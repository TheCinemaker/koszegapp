import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import ScanHelpModal from '../components/ScanHelpModal';

const GemPageWrapper = ({ children }) => (
  <div 
    className="-m-4 -mb-6 min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
    style={{
      backgroundImage: "radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.9)), url('/images/game/terkep.webp')"
    }}
  >
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

  const renderPergamenCard = (content) => (
    <GemPageWrapper>
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
              {content}
            </div>
          </div>
          <div className="pointer-events-none absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-transparent via-[#fdf5e6aa] to-[#fdf5e6] z-20" />
        </div>
      </div>
    </GemPageWrapper>
  );

  if (gameState === 'loading') {
    return renderPergamenCard(
      <>
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-3xl font-medium text-amber-900">Keresem a kincset...</p>
      </>
    );
  }

  if (error || !gem) {
    return renderPergamenCard(
      <>
        <h1 className="text-4xl font-bold text-red-600">Hiba történt</h1>
        <p className="text-2xl">{error || 'Kincs nem található az adatbázisban.'}</p>
        <Link 
          to="/" 
          className="inline-block mt-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
        >
          Vissza a főoldalra
        </Link>
      </>
    );
  }

  if (gameState === 'intro') {
    return renderPergamenCard(
      <>
        <h1 className="text-4xl sm:text-5xl font-bold">🎉 Felfedeztél egy kincset! 🎉</h1>
        <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md" />
        <h2 className="text-3xl sm:text-4xl mb-4">{gem.name}</h2>
        <p className="whitespace-pre-line">{gem.description}</p>
        <p className="text-3xl sm:text-4xl font-bold">Készen állsz a következő kihívásra?</p>
        <button
          onClick={() => setGameState('question')}
          className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg text-lg"
        >
          Induljon a kihívás! 💎
        </button>
      </>
    );
  }

  if (gameState === 'question') {
    return renderPergamenCard(
      <>
        <h1 className="text-4xl font-bold">🧩 Kihívás!</h1>
        <p className="whitespace-pre-line">{gem.question}</p>
        <div className="space-y-4">
          {gem.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="block w-full bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold py-3 px-6 rounded-lg shadow-md transition"
            >
              {option.text}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (gameState === 'correct') {
    return renderPergamenCard(
      <>
        <h1 className="text-4xl font-bold text-green-700">🎯 Helyes válasz!</h1>
        <p>Kiváló munkát végeztél!</p>
        <Link
          to="/game/mygems"
          className="mt-6 inline-block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all shadow-lg"
        >
          Megnézem a kincseim
        </Link>
      </>
    );
  }

  if (gameState === 'wrong_answer') {
    return renderPergamenCard(
      <>
        <h1 className="text-4xl font-bold text-red-700">❌ Rossz válasz!</h1>
        <p>Próbáld meg újra!</p>
      </>
    );
  }

  if (gameState === 'already_found') {
    return renderPergamenCard(
      <>
        <h1 className="text-4xl font-bold text-amber-700">⭐ Ezt a kincset már megtaláltad!</h1>
        <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md" />
        <p className="text-xl">{gem.name}</p>
        <Link
          to="/game/mygems"
          className="mt-6 inline-block bg-amber-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-700 transition-all shadow-lg"
        >
          Nézd meg a többit!
        </Link>
      </>
    );
  }

  return null;
}
