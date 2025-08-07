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

if (gameState === 'loading') {
  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
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
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-3xl font-medium text-amber-900">Keresem a kincset...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
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
            <h1 className="text-4xl font-bold text-red-600">Hiba történt</h1>
            <p className="text-2xl">{error}</p>
            <Link 
              to="/" 
              className="inline-block mt-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
            >
              Vissza a főoldalra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

if (!gem) {
  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
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
            <h1 className="text-4xl font-bold">Kincs nem található</h1>
            <p className="text-2xl">Ez a kincs nem létezik az adatbázisban.</p>
            <Link 
              to="/" 
              className="inline-block mt-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
            >
              Vissza a főoldalra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <>
    {gameState === 'intro' && (
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="animate-scale-in">
          <div
            className="max-w-md w-full max-h-[90vh] flex flex-col rounded-2xl shadow-lg border-2 border-amber-700/40 relative overflow-hidden"
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
                  🎉 Felfedeztél egy kincset! 🎉
                </h1>
                <img
                  src={`/images/${gem.image}`}
                  alt={gem.name}
                  className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md"
                />
                <div>
                  <h2 className="text-3xl sm:text-4xl mb-4">{gem.name}</h2>
                  <p className="whitespace-pre-line">{gem.description}</p>
                </div>
                <p className="text-3xl sm:text-4xl font-bold">
                  Készen állsz a következő kihívásra?
                </p>
                <button
                  onClick={() => setGameState('question')}
                  className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg text-lg"
                >
                  Induljon a kihívás! 💎
                </button>
              </div>
            </div>
            {/* Fade maszkolás */}
            <div className="pointer-events-none absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
          </div>
        </div>
      </div>
    )}

    {/* A többi gameState (question, correct, stb.) hasonlóan átalakítva */}
    
    {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
  </>
);
}
