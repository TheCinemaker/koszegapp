import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import ScanHelpModal from '../components/ScanHelpModal';

const GemPageWrapper = ({ children }) => (
  <div 
    className="-m-4 -mb-6 min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
    style={{
      backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/game/terkep.webp')"
    }}
  >
    {children}
  </div>
);

const ScanButton = ({ onClick }) => (
  <button onClick={onClick} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg text-center">
    📷 Keress egy új kincset!
  </button>
);

export default function GemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addFoundGem, isGemFound, hasPlayedBefore } = useGame();
  
  const [gem, setGem] = useState(null);
  const [gameState, setGameState] = useState('loading');
  const [error, setError] = useState(null);
  const [showScanHelp, setShowScanHelp] = useState(false);
  
  useEffect(() => {
    if (!hasPlayedBefore()) {
      navigate('/game/intro', { state: { redirectTo: location.pathname }, replace: true });
      return;
    }

    let isMounted = true;
    setGameState('loading');
    
    fetchHiddenGems()
      .then(data => {
        if (!isMounted) return;
        const found = data.find(g => g.id === id);
        if (!found) {
          setError('Ez a kincs nem található az adatbázisban.');
        } else {
          setGem(found);
          setGameState(isGemFound(id) ? 'already_found' : 'intro');
        }
      })
      .catch(err => isMounted && setError(err.message));
      
    return () => { isMounted = false; };
  }, [id, isGemFound, hasPlayedBefore, navigate, location]);

  const handleAnswer = (option) => {
    if (option.isCorrect) {
      addFoundGem(gem.id);
      setGameState('correct');
    } else {
      setGameState('wrong_answer');
      setTimeout(() => setGameState('question'), 1500);
    }
  };

return (
  <>
    <GemPageWrapper>
      <div className="max-w-2xl w-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden p-6">
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
