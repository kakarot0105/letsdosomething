import asyncio
import logging
import os
import smtplib
import uuid
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SMTP_HOST = os.environ.get('SMTP_HOST')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME') or os.environ.get('SMTP_USER')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL')
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME')
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'

EMAIL_NOTIFICATIONS_ENABLED = bool(SMTP_HOST and SMTP_FROM_EMAIL)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class ActivitySelection(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    activity_id: int
    activity_title: str
    activity_emoji: str
    activity_response: Optional[str] = None
    client_hint: Optional[str] = None
    recipient_name: Optional[str] = None
    host_email: Optional[EmailStr] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ActivitySelectionCreate(BaseModel):
    activity_id: int
    activity_title: str
    activity_emoji: str
    activity_response: Optional[str] = None
    client_hint: Optional[str] = None
    recipient_name: Optional[str] = None
    host_email: Optional[EmailStr] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()

    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])

    return status_checks


@api_router.post("/activity", response_model=ActivitySelection)
async def create_activity_selection(input: ActivitySelectionCreate):
    selection_dict = input.model_dump()
    selection_obj = ActivitySelection(**selection_dict)

    doc = selection_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()

    await db.activity_selections.insert_one(doc)
    asyncio.create_task(send_selection_notification(selection_obj))
    return selection_obj


@api_router.get("/activity", response_model=List[ActivitySelection])
async def list_activity_selections():
    selections = await db.activity_selections.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)

    for selection in selections:
        if isinstance(selection['timestamp'], str):
            selection['timestamp'] = datetime.fromisoformat(selection['timestamp'])

    return selections


async def send_selection_notification(selection: ActivitySelection):
    if not EMAIL_NOTIFICATIONS_ENABLED or not selection.host_email:
        return

    try:
        await asyncio.to_thread(_send_email_sync, selection)
    except Exception as exc:
        logger.exception("Failed to send notification email: %s", exc)


def _send_email_sync(selection: ActivitySelection):
    recipient_display = selection.recipient_name or "Your Valentine"
    activity_name = selection.activity_title
    timestamp_display = selection.timestamp.strftime('%Y-%m-%d %H:%M:%S %Z')

    subject = f"{recipient_display} picked {activity_name}! 💌"
    body_lines = [
        f"Hi there!",
        "",
        f"{recipient_display} just chose \"{activity_name}\" ({selection.activity_emoji}) for your Valentine's adventure.",
        "",
        f"Message shown to them:",
        f"{selection.activity_response or 'No custom message provided.'}",
        "",
        f"Recorded at: {timestamp_display}",
        "",
        "Check the Activity Log for more details.",
        "",
        "With love,",
        "Your Valentine App 💞",
    ]
    message = EmailMessage()
    message['Subject'] = subject
    if SMTP_FROM_NAME:
        message['From'] = formataddr((SMTP_FROM_NAME, SMTP_FROM_EMAIL))
    else:
        message['From'] = SMTP_FROM_EMAIL
    message['To'] = selection.host_email
    message.set_content("\n".join(body_lines))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
