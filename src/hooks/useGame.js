import { useState, useEffect, useCallback } from 'react';

const GAME_STATE_KEY = 'koszeg-city-game-state'; // A localStorage kulcsa a megtalált kincseknek
const HAS_PLAYED_KEY = 'has-played-koszeg-game'; // A kulcs annak jelzésére, hogy látta-e már az intrót

const getInitialGems = () => {
  try {
    const item = window.localStorage.getItem(GAME_STATE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Hiba a megtalált kincsek betöltésekor:", error);
    return [];
  }
};

export function useGame() {
  const [foundGems, setFoundGems] = useState(getInitialGems);

  useEffect(() => {
    try {
      window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(foundGems));
    } catch (error) {
      console.error("Hiba a megtalált kincsek mentésekor:", error);
    }
  }, [foundGems]);

  const addFoundGem = useCallback((gemId) => {
    setFoundGems((prev) => (prev.includes(gemId) ? prev : [...prev, gemId]));
  }, []);

  const isGemFound = useCallback(
    (gemId) => foundGems.includes(gemId),
    [foundGems]
  );

  const resetGame = useCallback(() => {
    setFoundGems([]);
    window.localStorage.removeItem(HAS_PLAYED_KEY); // Az intrót is reseteljük
  }, []);
  
  // Funkciók az intró állapot kezelésére
  const hasPlayedBefore = () => !!window.localStorage.getItem(HAS_PLAYED_KEY);
  const markAsPlayed = () => window.localStorage.setItem(HAS_PLAYED_KEY, 'true');

  return { foundGems, addFoundGem, isGemFound, resetGame, hasPlayedBefore, markAsPlayed };
}
