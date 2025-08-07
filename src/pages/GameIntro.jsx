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
      <div className="max-w-md w-full bg-amber-50/90 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-[0_0_60px_rgba(255,215,0,0.2)] border-2 border-amber-700/40 animate-fadein-slow">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-800 dark:text-amber-300 font-serif mb-4">
            Megidézted a térképet...
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6 mb-8 text-amber-900 dark:text-amber-100 text-lg leading-relaxed">
          <p>
            Egy ősi erő válaszolt a hívásodra. A kezedben tartott <span className="font-semibold text-amber-700 dark:text-yellow-400">titkos térkép</span> nem csupán papír – hanem egy <em>kulcs</em>, ami Kőszeg rejtett múltját és elveszett kincseit fedi fel előtted.
          </p>

          <ul className="space-y-3 text-base text-amber-800 dark:text-amber-200">
            <li className="flex items-start">
              <span className="mr-2">📍</span>
              <span>
                Járd be a várost, és keresd a QR kódokat elrejtve szobrokon, műemlékeken, falakon...
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🧠</span>
              <span>
                Oldd meg a rejtvényeket, amiket a kódok őriznek – minden válasz egy újabb titkot nyit meg.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💎</span>
              <span>
                Gyűjtsd össze az összes kincset – de csak a legkitartóbbak láthatják mindet!
              </span>
            </li>
          </ul>

          <div className="bg-amber-100/50 dark:bg-amber-800/30 p-4 rounded-lg border-l-4 border-amber-500">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              ⚠️ A játék elindult. Nincs visszaút. Most már <span className="underline">játszanod kell</span>.
            </p>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-800 hover:to-amber-900 transition shadow-lg text-lg"
        >
          🗺️ INDÍTSD EL A KALANDOT!
        </button>
      </div>
    </div>
  );
}
