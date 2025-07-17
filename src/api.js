export async function fetchAttractions() {
  const res = await fetch('/data/attractions.json');
  if (!res.ok) throw new Error('Failed to load attractions data');
  return res.json();
}

export async function fetchEvents() {
  const res = await fetch('/data/events.json');
  if (!res.ok) throw new Error('Failed to load events data');
  return res.json();
}

export async function fetchHotels() {
  const res = await fetch('/data/hotels.json');
  if (!res.ok) throw new Error('Failed to load hotels data');
  return res.json();
}

export async function fetchRestaurants() {
  const res = await fetch('/data/restaurants.json');
  if (!res.ok) throw new Error('Failed to load restaurants data');
  return res.json();
}

export async function fetchInfo() {
  const res = await fetch('/data/info.json');
  if (!res.ok) throw new Error('Failed to load info data');
  return res.json();
}

export async function fetchLeisure() {
  const res = await fetch('/data/leisure.json');
  if (!res.ok) throw new Error('Failed to load leisure data');
  return res.json();
}

export async function fetchParking() {
  const res = await fetch('/data/parking.json');
  if (!res.ok) throw new Error('Failed to load parking data');
  return res.json();
}

