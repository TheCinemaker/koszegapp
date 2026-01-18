import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { motion } from 'framer-motion';

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
  const { foundGems, resetGame, isGemFound, REQUIRED_KEYS } = useGame();
  const navigate = useNavigate();
  const [allGems, setAllGems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHiddenGems()
      .then(data => setAllGems(data))
      .finally(() => setLoading(false));
  }, []);

  const handleReset = () => {
    if (window.confirm("Valóban alaphelyzetbe állítod az időkaput?")) {
      resetGame();
      navigate('/');
    }
  };

  const foundCount = foundGems.length;
  // const progress = Math.min(100, (foundCount / REQUIRED_KEYS) * 100);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

      {/* ===== ÉVSZÁM – FIX HELYEN (15% MAGASAN) ===== */}
      <div className="absolute top-[15%] left-0 right-0 flex justify-center pointer-events-none z-0">
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
            onClick={handleReset}
            className="text-[10px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-red-400 transition-all"
          >
            Rendszer Újraindítása
          </button>
        </motion.div>

      </div>
    </div>
  );
}
