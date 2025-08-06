import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';

// Segédkomponens a "wrapper" ismétlésének elkerülésére
const GemPageWrapper = ({ children }) => (
  <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
    {children}
  </div>
);

export default function GemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addFoundGem, isGemFound, hasPlayedBefore } = useGame();
  
  const [gem, setGem] = useState(null);
  const [gameState, setGameState] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasPlayedBefore()) {
      navigate('/game/intro', { state: { redirectTo: `/game/gem/${id}` }, replace: true });
      return;
    }
    setGameState('loading');
    fetchHiddenGems()
      .then(data => {
        const found = data.find(g => g.id === id);
        if (!found) {
          setError('Ez a kincs nem található az adatbázisban.');
        } else {
          setGem(found);
          if (isGemFound(id)) {
            setGameState('already_found');
          } else {
            setGameState('intro');
          }
        }
      })
      .catch(err => setError(err.message));
  }, [id, isGemFound, hasPlayedBefore, navigate]);

  const handleAnswer = (option) => {
    if (option.isCorrect) {
      addFoundGem(gem.id);
      setGameState('correct');
    } else {
      setGameState('wrong_answer');
      setTimeout(() => setGameState('question'), 1500);
    }
  };

  if (gameState === 'loading') {
    return <GemPageWrapper><p className="font-semibold text-lg text-white">Keresem a kincset...</p></GemPageWrapper>;
  }

  if (error) {
    return <GemPageWrapper><p className="font-semibold text-lg text-red-500">Hiba: {error}</p></GemPageWrapper>;
  }

  if (!gem) {
    return <GemPageWrapper><p className="font-semibold text-lg text-white">Ez a kincs nem létezik.</p></GemPageWrapper>;
  }

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
        
        {gameState === 'intro' && (
          <div className="animate-scale-in">
            <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300 text-center mb-6">🎉 Felfedeztél egy rejtett kincset! 🎉</h1>
            <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-auto max-h-[60vh] object-cover rounded-xl mb-6 shadow-md"/>
            <h2 className="text-2xl font-semibold mb-2 text-purple-900 dark:text-purple-200">{gem.name}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{gem.description}</p>
            <button onClick={() => setGameState('question')} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg">Készen állsz a következő kihívásra?</button>
          </div>
        )}

        {gameState === 'question' && (
          <div className="animate-fadein">
            <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-6 text-center">{gem.question}</h2>
            <div className="mt-6 space-y-3">
              {gem.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(opt)} className="block w-full text-left p-4 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition font-semibold">
                  {opt.text}
                </button>
              ))}
            </div>
            {gem.hint && <p className="text-sm mt-6 text-center text-gray-500 dark:text-gray-400"><strong>Segítség:</strong> {gem.hint}</p>}
          </div>
        )}

        {gameState === 'correct' && (
          <div className="animate-fadein text-center">
            <h1 className="text-3xl font-bold text-green-500 mb-4">Helyes Válasz!</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">A következő kincshez vezető utat megnyitottad.</p>
            <Link to={`/game/gem/${gem.options.find(o => o.isCorrect).next_gem_id}`} className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg">
              Irány a következő kincs! &rarr;
            </Link>
          </div>
        )}

        {gameState === 'already_found' && (
          <div className="animate-fadein text-center">
            <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-4">Ezt a kincset már megtaláltad!</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">Folytatod a kalandot, vagy megnézed az eddigi zsákmányt?</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link to="/game/treasure-chest" className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">Megtalált kincseim</Link>
              <Link to="/" className="w-full sm:w-auto bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition">Vissza a Főoldalra</Link>
            </div>
          </div>
        )}

        {gameState === 'wrong_answer' && (
          <div className="animate-fadein text-center">
            <h1 className="text-3xl font-bold text-red-500">Sajnos nem ez a helyes válasz!</h1>
            <p className="text-lg mt-2 text-gray-700 dark:text-gray-300">De ne add fel, próbáld újra!</p>
          </div>
        )}
      </div>
    </div>
  );
}
