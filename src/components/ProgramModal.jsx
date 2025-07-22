import React, { useState, useEffect, useCallback } from 'react';

import { parseISO, isSameDay, isBefore, isAfter, format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ProgramDetailsSheet from './ProgramDetailsSheet';


export default function ProgramModal({ onClose }) {
  // --- STATE-EK ---

  const [userLocation, setUserLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // --- VISSZASZÁMLÁLÓ ---

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const ostromStart = new Date('2025-08-01T08:00:00');
    const diff = ostromStart - now;
    
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
      seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
      isOver: diff < 0
    };
  }, []); 

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // --- ESEMÉNYEK KIÉRTÉKELÉSE ---
  const evaluateEvents = useCallback(() => {
    if (events.length === 0) return; // Ne fusson le, amíg nincs adat

    const now = new Date();
    const today = events.filter(e => isSameDay(e.start, now));

    const curr = today.filter(e => 
      isBefore(e.start, now) && isAfter(e.end, now)
    );
    
    const nxt = today
      .filter(e => isAfter(e.start, now))
      .sort((a, b) => a.start - b.start)[0] || null; 

    setCurrentEvents(curr);
    setNextEvent(nxt);
  }, [events]); /

  
  useEffect(() => {
    // Események betöltése a JSON-ból
    fetch('/data/programok.json')
      .then(res => {
        if (!res.ok) throw new Error('Hálózati hiba a programok betöltésekor');
        return res.json();
      })
      .then(arr => {
        const parsed = arr.map(p => {
          try {
            const start = parseISO(p.idopont);
            // Az 'end' időpontot garantáltan létrehozzuk, ez fontos a logikánkhoz.
            const end = p.veg_idopont 
              ? parseISO(p.veg_idopont) 
              : new Date(start.getTime() + 60 * 60000); // Alapértelmezett 1 órás esemény

            return { ...p, start, end, kiemelt: !!p.kiemelt };
          } catch (error) {
            console.error('Hibás dátumformátum a JSON-ban:', p, error);
            return null; 
          }
        }).filter(Boolean); 
        setEvents(parsed);
      })
      .catch(error => console.error("Hiba a programok betöltésekor:", error));

    // Felhasználó pozíciójának lekérdezése
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.warn('Helymeghatározás hiba:', err.message)
      );
    }
  }, []);

    useEffect(() => {
    const countdownTimer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);


    const eventCheckTimer = setInterval(evaluateEvents, 10000); 
    
        evaluateEvents();
    return () => {
      clearInterval(countdownTimer);
      clearInterval(eventCheckTimer);
    };
  }, [evaluateEvents, calculateTimeLeft]);

  // --- RENDERELÉS ---

  const noEventsToday = currentEvents.length === 0 && !nextEvent;

  return (
    <>
      <div className="fixed inset-y-[30px] inset-x-0 overflow-y-auto z-[999] px-4 pb-4"> 
        <div className="max-w-3xl mx-auto"> 
          {/* Fejléc */}
          <div className="sticky top-0 z-20 bg-amber-600 dark:bg-amber-900 text-white p-3 rounded-t-2xl shadow-md flex justify-between items-center">
            <h2 className="text-xl font-bold">
              🏰 Kőszegi Ostromnapok 2025
            </h2>
            
            {!timeLeft.isOver && (
              <div className="hidden sm:flex items-baseline bg-amber-800/80 px-3 py-1 rounded-lg"> 
                <span className="font-mono text-sm">
                  {timeLeft.days}n {timeLeft.hours}ó {timeLeft.minutes}p
                </span>
                <span className="font-mono ml-2 text-xs w-6 text-center">
                  {timeLeft.seconds}s
                </span>
              </div>
            )}
            
            <button 
              onClick={onClose} 
              className="text-2xl hover:text-amber-200 transition-colors"
              aria-label="Bezárás"
            >
              × 
            </button>
          </div>

          {/* Tartalom konténer */}
          <div className="bg-amber-50 dark:bg-zinc-900 p-4 rounded-b-2xl shadow-lg">
            {noEventsToday && (
              <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">
                🎉 Nincs több esemény mára! Nézz vissza később, vagy lapozz a holnapi napra.
              </p>
            )}

            {/* Jelenleg zajló események */}
            {currentEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200 border-b-2 border-amber-200 dark:border-amber-700 pb-1">
                  🎬 Jelenleg zajlik ({currentEvents.length})
                </h3>
                {currentEvents.map(event => (
                  <EventCard key={event.id} event={event} userLocation={userLocation} onSelect={setSelectedProgram} />
                ))}
              </div>
            )}

            {/* Következő esemény */}
            {nextEvent && (
               <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200 border-b-2 border-yellow-200 dark:border-yellow-700 pb-1">
                    ⏭️ Következő esemény
                  </h3>
                  <EventCard key={nextEvent.id} event={nextEvent} userLocation={userLocation} onSelect={setSelectedProgram} isNext={true} />
               </div>
            )}

            {/* Térkép (ha van mit mutatni) */}
            {userLocation && (currentEvents.length > 0 || nextEvent) && (
              <div className="h-[250px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">
                <MapContainer
                  center={[
                    currentEvents[0]?.helyszin?.lat || nextEvent?.helyszin?.lat || userLocation.lat,
                    currentEvents[0]?.helyszin?.lng || nextEvent?.helyszin?.lng || userLocation.lng
                  ]}
                  zoom={16}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[userLocation.lat, userLocation.lng]}><Popup>📍 Itt vagy</Popup></Marker>
                  {currentEvents.map(e => (
                    <Marker key={`map-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]}>
                      <Popup><strong>{e.nev}</strong><br />{format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}</Popup>
                    </Marker>
                  ))}
                  {nextEvent && !currentEvents.some(e => e.id === nextEvent.id) && (
                    <Marker 
                      position={[nextEvent.helyszin.lat, nextEvent.helyszin.lng]}
                      icon={new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        iconSize: [25, 41], iconAnchor: [12, 41]
                      })}
                    >
                      <Popup><strong>{nextEvent.nev}</strong><br />Kezdés: {format(nextEvent.start, 'HH:mm')}</Popup>
                    </Marker>
                  )}
                 </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Részletes nézet (ezt nem változtattam) */}
      <ProgramDetailsSheet
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      /> 
    </>
  );
}

function EventCard({ event, userLocation, onSelect, isNext = false }) {
  const cardClasses = isNext 
    ? "p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-600 cursor-pointer hover:shadow-lg transition"
    : "mb-3 p-4 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer hover:shadow-lg transition";

  return (
    <div className={cardClasses} onClick={() => onSelect(event)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{event.nev}</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
            📍 {event.helyszin.nev}<br />
            🕘 {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
          </p>
        </div>
        {event.kiemelt && (
          <span className="ml-2 flex-shrink-0 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
            ⭐ Kiemelt
          </span>
        )}
      </div>
      {userLocation && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${event.helyszin.lat},${event.helyszin.lng}&travelmode=walking`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 text-sm font-semibold text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
          onClick={e => e.stopPropagation()} 
        >
          🧭 Útvonalterv gyalog
        </a>
      )}
    </div>
  );
}
