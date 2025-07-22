/* --- (időjárást is lekérdező verzió A 15:26 előtti állapot a stabil ) --- */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { parseISO, isSameDay, isBefore, isAfter, format, formatISO } from 'date-fns';
import { hu } from 'date-fns/locale'; // Magyar lokalizáció a dátumokhoz
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ProgramDetailsSheet from './ProgramDetailsSheet';

// Az EventCard komponens változatlan maradt, de a teljesség kedvéért itt van
function EventCard({ event, onSelect, isNext = false }) {
    const cardClasses = isNext 
    ? "p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-600 cursor-pointer hover:shadow-lg transition mb-2"
    : "p-3 rounded-xl bg-amber-200 dark:bg-amber-800/50 border-l-4 border-amber-500 cursor-pointer hover:shadow-lg transition mb-2";

    return (
        <div className={cardClasses} onClick={() => onSelect(event)}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{event.nev}</p>
                    <div className="text-sm mt-1 text-gray-700 dark:text-gray-300 space-y-1">
                        <p>📍 {event.helyszin.nev}</p>
                        <p>🕘 {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}</p>
                    </div>
                </div>
                {event.kiemelt && <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">KIEMELT</span>}
            </div>
        </div>
    );
}

// Komponens a teljes, napokra bontott programfüzet nézethez
function FullProgramView({ events, onSelect }) {
    const groupedEvents = useMemo(() => {
        return events.reduce((acc, event) => {
            const day = formatISO(event.start, { representation: 'date' });
            if (!acc[day]) acc[day] = [];
            acc[day].push(event);
            return acc;
        }, {});
    }, [events]);

    return (
        <div className="space-y-6">
            {Object.entries(groupedEvents).map(([day, dayEvents]) => (
                <div key={day}>
                    <h3 className="section-title border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">
                        {format(parseISO(day), 'MMMM d. (eeee)', { locale: hu })}
                    </h3>
                    {dayEvents.sort((a,b) => a.start - b.start).map(event => ( // Napon belül is időrendbe rakva
                        <EventCard key={event.id} event={event} onSelect={onSelect} />
                    ))}
                </div>
            ))}
        </div>
    );
}


export default function ProgramModal({ onClose }) {
    // --- STATE-EK ---
    const [view, setView] = useState('today');
    const [weatherData, setWeatherData] = useState(null); // ÚJ: State az időjárásnak
    const [events, setEvents] = useState([]);
    const [currentEvents, setCurrentEvents] = useState([]);
    const [nextEvents, setNextEvents] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [timeLeft, setTimeLeft] = useState(() => ({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true }));

    // ... a meglévő useCallback hookok változatlanok ...
    const calculateTimeLeft = useCallback(() => { /* ... változatlan ... */ });
    const evaluateEvents = useCallback(() => { /* ... változatlan ... */ }, [events]);

    // --- EFFECT-EK AZ ADATKEZELÉSHEZ ---
    useEffect(() => {
        // 1. Események betöltése
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

        // 2. Geolokáció lekérdezése
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => console.warn('Helymeghatározás hiba:', err.message)
            );
        }

        // 3. IDŐJÁRÁS LEKÉRDEZÉSE (itt, a modalon belül)
        fetch('https://api.openweathermap.org/data/2.5/weather?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045')
            .then(res => res.json())
            .then(data => {
                if(data.cod === 200) { // Ellenőrizzük, hogy sikeres volt-e a lekérdezés
                    setWeatherData({
                        temp: Math.round(data.main.temp),
                        description: data.weather[0].description,
                        icon: data.weather[0].icon,
                    });
                }
            })
            .catch(err => console.error("Időjárás API hiba:", err));

    }, []); // Mindez csak egyszer fut le, betöltődéskor.

    useEffect(() => {
        // Időzítők (visszaszámláló és esemény-checker)
        const countdownTimer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        const eventCheckTimer = setInterval(evaluateEvents, 10000);
        evaluateEvents(); // Azonnali futtatás
        return () => { clearInterval(countdownTimer); clearInterval(eventCheckTimer); };
    }, [evaluateEvents, calculateTimeLeft]);


    // --- RENDERELÉS ---
    const noEventsToday = currentEvents.length === 0 && nextEvents.length === 0;

    return (
        <>
            <div className="fixed inset-y-4 sm:inset-y-8 inset-x-2 sm:inset-x-0 z-[999] px-2 pb-4 pointer-events-none">
                <div className="max-w-3xl mx-auto flex flex-col h-full pointer-events-auto">
                    {/* FEJLÉC IDŐJÁRÁSSAL */}
                    <div className="sticky top-0 z-20 bg-amber-600 dark:bg-amber-900 text-white p-3 rounded-t-2xl shadow-md flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">🏰 Programfüzet</h2>
                            {weatherData && (
                                <div className="hidden sm:flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
                                    <img src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} alt={weatherData.description} className="w-6 h-6" />
                                    <span className="text-sm font-bold">{weatherData.temp}°C</span>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="text-2xl hover:text-amber-200 transition-colors" aria-label="Bezárás">×</button>
                    </div>

                    {/* VISSZASZÁMLÁLÓ SÁV */}
                    {!timeLeft.isOver && (
                        <div className="sticky top-[58px] z-10 bg-amber-800/95 backdrop-blur-sm text-white text-center p-2 shadow-inner">
                            <span className="font-mono text-sm">Kezdésig: {timeLeft.days}n {timeLeft.hours}ó {timeLeft.minutes}p {timeLeft.seconds}s</span>
                        </div>
                    )}

                    {/* GÖRGETHETŐ TARTALOM NÉZETVÁLTÓVAL */}
                    <div className="bg-amber-50 dark:bg-zinc-900 p-4 rounded-b-2xl shadow-lg flex-grow overflow-y-auto">
                        <div className="mb-4 flex border-b-2 border-amber-200 dark:border-zinc-700">
                            <button onClick={() => setView('today')} className={`px-4 py-2 text-sm font-semibold ${view === 'today' ? 'border-b-2 border-amber-600 text-amber-700 dark:text-amber-300' : 'text-gray-500 hover:bg-amber-100 dark:hover:bg-zinc-800'}`}>Mai Program</button>
                            <button onClick={() => setView('full')} className={`px-4 py-2 text-sm font-semibold ${view === 'full' ? 'border-b-2 border-amber-600 text-amber-700 dark:text-amber-300' : 'text-gray-500 hover:bg-amber-100 dark:hover:bg-zinc-800'}`}>Teljes Programfüzet</button>
                        </div>
                        
                        {view === 'today' ? (
                            <>
                                {noEventsToday && <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">🎉 Nincs több esemény mára!</p>}
                                {currentEvents.length > 0 && <div className="mb-6 animate-fadein"><h3 className="section-title border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">🎬 Jelenleg zajlik ({currentEvents.length})</h3>{currentEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} />)}</div>}
                                {nextEvents.length > 0 && <div className="mb-4 animate-fadein"><h3 className="section-title border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">⏭️ Következő ({format(nextEvents[0].start, 'HH:mm')}-kor)</h3>{nextEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isNext={true} />)}</div>}
                                {/* Térkép a "Mai program" nézetben marad */}
                                {userLocation && (currentEvents.length > 0 || nextEvents.length > 0) && <div className="h-[250px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700">{/* ... MapContainer ... */}</div>}
                            </>
                        ) : (
                            <FullProgramView events={events} onSelect={setSelectedProgram} />
                        )}
                    </div>
                </div>
            </div>

            <ProgramDetailsSheet program={selectedProgram} onClose={() => setSelectedProgram(null)} />
        </>
    );
}
