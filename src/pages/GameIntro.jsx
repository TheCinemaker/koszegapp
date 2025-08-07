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
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg border-2 border-amber-700/40 animate-fadein-slow"
        style={{
          backgroundImage: "url('/images/game/pergamen.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="p-6 sm:p-8 pt-24 pb-24 text-center font-zeyada text-amber-900 text-lg leading-relaxed">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Megidézted a térképet...</h1>

          <p className="mb-6">
            Egy ősi erő válaszolt a hívásodra. A kezedben tartott <strong>titkos térkép</strong> nem csupán papír – hanem egy kulcs, ami Kőszeg rejtett múltját és elveszett kincseit fedi fel előtted.
          </p>

          <ul className="text-left space-y-3 pl-4 pr-2">
            <li>📍 Keresd a QR kódokat a város eldugott pontjain</li>
            <li>🧠 Oldd meg a rejtvényeket, hogy továbbjuthass</li>
            <li>💎 Csak a legkitartóbbak találják meg az összes kincset</li>
          </ul>

          <div className="mt-6 bg-amber-100/70 p-4 rounded-md border-l-4 border-amber-500 shadow-md">
            ⚠️ A játék elindult. Nincs visszaút. Most már játszanod kell.
          </div>

          <button
            onClick={handleStartGame}
            className="mt-6 w-full bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-800 hover:to-amber-900 transition shadow-lg text-lg"
          >
            🗺️ INDÍTSD EL A KALANDOT!
          </button>
        </div>
      </div>
    </div>
  );
}
