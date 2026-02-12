import { useCallback, useEffect, useState } from "react";
import "@/App.css";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, Sparkles } from "lucide-react";

const CONFETTI_CONFIG = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const ADMIN_ACCESS_CODE = process.env.REACT_APP_ADMIN_KEY || "";
const HOST_EMAIL_STORAGE_KEY = "valentine-host-email";

const activities = [
  {
    id: 1,
    emoji: "🍽️",
    title: "Fancy Dinner",
    response:
      "Ooh la la! 🥂 Time to put on those fancy pants and pretend we're rich! Just don't judge my table manners 😜",
    gif: "https://media.giphy.com/media/3o7TKqm1mNujcBPSpy/giphy.gif"
  },
  {
    id: 2,
    emoji: "🍿",
    title: "Movie Marathon",
    response: "Netflix and actually chill! 🛋️ I promise not to fall asleep... maybe 😴💤",
    gif: "https://media.giphy.com/media/2zelCiUo5KJyN8MgMr/giphy.gif"
  },
  {
    id: 3,
    emoji: "💃",
    title: "Dance Party",
    response:
      "Warning: My dance moves are FIRE! 🔥🕺 (Translation: I have no idea what I'm doing but I'll look confident 😎)",
    gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
  },
  {
    id: 4,
    emoji: "👨‍🍳",
    title: "Cook Together",
    response: "Gordon Ramsay is shaking! 👨‍🍳 (Please have the fire extinguisher ready 🧯😂)",
    gif: "https://media.giphy.com/media/xUPGcJGy8I928yIlAQ/giphy.gif"
  },
  {
    id: 5,
    emoji: "🎨",
    title: "Arts & Crafts",
    response:
      "Time to get creative! 🖌️ We're basically Picasso... if Picasso had zero artistic talent but maximum enthusiasm! 😂🎨",
    gif: "https://media.giphy.com/media/ule4vhcY1xEKQ/giphy.gif"
  },
  {
    id: 6,
    emoji: "🌟",
    title: "Surprise Me!",
    response:
      "Buckle up buttercup! 🎢 This is gonna be LEGENDARY! (I have absolutely no plan but we'll figure it out 😂✨)",
    gif: "https://media.giphy.com/media/artj92V8o75VENhke/giphy.gif"
  }
];

const getSearchParams = () => {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
};

const decodeEmailFromLink = (value) => {
  if (!value) {
    return null;
  }
  try {
    if (typeof window !== "undefined" && window.atob) {
      return window.atob(value);
    }
    return null;
  } catch (error) {
    console.warn("Failed to decode host email from link", error);
    return null;
  }
};

const encodeEmailForLink = (value) => {
  if (!value) {
    return "";
  }
  if (typeof window !== "undefined" && window.btoa) {
    return window.btoa(value);
  }
  return value;
};

