import { useState, useEffect, useCallback } from 'react'; // useCallback hozzáadva

const GAME_STATE_KEY = 'koszeg-city-game-state';

const getInitialState = () => {
  try {
    const item = window.localStorage.getItem(GAME_STATE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

export function useGame() {
  const [foundGems, setFoundGems] = useState(getInitialState);

  useEffect(() => {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(foundGems));
  }, [foundGems]);

  const addFoundGem = useCallback((gemId) => {
    setFoundGems((prev) => (prev.includes(gemId) ? prev : [...prev, gemId]));
  }, []);

  // === ITT A FONTOS JAVÍTÁS ===
  // A useCallback biztosítja, hogy ez a függvény csak akkor jöjjön létre újra,
  // ha a 'foundGems' tömb ténylegesen megváltozik. Így stabil marad a renderelések között.
  const isGemFound = useCallback(
    (gemId) => foundGems.includes(gemId),
    [foundGems]
  );

  const resetGame = useCallback(() => {
    setFoundGems([]);
  }, []);

  return { foundGems, addFoundGem, isGemFound, resetGame };
}
