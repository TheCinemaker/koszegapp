import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame'; // Az új hook-unk!

export default function GemDetail() {
  const { id } = useParams();
  const { addFoundGem, isGemFound, foundGems } = useGame();
  
  const [gem, setGem] = useState(null);
  const [gameState, setGameState] = useState('intro'); // 'intro', 'question', 'correct', 'already_found'
  // ... a szokásos loading, error ...

  useEffect(() => {
    fetchHiddenGems().then(data => {
      const found = data.find(g => g.id === id);
      setGem(found);
      if (isGemFound(id)) {
        setGameState('already_found');
      } else {
        setGameState('intro');
      }
      // ...
    });
  }, [id, isGemFound]);

  const handleAnswer = (option) => {
    if (option.isCorrect) {
      addFoundGem(gem.id);
      setGameState('correct');
    } else {
      alert("Ez nem a helyes válasz, de próbálkozz újra, vagy kérj segítséget!");
    }
  };

   if (!gem) return <p className="p-4 text-center">Betöltés...</p>;

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
      
      {/* --- INTRO NÉZET --- */}
      {gameState === 'intro' && (
        <div className="max-w-3xl w-full bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl animate-scale-in p-6">
          <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300 text-center mb-6">🎉 Megtaláltad a(z) {gem.name} titkát! 🎉</h1>
          <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-auto max-h-[60vh] object-cover rounded-xl mb-6 shadow-md"/>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{gem.description}</p>
          <button onClick={() => setGameState('question')} className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg">
            Készen állsz a következő kihívásra?
          </button>
        </div>
      )}

      {/* --- KÉRDÉS NÉZET --- */}
      {gameState === 'question' && (
        <div className="max-w-3xl w-full bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl animate-fadein p-6">
          <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-6 text-center">{gem.question}</h2>
          <div className="mt-6 space-y-3">
            {gem.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)} 
                className="block w-full text-left p-4 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition font-semibold"
              >
                {opt.text}
              </button>
            ))}
          </div>
          {gem.hint && <p className="text-sm mt-6 text-center text-gray-500 dark:text-gray-400"><strong>Segítség:</strong> {gem.hint}</p>}
        </div>
      )}

      {/* --- HELYES VÁLASZ NÉZET --- */}
      {gameState === 'correct' && (
        <div className="max-w-3xl w-full bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl animate-fadein p-6 text-center">
          <h1 className="text-3xl font-bold text-green-500 mb-4">Helyes Válasz!</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">A következő kincshez vezető utat megnyitottad.</p>
          <Link to={`/gem/${gem.options.find(o => o.isCorrect).next_gem_id}`} className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg">
            Irány a következő kincs! &rarr;
          </Link>
        </div>
      )}

      {/* --- MÁR MEGTALÁLTAD NÉZET --- */}
      {gameState === 'already_found' && (
        <div className="max-w-3xl w-full bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl animate-fadein p-6 text-center">
          <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-4">Ezt a kincset már megtaláltad!</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">Folytatod a kalandot, vagy megnézed az eddigi zsákmányt?</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/my-gems" className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">Megtalált kincseim</Link>
            <Link to="/" className="w-full sm:w-auto bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition">Vissza a Főoldalra</Link>
          </div>
        </div>
      )}
    </div>
  );
}
