import { useState, useEffect, useCallback } from "react";
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
const ADMIN_KEY_STORAGE_KEY = "valentine-admin-code";

const getRecipientNameFromUrl = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("name") || params.get("recipient");
  return raw ? raw.trim() : null;
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

const getHostModeFromUrl = () => {
  if (typeof window === "undefined") {
    return false;
  }
  if (!ADMIN_ACCESS_CODE) {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  const providedCode = params.get("admin");
  if (providedCode && providedCode === ADMIN_ACCESS_CODE) {
    window.localStorage.setItem(ADMIN_KEY_STORAGE_KEY, providedCode);
    return true;
  }
  const storedCode = window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY);
  return storedCode === ADMIN_ACCESS_CODE;
};

const getHostEmailFromUrl = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("notify") || params.get("hostEmail");
  return decodeEmailFromLink(encoded);
};

const useActivityLog = (isEnabled) => {
  const [activityLog, setActivityLog] = useState([]);
  const [isActivityLogVisible, setIsActivityLogVisible] = useState(false);
  const [isLogLoading, setIsLogLoading] = useState(false);
  const [logError, setLogError] = useState(null);
  const [isPersistingSelection, setIsPersistingSelection] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const fetchActivityLog = useCallback(async () => {
    if (!isEnabled || typeof fetch !== "function") {
      return;
    }

    try {
      setIsLogLoading(true);
      setLogError(null);

      const response = await fetch(`${API_BASE_URL}/activity`);
      if (!response.ok) {
        throw new Error("Unable to load activity log");
      }

      const data = await response.json();
      setActivityLog(data);
      setLastSyncedAt(new Date());
    } catch (error) {
      setLogError(
        error.message || "Failed to load selections. Is the backend running?"
      );
    } finally {
      setIsLogLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    fetchActivityLog();
    const interval = setInterval(fetchActivityLog, 15000);
    return () => clearInterval(interval);
  }, [isEnabled, fetchActivityLog]);

  const toggleActivityLog = () => {
    setIsActivityLogVisible((prev) => !prev);
  };

  return {
    activityLog,
    isActivityLogVisible,
    isLogLoading,
    logError,
    isPersistingSelection,
    setIsPersistingSelection,
    lastSyncedAt,
    fetchActivityLog,
    toggleActivityLog,
    setLogError
  };
};

const ValentineExperience = ({ recipientName, hostEmail, isHostView }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showActivitySelect, setShowActivitySelect] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 100, y: 0 });
  const [attempts, setAttempts] = useState(0);
  const [clientFingerprint] = useState(getClientFingerprint);

  const {
    activityLog,
    isActivityLogVisible,
    isLogLoading,
    logError,
    isPersistingSelection,
    setIsPersistingSelection,
    lastSyncedAt,
    fetchActivityLog,
    toggleActivityLog,
    setLogError
  } = useActivityLog(isHostView);

  const displayName = recipientName || "sweetheart";

  const activities = [
    { 
      id: 1, 
      emoji: "🍽️", 
      title: "Fancy Dinner", 
      response: "Ooh la la! 🥂 Time to put on those fancy pants and pretend we're rich! Just don't judge my table manners 😜",
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
      response: "Warning: My dance moves are FIRE! 🔥🕺 (Translation: I have no idea what I'm doing but I'll look confident 😎)",
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
      response: "Time to get creative! 🖌️ We're basically Picasso... if Picasso had zero artistic talent but maximum enthusiasm! 😂🎨",
      gif: "https://media.giphy.com/media/ule4vhcY1xEKQ/giphy.gif"
    },
    { 
      id: 6, 
      emoji: "🌟", 
      title: "Surprise Me!", 
      response: "Buckle up buttercup! 🎢 This is gonna be LEGENDARY! (I have absolutely no plan but we'll figure it out 😂✨)",
      gif: "https://media.giphy.com/media/artj92V8o75VENhke/giphy.gif"
    }
  ];

  const persistActivitySelection = useCallback(
    async (activity) => {
      if (typeof fetch !== "function") {
        return;
      }

      try {
        setIsPersistingSelection(true);
        setLogError(null);

        const locationHint = typeof window !== "undefined" ? window.location.hostname : "unknown-host";
        const response = await fetch(`${API_BASE_URL}/activity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
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

        await fetchActivityLog();
      } catch (error) {
        console.error("Failed to persist selection", error);
        setLogError("Selection shown locally, but logging failed. Please verify the backend.");
      } finally {
        setIsPersistingSelection(false);
      }
    },
    [clientFingerprint, fetchActivityLog, hostEmail, recipientName, setIsPersistingSelection, setLogError]
  );

  const handleYesClick = () => {
    setShowSuccess(true);
    confetti({
      ...CONFETTI_CONFIG,
      colors: ['#FF4D6D', '#FF8FA3', '#C9184A', '#FFCCD5']
    });
    
    setTimeout(() => {
      confetti({
        ...CONFETTI_CONFIG,
        colors: ['#FF4D6D', '#FF8FA3', '#C9184A', '#FFCCD5']
      });
    }, 200);
    
    setTimeout(() => {
      confetti({
        ...CONFETTI_CONFIG,
        colors: ['#FF4D6D', '#FF8FA3', '#C9184A', '#FFCCD5']
      });
    }, 400);

    setTimeout(() => {
      setShowActivitySelect(true);
    }, 4000);
  };

  const handleActivitySelect = async (activity) => {
    setSelectedActivity(activity);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF4D6D', '#FF8FA3', '#C9184A', '#FFCCD5']
    });
    await persistActivitySelection(activity);
  };

  const moveNoButton = () => {
    setAttempts(prev => prev + 1);
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = 150;
    const buttonHeight = 60;
    
    const maxX = (viewportWidth - buttonWidth) / 2 - 100;
    const maxY = (viewportHeight - buttonHeight) / 2 - 100;
    
    const minDistance = 200;
    
    let newX, newY;
    do {
      newX = (Math.random() - 0.5) * maxX * 2;
      newY = (Math.random() - 0.5) * maxY * 2;
    } while (Math.abs(newX) < minDistance && Math.abs(newY) < minDistance);
    
    setNoButtonPosition({ x: newX, y: newY });
  };

  let content;

  if (showSuccess) {
    if (selectedActivity) {
      content = (
        <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4" 
             style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)' }}
             data-testid="final-screen">
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
            
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-valentine-text mb-6" data-testid="final-heading">
              {selectedActivity.title}!
            </h1>
            
            <p className="font-body text-2xl md:text-3xl text-valentine-text leading-relaxed mb-8" data-testid="final-message">
              {selectedActivity.response}
            </p>
            
            <div className="flex gap-4 justify-center items-center mb-6">
              <Heart className="w-8 h-8 text-valentine-primary fill-valentine-primary animate-pulse" />
              <p className="font-body text-xl text-valentine-accent font-semibold" data-testid="final-tagline">
                It's a date, {displayName}! Can't wait! 🗓️💕🎊
              </p>
              <Heart className="w-8 h-8 text-valentine-primary fill-valentine-primary animate-pulse" />
            </div>

            <motion.img
              src={selectedActivity.gif}
              alt="Celebration"
              className="mt-8 rounded-3xl shadow-2xl max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid="final-gif"
            />
          </motion.div>
        </div>
      );
    } else {
      content = (
        <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4" 
             style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)' }}
             data-testid="success-screen">
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
              <Heart className="w-24 h-24 mx-auto mb-6 text-valentine-primary fill-valentine-primary" data-testid="success-heart-icon" />
            </motion.div>
            
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-valentine-text mb-6" data-testid="success-heading">
            Yaaay, {displayName}! 🎉💃
          </h1>
          
          <p className="font-body text-xl md:text-2xl text-valentine-text leading-relaxed mb-8" data-testid="success-message">
            I knew the "No" button would wear you down, {displayName}! 😂🏃‍♂️💨
            You never stood a chance against my master plan! 
            Let's make this Valentine's Day LEGENDARY! 🚀✨
          </p>

            {showActivitySelect && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-valentine-text mb-6" data-testid="activity-question">
                  So... what do you wanna do? 🤔💭
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto" data-testid="activity-grid">
                  {activities.map((activity) => (
                    <motion.button
                      key={activity.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleActivitySelect(activity)}
                      className="p-6 rounded-2xl border-2 font-body font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderColor: '#FF4D6D',
                        color: '#590D22'
                      }}
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="text-5xl mb-2">{activity.emoji}</div>
                      <div>{activity.title}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {!showActivitySelect && (
              <>
                <div className="flex gap-4 justify-center items-center">
                  <Sparkles className="w-8 h-8 text-valentine-accent animate-pulse" />
                  <p className="font-body text-lg text-valentine-accent font-semibold" data-testid="success-tagline">
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
                  data-testid="success-image"
                />
              </>
            )}
          </motion.div>

          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: -20,
                  rotate: Math.random() * 360
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 360 + 360
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              >
                <Heart className="w-6 h-6 text-valentine-secondary opacity-30" />
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
  } else {
    content = (
      <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4" 
           style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)' }}
           data-testid="proposal-screen">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-10 left-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Heart className="w-12 h-12 text-valentine-secondary opacity-20" />
          </motion.div>
          <motion.div
            className="absolute top-20 right-20"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Heart className="w-8 h-8 text-valentine-primary opacity-20" />
          </motion.div>
          <motion.div
            className="absolute bottom-20 left-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-10 h-10 text-valentine-accent opacity-20" />
          </motion.div>
          <motion.div
            className="absolute bottom-10 right-10"
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-valentine-secondary opacity-20" />
          </motion.div>
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md w-full text-center p-8 md:p-12 rounded-3xl backdrop-blur-xl border shadow-[0_8px_32px_rgba(255,77,109,0.15)]"
          style={{ 
            background: 'rgba(255, 255, 255, 0.4)',
            borderColor: 'rgba(255, 77, 109, 0.2)'
          }}
          data-testid="proposal-card"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-20 h-20 mx-auto mb-6 text-valentine-primary fill-valentine-primary" data-testid="proposal-heart-icon" />
          </motion.div>

        <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6" 
            style={{ color: '#590D22' }}
            data-testid="proposal-heading">
          Will you be my Valentine, {displayName}? 💘
        </h1>

        <p className="font-body text-lg md:text-xl leading-relaxed mb-8" 
           style={{ color: '#590D22' }}
           data-testid="proposal-subtext">
          This Valentine's Day would be incomplete without you, {displayName}! 🥺✨
        </p>

          <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-12 h-32 relative" data-testid="button-container">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleYesClick}
              className="rounded-full px-8 py-4 text-xl font-bold shadow-lg hover:shadow-xl text-white animate-pulse-slow z-10"
              style={{ 
                background: 'linear-gradient(to right, #FF4D6D, #C9184A)'
              }}
              data-testid="yes-button"
            >
              Yes! 💕
            </motion.button>

            <motion.button
              animate={{
                x: noButtonPosition.x,
                y: noButtonPosition.y
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onHoverStart={moveNoButton}
              onMouseEnter={moveNoButton}
              onClick={moveNoButton}
              className="rounded-full px-8 py-4 text-xl font-bold border-2 shadow-lg absolute cursor-pointer select-none"
              style={{ 
                background: 'white',
                color: '#C9184A',
                borderColor: '#FF4D6D',
                pointerEvents: 'auto'
              }}
              data-testid="no-button"
            >
              {attempts === 0 ? "No 🙅" : attempts < 3 ? "No way! 🏃‍♂️" : attempts < 5 ? "Still no! 😤" : attempts < 8 ? "Nope! 😊" : "Nice try! 🤪"}
            </motion.button>
          </div>

          {attempts > 2 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 font-body text-sm"
              style={{ color: '#C9184A' }}
              data-testid="attempts-message"
            >
              {attempts < 5 ? "Come on, you know you want to say yes! 😉👉👈" : "I can do this all day! 😄💪 (But seriously, just say yes already! 🙏)"}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {content}
      {isHostView && (
        <SelectionLogViewer
          isVisible={isActivityLogVisible}
          onToggle={toggleActivityLog}
          onRefresh={fetchActivityLog}
          selections={activityLog}
          isLoading={isLogLoading}
          isPersistingSelection={isPersistingSelection}
          error={logError}
          lastSyncedAt={lastSyncedAt}
        />
      )}
    </>
  );
};

const ShareLinkSetup = ({ isHostView }) => {
  const [nameInput, setNameInput] = useState("");
  const [hostEmailInput, setHostEmailInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(HOST_EMAIL_STORAGE_KEY) || "";
  });
  const [generatedLink, setGeneratedLink] = useState("");
  const [hostPreviewLink, setHostPreviewLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("idle");
  const [hostCopyStatus, setHostCopyStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const {
    activityLog,
    isActivityLogVisible,
    isLogLoading,
    logError,
    isPersistingSelection,
    lastSyncedAt,
    fetchActivityLog,
    toggleActivityLog
  } = useActivityLog(isHostView);

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  const currentName = nameInput.trim();
  const currentEmail = hostEmailInput.trim();

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toLowerCase());

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
    const params = new URLSearchParams({
      name: currentName,
      notify: encodedEmail
    });
    const personalizedLink = `${baseUrl}?${params.toString()}`;
    const previewLink = ADMIN_ACCESS_CODE
      ? `${personalizedLink}&admin=${encodeURIComponent(ADMIN_ACCESS_CODE)}`
      : personalizedLink;

    setGeneratedLink(personalizedLink);
    setHostPreviewLink(previewLink);
    setCopyStatus("idle");
    setHostCopyStatus("idle");
    setErrorMessage("");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(HOST_EMAIL_STORAGE_KEY, currentEmail);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy link", error);
      setCopyStatus("failed");
    }
  };

  const handleCopyHostLink = async () => {
    if (!hostPreviewLink) return;

    try {
      await navigator.clipboard.writeText(hostPreviewLink);
      setHostCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy host link", error);
      setHostCopyStatus("failed");
    }
  };

  const handlePreviewLink = () => {
    const target = hostPreviewLink || generatedLink;
    if (!target) return;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative p-4"
      style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
      data-testid="share-screen"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-8 left-12"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="w-14 h-14 text-valentine-secondary opacity-20" />
        </motion.div>
        <motion.div
          className="absolute bottom-10 right-14"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-10 h-10 text-valentine-accent opacity-20" />
        </motion.div>
      </div>

      <div
        className="relative z-10 w-full max-w-2xl text-center p-8 md:p-12 rounded-3xl backdrop-blur-xl border shadow-[0_8px_32px_rgba(255,77,109,0.15)]"
        style={{
          background: "rgba(255, 255, 255, 0.4)",
          borderColor: "rgba(255, 77, 109, 0.2)"
        }}
      >
        <h1
          className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-4"
          style={{ color: "#590D22" }}
        >
          Who do you want to invite?
        </h1>
        <p
          className="font-body text-lg md:text-xl text-valentine-text mb-8"
          data-testid="share-subtext"
        >
          Type their name, generate a magical link, and share it. When they open
          it, the page greets them personally and logs whichever activity they
          pick.
        </p>

        <form
          className="flex flex-col gap-4 items-center"
          onSubmit={handleGenerateLink}
        >
          <input
            type="text"
            className="w-full rounded-full border-2 border-valentine-primary/40 px-6 py-3 text-lg font-body shadow-inner focus:outline-none focus:ring-4 focus:ring-valentine-primary/30"
            placeholder="Type their name…"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            data-testid="share-name-input"
          />
          <input
            type="email"
            className="w-full rounded-full border-2 border-valentine-primary/40 px-6 py-3 text-lg font-body shadow-inner focus:outline-none focus:ring-4 focus:ring-valentine-primary/30"
            placeholder="Your email (we'll send responses here)"
            value={hostEmailInput}
            onChange={(event) => setHostEmailInput(event.target.value)}
            data-testid="share-email-input"
          />
          <button
            type="submit"
            className="rounded-full px-10 py-4 text-xl font-bold shadow-lg hover:shadow-xl text-white animate-pulse-slow"
            style={{
              background: "linear-gradient(to right, #FF4D6D, #C9184A)"
            }}
            data-testid="share-generate-button"
          >
            Generate Magical Link ✨
          </button>
        </form>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        )}

        {generatedLink && (
          <div
            className="mt-10 rounded-2xl border border-valentine-primary/30 bg-white/80 p-6 text-left shadow-lg"
            data-testid="share-link-card"
          >
            <p className="font-heading text-2xl text-valentine-text mb-3">
              Share this with {currentName || "your Valentine"}:
            </p>
            <div className="flex flex-col gap-4 md:flex-row">
              <input
                readOnly
                value={generatedLink}
                className="flex-1 rounded-xl border border-valentine-primary/40 px-4 py-3 font-mono text-sm text-valentine-text bg-white/90"
                onFocus={(event) => event.target.select()}
                data-testid="share-link-output"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-xl px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl"
                style={{ background: "#FF4D6D" }}
                data-testid="share-copy-button"
              >
                {copyStatus === "copied" ? "Copied! 💌" : "Copy Link"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={handlePreviewLink}
                className="rounded-full border border-valentine-primary/40 px-6 py-3 font-semibold text-valentine-text hover:bg-white"
                data-testid="share-preview-button"
              >
                Preview Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput("");
                  setGeneratedLink("");
                  setCopyStatus("idle");
                }}
                className="rounded-full border border-valentine-primary/40 px-6 py-3 font-semibold text-valentine-text hover:bg-white"
                data-testid="share-reset-button"
              >
                Create Another
              </button>
              <button
                type="button"
                onClick={handleCopyHostLink}
                className="rounded-full border border-valentine-primary/40 px-6 py-3 font-semibold text-valentine-text hover:bg-white"
                data-testid="share-copy-host-button"
              >
                {hostCopyStatus === "copied" ? "Host Link Copied" : "Copy Host Link"}
              </button>
            </div>
            <p className="mt-4 text-sm text-valentine-text/80">
              Anyone opening the first link will see their name in the proposal
              screen, and their choice will appear in your Activity Log. We&apos;ll
              also email the results to {currentEmail || "your inbox"} as soon as
              they pick something.
            </p>
            {copyStatus === "failed" && (
              <p className="mt-2 text-xs text-red-600">
                Copy failed—please select the link above and copy it manually.
              </p>
            )}
            {hostCopyStatus === "failed" && (
              <p className="mt-2 text-xs text-red-600">
                Host link copy failed—select the host link button again or copy manually.
              </p>
            )}
          </div>
        )}
      </div>

      {isHostView && (
        <SelectionLogViewer
          isVisible={isActivityLogVisible}
          onToggle={toggleActivityLog}
          onRefresh={fetchActivityLog}
          selections={activityLog}
          isLoading={isLogLoading}
          isPersistingSelection={isPersistingSelection}
          error={logError}
          lastSyncedAt={lastSyncedAt}
        />
      )}
    </div>
  );
};

const ValentineProposal = () => {
  const [recipientName] = useState(getRecipientNameFromUrl);
  const [hostEmail] = useState(getHostEmailFromUrl);
  const [hasAdminAccess] = useState(getHostModeFromUrl);
  const isHostView = hasAdminAccess;

  if (!recipientName) {
    return hasAdminAccess ? (
      <ShareLinkSetup isHostView={isHostView} />
    ) : (
      <HostAccessRequired />
    );
  }

  return (
    <ValentineExperience
      recipientName={recipientName}
      hostEmail={hostEmail}
      isHostView={isHostView}
    />
  );
};

function App() {
  return (
    <div className="App">
      <ValentineProposal />
    </div>
  );
}

export default App;

const HostAccessRequired = () => {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-8 text-center"
      style={{ background: "linear-gradient(135deg, #FFF0F3 0%, #FFCCD5 100%)" }}
    >
      <div className="max-w-md rounded-3xl border border-white/40 bg-white/60 p-10 shadow-xl backdrop-blur-lg">
        <h1 className="font-heading text-4xl text-valentine-text mb-4">
          💌 Invitation Only
        </h1>
        <p className="font-body text-lg text-valentine-text/80">
          This is the organizer view. If you&apos;re the host, open your special URL
          that includes the secret <code>?admin=...</code> key to access the share
          tools and Activity Log.
        </p>
        <p className="mt-4 text-sm text-valentine-text/70">
          Recipients should open their personalized link (with <code>?name=</code>) to
          see the surprise experience.
        </p>
      </div>
    </div>
  );
};

const SelectionLogViewer = ({
  isVisible,
  onToggle,
  onRefresh,
  selections,
  isLoading,
  isPersistingSelection,
  error,
  lastSyncedAt
}) => {
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

  const formattedSyncedAt = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 text-left">
      <button
        onClick={onToggle}
        className="rounded-full bg-valentine-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
      >
        {isVisible ? "Hide Activity Log" : "Show Activity Log"}
        {isPersistingSelection && <span className="ml-2 text-xs opacity-80">Saving...</span>}
      </button>

      {isVisible && (
        <div className="w-80 rounded-3xl border-2 border-valentine-primary/30 bg-white/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-heading text-xl text-valentine-text">Recent Selections</p>
              <p className="text-xs text-valentine-accent">Updated {formattedSyncedAt}</p>
            </div>
            <button
              onClick={onRefresh}
              className="text-sm font-semibold text-valentine-accent hover:underline disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {isLoading && selections.length === 0 && (
              <p className="text-sm text-valentine-text/70">Loading selections...</p>
            )}

            {!isLoading && selections.length === 0 && (
              <p className="text-sm text-valentine-text/70">
                No picks recorded yet. Once someone chooses an activity, it will appear here.
              </p>
            )}

            {selections.map((selection) => (
              <div
                key={selection.id}
                className="rounded-2xl border border-valentine-primary/20 bg-white/80 px-3 py-2 shadow-sm"
              >
                <p className="font-body text-sm font-semibold text-valentine-text">
                  <span className="mr-2 text-lg" aria-hidden="true">
                    {selection.activity_emoji}
                  </span>
                  {selection.activity_title}
                </p>
                <p className="text-xs text-valentine-accent">
                  {formatTimestamp(selection.timestamp)}
                </p>
                {selection.recipient_name && (
                  <p className="text-xs text-slate-500">For: {selection.recipient_name}</p>
                )}
                {selection.client_hint && (
                  <p className="text-xs text-slate-500">Client: {selection.client_hint}</p>
                )}
              </div>
            ))}
          </div>

          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
};
