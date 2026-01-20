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

  /* ===== FÁZISOK LÉPTETÉSE ===== */
  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => setPhase('rules'), 3500); // Intro olvasási idő
      return () => clearTimeout(t);
    }
    if (phase === 'rules') {
      const t = setTimeout(() => setPhase('name'), 5000); // Lore olvasási idő -> NÉV BEKÉRÉS
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleNameSubmit = (name) => {
    setPlayerName(name);
    setPhase('choice');
  };

  const handleEnter = () => {
    // 1. Game Mode és Név beállítás
    setGameMode(mode);
    // 2. Játék indítása (Intro kapuval)
    startGame('intro_1532', mode, playerName);
    // 3. Navigáció a SoftStart-ra
    navigate('/game/start', { replace: true });
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
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-[20vh] space-y-10 text-center">

        <AnimatePresence>
          {/* 1. FÁZIS: INTRO (SOFTSTART DESIGN) */}
          {(phase === 'intro' || phase === 'rules' || phase === 'choice') && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-3xl font-serif text-white/90 leading-tight">
                Az idő nem egyenes vonal.
              </h1>
              <p className="text-white/60 leading-relaxed font-light mt-4 space-y-2">
                <span>
                  A város nem csak épült. Megmaradt.
                </span>
                <span>
                  Falai nem csupán kövek. Emlékeket hordoznak.
                </span>
              </p>
            </motion.div>
          )}

          {/* 2. FÁZIS: LORE (MÚLT) */}
          {(phase === 'rules' || phase === 'choice') && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="mt-4 text-white/60 leading-relaxed font-light max-w-sm mx-auto"
            >
              <p>
                Vannak helyek, ahol a múlt nem tűnt el, csak csendben figyel.
              </p>
              <p className="mt-4 font-serif italic text-white/80">
                Ezek a helyek mesélnek. Nem mindenkinek egyszerre.
              </p>
              <p className="mt-4">
                A város őrzi, ami akkor számított.
              </p>
            </motion.div>
          )}

          {/* 3. FÁZIS: NAME INPUT */}
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

          {/* 4. FÁZIS: VÁLASZTÁS */}
          {phase === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mt-8 space-y-8"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                  Két út nyílik meg előtted, <span className="text-amber-500 font-bold">{playerName}</span>.
                </p>
                <p className="text-sm font-serif italic text-white/60">
                  Mindkettő ugyanoda vezet —<br />
                  de mást enged közel.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <button
                  onClick={() => setMode('child')}
                  className={`w-full pb-3 border-b transition-all duration-300
                    ${mode === 'child'
                      ? 'border-white/80 text-white'
                      : 'border-white/10 text-white/40 hover:text-white/70'}
                  `}
                >
                  <div className="font-serif text-lg">Felfedező</div>
                  <div className="text-xs uppercase tracking-widest opacity-60">
                    Könnyedebb megértés
                  </div>
                </button>

                <button
                  onClick={() => setMode('adult')}
                  className={`w-full pb-3 border-b transition-all duration-300
                    ${mode === 'adult'
                      ? 'border-amber-200/60 text-amber-50'
                      : 'border-white/10 text-neutral-100/40 hover:text-neutral-100/70'}
                  `}
                >
                  <div className="font-serif text-lg">Történész</div>
                  <div className="text-xs uppercase tracking-widest opacity-60">
                    Mélyebb összefüggések
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* VÉGSŐ BELÉPÉS GOMB (CSAK HA VAN MODE) */}
          <AnimatePresence>
            {mode && (
              <motion.div
                key="enter-button"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-8"
              >
                <button
                  onClick={handleEnter}
                  className="
                    text-xs
                    uppercase
                    tracking-[0.4em]
                    text-blue-300
                    opacity-80
                    hover:opacity-100
                    border-b border-transparent
                    hover:border-blue-300/40
                    pb-2
                    transition-all
                  "
                >
                  Belépek az időkapun →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </AnimatePresence>
      </div>
    </div>
  );
}
