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
      className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4"
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/game/terkep.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-md w-full bg-amber-50/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl border-2 border-amber-700/30">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-800 font-serif mb-4">Üdv, Kalandor!</h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="space-y-6 mb-8">
          <p className="text-lg text-amber-900 leading-relaxed">
            Egy <span className="font-semibold text-amber-700">titkos térképre</span> találtál, ami Kőszeg rejtett kincseihez vezet.
          </p>
          
          <ul className="space-y-3 text-left text-amber-800">
            <li className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>Szkennelj QR kódokat a történelmi helyszíneken</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>Fejtsd meg a rejtvényeket</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-600 mr-2">•</span>
              <span>Gyűjtsd össze az összes kincset!</span>
            </li>
          </ul>
          
          <div className="bg-amber-100/50 p-4 rounded-lg border-l-4 border-amber-500">
            <p className="font-semibold text-amber-800">
              ⚠️ A játékot végig kell játszanod!
            </p>
          </div>
        </div>
        
        <button
          onClick={handleStartGame}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-700 hover:to-amber-800 transition shadow-lg"
        >
          BELEVÁGOK A KALANDBA!
        </button>
      </div>
    </div>
  );
}
