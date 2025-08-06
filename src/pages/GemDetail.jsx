import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';

export default function GemDetail() {
  const { id } = useParams();
  const { addFoundGem, isGemFound } = useGame();
  
  const [gem, setGem] = useState(null);
  const [gameState, setGameState] = useState('loading'); // Alapból 'loading'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setGameState('loading'); // Minden ID váltáskor reseteljük

    fetchHiddenGems()
      .then(data => {
        const found = data.find(g => g.id === id);
        if (!found) {
          setError('Ez a kincs nem található az adatbázisban.');
        } else {
          setGem(found);
          // === ITT A JAVÍTÁS ===
          // Csak a betöltés végén, egyszer döntjük el a kezdő állapotot.
          if (isGemFound(id)) {
            setGameState('already_found');
          } else {
            setGameState('intro');
          }
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
      
  }, [id]); // <<< A FÜGGŐSÉGI TÖMBBŐL KIVESSZÜK az 'isGemFound'-ot!

  const handleAnswer = (option) => {
    if (option.isCorrect) {
      addFoundGem(gem.id);
      setGameState('correct');
    } else {
      // Itt egy jobb visszajelzést adunk, mint az alert
      setGameState('wrong_answer');
      setTimeout(() => setGameState('question'), 1500); // 1.5 mp után vissza a kérdéshez
    }
  };

  if (loading) return <div className="bg-gray-900/90 ..."><p className="text-white">Keresem a kincset...</p></div>;
  if (error) return <div className="..."><p className="text-red-500">Hiba: {error}</p></div>;
  if (!gem) return <div className="..."><p>Ez a kincs nem létezik.</p></div>;

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
      {/* ... A különböző gameState nézetek ... */}
      
      {/* --- ÚJ: HIBÁS VÁLASZ NÉZET --- */}
      {gameState === 'wrong_answer' && (
        <div className="max-w-3xl ... text-center">
          <h1 className="text-3xl font-bold text-red-500">Sajnos nem ez a helyes válasz!</h1>
          <p className="text-lg mt-2 text-white">De ne add fel, próbáld újra!</p>
        </div>
      )}

      {/* A többi nézet (intro, question, correct, already_found) változatlan */}
      {/* ... */}
    </div>
  );
}
