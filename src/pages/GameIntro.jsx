import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { IoShieldHalfOutline, IoHappyOutline, IoSkullOutline } from 'react-icons/io5';

export default function GameIntro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markAsPlayed, setGameMode } = useGame();
  const [selectedMode, setSelectedMode] = useState(null);

  const handleStartGame = () => {
    if (!selectedMode) return;

    setGameMode(selectedMode);
    markAsPlayed();
    // Navigate to dashboard or specific gem if redirected
    const redirectTo = location.state?.redirectTo || '/game/treasure-chest';
    navigate(redirectTo, { replace: true });
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, rgba(0,0,0,0.7), rgba(0,0,0,0.95)), url('/images/game/terkep.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="max-w-xl w-full max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border-4 border-amber-900/60 animate-fadein relative overflow-hidden bg-[#f4e4bc]"
        style={{
          boxShadow: '0 0 60px rgba(0,0,0,0.9) inset',
        }}
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]" />

        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-8 text-center text-amber-950">

          {/* Coat of Arms */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/game/jurisics_cimer.jpg"
              alt="Jurisics Címer"
              className="w-32 h-auto drop-shadow-xl"
            />
          </div>

          <h1 className="font-zeyada text-5xl sm:text-6xl font-black mb-6 drop-shadow-sm text-balance leading-none text-amber-900">
            KŐSZEG QUEST
          </h1>

          <div className="space-y-6 text-lg sm:text-xl font-medium leading-relaxed px-2 font-serif">
            <div className="bg-red-900/10 border-l-4 border-red-800 p-4 rounded-r-lg text-left mb-6">
              <p className="text-red-900 font-bold text-xl uppercase tracking-widest mb-1">
                ⚠️ Figyelem!
              </p>
              <p className="text-red-950/80 font-semibold">
                A játék elkezdése után nincs visszaút. A város sorsa a te kezedben van.
              </p>
            </div>

            <p>
              Kőszeg utcáin rejtélyek várnak. Minden sarkon egy újabb nyom, minden falban egy újabb titok.
            </p>

            <div className="bg-amber-900/5 p-5 rounded-xl border border-amber-900/10 my-6 text-left shadow-sm">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-amber-900 border-b border-amber-900/10 pb-2">
                <IoShieldHalfOutline className="text-2xl" />
                A KÜLDETÉS:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-amber-800 text-amber-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</span>
                  <span>Keress <strong className="text-amber-900">QR Kódokat</strong> a város pontjain.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-amber-800 text-amber-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</span>
                  <span>Szkenneld be őket a telefonoddal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-amber-800 text-amber-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</span>
                  <span>Válaszolj helyesen és szerezd meg a rangot!</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mt-8 space-y-4">
            <p className="text-base font-bold uppercase tracking-widest text-amber-900/60">Válassz nehézséget:</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMode('child')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedMode === 'child'
                    ? 'bg-green-700/10 border-green-700 shadow-md transform scale-[1.02]'
                    : 'bg-white/40 border-amber-900/10 hover:bg-white/60 hover:border-amber-900/30'
                  }`}
              >
                <IoHappyOutline className={`text-4xl mb-2 ${selectedMode === 'child' ? 'text-green-800' : 'text-amber-900/40'}`} />
                <span className="font-bold text-lg text-amber-900">Apród</span>
                <span className="text-sm font-sans text-amber-800/70">(Gyerek)</span>
              </button>

              <button
                onClick={() => setSelectedMode('adult')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedMode === 'adult'
                    ? 'bg-red-900/10 border-red-900 shadow-md transform scale-[1.02]'
                    : 'bg-white/40 border-amber-900/10 hover:bg-white/60 hover:border-amber-900/30'
                  }`}
              >
                <IoSkullOutline className={`text-4xl mb-2 ${selectedMode === 'adult' ? 'text-red-900' : 'text-amber-900/40'}`} />
                <span className="font-bold text-lg text-amber-900">Vitéz</span>
                <span className="text-sm font-sans text-amber-800/70">(Felnőtt)</span>
              </button>
            </div>
          </div>

          {/* Start Button */}
          <div className="mt-8 pb-4">
            <button
              onClick={handleStartGame}
              disabled={!selectedMode}
              className={`
                w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all transform
                ${selectedMode
                  ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 hover:from-amber-800 hover:to-amber-950 hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'}
              `}
            >
              {selectedMode ? 'Kalandra fel!' : 'Válassz módot!'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
