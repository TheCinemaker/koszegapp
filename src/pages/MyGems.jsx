import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { motion, AnimatePresence } from 'framer-motion';
import { storyChapters } from '../data/story_chapters';

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

const StatusRow = ({ gem, isFound, onClick }) => {
  return (
    <motion.div
      variants={itemVariants}
      className={`
        w-full py-4 border-b border-white/5 flex items-center justify-between group
        ${isFound ? 'opacity-100 cursor-pointer' : 'opacity-30 cursor-default'}
      `}
      onClick={() => isFound && onClick(gem.id)}
    >
      <div className="flex items-center gap-4 text-left">
        {/* Status Dot */}
        <div className={`
          w-1.5 h-1.5 rounded-full transition-all duration-500
          ${isFound ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110' : 'bg-transparent border border-white/50'}
        `} />

        <div className="flex flex-col gap-1">
          <span className={`
            font-serif text-lg leading-none tracking-wide text-white transition-all
            ${isFound ? '' : 'font-mono text-xs uppercase tracking-[0.2em] opacity-80'}
          `}>
            {isFound ? gem.name.replace(/\(.*\)/, '') : 'ZÁROLT ADAT'}
          </span>

          {isFound && (
            <span className="text-[10px] uppercase tracking-widest font-mono opacity-50">
              STABILIZÁLVA
            </span>
          )}
        </div>
      </div>

      {isFound && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest text-white/40 transform translate-x-2 group-hover:translate-x-0 duration-300">
          →
        </div>
      )}
    </motion.div>
  );
};

export default function MyGems() {
  const { foundGems, resetGame, isGemFound, REQUIRED_KEYS, gameState, startGame } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Story State
  const [activeStory, setActiveStory] = useState(null);

  // --- GATEKEEPER LOGIKA ---
  // Ha nem kezdte el a játékot, irányítsuk át a teljes képernyős Intróra
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

    // Find the highest unlocked chapter that hasn't been seen yet
    // We define logic: Show ONLY the most recent one if multiple triggered? Or show sequentially?
    // Let's show the one matching the EXACT count or simply the highest unseen <= count.

    const unlockedChapters = storyChapters.filter(c => c.unlockAt <= count && !seenStories.includes(c.id));

    if (unlockedChapters.length > 0) {
      // Show the first unseen unlocked chapter
      setActiveStory(unlockedChapters[0]);
    }

  }, [foundGems.length, loading]);

  const handleStoryClose = () => {
    if (!activeStory) return;

    // Mark as seen
    const seenStories = JSON.parse(localStorage.getItem('koszeg_seen_stories') || '[]');
    const newSeen = [...seenStories, activeStory.id];
    localStorage.setItem('koszeg_seen_stories', JSON.stringify(newSeen));

    setActiveStory(null);
  };

  if (!gameState.gameStarted) return null; // Amíg átirányít

  useEffect(() => {
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  const handleReset = () => {
    if (window.confirm("Valóban alaphelyzetbe állítod az időkaput?")) {
      // Reset story progress too
      localStorage.removeItem('koszeg_seen_stories');
      resetGame();
    }
  };

  const foundCount = foundGems.length;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

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

        {/* List - Staggered */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full space-y-2 mb-20"
        >
          {allGems.map(gem => (
            <StatusRow
              key={gem.id}
              gem={gem}
              isFound={isGemFound(gem.id)}
              onClick={(id) => navigate(`/game/gem/${id}`)}
            />
          ))}
        </motion.div>

        {/* Footer / Future Button Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="w-full flex flex-col items-center gap-8"
        >
          {/* Placeholder for FUTURE BUTTON */}
          <div className="w-full h-0"></div>

          <button
            onClick={() => navigate('/game/scan')}
            className="
               w-full py-4 
               border border-white/20 rounded-lg
               bg-white/5 hover:bg-white/10 
               text-white text-xs uppercase tracking-[0.2em]
               transition-all mb-8
             "
          >
            QR Kód Beolvasása
          </button>

          <button
            onClick={handleReset}
            className="text-[10px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-red-400 transition-all border border-white/10 px-4 py-2 rounded"
          >
            Rendszer Újraindítása (RESET)
          </button>
        </motion.div>

      </div>
    </div>
  );
}
