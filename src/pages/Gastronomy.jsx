import React, { useState, useMemo, useCallback, useRef } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { useFavorites } from '../contexts/FavoritesContext';

const featuredIds = ['gastro-10'];

// --- Stabil “random” súly: ugyanarra az id-re mindig ugyanaz a szám ---
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // unsigned 32-bit -> 0..1
  return (h >>> 0) / 0xffffffff;
}

// Id + session-só alapján kap stabil “random” súlyt
function makeStableWeightFn(salt) {
  return (id) => hash32(String(salt) + ':' + String(id));
}

export default function Gastronomy({ restaurants = [], loading }) {
  const [filterType, setFilterType] = useState('all');
  const { favorites, isFavorite } = useFavorites();

  // egy session alatt állandó só (nem változik renderenként)
  const saltRef = useRef(Math.random().toString(36).slice(2));
  const weightOf = useMemo(() => makeStableWeightFn(saltRef.current), []);

  const handleFilterChange = useCallback((value) => {
    setFilterType(value);
  }, []);

  // Dropdown címkék
  const types = useMemo(() => {
    const base = Array.from(new Set(restaurants.map(r => r.type))).filter(Boolean);
    const hasFavGastro = favorites.some(
      favId => restaurants.some(item => item.id === favId && String(favId).startsWith('gastro-'))
    );
    // “Minden” mindig elöl, “Kedvenceim” (ha kell) utána
    const labels = ['Minden'];
    if (hasFavGastro) labels.push('Kedvenceim');
    return [...labels, ...base];
  }, [restaurants, favorites]);

  const dropdownOptions = useMemo(
    () => types.map(t => ({ label: t, value: t === 'Minden' ? 'all' : t })),
    [types]
  );

  // Stabil sorrend: featured elöl, a többi ID-alapú stabil súllyal rendezve
  const finalList = useMemo(() => {
    // Szűrés
    const filtered = restaurants.filter(r => {
      if (filterType === 'Kedvenceim') return isFavorite(r.id);
      return filterType === 'all' || r.type === filterType;
    });

    // Featured + non-featured
    const featured = filtered.filter(r => featuredIds.includes(r.id));
    const nonFeatured = filtered.filter(r => !featuredIds.includes(r.id));

    // Stabil “random” sorrend a nonFeatured-re (kedvenceléskor sem ugrik)
    nonFeatured.sort((a, b) => {
      const wa = weightOf(a.id);
      const wb = weightOf(b.id);
      if (wa === wb) {
        // tiebreaker: név szerint
        return a.name.localeCompare(b.name, 'hu');
      }
      return wa - wb;
    });

    // Featured marad elöl, a többiek stabil pszeudo-random
    return [...featured, ...nonFeatured];
  }, [restaurants, filterType, isFavorite, weightOf]);

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
