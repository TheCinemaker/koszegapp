import React, { useState, useMemo, useCallback } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { useFavorites } from '../contexts/FavoritesContext';

const featuredIds = ['gastro-10'];

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Gastronomy({ restaurants, loading }) {
  const [filterType, setFilterType] = useState('all');
  const { favorites, isFavorite } = useFavorites();

  const handleFilterChange = useCallback((value) => {
    setFilterType(value);
  }, []);

  const types = useMemo(() => {
    let baseTypes = ['Minden', ...Array.from(new Set(restaurants.map(r => r.type)))];
    if (favorites.some(favId => restaurants.some(item => item.id === favId && favId.startsWith('gastro-')))) {
      if (!baseTypes.includes('Kedvenceim')) {
        baseTypes.splice(1, 0, 'Kedvenceim');
      }
    }
    return baseTypes;
  }, [restaurants, favorites]);

  const dropdownOptions = useMemo(() => {
    return types.map(t => ({
      label: t,
      value: t === 'Minden' ? 'all' : t
    }));
  }, [types]);

  const finalList = useMemo(() => {
    const filtered = restaurants.filter(r => {
      if (filterType === 'Kedvenceim') return isFavorite(r.id);
      return filterType === 'all' || r.type === filterType;
    });
    
    const featured = filtered.filter(r => featuredIds.includes(r.id));
    const nonFeatured = filtered.filter(r => !featuredIds.includes(r.id));
    
    return [...featured, ...shuffle(nonFeatured)];
  }, [restaurants, filterType, isFavorite]);

  if (loading) {
    return <p className="text-center p-10">Vendéglátóhelyek betöltése...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 max-w-sm mx-auto">
        <h2 className="text-center text-lg font-semibold mb-2">Szűrés kategória szerint:</h2>
        <CustomDropdown
          options={dropdownOptions}
          value={filterType === 'all' ? 'Minden' : filterType}
          onChange={handleFilterChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finalList.length > 0 ? (
          finalList.map(restaurant => (
            <GastroCard 
              key={restaurant.id} 
              restaurant={restaurant} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Nincs a szűrőnek megfelelő találat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
