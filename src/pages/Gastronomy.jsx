import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { fetchRestaurants } from '../api';

/**
 * Kiemelt éttermek azonosítói (mindig legyenek az első helyen)
 * @type {number[]}
 */
const featuredIds = [10];

/**
 * Véletlenszerűen megkeveri egy tömb elemeit (Fisher-Yates algoritmus)
 * @param {Array} array - A bemeneti tömb
 * @returns {Array} - A kevert tömb
 */
function shuffle(array) {
  console.log('[shuffle] Kezdem a keverést...');
  const shuffled = [...array]; // Módosíthatatlan másolat
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  console.log('[shuffle] Keverés kész. Elemszám:', shuffled.length);
  return shuffled;
}

export default function Gastronomy() {
  console.log('[Gastronomy] Komponens renderelődik');
  const [list, setList] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // API hívás és adatbetöltés
  useEffect(() => {
    console.log('[useEffect] API hívás indul...');
    setLoading(true);
    
    fetchRestaurants()
      .then(data => {
        console.log('[API] Sikeres válasz, elemek száma:', data.length);
        setList(data);
      })
      .catch(err => {
        console.error('[API] Hiba történt:', err);
        setError(err.message);
      })
      .finally(() => {
        console.log('[useEffect] Betöltés befejeződött');
        setLoading(false);
      });
  }, []);

  // Szűrő változás kezelése
  const handleFilterChange = useCallback((value) => {
    console.log('[Filter] Új szűrő érték:', value);
    setFilterType(value);
  }, []);

  // Kategóriák listája (Minden + egyedi típusok)
  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(list.map(r => r.type)));
    console.log('[Types] Egyedi típusok:', uniqueTypes);
    return ['Minden', ...uniqueTypes];
  }, [list]);

  // Dropdown opciók generálása
  const dropdownOptions = useMemo(() => {
    console.log('[Dropdown] Opciók generálása...');
    return types.map(t => ({
      label: t,
      value: t === 'Minden' ? 'all' : t
    }));
  }, [types]);

  // Végleges, szűrt és kevert lista
  const finalList = useMemo(() => {
    console.log('[FinalList] Lista újraszámolása...');
    console.log('[FinalList] Aktuális szűrő:', filterType);
    
    // 1. Szűrés
    const filtered = list.filter(r => 
      filterType === 'all' || r.type === filterType
    );
    console.log('[FinalList] Szűrt elemek száma:', filtered.length);

    // 2. Kiemeltek és nem kiemeltek szétválasztása
    const featured = filtered.filter(r => featuredIds.includes(r.id));
    const nonFeatured = filtered.filter(r => !featuredIds.includes(r.id));
    console.log('[FinalList] Kiemelt elemek:', featured.length, 'Nem kiemelt:', nonFeatured.length);

    // 3. Csak a nem kiemelteket keverjük meg
    const shuffledNonFeatured = shuffle(nonFeatured);
    
    // 4. Végleges sorrend
    const result = [...featured, ...shuffledNonFeatured];
    console.log('[FinalList] Végeredmény elemszám:', result.length);
    return result;
  }, [list, filterType]);

  // Hibakezelés
  if (error) {
    console.error('[Render] Hiba állapotban renderelés');
    return <p className="text-red-500 p-4">Hiba: {error}</p>;
  }

  // Betöltés állapota
  if (loading) {
    console.log('[Render] Betöltés állapotban renderelés');
    return <p className="text-center p-10">Vendéglátóhelyek betöltése...</p>;
  }

  console.log('[Render] Végső renderelés, elemek száma:', finalList.length);
  return (
    <div className="p-4">
      <div className="mb-6">
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
              data-testid={`gastro-card-${restaurant.id}`}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Nincs megjeleníthető étterem a kiválasztott szűrővel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
