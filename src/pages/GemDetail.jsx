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

  if (!gem) return <p>Betöltés...</p>;

  return (
    <div className="bg-gray-900/90 ...">
      {/* --- INTRO NÉZET --- */}
      {gameState === 'intro' && (
        <div className="max-w-3xl ... animate-scale-in">
          <h1 className="text-3xl ...">🎉 Megtaláltad a(z) {gem.name} titkát! 🎉</h1>
          <img src={`/images/${gem.image}`} ... />
          <p className="...">{gem.description}</p>
          <button onClick={() => setGameState('question')} className="... bg-green-600 ...">
            Készen állsz a következő kihívásra?
          </button>
        </div>
      )}

      {/* --- KÉRDÉS NÉZET --- */}
      {gameState === 'question' && (
        <div className="max-w-3xl ... animate-fadein">
          <h2 className="text-2xl ...">{gem.question}</h2>
          <div className="mt-6 space-y-3">
            {gem.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt)} className="...">
                {opt.text}
              </button>
            ))}
          </div>
          {gem.hint && <p className="text-sm mt-4">Segítség: {gem.hint}</p>}
        </div>
      )}

      {/* --- HELYES VÁLASZ NÉZET --- */}
      {gameState === 'correct' && (
        <div className="max-w-3xl ... animate-fadein">
          <h1 className="text-3xl ...">Helyes Válasz!</h1>
          <p>A következő kincshez vezető utat megnyitottad.</p>
          <Link to={`/gem/${gem.options.find(o => o.isCorrect).next_gem_id}`} className="...">
            Irány a következő kincs! &rarr;
          </Link>
        </div>
      )}

      {/* --- MÁR MEGTALÁLTAD NÉZET --- */}
      {gameState === 'already_found' && (
        <div className="max-w-3xl ...">
          <h1 className="text-3xl ...">Ezt a kincset már megtaláltad!</h1>
          <p>Szeretnéd megnézni a már felfedezett kincseidet?</p>
          <Link to="/my-gems" className="...">Megtalált kincseim</Link>
          <Link to="/" className="...">Vissza a Főoldalra</Link>
        </div>
      )}
    </div>
  );
}
