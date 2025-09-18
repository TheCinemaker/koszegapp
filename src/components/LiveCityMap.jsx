// src/components/LiveCityMap.jsx
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseISO, isValid } from 'date-fns';

// Leaflet default marker ikon fix (különben nem tölti be a sprite-ot build után)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ——— segédek
const MONTH_SHORT = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];

function getMonthFromEvent(evt) {
  if (!evt) return null;
  // előnyben: ISO 'date' mező
  if (evt.date) {
    const d = parseISO(evt.date);
    if (isValid(d)) return d.getMonth() + 1;
  }
  // fallback: _s (App.jsx-ben számolt kezdő)
  if (evt._s instanceof Date && !isNaN(evt._s)) {
    return evt._s.getMonth() + 1;
  }
  return null;
}

function hasCoords(item) {
  return item && item.coords && typeof item.coords.lat === 'number' && typeof item.coords.lng === 'number';
}

// Színek a rétegekhez
const COLORS = {
  events: '#ef4444',       // piros
  attractions: '#22c55e',  // zöld
  leisure: '#f59e0b',      // borostyán
  restaurants: '#6366f1',  // indigó
};

export default function LiveCityMap({
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // ——— SZŰRÉSEK
  const filteredEvents = useMemo(() => {
    const arr = Array.isArray(events) ? events : [];
    return arr.filter(e => {
      if (!hasCoords(e)) return false;
      const m = getMonthFromEvent(e);
      return m ? m === month : true; // ha nincs hónap, engedjük át
    });
  }, [events, month]);

  const validAttractions = useMemo(
    () => (Array.isArray(attractions) ? attractions.filter(hasCoords) : []),
    [attractions]
  );
  const validLeisure = useMemo(
    () => (Array.isArray(leisure) ? leisure.filter(hasCoords) : []),
    [leisure]
  );
  const validRestaurants = useMemo(
    () => (Array.isArray(restaurants) ? restaurants.filter(hasCoords) : []),
    [restaurants]
  );

  // ——— Középpont: Kőszeg
  const center = [47.3891, 16.5396];
  const zoom = 14;

  return (
    <div className="relative w-full h-[70vh] md:h-[78vh] rounded-2xl overflow-hidden shadow-xl">
      {/* Hónapválasztó (mobil-barát, fix bal-felső) */}
      <div className="absolute top-2 left-2 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow p-2">
        <label htmlFor="month" className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Hónap
        </label>
        <select
          id="month"
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
        >
          {MONTH_SHORT.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Legenda (bal-alsó) */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow p-2 text-xs">
        <div className="font-semibold mb-1">Jelmagyarázat</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.events }} />
          <span>Események</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.attractions }} />
          <span>Látnivalók</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.leisure }} />
          <span>Szabadidő</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.restaurants }} />
          <span>Vendéglátás</span>
        </div>
      </div>

      {/* A tényleges térkép */}
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="w-full h-full">
        {/* --- Térkép stílus váltó (jobb-felső) --- */}
        <LayersControl position="topright">
          {/* Alaprétegek */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Carto Light">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OSM, &copy; Carto"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Carto Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OSM, &copy; Carto"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="OpenTopoMap">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution="Map data &copy; OSM, SRTM | Map style &copy; OpenTopoMap"
              maxZoom={17}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Esri Műhold">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar, GeoEye"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* Átlapolt rétegek (tetszés szerint ki/be kapcsolhatók) */}
          <LayersControl.Overlay checked name="Események">
            <LayerGroup>
              {filteredEvents.map(e => (
                <CircleMarker
                  key={`e-${e.id}`}
                  center={[e.coords?.lat, e.coords?.lng]}
                  radius={7}
                  pathOptions={{ color: COLORS.events, fillColor: COLORS.events, fillOpacity: 0.8 }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="font-semibold mb-1">{e.name}</div>
                      {e.date && <div className="text-xs opacity-80">📅 {e.date}{e.end_date && e.end_date !== e.date ? ` – ${e.end_date}` : ''}</div>}
                      {e.time && <div className="text-xs opacity-80">⏰ {e.time}</div>}
                      {e.location && <div className="text-xs opacity-80">📍 {e.location}</div>}
                      <div className="mt-2">
                        <a className="text-indigo-600 underline text-sm" href={`/events/${e.id}`}>Részletek</a>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Látnivalók">
            <LayerGroup>
              {validAttractions.map(a => (
                <Marker key={`a-${a.id}`} position={[a.coords.lat, a.coords.lng]}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="font-semibold mb-1">{a.name}</div>
                      {a.location && <div className="text-xs opacity-80">📍 {a.location}</div>}
                      <div className="mt-2">
                        <a className="text-indigo-600 underline text-sm" href={`/attractions/${a.id}`}>Részletek</a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Szabadidő">
            <LayerGroup>
              {validLeisure.map(l => (
                <CircleMarker
                  key={`l-${l.id}`}
                  center={[l.coords.lat, l.coords.lng]}
                  radius={6}
                  pathOptions={{ color: COLORS.leisure, fillColor: COLORS.leisure, fillOpacity: 0.85 }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="font-semibold mb-1">{l.name}</div>
                      {l.location && <div className="text-xs opacity-80">📍 {l.location}</div>}
                      <div className="mt-2">
                        <a className="text-indigo-600 underline text-sm" href={`/leisure/${l.id}`}>Részletek</a>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Vendéglátás">
            <LayerGroup>
              {validRestaurants.map(r => (
                <CircleMarker
                  key={`r-${r.id}`}
                  center={[r.coords.lat, r.coords.lng]}
                  radius={6}
                  pathOptions={{ color: COLORS.restaurants, fillColor: COLORS.restaurants, fillOpacity: 0.85 }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="font-semibold mb-1">{r.name}</div>
                      {r.type && <div className="text-xs opacity-80">🍽️ {r.type}</div>}
                      {r.location && <div className="text-xs opacity-80">📍 {r.location}</div>}
                      <div className="mt-2">
                        <a className="text-indigo-600 underline text-sm" href={`/gastronomy/${r.id}`}>Részletek</a>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}
