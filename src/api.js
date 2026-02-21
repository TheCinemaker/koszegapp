// Segédfüggvény a ismétlődés elkerülésére
async function fetchData(url, errorMessage) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(errorMessage || 'Az adatok betöltése sikertelen.');
    }
    return await response.json();
  } catch (error) {
    console.error(`Hiba a(z) ${url} betöltésekor:`, error);
    // Visszaadunk egy üres tömböt, hogy az app ne omoljon össze
    return [];
  }
}

// --- FŐ ADATFORRÁSOK ---
// Minden adat a /public/data/ mappából jön

export async function fetchAttractions() {
  return fetchData('/data/attractions.json', 'A látnivalók betöltése sikertelen.');
}

export async function fetchEvents() {
  return fetchData('/data/events.json', 'Az események betöltése sikertelen.');
}

export async function fetchHotels() {
  return fetchData('/data/hotels.json', 'A szállások betöltése sikertelen.');
}

import { supabase } from './lib/supabaseClient';

export async function fetchRestaurants() {
  const local = await fetchData('/data/restaurants.json', 'A vendéglátóhelyek betöltése sikertelen.');

  try {
    const { data: dbData } = await supabase.from('restaurants').select('*');

    if (dbData && local) {
      // 1. Create a map for faster lookup by Normalized Name
      const dbMap = new Map(dbData.map(item => [item.name.toLowerCase().trim(), item]));

      return local.map(restaurant => {
        const key = restaurant.name.toLowerCase().trim();
        if (dbMap.has(key)) {
          const dbItem = dbMap.get(key);
          // Merge dynamic fields, prioritize DB for these specific marketing fields
          return {
            ...restaurant,
            flash_sale: dbItem.flash_sale,
            mystery_box: dbItem.mystery_box,
            tier: dbItem.tier,
            // Keep local ID for routing consistency, or use DB ID if you want to switch to UUIDs eventually
            // For now, keeping local ID ensures existing URLs work.
            supabase_id: dbItem.id // Store real ID for future use
          };
        }
        return restaurant;
      });
    }
  } catch (err) {
    console.error("Supabase merge error:", err);
  }

  return local;
}

export async function fetchInfo() {
  return fetchData('/data/info.json', 'Az információk betöltése sikertelen.');
}

export async function fetchLeisure() {
  return fetchData('/data/leisure.json', 'A szabadidős programok betöltése sikertelen.');
}

export async function fetchParking() {
  return fetchData('/data/parking.json', 'A parkolók betöltése sikertelen.');
}


// --- SPECIFIKUS ADATFORRÁSOK (PARKOLÁS) ---

export async function fetchParkingZones() {
  return fetchData('/data/parking-zones.json', 'A parkolási zónák betöltése sikertelen.');
}

export async function fetchParkingMachines() {
  try {
    const response = await fetch('/data/parking_machines.json');
    if (!response.ok) {
      throw new Error('A parkolóautomaták betöltése sikertelen.');
    }
    const data = await response.json();
    console.log('[api.js] Sikeresen betöltött automata adatok:', data); // <<< ÚJ SOR
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// --- ID ALAPÚ LEKÉRDEZÉSEK ---

export async function fetchAttractionById(id) {
  const attractions = await fetchAttractions();
  return attractions.find(item => String(item.id) === String(id));
}

export async function fetchEventById(id) {
  const events = await fetchEvents();
  return events.find(e => String(e.id) === String(id));
}

export async function fetchHiddenGems() {
  return fetchData('/data/hidden_gems.json', 'A rejtett kincsek betöltése sikertelen.');
}
