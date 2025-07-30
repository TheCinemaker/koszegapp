import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast'; // <<< ÚJ IMPORT
import { FaCheckCircle, FaTrashAlt } from 'react-icons/fa'; // <<< ÚJ IMPORT AZ IKONOKHOZ

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

  // --- KIEGÉSZÍTETT FÜGGVÉNYEK ---

  const addFavorite = useCallback((id) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev; // Ha már benne van, nem csinálunk semmit
      }
      
      // <<< ÚJ: ÉRTESÍTÉS KÜLDÉSE SIKERES HOZZÁADÁSKOR >>>
      toast.success('Hozzáadva a kedvencekhez', {
        icon: <FaCheckCircle className="text-green-500" />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      return [...prev, id];
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites((prev) => prev.filter((favId) => favId !== id));

    // <<< ÚJ: ÉRTESÍTÉS KÜLDÉSE SIKERES TÖRLÉSKOR >>>
    toast.error('Eltávolítva a kedvencekből', {
      icon: <FaTrashAlt className="text-red-500" />,
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
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
