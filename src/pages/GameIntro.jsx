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
  // Removed automatic phase switching as per new requirement (waiting for user click)

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
      <div className="absolute top-[30px] left-0 right-0 flex flex-col items-center pointer-events-none z-0">
        <div className="font-serif text-7xl md:text-8xl tracking-widest text-neutral-100/70 leading-none">
          {year}
        </div>
        <div className="mt-2 text-[10px] md:text-xs uppercase tracking-[0.3em] text-neutral-100/30 font-sans">
          Van, amit csak a falak tudnak.
        </div>
      </div>

      {/* ===== TARTALMI RÉTEG ===== */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-[20vh] space-y-8 text-center">

        <AnimatePresence mode='wait'>
          {/* 1. FÁZIS: INTRO (Unified Text) */}
          {(phase === 'intro') && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5, ease: 'easeOut' }} // Slower, unified fade
              className="space-y-6 text-center max-w-sm mx-auto"
            >
              <div className="text-white/80 leading-relaxed font-light text-sm uppercase tracking-widest space-y-6">
                <p>
                  AZ IDŐ NEM VONAL.<br />
                  HANEM RÉTEGEK EGYMÁSON.
                </p>
                <p>
                  A VÁROS NEM CSAK ÉPÜLT.<br />
                  MEGMARADT.
                </p>
                <p>
                  FALAI NEM BESZÉLNEK HANGOSAN.<br />
                  DE EMLÉKEZNEK.
                </p>
                <p>
                  VANNAK HELYEK,<br />
                  AHOL A MÚLT NEM MÖGÖTTED VAN,<br />
                  HANEM KÖRÜLÖTTED.
                </p>
                <p className="text-white font-semibold">
                  HA JÓ HELYEN ÁLLSZ MEG,<br />
                  TALÁN ÉSZREVESZED.
                </p>
              </div>

              {/* Tovább Gomb - Késleltetve */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4, duration: 1 }} // Button appears after text is fully read
                onClick={() => setPhase('choice')}
                className="
                   mt-12
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
                   inline-block
                 "
              >
                INDULJ EL →
              </motion.button>
            </motion.div>
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

      {/* ===== LÁBLÉC: JOGI & SZABÁLYOK (Fixen alul) ===== */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-between z-20">
        <button
          onClick={() => window.open('/game/rules', '_blank')}
          className="text-xs text-blue-400/70 hover:text-blue-300 uppercase tracking-wider transition-colors"
        >
          Játékszabályok
        </button>
        <button
          onClick={() => window.open('/game/legal', '_blank')}
          className="text-xs text-blue-400/70 hover:text-blue-300 uppercase tracking-wider transition-colors"
        >
          Jogi Nyilatkozat
        </button>
      </div>
    </div>
  );
}
