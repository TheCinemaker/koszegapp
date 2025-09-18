// src/components/LiveCityMap.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext.jsx';

// --- kis utilok ---
const hasCoords = (obj) => obj?.coords && typeof obj.coords.lat === 'number' && typeof obj.coords.lng === 'number';

const dateRangeText = (evt) => {
  if (!evt?.date) return '';
  if (evt.end_date && evt.end_date !== evt.date) return `${evt.date} – ${evt.end_date}`;
  return evt.date;
};

const imgByKind = (kind, image) => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/images/')) return image;
  const base = {
    events: `/images/events/${image}`,
    attractions: `/images/attractions/${image}`,
    restaurants: `/images/gastro/${image}`,
    leisure: `/images/leisure/${image}`,
  }[kind];
  return base || `/images/${image}`;
};

const mapsLink = (lat, lng) =>
  `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=16`;

// --- egységes divIcon (emoji + szín)
const makeIcon = (bg, emoji = '📍') =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="map-pin" style="background:${bg}">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });

// külön színek/fajta
const ICONS = {
  events: makeIcon('#ef4444', '🎪'),
  attractions: makeIcon('#10b981', '🏛️'),
  restaurants: makeIcon('#6366f1', '🍽️'),
  leisure: makeIcon('#f59e0b', '🎯'),
};

