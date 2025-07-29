import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// A kulcs a localStorage-hez
const FAVORITES_KEY = 'koszeg-app-favorites';

// 1. Létrehozzuk a Context objektumot
const FavoritesContext = createContext();

// Segédfüggvény a localStorage biztonságos olvasásához
const getInitialState = () => {
  try {
    const item = window.localStorage.getItem(FAVORITES_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Hiba a kedvencek beolvasásakor:", error);
    return [];
  }
};

// 2. Létrehozzuk a "Provider"-t. Ez lesz a központi agy.
// Ez a komponens fogja körbeölelni az egész alkalmazásunkat.
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(getInitialState);

  // Ez a rész frissíti a localStorage-t, ha a kedvencek listája megváltozik
  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Hiba a kedvencek mentésekor:", error);
    }
  }, [favorites]);

  const addFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites((prev) => prev.filter((favId) => favId !== id));
  }, []);

  const isFavorite = useCallback(
    (id) => favorites.includes(id),
    [favorites]
  );

  // A "value" tartalmaz mindent, amit a többi komponensnek elérhetővé teszünk
  const value = { favorites, addFavorite, removeFavorite, isFavorite };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// 3. Létrehozzuk a saját hook-unkat.
// Ez egy egyszerűsítés, hogy a többi komponensnek ne kelljen a useContext-tel bajlódnia.
export const useFavorites = () => {
  return useContext(FavoritesContext);
};