const getClientFingerprint = () => {
  if (typeof window === "undefined") {
    return "unknown-client";
  }
  const storageKey = "valentine-client-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }
  const generated = window.crypto?.randomUUID?.() ?? `client-${Date.now()}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
};

const getRecipientNameFromUrl = () => {
  const params = getSearchParams();
  const raw = params.get("name") || params.get("recipient");
  return raw ? raw.trim() : null;
};

const getHostEmailFromUrl = () => {
  const params = getSearchParams();
  const encoded = params.get("notify") || params.get("hostEmail");
  return decodeEmailFromLink(encoded);
};

const getHasAdminAccess = () => {
  if (!ADMIN_ACCESS_CODE) {
    return false;
  }
  const params = getSearchParams();
  return params.get("admin") === ADMIN_ACCESS_CODE;
};

const getIsDashboardMode = () => {
  const params = getSearchParams();
  return params.get("dashboard") === "1";
};

const getApiHeaders = (includeAdmin = false) => {
  const headers = { "Content-Type": "application/json" };
  if (includeAdmin && ADMIN_ACCESS_CODE) {
    headers["X-Admin-Key"] = ADMIN_ACCESS_CODE;
  }
  return headers;
};

const formatTimestamp = (value) => {
  if (!value) {
    return "Unknown time";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

const ValentineExperience = ({ recipientName, hostEmail }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showActivitySelect, setShowActivitySelect] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 100, y: 0 });
  const [attempts, setAttempts] = useState(0);
  const [clientFingerprint] = useState(getClientFingerprint);
  const [saveMessage, setSaveMessage] = useState("");

  const displayName = recipientName || "sweetheart";

  const persistActivitySelection = useCallback(
    async (activity) => {
      if (typeof fetch !== "function") {
        return;
      }
      try {
        const locationHint =
          typeof window !== "undefined" ? window.location.hostname : "unknown-host";
        const response = await fetch(`${API_BASE_URL}/activity`, {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            activity_id: activity.id,
            activity_title: activity.title,
            activity_emoji: activity.emoji,
            activity_response: activity.response,
            client_hint: `${clientFingerprint}@${locationHint}`,
            recipient_name: recipientName,
            host_email: hostEmail
          })
        });

        if (!response.ok) {
          throw new Error("Unable to save selection");
        }
        setSaveMessage("Saved successfully.");
      } catch (error) {
        console.error("Failed to persist selection", error);
        setSaveMessage("Saved visually, but logging/email failed.");
      }
    },
    [clientFingerprint, hostEmail, recipientName]
  );

  const handleYesClick = () => {
    setShowSuccess(true);
    confetti({ ...CONFETTI_CONFIG, colors: ["#FF4D6D", "#FF8FA3", "#C9184A", "#FFCCD5"] });
    setTimeout(
      () => confetti({ ...CONFETTI_CONFIG, colors: ["#FF4D6D", "#FF8FA3", "#C9184A", "#FFCCD5"] }),
      200
    );
    setTimeout(
      () => confetti({ ...CONFETTI_CONFIG, colors: ["#FF4D6D", "#FF8FA3", "#C9184A", "#FFCCD5"] }),
      400
    );
    setTimeout(() => setShowActivitySelect(true), 4000);
  };

  const handleActivitySelect = async (activity) => {
    setSelectedActivity(activity);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#FF4D6D", "#FF8FA3", "#C9184A", "#FFCCD5"]
    });
    await persistActivitySelection(activity);
  };

  const moveNoButton = () => {
    setAttempts((prev) => prev + 1);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = 150;
    const buttonHeight = 60;

    const maxX = (viewportWidth - buttonWidth) / 2 - 100;
    const maxY = (viewportHeight - buttonHeight) / 2 - 100;
    const minDistance = 200;

    let newX;
    let newY;
    do {
      newX = (Math.random() - 0.5) * maxX * 2;
      newY = (Math.random() - 0.5) * maxY * 2;
    } while (Math.abs(newX) < minDistance && Math.abs(newY) < minDistance);

    setNoButtonPosition({ x: newX, y: newY });
  };

  if (showSuccess && selectedActivity) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4"
        style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative z-10 max-w-2xl w-full text-center p-8 md:p-12"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="text-8xl mb-6"
          >
            {selectedActivity.emoji}
          </motion.div>

          <h1 className="font-heading text-5xl md:text-6xl font-bold text-valentine-text mb-6">
            {selectedActivity.title}!
          </h1>

          <p className="font-body text-2xl md:text-3xl text-valentine-text leading-relaxed mb-8">
            {selectedActivity.response}
          </p>

          <div className="flex gap-4 justify-center items-center mb-6">
            <Heart className="w-8 h-8 text-valentine-primary fill-valentine-primary animate-pulse" />
            <p className="font-body text-xl text-valentine-accent font-semibold">
              It&apos;s a date, {displayName}! Can&apos;t wait! 🗓️💕🎊
            </p>
            <Heart className="w-8 h-8 text-valentine-primary fill-valentine-primary animate-pulse" />
          </div>

          {saveMessage && <p className="text-sm text-valentine-accent">{saveMessage}</p>}

          <motion.img
            src={selectedActivity.gif}
            alt="Celebration"
            className="mt-8 rounded-3xl shadow-2xl max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          />
        </motion.div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4"
        style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative z-10 max-w-2xl w-full text-center p-8 md:p-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-24 h-24 mx-auto mb-6 text-valentine-primary fill-valentine-primary" />
          </motion.div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold text-valentine-text mb-6">
            Yaaay, {displayName}! 🎉💃
          </h1>

          <p className="font-body text-xl md:text-2xl text-valentine-text leading-relaxed mb-8">
            I knew the &quot;No&quot; button would wear you down, {displayName}! 😂🏃‍♂️💨 Let&apos;s
            make this Valentine&apos;s Day legendary! 🚀✨
          </p>

          {showActivitySelect ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-valentine-text mb-6">
                So... what do you wanna do? 🤔💭
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {activities.map((activity) => (
                  <motion.button
                    key={activity.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleActivitySelect(activity)}
                    className="p-6 rounded-2xl border-2 font-body font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.8)",
                      borderColor: "#FF4D6D",
                      color: "#590D22"
                    }}
                  >
                    <div className="text-5xl mb-2">{activity.emoji}</div>
                    <div>{activity.title}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex gap-4 justify-center items-center">
                <Sparkles className="w-8 h-8 text-valentine-accent animate-pulse" />
                <p className="font-body text-lg text-valentine-accent font-semibold">
                  This is just the beginning of our amazing adventure together 🌈🎢
                </p>
                <Sparkles className="w-8 h-8 text-valentine-accent animate-pulse" />
              </div>

              <motion.img
                src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
                alt="Celebration Dance"
                className="mt-8 rounded-3xl shadow-2xl max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              />
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4"
      style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full text-center p-8 md:p-12 rounded-3xl backdrop-blur-xl border shadow-[0_8px_32px_rgba(255,77,109,0.15)]"
        style={{
          background: "rgba(255, 255, 255, 0.4)",
          borderColor: "rgba(255, 77, 109, 0.2)"
        }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="w-20 h-20 mx-auto mb-6 text-valentine-primary fill-valentine-primary" />
        </motion.div>

        <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ color: "#590D22" }}>
          Will you be my Valentine, {displayName}? 💘
        </h1>

        <p className="font-body text-lg md:text-xl leading-relaxed mb-8" style={{ color: "#590D22" }}>
          This Valentine&apos;s Day would be incomplete without you, {displayName}! 🥺✨
        </p>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-12 h-32 relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleYesClick}
            className="rounded-full px-8 py-4 text-xl font-bold shadow-lg hover:shadow-xl text-white animate-pulse-slow z-10"
            style={{ background: "linear-gradient(to right, #FF4D6D, #C9184A)" }}
          >
            Yes! 💕
          </motion.button>

          <motion.button
            animate={{ x: noButtonPosition.x, y: noButtonPosition.y }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onHoverStart={moveNoButton}
            onMouseEnter={moveNoButton}
            onClick={moveNoButton}
            className="rounded-full px-8 py-4 text-xl font-bold border-2 shadow-lg absolute cursor-pointer select-none"
            style={{
              background: "white",
              color: "#C9184A",
              borderColor: "#FF4D6D",
              pointerEvents: "auto"
            }}
          >
            {attempts === 0
              ? "No 🙅"
              : attempts < 3
                ? "No way! 🏃‍♂️"
                : attempts < 5
                  ? "Still no! 😤"
                  : attempts < 8
                    ? "Nope! 😊"
                    : "Nice try! 🤪"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const ShareLinkSetup = ({ hasAdminAccess }) => {
  const [nameInput, setNameInput] = useState("");
  const [hostEmailInput, setHostEmailInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(HOST_EMAIL_STORAGE_KEY) || "";
  });
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  const currentName = nameInput.trim();
  const currentEmail = hostEmailInput.trim();
  const dashboardUrl =
    ADMIN_ACCESS_CODE && baseUrl
      ? `${baseUrl}?dashboard=1&admin=${encodeURIComponent(ADMIN_ACCESS_CODE)}`
      : "";

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toLowerCase());

  const handleGenerateLink = (event) => {
    event.preventDefault();
    if (!currentName) {
      setErrorMessage("Please type a name so we can personalize the invite.");
      setGeneratedLink("");
      return;
    }
    if (!currentEmail || !isValidEmail(currentEmail)) {
      setErrorMessage("Add a valid email so we can send you the response.");
      setGeneratedLink("");
      return;
    }

    const encodedEmail = encodeEmailForLink(currentEmail);
    const params = new URLSearchParams({ name: currentName, notify: encodedEmail });
    setGeneratedLink(`${baseUrl}?${params.toString()}`);
    setCopyStatus("idle");
    setErrorMessage("");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(HOST_EMAIL_STORAGE_KEY, currentEmail);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy link", error);
      setCopyStatus("failed");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4"
      style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
    >
      <div
        className="relative z-10 w-full max-w-2xl text-center p-8 md:p-12 rounded-3xl backdrop-blur-xl border shadow-[0_8px_32px_rgba(255,77,109,0.15)]"
        style={{
          background: "rgba(255, 255, 255, 0.4)",
          borderColor: "rgba(255, 77, 109, 0.2)"
        }}
      >
        <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-4" style={{ color: "#590D22" }}>
          Who do you want to invite?
        </h1>
        <p className="font-body text-lg md:text-xl text-valentine-text mb-8">
          Type their name, generate a magical link, and share it. Their choice is logged and emailed to you.
        </p>

        <form className="flex flex-col gap-4 items-center" onSubmit={handleGenerateLink}>
          <input
            type="text"
            className="w-full rounded-full border-2 border-valentine-primary/40 px-6 py-3 text-lg font-body shadow-inner focus:outline-none focus:ring-4 focus:ring-valentine-primary/30"
            placeholder="Type their name..."
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
          />
          <input
            type="email"
            className="w-full rounded-full border-2 border-valentine-primary/40 px-6 py-3 text-lg font-body shadow-inner focus:outline-none focus:ring-4 focus:ring-valentine-primary/30"
            placeholder="Your email (we'll send responses here)"
            value={hostEmailInput}
            onChange={(event) => setHostEmailInput(event.target.value)}
          />
          <button
            type="submit"
            className="rounded-full px-10 py-4 text-xl font-bold shadow-lg hover:shadow-xl text-white animate-pulse-slow"
            style={{ background: "linear-gradient(to right, #FF4D6D, #C9184A)" }}
          >
            Generate Magical Link ✨
          </button>
        </form>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

        {generatedLink && (
          <div className="mt-10 rounded-2xl border border-valentine-primary/30 bg-white/80 p-6 text-left shadow-lg">
            <p className="font-heading text-2xl text-valentine-text mb-3">
              Share this with {currentName || "your Valentine"}:
            </p>
            <input
              readOnly
              value={generatedLink}
              className="w-full rounded-xl border border-valentine-primary/40 px-4 py-3 font-mono text-sm text-valentine-text bg-white/90"
              onFocus={(event) => event.target.select()}
            />
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => copyText(generatedLink)}
                className="rounded-full border border-valentine-primary/40 px-6 py-3 font-semibold text-valentine-text hover:bg-white"
              >
                {copyStatus === "copied" ? "Copied! 💌" : "Copy Invite Link"}
              </button>
              {dashboardUrl && hasAdminAccess && (
                <button
                  type="button"
                  onClick={() => copyText(dashboardUrl)}
                  className="rounded-full border border-valentine-primary/40 px-6 py-3 font-semibold text-valentine-text hover:bg-white"
                >
                  Copy Dashboard URL
                </button>
              )}
            </div>
            {copyStatus === "failed" && (
              <p className="mt-2 text-xs text-red-600">
                Copy failed. Select the link above and copy it manually.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardAccessRequired = () => {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-8 text-center"
      style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
    >
      <div className="max-w-md rounded-3xl border border-white/40 bg-white/60 p-10 shadow-xl backdrop-blur-lg">
        <h1 className="font-heading text-4xl text-valentine-text mb-4">Dashboard Locked</h1>
        <p className="font-body text-lg text-valentine-text/80">
          Open this URL with your admin key: <code>?dashboard=1&amp;admin=...</code>
        </p>
      </div>
    </div>
  );
};

const AdminDashboard = ({ hasAdminAccess }) => {
  const [selections, setSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const loadSelections = useCallback(async () => {
    if (!hasAdminAccess) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/activity`, {
        method: "GET",
        headers: getApiHeaders(true)
      });

      if (!response.ok) {
        throw new Error(`Unable to load dashboard (${response.status})`);
      }

      const data = await response.json();
      setSelections(data);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("Failed to load dashboard", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    if (!hasAdminAccess) {
      return undefined;
    }
    loadSelections();
    const interval = setInterval(loadSelections, 15000);
    return () => clearInterval(interval);
  }, [hasAdminAccess, loadSelections]);

  if (!hasAdminAccess) {
    return <DashboardAccessRequired />;
  }

  return (
    <div
      className="min-h-screen w-full p-6 md:p-10"
      style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
    >
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-4xl text-valentine-text">Admin Dashboard</h1>
          <button
            type="button"
            onClick={loadSelections}
            disabled={isLoading}
            className="rounded-full border border-valentine-primary/40 px-5 py-2 font-semibold text-valentine-text hover:bg-white disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <p className="mt-2 text-sm text-valentine-accent">
          Last updated: {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : "Never"}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-3">
          {!isLoading && selections.length === 0 && (
            <p className="text-valentine-text/70">No selections recorded yet.</p>
          )}

          {selections.map((selection) => (
            <div
              key={selection.id}
              className="rounded-2xl border border-valentine-primary/30 bg-white/90 p-4 shadow-sm"
            >
              <p className="text-xl font-semibold text-valentine-text">
                <span className="mr-2">{selection.activity_emoji}</span>
                {selection.activity_title}
              </p>
              <p className="text-sm text-valentine-accent">{formatTimestamp(selection.timestamp)}</p>
              <p className="text-sm text-slate-600">
                Recipient: {selection.recipient_name || "Unknown"}
              </p>
              <p className="text-sm text-slate-600">
                Host email: {selection.host_email || "Not provided"}
              </p>
              {selection.client_hint && (
                <p className="text-sm text-slate-500">Client: {selection.client_hint}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ValentineProposal = () => {
  const [recipientName] = useState(getRecipientNameFromUrl);
  const [hostEmail] = useState(getHostEmailFromUrl);
  const [isDashboardMode] = useState(getIsDashboardMode);
  const [hasAdminAccess] = useState(getHasAdminAccess);

  if (isDashboardMode) {
    return <AdminDashboard hasAdminAccess={hasAdminAccess} />;
  }

  if (!recipientName) {
    return <ShareLinkSetup hasAdminAccess={hasAdminAccess} />;
  }

  return <ValentineExperience recipientName={recipientName} hostEmail={hostEmail} />;
};

function App() {
  return (
    <div className="App">
      <ValentineProposal />
    </div>
  );
}

export default App;
