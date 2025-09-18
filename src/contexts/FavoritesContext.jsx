// contexts/FavoritesContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTrashAlt } from 'react-icons/fa';

const FAVORITES_KEY = 'koszeg-app-favorites';
const FavoritesContext = createContext();

const normalizeId = (id) => String(id ?? '');

const safeLocalStorageGet = (key, fallback) => {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : fallback;
    // régi adatok normalizálása stringgé
    return Array.isArray(data) ? data.map(normalizeId) : fallback;
  } catch {
    return fallback;
  }
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => safeLocalStorageGet(FAVORITES_KEY, []));

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const addFavorite = useCallback((id) => {
    const nid = normalizeId(id);
    setFavorites(prev => prev.includes(nid) ? prev : [...prev, nid]);
    toast.success('Hozzáadva a kedvencekhez', { icon: <FaCheckCircle className="text-green-500" /> });
  }, []);

  const removeFavorite = useCallback((id) => {
    const nid = normalizeId(id);
    setFavorites(prev => prev.filter(x => x !== nid));
    toast.error('Eltávolítva a kedvencekből', { icon: <FaTrashAlt className="text-red-500" /> });
  }, []);

  const toggleFavorite = useCallback((id) => {
    const nid = normalizeId(id);
    setFavorites(prev => prev.includes(nid) ? prev.filter(x => x !== nid) : [...prev, nid]);
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const pruneFavorites = useCallback((validIdsSet, isUpcomingById) => {
    setFavorites(prev => prev.filter(id => validIdsSet.has(id) && isUpcomingById(id)));
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(normalizeId(id)), [favorites]);

  const value = useMemo(() => ({
    favorites, addFavorite, removeFavorite, toggleFavorite, clearFavorites, pruneFavorites, isFavorite
  }), [favorites, addFavorite, removeFavorite, toggleFavorite, clearFavorites, pruneFavorites, isFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => useContext(FavoritesContext);
