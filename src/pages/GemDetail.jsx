import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; 
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';

const GemPageWrapper = ({ children }) => (
  <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
    {children}
  </div>
);

export default function GemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addFoundGem, isGemFound, hasPlayedBefore } = useGame();
  
  const [gem, setGem] = useState(null);
  const [gameState, setGameState] = useState('loading');
  const [error, setError] = useState(null);

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

  // Loading and error states
  if (gameState === 'loading') {
    return (
      <GemPageWrapper>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-white">Keresem a kincset...</p>
        </div>
      </GemPageWrapper>
    );
  }

  if (error) {
    return (
      <GemPageWrapper>
        <div className="max-w-md bg-white/90 dark:bg-gray-800 rounded-xl p-6 text-center">
          <p className="text-xl font-bold text-red-500 mb-4">Hiba történt</p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <Link to="/" className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">
            Vissza a főoldalra
          </Link>
        </div>
      </GemPageWrapper>
    );
  }

  if (!gem) {
    return (
      <GemPageWrapper>
        <div className="max-w-md bg-white/90 dark:bg-gray-800 rounded-xl p-6 text-center">
          <p className="text-xl font-bold text-gray-800 dark:text-white mb-4">Kincs nem található</p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">Ez a kincs nem létezik az adatbázisban.</p>
          <Link to="/" className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">
            Vissza a főoldalra
          </Link>
        </div>
      </GemPageWrapper>
    );
  }

  return (
    <GemPageWrapper>
      <div className="max-w-2xl w-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Game State Views */}
        {gameState === 'intro' && (
          <div className="animate-scale-in p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-300 mb-2">🎉 Felfedeztél egy kincset! 🎉</h1>
              <div className="w-20 h-1 bg-amber-600 mx-auto rounded-full"></div>
            </div>
            
            <img 
              src={`/images/${gem.image}`} 
              alt={gem.name}
              className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md mb-6"
            />
            
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-200 mb-2">{gem.name}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{gem.description}</p>
            </div>
            
            <button 
              onClick={() => setGameState('question')}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              Készen állsz a kihívásra?
            </button>
          </div>
        )}

        {gameState === 'question' && (
          <div className="animate-fadein p-6">
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
        )}

        {/* Other game states... */}
      </div>
    </GemPageWrapper>
  );
}
