# Valentine's Day Proposal Game + Activity Tracker

This repo contains a playful React front-end experience backed by a FastAPI service. After someone clicks **Yes!** they can pick an activity, confetti fires, and now those selections are saved so you can review what was chosen even if you weren't watching the screen.

## Running the Backend (FastAPI)

1. Copy the sample env file and adjust if needed:

   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env if you want to point at Atlas or another cluster
   ```

   Default values point to a local MongoDB instance on `localhost:27017`.

2. Install dependencies and start the server:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn server:app --reload
   ```

   New endpoints:

   - `POST /api/activity` – persist the activity that was picked.
   - `GET /api/activity` – list the latest selections (most recent first).

## Running the Frontend (React + Craco)

1. Copy the sample env file:

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm start
   ```

   The default `REACT_APP_API_BASE_URL` assumes the backend runs on `http://localhost:8000/api`. Update this for other environments or hosting providers.

2. Build for production:

   ```bash
   npm run build
   ```

## Viewing What Was Selected

- A floating **Show Activity Log** button appears in the bottom-right corner of every screen.
- When expanded, it shows the most recent choices (emoji, activity name, timestamp, and optional client hint).
- The log auto-refreshes every 15 seconds; you can also click **Refresh** to fetch immediately.
- If the backend is offline you’ll still see the celebratory UI, but the log panel will display an error so you know to check the server.
- Each entry now includes the recipient’s name (when provided) so you know exactly whose link produced each selection.
- The Activity Log panel is visible only in “host mode” (when you load the site without a `name` parameter or append `&host=1`). Recipients get the clean romantic experience without the admin tools.

## Personalizing the Link

If you open the site without a `name` query parameter, you’ll see a share screen where you can type the recipient’s name, click **Generate Magical Link**, and copy/preview the personalized URL in one click.

You can also craft the link manually by adding `?name=Taylor` (or `?recipient=Taylor`) to the URL before sharing it. Example:

```
http://localhost:3000/?name=Taylor
```

When they open the page, all the headlines and celebratory copy will greet them by name, and the backend log will record who made the selection. If you want to preview the exact page while still seeing the Activity Log toggle, append `&host=1` to your personalized link (for example, `https://yourdomain.com/?name=Taylor&host=1`).

## One-Command Local Stack (Docker)

If you prefer containers, everything is already wired up via Docker:

```bash
docker compose up --build
```

Services:

- `mongo` – MongoDB 7 with a named volume (`mongo-data`) so data persists.
- `backend` – FastAPI app served by Uvicorn on `http://localhost:8000`.
- `frontend` – Production React build served by Nginx on `http://localhost:3000`.

Environment files are ignored by Git, but the compose file overrides the critical values so containers can communicate (`backend` talks to `mongo`, `frontend` talks to `backend`).

## Deploying to GitHub Pages

- A GitHub Actions workflow (`.github/workflows/deploy-frontend.yml`) now builds the React app from `frontend/` every time you push to `main` (or trigger it manually) and publishes the static files to the `gh-pages` branch.
- Before running it, set a repository variable named `REACT_APP_API_BASE_URL` so the build points at your hosted FastAPI endpoint (Settings → Secrets and variables → Actions → Variables).
- If you have a custom domain, keep the `CNAME` file at the repo root; the workflow copies it into the published build automatically.
- In **Settings → Pages**, choose **Branch: gh-pages / root** so GitHub Pages serves the generated site. Once that’s set, your custom domain will show the latest build after each push.

Enjoy surprising your Valentine and keep track of what they picked! 💘
