import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { parseISO, isValid, isWithinInterval, endOfDay } from 'date-fns';

// egyszerű div-alapú ikon (pulzáló)
const DivIcon = (cls = 'pulse') =>
  L.divIcon({ className: cls, html: '<span />', iconSize: [16, 16] });

function computeEventState(evt, now) {
  // ISO date + optional end_date + time
  if (!evt?.date) return { now: false, later: false };
  const s = isValid(parseISO(evt.date)) ? parseISO(evt.date) : null;
  const e = isValid(parseISO(evt.end_date || evt.date)) ? parseISO(evt.end_date || evt.date) : s;
  if (!s || !e) return { now: false, later: false };

  // ha van time: "HH:mm-HH:mm" vagy "HH:mm"
  let start = s, end = endOfDay(e);
  if (evt.time && /^\d{2}:\d{2}(-\d{2}:\d{2})?$/.test(evt.time.replace(/\s/g, ''))) {
    const t = evt.time.replace(/\s/g, '');
    if (t.includes('-')) {
      const [ts, te] = t.split('-');
      const [hs, ms] = ts.split(':').map(Number);
      const [he, me] = te.split(':').map(Number);
      start = new Date(s); start.setHours(hs, ms || 0, 0, 0);
      end = new Date(e);   end.setHours(he, me || 0, 0, 0);
    } else {
      const [h, m] = t.split(':').map(Number);
      start = new Date(s); start.setHours(h, m || 0, 0, 0);
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
  }
  const happening = isWithinInterval(now, { start, end });
  const laterToday = start > now && isWithinInterval(start, { start: new Date(now.setHours(0,0,0,0)), end: endOfDay(new Date()) });
  return { now: happening, later: laterToday };
}

function cardImage(kind, item) {
  const name = item?.image || '';
  if (!name) return '';
  if (kind === 'events') return `/images/events/${name}`;
  if (kind === 'attractions') return `/images/attractions/${name}`;
  if (kind === 'leisure') return `/images/leisure/${name}`;
  if (kind === 'restaurants') return `/images/gastro/${name}`;
  return `/images/${name}`;
}

export default function LiveCityMap({
  center = [47.3896, 16.5402],
  zoom = 14,
  events = [],
  attractions = [],
  leisure = [],
  restaurants = [],
}) {
  const now = new Date();

  const points = useMemo(() => {
    const out = [];

    // ESEMÉNYEK
    for (const e of events) {
      if (!e?.coords) continue;
      const { now: isNow, later } = computeEventState(e, new Date());
      out.push({
        kind: 'events',
        id: e.id,
        name: e.name,
        coords: [e.coords.lat, e.coords.lng],
        icon: DivIcon(isNow ? 'pulse' : later ? 'pulse later' : 'pulse'),
        href: `/events/${e.id}`,
        image: cardImage('events', e),
        subtitle: e.time || '',
      });
    }
    // LÁTNIVALÓK
    for (const a of attractions) {
      if (!a?.coords) continue;
      out.push({
        kind: 'attractions',
        id: a.id,
        name: a.name,
        coords: [a.coords.lat, a.coords.lng],
        icon: DivIcon('pulse place'),
        href: `/attractions/${a.id}`,
        image: cardImage('attractions', a),
        subtitle: a.short || '',
      });
    }
    // SZABADIDŐ
    for (const l of leisure) {
      if (!l?.coords) continue;
      out.push({
        kind: 'leisure',
        id: l.id,
        name: l.name,
        coords: [l.coords.lat, l.coords.lng],
        icon: DivIcon('pulse place'),
        href: `/leisure/${l.id}`,
        image: cardImage('leisure', l),
        subtitle: l.type || '',
      });
    }
    // VENDÉGLÁTÓ
    for (const r of restaurants) {
      if (!r?.coords) continue;
      out.push({
        kind: 'restaurants',
        id: r.id,
        name: r.name,
        coords: [r.coords.lat, r.coords.lng],
        icon: DivIcon('pulse place'),
        href: `/gastronomy/${r.id}`,
        image: cardImage('restaurants', r),
        subtitle: r.type || '',
      });
    }

    return out;
  }, [events, attractions, leisure, restaurants]);

  return (
    <div className="w-full h-[70vh] rounded-2xl overflow-hidden shadow">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(p => (
          <Marker key={`${p.kind}-${p.id}`} position={p.coords} icon={p.icon}>
            <Popup>
              <div className="w-56">
                {p.image && (
                  <img src={p.image} alt={p.name} className="w-full h-28 object-cover rounded-md mb-2" />
                )}
                <div className="font-semibold">{p.name}</div>
                {p.subtitle && <div className="text-xs text-gray-600 mb-2">{p.subtitle}</div>}
                <Link to={p.href} className="inline-block text-indigo-600 underline">Részlet</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
