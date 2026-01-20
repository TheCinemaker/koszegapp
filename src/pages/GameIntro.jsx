import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerNameInput from '../screens/game/PlayerNameInput';

export default function GameIntro() {
  const navigate = useNavigate();
  const { startGame, setGameMode } = useGame();

  const [year, setYear] = useState(2025);
  const [phase, setPhase] = useState('counting'); // counting, intro, rules, name, choice
  const [mode, setMode] = useState(null);
  const [playerName, setPlayerName] = useState('');

  /* ===== IDŐSZÁMLÁLÓ ===== */
  useEffect(() => {
    const start = 2025;
    const end = 1532;
    const duration = 2800; // Gyors pörgetés
    const frames = 60;
    let f = 0;

    const timer = setInterval(() => {
      f++;
      const t = f / frames;
      const eased = 1 - Math.pow(1 - t, 4); // Ease-out quartic
      setYear(Math.floor(start - (start - end) * eased));

      if (f >= frames) {
        clearInterval(timer);
        setYear(end);
        // Várunk kicsit a pörgetés után, mielőtt jön a szöveg
        setTimeout(() => setPhase('intro'), 400);
      }
    }, duration / frames);

    return () => clearInterval(timer);
  }, []);

  /* ===== FÁZISOK LÉPTETÉSE (KÉZI) ===== */
  // Az auto-timer törölve, gombbal lépünk tovább.

  const handleNameSubmit = (name) => {
    setPlayerName(name);
    // 1. Game Mode és Név beállítás (mode már set-elve van)
    // 2. Játék indítása (Intro kapuval)
    startGame('intro_1532', mode, name);
    // 3. Navigáció a SoftStart-ra
    navigate('/game/start', { replace: true });
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setPhase('name');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

      {/* ===== ÉVSZÁM – 30px FENTRŐL ===== */}
      <div className="absolute top-[30px] left-0 right-0 flex justify-center pointer-events-none">
        <div className="font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70">
          {year}
        </div>
      </div>

      {/* ===== TARTALMI RÉTEG ===== */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-[20vh] space-y-8 text-center">

        <AnimatePresence mode='wait'>
          {/* 1. FÁZIS: INTRO (SOFTSTART DESIGN) */}
          {(phase === 'intro' || phase === 'rules' || phase === 'choice') && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-4"
            >
              <h1 className="text-2xl font-serif text-white/90 leading-tight">
                Az idő nem egyenes vonal.
              </h1>
              {phase !== 'choice' && (
                <p className="text-white/60 leading-relaxed font-light mt-4 space-y-2 text-sm">
                  <span>A város nem csak épült. Megmaradt.</span>
                  <br />
                  <span>Falai emlékeket hordoznak.</span>
                </p>
              )}
            </motion.div>
          )}

          {/* 2. FÁZIS: LORE (MÚLT) */}
          {(phase === 'rules') && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mt-4 text-white/60 leading-relaxed font-light max-w-sm mx-auto text-sm"
            >
              <p>Vannak helyek, ahol a múlt csendben figyel.</p>
              <p className="mt-4 font-serif italic text-white/80">
                Ezek a helyek mesélnek.
              </p>
            </motion.div>
          )}

          {/* NEXT GOMBOK (Intro / Rules) */}
          {phase === 'intro' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }} // Kis késleltetés, hogy ne nyomják el azonnal
              onClick={() => setPhase('rules')}
              className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs uppercase tracking-[0.2em] transition-all"
            >
              Tovább
            </motion.button>
          )}

          {phase === 'rules' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setPhase('choice')}
              className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs uppercase tracking-[0.2em] transition-all"
            >
              Tovább
            </motion.button>
          )}

          {/* 3. FÁZIS: VÁLASZTÁS */}
          {phase === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.8 }}
              className="mt-4 space-y-6 w-full"
            >
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Válassz utat
                </p>
                <p className="text-xs font-serif italic text-white/60">
                  Mindkettő ugyanoda vezet.
                </p>
              </div>

              <div className="space-y-3 text-left w-full">
                <button
                  onClick={() => handleModeSelect('child')}
                  className="w-full py-4 px-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-lg group"
                >
                  <div className="font-serif text-lg text-white group-hover:text-amber-200 transition-colors">Felfedező</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
                    Könnyedebb kaland
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect('adult')}
                  className="w-full py-4 px-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-lg group"
                >
                  <div className="font-serif text-lg text-white group-hover:text-amber-200 transition-colors">Történész</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
                    Mélyebb összefüggések
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* 4. FÁZIS: NAME INPUT */}
          {phase === 'name' && (
            <motion.div
              key="name-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <PlayerNameInput onNameSubmit={handleNameSubmit} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
