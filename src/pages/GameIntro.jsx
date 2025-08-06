import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function GameIntro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markAsPlayed } = useGame();

  const handleStartGame = () => {
    // 1. Megjelöljük, hogy a játékos már látta az intrót
    markAsPlayed();
    // 2. Átirányítjuk az eredetileg szkennelt QR kód céljára
    const redirectTo = location.state?.redirectTo || '/';
    navigate(redirectTo, { replace: true });
  };

  return (
    // Teljes oldalas "pergamen" háttér
    <div className="bg-[#fdf6e3] -m-4 -mb-6 min-h-screen flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-black/10 backdrop-blur-sm p-8 rounded-lg shadow-2xl animate-fadein">
        <h1 className="text-4xl font-bold text-gray-800 font-serif mb-4">Üdv, Kalandor!</h1>
        <p className="text-gray-700 leading-relaxed mb-6">
          Egy titkos ösvényre léptél. Egy játékot találtál, ami Kőszeg rejtett csodáihoz vezet.
          A szabály egyszerű: szkennelj, fejts meg egy rejtvényt, és találd meg a következő nyomot.
        </p>
        <p className="font-bold text-lg text-red-800 mb-8">
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
