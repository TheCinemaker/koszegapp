import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import ScanHelpModal from '../components/ScanHelpModal';

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

  const renderContent = () => {
    if (gameState === 'loading') {
      return (
        <div className="font-zeyada text-amber-900 text-2xl sm:text-3xl leading-relaxed text-center space-y-8 font-bold">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-3xl font-medium text-amber-900">Keresem a kincset...</p>
        </div>
      );
    }

    if (error) {
      return (
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
      );
    }

    if (!gem) {
      return (
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
      );
    }

    if (gameState === 'intro') {
      return (
        <div className="animate-scale-in">
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
      );
    }

    if (gameState === 'question') {
      return (
        <div className="animate-fadein">
          <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-6 text-center">{gem.question}</h2>
          <div className="space-y-3 mb-6">
            {gem.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)} 
                className="w-full text-left p-4 rounded-lg bg-white/80 dark:bg-gray-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition border border-amber-200 dark:border-gray-600"
              >
                {opt.text}
              </button>
            ))}
          </div>
          {gem.hint && (
            <div className="bg-amber-100/50 dark:bg-gray-700/50 p-3 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Segítség:</span> {gem.hint}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (gameState === 'correct') {
      return (
        <div className="animate-fadein text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">Helyes Válasz!</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">A következő kincshez vezető utat megnyitottad.</p>
          <Link 
            to={`/game/gem/${gem.options.find(o => o.isCorrect).next_gem_id}`} 
            className="inline-block mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
          >
            Irány a következő kincs! &rarr;
          </Link>
        </div>
      );
    }

    if (gameState === 'already_found') {
      return (
        <div className="animate-fadein text-center">
          <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-300 mb-4">Ezt a kincset már megtaláltad!</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">Folytatod a kalandot, vagy megnézed az eddigi zsákmányt?</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              to="/game/treasure-chest" 
              className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Megtalált kincseim
            </Link>
            <ScanButton onClick={() => setShowScanHelp(true)} />
          </div>
        </div>
      );
    }

    if (gameState === 'wrong_answer') {
      return (
        <div className="animate-fadein text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Sajnos nem ez a helyes válasz!</h1>
          <p className="text-lg mt-2 text-gray-700 dark:text-gray-300">De ne add fel, próbáld újra!</p>
        </div>
      );
    }

    return null;
  };

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
          {renderContent()}
        </div>
        {/* Fade maszkolás */}
        <div className="pointer-events-none absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
      </div>

      {showScanHelp && <ScanHelpModal onClose={() => setShowScanHelp(false)} />}
    </div>
  );
}
