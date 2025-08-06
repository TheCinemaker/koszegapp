import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function GameIntro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markAsPlayed } = useGame();

  const handleStartGame = () => {
    markAsPlayed();
    const redirectTo = location.state?.redirectTo || '/';
    navigate(redirectTo, { replace: true });
  };

  return (
    // === ITT A JAVÍTÁS: A te háttérképedet használjuk ===
    <div 
      className="-m-4 -mb-6 min-h-screen flex items-center justify-center p-4 text-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/game/terkep.webp')" }}
    >
      <div className="max-w-md w-full bg-black/20 backdrop-blur-sm p-8 rounded-lg shadow-2xl animate-fadein ring-2 ring-yellow-700/50">
        <h1 className="text-4xl font-bold text-gray-800 font-serif mb-4 drop-shadow-lg">Üdv, Kalandor!</h1>
        <p className="text-gray-900 font-semibold leading-relaxed mb-6 drop-shadow-md">
          Egy titkos ösvényre léptél. Egy játékot találtál, ami Kőszeg rejtett csodáihoz vezet.
          A szabály egyszerű: szkennelj, fejts meg egy rejtvényt, és találd meg a következő nyomot.
        </p>
        <p className="font-bold text-lg text-red-800 mb-8 drop-shadow-lg">
          De vigyázz! A játékot, mit elkezdtél, végig kell játszanod!
        </p>
        <button
          onClick={handleStartGame}
          className="bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl hover:bg-green-800 transition shadow-lg transform hover:scale-105"
        >
          BELEVÁGOK!
        </button>
      </div>
    </div>
  );
}
