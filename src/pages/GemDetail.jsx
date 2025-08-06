import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';

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
    // --- INTRO ÁTIRÁNYÍTÁS LOGIKA ---
    if (!hasPlayedBefore()) {
      navigate('/game/intro', { state: { redirectTo: `/gem/${id}` }, replace: true });
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

  if (gameState === 'loading') return <GemPageWrapper><p className="font-semibold text-lg text-white">Keresem a kincset...</p></GemPageWrapper>;
  if (error) return <GemPageWrapper><p className="font-semibold text-lg text-red-500">Hiba: {error}</p></GemPageWrapper>;
  if (!gem) return <GemPageWrapper><p className="font-semibold text-lg text-white">Ez a kincs nem létezik.</p></GemPageWrapper>;

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
        {gameState === 'intro' && (
          <div className="animate-scale-in">
             <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300 text-center mb-6">🎉 Megtaláltad a(z) {gem.name} titkát! 🎉</h1>
            <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-auto max-h-[60vh] object-cover rounded-xl mb-6 shadow-md"/>
            <h2 className="text-2xl font-semibold mb-2 text-purple-900 dark:text-purple-200">{gem.name}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{gem.description}</p>
            <button onClick={() => setGameState('question')} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg">Készen állsz a következő kihívásra?</button>
          </div>
        )}
        {gameState === 'question' && ( /* ... kód változatlan ... */ )}
        {gameState === 'correct' && ( /* ... kód változatlan ... */ )}
        {gameState === 'already_found' && ( /* ... kód változatlan ... */ )}
        {gameState === 'wrong_answer' && ( /* ... kód változatlan ... */ )}
      </div>
    </div>
  );
}
