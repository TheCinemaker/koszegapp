import React, { useState, useEffect, useMemo } from 'react'; // Csak a useMemo-t importáljuk pluszban
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { fetchRestaurants } from '../api';

// A featuredIds és a shuffle függvény változatlan
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

  // --- STABILITÁSI JAVÍTÁS ---
  // A számításokat useMemo-ba csomagoljuk, hogy ne fussanak le feleslegesen.

  // A kategóriákat CSAK AKKOR számoljuk újra, ha a 'list' (az eredeti adat) megváltozik.
  const types = useMemo(() => {
    return ['Minden', ...Array.from(new Set(list.map(r => r.type)))];
  }, [list]);

  // A szűrt és randomizált listát CSAK AKKOR számoljuk újra, ha a 'list' vagy a 'filterType' változik.
  const finalList = useMemo(() => {
    const filteredList = list.filter(r => 
      filterType === 'all' || filterType === 'Minden' || r.type === filterType
    );
    
    const featured = filteredList.filter(r => featuredIds.includes(r.id));
    const nonFeatured = filteredList.filter(r => !featuredIds.includes(r.id));
    
    return [...featured, ...shuffle([...nonFeatured])];
  }, [list, filterType]);

  // A dropdown opciókat CSAK AKKOR generáljuk újra, ha a 'types' lista megváltozik.
  const dropdownOptions = useMemo(() => types.map(t => ({
    label: t,
    value: t === 'Minden' ? 'all' : t
  })), [types]);


  // --- A KÓD TÖBBI RÉSZE VÁLTOZATLAN ---
  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;

  if (loading) {
    return <p className="text-center p-10">Vendéglátóhelyek betöltése...</p>;
  }

  return (
    <div className="p-4">
      <div className="mb-6">
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