// --- bounds helper (látható markerekhez igazítjuk a nézetet)
function FitBounds({ items }) {
  const map = useMap();
  const prevKey = useRef('');
  useEffect(() => {
    const pts = items
      .filter(hasCoords)
      .map(i => [i.coords.lat, i.coords.lng]);
    const key = JSON.stringify(pts);
    if (!pts.length || key === prevKey.current) return;
    prevKey.current = key;
    const bounds = L.latLngBounds(pts);
    // kis padding, hogy mobilon is kényelmes legyen
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [items, map]);
  return null;
}

export default function LiveCityMap({ events = [], attractions = [], leisure = [], restaurants = [] }) {
  // rétegek: csak Események legyen ON by default
  const [layers, setLayers] = useState({
    events: true,
    attractions: false,
    restaurants: false,
    leisure: false,
  });
  const [onlyFavs, setOnlyFavs] = useState(false);

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  // szűrések
  const visibleEvents = useMemo(() => {
    const base = events.filter(hasCoords);
    return onlyFavs ? base.filter(e => isFavorite(e.id)) : base;
  }, [events, onlyFavs, isFavorite]);

  const visibleAttractions = useMemo(() => {
    const base = attractions.filter(hasCoords);
    return onlyFavs ? base.filter(a => isFavorite(a.id)) : base;
  }, [attractions, onlyFavs, isFavorite]);

  const visibleRestaurants = useMemo(() => {
    const base = restaurants.filter(hasCoords);
    return onlyFavs ? base.filter(r => isFavorite(r.id)) : base;
  }, [restaurants, onlyFavs, isFavorite]);

  const visibleLeisure = useMemo(() => {
    const base = leisure.filter(hasCoords);
    return onlyFavs ? base.filter(l => isFavorite(l.id)) : base;
  }, [leisure, onlyFavs, isFavorite]);

  // ami épp látható (bounds-hoz)
  const itemsForBounds = useMemo(() => {
    const res = [];
    if (layers.events) res.push(...visibleEvents);
    if (layers.attractions) res.push(...visibleAttractions);
    if (layers.restaurants) res.push(...visibleRestaurants);
    if (layers.leisure) res.push(...visibleLeisure);
    return res;
  }, [layers, visibleEvents, visibleAttractions, visibleRestaurants, visibleLeisure]);

  // mobilbarát fix magasság
  const styleContainer = 'w-full h-[calc(100vh-160px)] rounded-xl overflow-hidden shadow-lg';

  return (
    <div className="relative">
      {/* Felső filter-sáv (mobilbarát) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold mr-1">Rétegek:</span>
        {[
          ['events', 'Események'],
          ['attractions', 'Látnivalók'],
          ['restaurants', 'Vendéglátás'],
          ['leisure', 'Szabadidő'],
        ].map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-1 text-sm bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded-full shadow">
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
            />
            <span>{label}</span>
          </label>
        ))}

        <label className="inline-flex items-center gap-1 text-sm ml-auto bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded-full shadow">
          <input type="checkbox" checked={onlyFavs} onChange={() => setOnlyFavs(v => !v)} />
          <span>Csak kedvenceim</span>
        </label>
      </div>

      {/* TÉRKÉP */}
      <div className={styleContainer}>
        <MapContainer center={[47.3891, 16.5396]} zoom={14} className="w-full h-full">
          <TileLayer
            // jó kontraszt, mobilbarát
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {/* bounds a látható markerekhez */}
          <FitBounds items={itemsForBounds} />

          {/* ESEMÉNYEK */}
          {layers.events && (
            <MarkerClusterGroup chunkedLoading>
              {visibleEvents.map(evt => (
                <Marker
                  key={`e-${evt.id}`}
                  position={[evt.coords.lat, evt.coords.lng]}
                  icon={ICONS.events}
                >
                  <Popup>
                    <div className="w-64">
                      {evt.image && (
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-neutral-200">
                          <img
                            src={imgByKind('events', evt.image)}
                            alt={evt.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-sm mb-1">{evt.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {dateRangeText(evt)} {evt.time ? `• ${evt.time}` : ''}
                      </p>

                      <div className="flex gap-2">
                        <Link
                          to={`/events/${evt.id}`}
                          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Részlet
                        </Link>
                        <a
                          className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          href={mapsLink(evt.coords.lat, evt.coords.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Vigyél oda
                        </a>
                        <button
                          onClick={() =>
                            isFavorite(evt.id) ? removeFavorite(evt.id) : addFavorite(evt.id)
                          }
                          className={`ml-auto text-xs px-2 py-1 rounded ${
                            isFavorite(evt.id)
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {isFavorite(evt.id) ? 'Kedvenc ✓' : 'Szivecskézem'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {/* LÁTNIVALÓK */}
          {layers.attractions && (
            <MarkerClusterGroup chunkedLoading>
              {visibleAttractions.map(a => (
                <Marker
                  key={`a-${a.id}`}
                  position={[a.coords.lat, a.coords.lng]}
                  icon={ICONS.attractions}
                >
                  <Popup>
                    <div className="w-64">
                      {a.image && (
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-neutral-200">
                          <img
                            src={imgByKind('attractions', a.image)}
                            alt={a.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-sm mb-1">{a.name}</h3>
                      {a.location && <p className="text-xs text-gray-600 mb-2">{a.location}</p>}
                      <div className="flex gap-2">
                        <Link
                          to={`/attractions/${a.id}`}
                          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Részlet
                        </Link>
                        <a
                          className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          href={mapsLink(a.coords.lat, a.coords.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Vigyél oda
                        </a>
                        <button
                          onClick={() =>
                            isFavorite(a.id) ? removeFavorite(a.id) : addFavorite(a.id)
                          }
                          className={`ml-auto text-xs px-2 py-1 rounded ${
                            isFavorite(a.id)
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {isFavorite(a.id) ? 'Kedvenc ✓' : 'Szivecskézem'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {/* VENDÉGLÁTÁS */}
          {layers.restaurants && (
            <MarkerClusterGroup chunkedLoading>
              {visibleRestaurants.map(r => (
                <Marker
                  key={`r-${r.id}`}
                  position={[r.coords.lat, r.coords.lng]}
                  icon={ICONS.restaurants}
                >
                  <Popup>
                    <div className="w-64">
                      {r.image && (
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-neutral-200">
                          <img
                            src={imgByKind('restaurants', r.image)}
                            alt={r.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-sm mb-1">{r.name}</h3>
                      {r.tags?.length > 0 && (
                        <p className="text-xs text-gray-600 mb-2">{r.tags.join(' • ')}</p>
                      )}
                      <div className="flex gap-2">
                        <Link
                          to={`/gastronomy/${r.id}`}
                          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Részlet
                        </Link>
                        <a
                          className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          href={mapsLink(r.coords.lat, r.coords.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Vigyél oda
                        </a>
                        <button
                          onClick={() =>
                            isFavorite(r.id) ? removeFavorite(r.id) : addFavorite(r.id)
                          }
                          className={`ml-auto text-xs px-2 py-1 rounded ${
                            isFavorite(r.id)
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {isFavorite(r.id) ? 'Kedvenc ✓' : 'Szivecskézem'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {/* SZABADIDŐ */}
          {layers.leisure && (
            <MarkerClusterGroup chunkedLoading>
              {visibleLeisure.map(l => (
                <Marker
                  key={`l-${l.id}`}
                  position={[l.coords.lat, l.coords.lng]}
                  icon={ICONS.leisure}
                >
                  <Popup>
                    <div className="w-64">
                      {l.image && (
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-neutral-200">
                          <img
                            src={imgByKind('leisure', l.image)}
                            alt={l.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-sm mb-1">{l.name}</h3>
                      {l.location && <p className="text-xs text-gray-600 mb-2">{l.location}</p>}
                      <div className="flex gap-2">
                        <Link
                          to={`/leisure/${l.id}`}
                          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Részlet
                        </Link>
                        <a
                          className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          href={mapsLink(l.coords.lat, l.coords.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Vigyél oda
                        </a>
                        <button
                          onClick={() =>
                            isFavorite(l.id) ? removeFavorite(l.id) : addFavorite(l.id)
                          }
                          className={`ml-auto text-xs px-2 py-1 rounded ${
                            isFavorite(l.id)
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {isFavorite(l.id) ? 'Kedvenc ✓' : 'Szivecskézem'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>

      {/* kis CSS a divIcon-hoz (globál css-be is átteheted, de így is oké) */}
      <style>{`
        .custom-div-icon .map-pin {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 14px;
          box-shadow: 0 6px 12px rgba(0,0,0,.25);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
