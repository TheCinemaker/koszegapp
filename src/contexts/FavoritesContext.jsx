import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'koszeg-app-favorites';

const FavoritesContext = createContext();

const getInitialState = () => {
  try {
    const item = window.localStorage.getItem(FAVORITES_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Hiba a kedvencek beolvasásakor:", error);
    return [];
  }
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(getInitialState);

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

  const value = { favorites, addFavorite, removeFavorite, isFavorite };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  return useContext(FavoritesContext);
};
