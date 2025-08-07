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
  className="max-w-md w-full max-h-[90vh] rounded-2xl shadow-lg border-2 border-amber-700/40 animate-fadein-slow relative overflow-hidden"
  style={{
    backgroundImage: "url('/images/game/pergamen.jpeg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
>
  <div
    className="overflow-y-auto h-full relative z-10"
    style={{
      paddingTop: '6rem',
      paddingBottom: '6rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
    }}
  >
    <div className="font-zeyada text-amber-900 text-xl sm:text-2xl leading-relaxed text-center space-y-6">

      <h1 className="text-4xl sm:text-5xl font-bold">Megidézted a térképet...</h1>

      <p className="text-3xl sm:text-4xl">
        Egy ősi erő válaszolt a hívásodra. A kezedben tartott <strong>titkos térkép</strong> nem csupán papír – hanem egy kulcs, ami Kőszeg rejtett múltját és elveszett kincseit fedi fel előtted.
      </p>

      <ul className="text-left space-y-3 pl-4 pr-2">
        <li>📍 Keresd a QR kódokat a város eldugott pontjain</li>
        <li>🧠 Oldd meg a rejtvényeket, hogy továbbjuthass</li>
        <li>💎 Csak a legkitartóbbak találják meg az összes kincset</li>
      </ul>

      <p className="mt-8 text-3xl sm:text-4xl font-bold">
        ⚠️ A játék elindult. Nincs visszaút. Most már játszanod kell.
      </p>

      <p className="mt-8 text-xl sm:text-2xl font-semibold">
        A kezdéshez kattints a pecsétre!
      </p>
        <div className="mt-4 flex justify-center">
          <img
              src="/images/game/waxseal.jpeg"
              alt="Pecsét – kezdés"
              onClick={handleStartGame}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300 animate-float"
          />
      </div>

    </div>
  </div>

  {/* Felül fade maszkolás */}
  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-amber-50/95 to-transparent pointer-events-none z-20" />

  {/* Alul fade maszkolás */}
  <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-amber-50/95 to-transparent pointer-events-none z-20" />
</div>
}
