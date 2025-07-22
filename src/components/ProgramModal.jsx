/* --- FÁJL: ProgramModal.jsx --- */

import React, { useState, useEffect, useCallback } from 'react';
import { parseISO, isSameDay, isBefore, isAfter, format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ProgramDetailsSheet from './ProgramDetailsSheet';

// Külön komponens az esemény kártyáknak a jobb olvashatóságért
function EventCard({ event, onSelect, isNext = false }) {
  const cardClasses = isNext 
    ? "p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-600 cursor-pointer hover:shadow-lg transition mb-2"
    : "p-3 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer hover:shadow-lg transition mb-2";

  return (
    <div className={cardClasses} onClick={() => onSelect(event)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100">{event.nev}</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
            📍 {event.helyszin.nev}
          </p>
        </div>
        {event.kiemelt && (
          <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            KIEMELT
          </span>
        )}
      </div>
    </div>
  );
}


export default function ProgramModal({ onClose }) {
  // --- STATE-EK ---
  const [userLocation, setUserLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [nextEvents, setNextEvents] = useState([]); // Kezeli a párhuzamosan induló eseményeket
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  // --- VISSZASZÁMLÁLÓ LOGIKA ---
  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const ostromStart = new Date('2025-08-01T08:00:00');
    const diff = ostromStart - now;
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
      seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
      isOver: diff < 0,
    };
  }, []);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // --- ESEMÉNYEK KIÉRTÉKELÉSE ---
  const evaluateEvents = useCallback(() => {
    if (events.length === 0) return;
    const now = new Date();
    const today = events.filter(e => isSameDay(e.start, now));

    const curr = today.filter(e => isBefore(e.start, now) && isAfter(e.end, now));
    const upcoming = today.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
    const nextGroup = upcoming.length > 0
      ? upcoming.filter(e => e.start.getTime() === upcoming[0].start.getTime())
      : [];
    
    setCurrentEvents(curr);
    setNextEvents(nextGroup);
  }, [events]);

  // --- EFFECT-EK AZ ADATKEZELÉSHEZ ---
  useEffect(() => {
    fetch('/data/programok.json')
      .then(res => res.json())
      .then(arr => {
        const parsed = arr.map(p => {
          try {
            const start = parseISO(p.idopont);
            const end = p.veg_idopont ? parseISO(p.veg_idopont) : new Date(start.getTime() + 60 * 60000);
            return { ...p, id: p.id || `${p.nev}-${p.idopont}`, start, end, kiemelt: !!p.kiemelt };
          } catch (error) { return null; }
        }).filter(Boolean);
        setEvents(parsed);
      });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.warn('Helymeghatározás hiba:', err.message)
      );
    }
  }, []);

  useEffect(() => {
    const countdownTimer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    const eventCheckTimer = setInterval(evaluateEvents, 10000);
    evaluateEvents();
    return () => { clearInterval(countdownTimer); clearInterval(eventCheckTimer); };
  }, [evaluateEvents, calculateTimeLeft]);

  // --- RENDERELÉS ---
  const noEventsToday = currentEvents.length === 0 && nextEvents.length === 0;
  const mapCenterEvent = currentEvents[0] || nextEvents[0];

  // Kék marker ikon a "következő" eseményekhez a térképen
  const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  return (
    <>
      <div className="fixed inset-y-4 sm:inset-y-8 inset-x-2 sm:inset-x-0 z-[999] px-2 pb-4 pointer-events-none">
        <div className="max-w-3xl mx-auto flex flex-col h-full pointer-events-auto">
          {/* FEJLÉC */}
          <div className="sticky top-0 z-20 bg-amber-600 dark:bg-amber-900 text-white p-3 rounded-t-2xl shadow-md flex justify-between items-center">
            <h2 className="text-xl font-bold">🏰 Kőszegi Ostromnapok</h2>
            <button onClick={onClose} className="text-2xl hover:text-amber-200 transition-colors" aria-label="Bezárás">×</button>
          </div>
          
          {/* VISSZASZÁMLÁLÓ SÁV (mindig látszik) */}
          {!timeLeft.isOver && (
            <div className="sticky top-[58px] z-10 bg-amber-800/95 backdrop-blur-sm text-white text-center p-2 shadow-inner">
              <span className="font-mono text-sm">Kezdésig: {timeLeft.days}n {timeLeft.hours}ó {timeLeft.minutes}p {timeLeft.seconds}s</span>
            </div>
          )}

          {/* GÖRGETHETŐ TARTALOM */}
          <div className="bg-amber-50 dark:bg-zinc-900 p-4 rounded-b-2xl shadow-lg flex-grow overflow-y-auto">
            {noEventsToday && <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">🎉 Nincs több esemény mára!</p>}

            {currentEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="section-title border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">🎬 Jelenleg zajlik ({currentEvents.length})</h3>
                {currentEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} />)}
              </div>
            )}

            {nextEvents.length > 0 && (
               <div className="mb-4">
                  <h3 className="section-title border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">⏭️ Következő ({format(nextEvents[0].start, 'HH:mm')}-kor)</h3>
                  {nextEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isNext={true} />)}
               </div>
            )}

            {userLocation && mapCenterEvent && (
              <div className="h-[250px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
                <MapContainer center={[mapCenterEvent.helyszin.lat, mapCenterEvent.helyszin.lng]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[userLocation.lat, userLocation.lng]}><Popup>📍 Itt vagy</Popup></Marker>
                  {currentEvents.map(e => <Marker key={`map-curr-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]}><Popup><strong>{e.nev}</strong><br/>{format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}</Popup></Marker>)}
                  {nextEvents.map(e => !currentEvents.some(c => c.id === e.id) && <Marker key={`map-next-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]} icon={blueIcon}><Popup><strong>{e.nev}</strong><br/>Kezdés: {format(e.start, 'HH:mm')}</Popup></Marker>)}
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RÉSZLETEK PANEL MEGJELENÍTÉSE */}
      <ProgramDetailsSheet program={selectedProgram} onClose={() => setSelectedProgram(null)} />
    </>
  );
}
