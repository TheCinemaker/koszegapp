import React, { useState, useEffect } from 'react';
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { fetchRestaurants } from '../api';

const featuredIds = [10];

function shuffle(array) {
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

  const types = ['Minden', ...Array.from(new Set(list.map(r => r.type)))];

  const filteredList = list.filter(r => 
    filterType === 'all' || filterType === 'Minden' || r.type === filterType
  );
  
  const finalList = [
    ...filteredList.filter(r => featuredIds.includes(r.id)),
    ...shuffle(filteredList.filter(r => !featuredIds.includes(r.id)))
  ];

  const dropdownOptions = types.map(t => ({
    label: t,
    value: t === 'Minden' ? 'all' : t
  }));

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

  // <<< JAVÍTÁS: A SKELETON HELYETT EZT HASZNÁLJUK >>>
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
          onChange={setFilterType}
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
