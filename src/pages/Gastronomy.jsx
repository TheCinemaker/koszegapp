import React, { useState, useEffect, useMemo, useCallback } from 'react'; // useCallback hozzáadva
import CustomDropdown from '../components/CustomDropdown';
import GastroCard from '../components/GastroCard';
import { fetchRestaurants } from '../api';

const featuredIds = [10];

// A shuffle függvény változatlan
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

  // --- HIBABIZTOS JAVÍTÁS ---

  // <<< JAVÍTÁS 1: Biztonságos eseménykezelő a Dropdownhoz >>>
  // A useCallback biztosítja, hogy ez a függvény ne jöjjön létre minden rendereléskor újra.
  // A lényeg, hogy egy explicit `(value)` paramétert vár, így biztosítjuk, hogy
  // a CustomDropdown-ból csak az érték érkezik, nem a teljes event objektum.
  const handleFilterChange = useCallback((value) => {
    setFilterType(value);
  }, []);

  // A kategóriák számolása (useMemo marad, mert ez jó)
  const types = useMemo(() => {
    return ['Minden', ...Array.from(new Set(list.map(r => r.type)))];
  }, [list]);

  // A dropdown opciók generálása (useMemo marad)
  const dropdownOptions = useMemo(() => {
    return types.map(t => ({
      label: t,
      value: t === 'Minden' ? 'all' : t
    }));
  }, [types]);

  // <<< JAVÍTÁS 2: A szűrés és randomizálás logikája >>>
  // A useMemo itt is elengedhetetlen a teljesítmény miatt.
  const finalList = useMemo(() => {
    // Először szűrünk
    const filtered = list.filter(r => 
      filterType === 'all' || filterType === 'Minden' || r.type === filterType
    );
    
    // Szétválogatjuk a kiemelt és nem kiemelt elemeket
    const featuredItems = filtered.filter(r => featuredIds.includes(r.id));
    const nonFeaturedItems = filtered.filter(r => !featuredIds.includes(r.id));
    
    // CSAK a nem kiemelt listát keverjük meg, és egy új tömbbe tesszük
    const shuffledNonFeatured = shuffle([...nonFeaturedItems]);

    // Visszaadjuk a végleges sorrendet
    return [...featuredItems, ...shuffledNonFeatured];
  }, [list, filterType]);


  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (loading) return <p className="text-center p-10">Vendéglátóhelyek betöltése...</p>;

  // <<< JAVÍTÁS 3: A biztonságos eseménykezelő átadása >>>
  return (
    <div className="p-4">
      <div className="mb-6">
        <CustomDropdown
          options={dropdownOptions}
          value={filterType}
          onChange={handleFilterChange} // Itt már a biztonságos `handleFilterChange`-t használjuk
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
