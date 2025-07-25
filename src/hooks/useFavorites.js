import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'attraction-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Hiba a kedvencek betöltésekor:', error);
    }
  }, []);

  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const addFavorite = useCallback((id) => {
    if (!favorites.includes(id)) {
      saveFavorites([...favorites, id]);
    }
  }, [favorites]);

  const removeFavorite = useCallback((id) => {
    saveFavorites(favorites.filter(favId => favId !== id));
  }, [favorites]);

  const isFavorite = useCallback((id) => {
    return favorites.includes(id);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
