import { useState, useEffect, useCallback } from 'react';

const GAME_STATE_KEY = 'koszeg-city-game-state';
const HAS_PLAYED_KEY = 'has-played-koszeg-game';

const getInitialGems = () => {
  try {
    const item = window.localStorage.getItem(GAME_STATE_KEY);
    return item ? JSON.parse(item) : [];
  } catch { return []; }
};

export function useGame() {
  const [foundGems, setFoundGems] = useState(getInitialGems);

  useEffect(() => {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(foundGems));
  }, [foundGems]);

  const addFoundGem = useCallback((gemId) => {
    setFoundGems((prev) => (prev.includes(gemId) ? prev : [...prev, gemId]));
  }, []);

  const isGemFound = useCallback((gemId) => foundGems.includes(gemId), [foundGems]);

  const resetGame = useCallback(() => {
    setFoundGems([]);
    window.localStorage.removeItem(HAS_PLAYED_KEY);
  }, []);
  
  const hasPlayedBefore = useCallback(() => !!window.localStorage.getItem(HAS_PLAYED_KEY), []);
  const markAsPlayed = useCallback(() => window.localStorage.setItem(HAS_PLAYED_KEY, 'true'), []);

  return { foundGems, addFoundGem, isGemFound, resetGame, hasPlayedBefore, markAsPlayed };
}
