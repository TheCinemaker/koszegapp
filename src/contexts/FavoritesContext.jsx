import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTrashAlt } from 'react-icons/fa';

const FAVORITES_KEY = 'koszeg-app-favorites';

const FavoritesContext = createContext();

const safeLocalStorageGet = (key, fallback) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Favorites load error:', e);
    return fallback;
  }
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => safeLocalStorageGet(FAVORITES_KEY, []));

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (e) {
      console.error('Favorites save error:', e);
    }
  }, [favorites]);

  const addFavorite = useCallback((id) => {
    setFavorites(prev => {
      if (prev.includes(id)) return prev;
      toast.success('Hozzáadva a kedvencekhez', {
        icon: <FaCheckCircle className="text-green-500" />,
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return [...prev, id];
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites(prev => prev.filter(x => x !== id));
    toast.error('Eltávolítva a kedvencekből', {
      icon: <FaTrashAlt className="text-red-500" />,
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const exists = prev.includes(id);
      if (exists) {
        toast.error('Eltávolítva a kedvencekből', {
          icon: <FaTrashAlt className="text-red-500" />,
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        return prev.filter(x => x !== id);
      } else {
        toast.success('Hozzáadva a kedvencekhez', {
          icon: <FaCheckCircle className="text-green-500" />,
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        return [...prev, id];
      }
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    toast('Összes kedvenc törölve', { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
  }, []);

  // külső listák alapján takarítás: csak létező és jövőbeni marad
  const pruneFavorites = useCallback((validIdsSet, isUpcomingById) => {
    setFavorites(prev => prev.filter(id => validIdsSet.has(id) && isUpcomingById(id)));
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const value = useMemo(() => ({
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    pruneFavorites,
    isFavorite,
  }), [favorites, addFavorite, removeFavorite, toggleFavorite, clearFavorites, pruneFavorites, isFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => useContext(FavoritesContext);
