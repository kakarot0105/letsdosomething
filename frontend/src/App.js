import { useState } from "react";
import "@/App.css";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, Sparkles } from "lucide-react";

const CONFETTI_CONFIG = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
};

const ValentineProposal = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showActivitySelect, setShowActivitySelect] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 100, y: 0 });
  const [attempts, setAttempts] = useState(0);

  const activities = [
    { id: 1, emoji: "🍽️", title: "Fancy Dinner", response: "Ooh fancy! Time to dress up and eat like royalty! 👑" },
    { id: 2, emoji: "🍿", title: "Movie Marathon", response: "Perfect! I'll bring the popcorn, you bring the cuddles! 🎬" },
    { id: 3, emoji: "💃", title: "Dance Party", response: "Let's dance like nobody's watching! (Even if they are 😂)" },
    { id: 4, emoji: "👨‍🍳", title: "Cook Together", response: "Hope you're ready for some kitchen chaos and delicious food! 🔥" },
    { id: 5, emoji: "🎮", title: "Game Night", response: "Game on! But I'm warning you, I play to win! 😎" },
    { id: 6, emoji: "🌟", title: "Surprise Me!", response: "Oooh mystery date! Trust me, it's gonna be epic! 🎉" }
  ];

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
  };

  const moveNoButton = () => {
    setAttempts(prev => prev + 1);
    
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 200;
    
    const newX = Math.random() * maxX - maxX / 2;
    const newY = Math.random() * maxY - maxY / 2;
    
    setNoButtonPosition({ x: newX, y: newY });
  };

  if (showSuccess) {
    return (
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
            Yaaay! 💕
          </h1>
          
          <p className="font-body text-xl md:text-2xl text-valentine-text leading-relaxed mb-8" data-testid="success-message">
            I knew the "No" button would wear you down! 😂 
            You never stood a chance against my master plan! 
            Let's make this Valentine's Day legendary! 🎉
          </p>
          
          <div className="flex gap-4 justify-center items-center">
            <Sparkles className="w-8 h-8 text-valentine-accent animate-pulse" />
            <p className="font-body text-lg text-valentine-accent font-semibold" data-testid="success-tagline">
              This is just the beginning of our amazing adventure together
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

  return (
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
          Will you be my Valentine?
        </h1>

        <p className="font-body text-lg md:text-xl leading-relaxed mb-8" 
           style={{ color: '#590D22' }}
           data-testid="proposal-subtext">
          This Valentine's Day would be incomplete without you 💝
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
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onHoverStart={moveNoButton}
            onClick={moveNoButton}
            className="rounded-full px-8 py-4 text-xl font-bold border-2 shadow-lg absolute"
            style={{ 
              background: 'white',
              color: '#C9184A',
              borderColor: '#FF4D6D'
            }}
            data-testid="no-button"
          >
            {attempts === 0 ? "No" : attempts < 3 ? "No way!" : attempts < 5 ? "Still no!" : "Nope! 😊"}
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
            {attempts < 5 ? "Come on, you know you want to say yes! 😉" : "I can do this all day! 😄"}
          </motion.p>
        )}
      </motion.div>
    </div>
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
