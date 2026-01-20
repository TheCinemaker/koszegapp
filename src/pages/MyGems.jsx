import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { motion, AnimatePresence } from 'framer-motion';
import { storyChapters } from '../data/story_chapters';
import GameCompleteScreen from '../screens/game/GameCompleteScreen';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

// --- COMPONENTS ---
const StoryOverlay = ({ chapter, onClose }) => {
  if (!chapter) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-blue-400 text-xs font-mono uppercase tracking-[0.3em] mb-2">
            Új Fejezet Feloldva
          </div>
          <h2 className="text-3xl font-serif text-white mb-6">
            {chapter.title}
          </h2>
          <div className="w-12 h-[1px] bg-white/20 mx-auto mb-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="text-white/80 leading-relaxed font-light italic"
        >
          {chapter.content.split('\n').map((line, i) => (
            line.trim() && <p key={i} className="mb-4">{line}</p>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          onClick={onClose}
          className="px-8 py-3 border border-white/20 rounded-full text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
        >
          Tovább a Naplóhoz
        </motion.button>
      </div>
    </motion.div>
  );
};

const GemCard = ({ gem, isFound, onClick }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileTap={{ scale: 0.95 }}
      onClick={() => isFound && onClick(gem.id)}
      className={`
        aspect-square rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300
        ${isFound
          ? 'bg-amber-900/20 border border-amber-500/30 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:bg-amber-900/40 hover:border-amber-500/60'
          : 'bg-white/5 border border-white/5 opacity-40 cursor-default'}
      `}
    >
      {/* GLOW EFFECT (FOUND) */}
      {isFound && (
        <div className="absolute inset-0 bg-amber-500/10 blur-xl animate-pulse" />
      )}

      {/* ICON / CONTENT */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        {/* Simple Dot for now, or could use an icon if available */}
        <div className={`
          w-2 h-2 rounded-full transition-all duration-500 mb-1
          ${isFound ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-white/20'}
        `} />

        {/* SHORT ID or NAME TRUNCATED */}
        <div className="text-[9px] uppercase font-mono tracking-widest text-white/60 text-center px-1">
          {isFound ? (gem.shortName || 'KAPU') : 'XXX'}
        </div>
      </div>

      {/* CORNER DECOR */}
      {isFound && (
        <>
          <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-amber-500/50" />
        </>
      )}

    </motion.div>
  );
};

export default function MyGems() {
  const { foundGems, isGemFound, REQUIRED_KEYS, gameState } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  // Story State
  const [activeStory, setActiveStory] = useState(null);

  // --- GATEKEEPER LOGIKA ---
  useEffect(() => {
    if (!gameState.gameStarted) {
      navigate('/game/intro');
    }
  }, [gameState.gameStarted, navigate]);

  // Story Check Logic
  useEffect(() => {
    if (loading) return;

    const count = foundGems.length;
    const seenStories = JSON.parse(localStorage.getItem('koszeg_seen_stories') || '[]');

    const unlockedChapters = storyChapters.filter(c => c.unlockAt <= count && !seenStories.includes(c.id));

    if (unlockedChapters.length > 0) {
      setActiveStory(unlockedChapters[0]);
    }

  }, [foundGems.length, loading]);

  const handleStoryClose = () => {
    if (!activeStory) return;

    const seenStories = JSON.parse(localStorage.getItem('koszeg_seen_stories') || '[]');
    const newSeen = [...seenStories, activeStory.id];
    localStorage.setItem('koszeg_seen_stories', JSON.stringify(newSeen));

    setActiveStory(null);
  };

  useEffect(() => {
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  if (!gameState.gameStarted) return null;
  if (loading) return null;

  const foundCount = foundGems.length;
  const isGameComplete = foundCount >= REQUIRED_KEYS;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

      {/* CERTIFICATE OVERLAY */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <GameCompleteScreen onExplore={() => setShowCertificate(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* STORY OVERLAY */}
      <AnimatePresence>
        {activeStory && <StoryOverlay chapter={activeStory} onClose={handleStoryClose} />}
      </AnimatePresence>

      {/* ===== ÉVSZÁM – FIX HELYEN (15% MAGASAN) ===== */}
      <div className="absolute top-[30px] left-0 right-0 flex justify-center pointer-events-none z-0">
        <div className="font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70">
          1532
        </div>
      </div>

      {/* ===== TARTALMI RÉTEG (Görgethető) ===== */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-[32vh] pb-32">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="w-full text-center mb-12"
        >
          <h2 className="text-3xl font-serif text-white/90 mb-2">Státusz Napló</h2>
          <div className="text-xs font-mono uppercase tracking-[0.3em] opacity-40">
            {foundCount} / {REQUIRED_KEYS} IDŐKAPU NYITVA
          </div>
        </motion.div>

        {/* Grid - Staggered */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full grid grid-cols-4 gap-3 px-4 mb-20"
        >
          {allGems.map(gem => (
            <GemCard
              key={gem.id}
              gem={gem}
              isFound={isGemFound(gem.id)}
              onClick={(id) => navigate(`/game/gem/${id}`)}
            />
          ))}
        </motion.div>

        {/* Footer / Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="w-full flex flex-col items-center gap-4"
        >

          {/* CERTIFICATE BUTTON (Visible ONLY if Game Complete) */}
          {isGameComplete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCertificate(true)}
              className="
                w-full py-4 mb-4
                bg-amber-900/40 border border-amber-500/50 rounded-lg
                text-amber-100 font-serif text-sm uppercase tracking-[0.15em]
                shadow-[0_0_20px_rgba(245,158,11,0.2)]
                flex items-center justify-center gap-3
              "
            >
              <span>📜</span> Vitézi Oklevél Megtekintése
            </motion.button>
          )}

          <button
            onClick={() => navigate('/game/scan')}
            className="
               w-full py-4 
               border border-white/20 rounded-lg
               bg-white/5 hover:bg-white/10 
               text-white text-xs uppercase tracking-[0.2em]
               transition-all mb-4
             "
          >
            QR Kód Beolvasása
          </button>

        </motion.div>

      </div>
    </div>
  );
}
