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
      className="max-w-md w-full max-h-[90vh] flex flex-col rounded-2xl shadow-lg border-2 border-amber-700/40 animate-fadein-slow relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/game/pergamen.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="scroll-mask flex-1 overflow-y-auto relative z-10 px-[12.5%] pt-24 pb-24">
        <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-8 font-bold">

          <h1 className="text-4xl sm:text-5xl font-bold">
            Megtaláltad a város kincsesládájának egyik darabját!
          </h1>

          <p>
            A kezedben tartott <strong>titkos nagyító</strong> nem csupán eszköz – hanem egy kulcs, ami Kőszeg rejtett múltját és nem ismert kincseit fedi fel előtted.
          </p>

          <ul className="text-left space-y-4 list-none">
            <li>📍 Keresd a QR kódokat a város eldugott pontjain</li>
            <li>🧠 Oldd meg a rejtvényeket, hogy továbbjuthass</li>
            <li>💎 Csak a legkitartóbbak találják meg az összes kincset</li>
          </ul>

          <p className="text-3xl sm:text-4xl font-bold">
            ⚠️ A játék elindult. Nincs visszaút! Most már játszanod kell.
          </p>

          <p className="text-2xl sm:text-3xl font-bold">
            A kezdéshez kattints a pecsétre!
          </p>

          <div className="flex justify-center">
            <img
              src="/images/game/waxseal.jpeg"
              alt="Pecsét – kezdés"
              onClick={handleStartGame}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300 animate-float"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
