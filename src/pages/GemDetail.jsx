import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchHiddenGems } from '../api';

export default function GemDetail() {
  const { id } = useParams();
  const [gem, setGem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContent, setShowContent] = useState(false); 

  useEffect(() => {
    setLoading(true);
    setShowContent(false);

    fetchHiddenGems()
      .then(data => {
        const found = data.find(g => g.id === id);
        if (!found) {
          setError('Ez a kincs nem található az adatbázisban.');
          setLoading(false);
        } else {
          setGem(found);
          setTimeout(() => {
            setLoading(false);
            setShowContent(true);
          }, 1500);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (error) return <p className="p-4 text-center text-red-500">Hiba: {error}</p>;
  if (!gem && !loading) return <p className="p-4 text-center">Ez a kincs nem létezik.</p>;

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm -m-4 -mb-6 min-h-screen flex items-center justify-center p-4">
      {/* Betöltő képernyő a kincsesládával */}
      {loading && (
        <div className="text-center">
          <img 
            src="/images/treasure-chest-opening.gif" 
            alt="Kincsesláda nyílik..."
            className="w-48 h-48 mx-auto"
          />
          <p className="text-white mt-4 font-semibold animate-pulse">Keresem a kincset...</p>
        </div>
      )}

      {/* A tartalom kártya, ami csak az animáció után jelenik meg */}
      {showContent && gem && (
        <div className="w-full max-w-lg bg-purple-50 dark:bg-gray-800 rounded-2xl shadow-2xl animate-scale-in p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300">🎉 Felfedeztél egy rejtett kincset! 🎉</h1>
          </div>
          
          <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-auto max-h-[60vh] object-cover rounded-xl mb-6 shadow-md"/>
          
          <h2 className="text-2xl font-semibold mb-2 text-purple-900 dark:text-purple-200">{gem.name}</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{gem.description}</p>
          
          <div className="mt-8 pt-6 border-t border-purple-200 dark:border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-4 text-center">
            {gem.next_gem_id ? (
              <Link to={`/gem/${gem.next_gem_id}`} className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-lg text-lg">
                Irány a következő kincs! &rarr;
              </Link>
            ) : (
              <p className="font-semibold text-lg">Gratulálok, végigértél a Felfedező Túrán!</p>
            )}
            <Link to="/" className="w-full sm:w-auto bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition">
              Vissza a Főoldalra
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
