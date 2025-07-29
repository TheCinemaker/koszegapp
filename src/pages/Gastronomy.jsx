import React, { useState, useEffect } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { fetchRestaurants } from '../api';

const featuredIds = [10];

function shuffle(array) {
  // Ez a függvény tökéletes, nem kell bántani.
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function Gastronomy() {
  const [list, setList] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRestaurants()
      .then(data => setList(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // --- VISSZAÁLLÍTOTT, EREDETI LOGIKA ---
  
  // 1. Legeneráljuk a kategóriákat.
  const types = ['Minden', ...Array.from(new Set(list.map(r => r.type)))];

  // 2. Létrehozzuk a szűrt listát a kiválasztott filterType alapján.
  const filteredList = list.filter(r => 
    filterType === 'all' || filterType === 'Minden' || r.type === filterType
  );
  
  // 3. A szűrt listából kiválogatjuk a kiemelt és nem kiemelt elemeket.
  const featured = filteredList.filter(r => featuredIds.includes(r.id));
  const nonFeatured = filteredList.filter(r => !featuredIds.includes(r.id));

  // 4. Összerakjuk a végleges listát: elöl a kiemelt, utána a kevert többi.
  // FONTOS: a shuffle-nek egy MÁSOLATOT adunk, hogy ne az eredeti listát módosítsa.
  const finalList = [
    ...featured,
    ...shuffle([...nonFeatured])
  ];

  // 5. Legeneráljuk a dropdown opciókat.
  const dropdownOptions = types.map(t => ({
    label: t,
    value: t === 'Minden' ? 'all' : t
  }));


  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

  if (loading) {
    return <p className="text-center p-10">Vendéglátóhelyek betöltése...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 max-w-sm mx-auto">
        <h2 className="text-center text-lg font-semibold mb-2">Szűrés kategória szerint:</h2>
        <CustomDropdown
          options={dropdownOptions}
          value={filterType}
          // Ez az egyetlen apró változtatás az eredetihez képest a biztonság kedvéért,
          // de ha a tiéd `setFilterType` volt és működött, hagyd úgy.
          onChange={(value) => setFilterType(value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finalList.length > 0 ? (
          finalList.map(restaurant => (
            <GastroCard key={restaurant.id} restaurant={restaurant} />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Sajnos nincs a szűrőnek megfelelő találat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
