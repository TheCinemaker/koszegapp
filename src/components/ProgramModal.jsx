/* --- FÁJL: ProgramModal.jsx (Végleges, TELJES, iOS-biztos, javított verzió) --- */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { parseISO, isSameDay, isBefore, isAfter, format, formatISO, isValid, startOfDay, differenceInDays } from 'date-fns';
import { hu } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ProgramDetailsSheet from './ProgramDetailsSheet';

// --- BIZTONSÁGI ÉS HELPER FÜGGVÉNYEK ---

function safeParseISO(dateString) {
    if (!dateString) return null;
    try {
        const date = parseISO(dateString);
        return isValid(date) ? date : null;
    } catch (error) {
        console.error(`Hibás dátumformátum, nem sikerült feldolgozni: "${dateString}"`, error);
        return null;
    }
}

function useFavorites() {
    const [favorites, setFavorites] = useState(() => {
        try {
            const stored = localStorage.getItem('programFavorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Hiba a kedvencek betöltésekor a localStorage-ből:", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('programFavorites', JSON.stringify(favorites));
        } catch (error) {
            console.error("Hiba a kedvencek mentésekor a localStorage-be:", error);
        }
    }, [favorites]);

    const toggleFavorite = (eventId) => {
        setFavorites(prev => 
            prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
        );
    };
    return { favorites, toggleFavorite };
}

function EventCard({ event, onSelect, isFavorite, onToggleFavorite }) {
    const cardClasses = "p-3 rounded-xl border-l-4 cursor-pointer hover:shadow-lg transition mb-2 " + 
        (isFavorite ? "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-500" : "bg-amber-200 dark:bg-amber-800/50 border-amber-500");
    return (
        <div className={cardClasses} onClick={() => onSelect(event)}>
            <div className="flex items-start justify-between">
                <div className="flex-grow pr-2">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{event.nev}</p>
                    <div className="text-sm mt-1 text-gray-700 dark:text-gray-300 space-y-1">
                        <p>📍 {event.helyszin.nev}</p>
                        <p>🕘 {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}</p>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(event.id); }} className="p-2 text-2xl flex-shrink-0" aria-label={isFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}>
                    {isFavorite ? <span className="text-yellow-500 transition-transform duration-200 transform hover:scale-125">★</span> : <span className="text-gray-400 transition-transform duration-200 transform hover:scale-125">☆</span>}
                </button>
            </div>
        </div>
    );
}

// EZ A RÉSZ HIÁNYZOTT: Visszaszámláló a következő eseményig
function CountdownToNext({ targetDate }) {
    const calculateTimeLeft = useCallback(() => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        return { days, hours, minutes, seconds, isOver: false };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    if (timeLeft.isOver) return <span className="font-bold text-green-600">Most kezdődik!</span>;
    if (timeLeft.days > 0) return (<div className="font-mono font-bold"><span className="text-3xl">{timeLeft.days}</span><span className="text-xl"> nap </span><span className="text-3xl">{String(timeLeft.hours).padStart(2, '0')}</span><span className="text-xl"> óra</span></div>);
    return (<span className="text-3xl font-mono font-bold">{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>);
}

// --- A FŐ KOMPONENS ---

export default function ProgramModal({ onClose, openDrawer }) {
    const [view, setView] = useState('today');
    const { favorites, toggleFavorite } = useFavorites();
    const [notificationPermission, setNotificationPermission] = useState(typeof window !== 'undefined' && window.Notification ? Notification.permission : 'unsupported');
    const [weatherData, setWeatherData] = useState(null);
    const [events, setEvents] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [currentEvents, setCurrentEvents] = useState([]);
    const [nextEvents, setNextEvents] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [timeLeft, setTimeLeft] = useState(() => ({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true }));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const evaluateEvents = useCallback(() => {
        if (events.length === 0) return;
        const now = new Date();
        const today = events.filter(e => isSameDay(e.start, now));
        const curr = today.filter(e => isBefore(e.start, now) && isAfter(e.end, now));
        const nextToday = today.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
        setCurrentEvents(curr);
        if (nextToday.length > 0) {
            const nextGroup = nextToday.filter(e => e.start.getTime() === nextToday[0].start.getTime());
            setNextEvents(nextGroup);
        } else {
            const allFutureEvents = events.filter(e => isAfter(e.start, now)).sort((a, b) => a.start - b.start);
            if (allFutureEvents.length > 0) {
                const nextGroup = allFutureEvents.filter(e => e.start.getTime() === allFutureEvents[0].start.getTime());
                setNextEvents(nextGroup);
            } else {
                setNextEvents([]);
            }
        }
    }, [events]);

    useEffect(() => {
        async function loadData() {
            try {
                const programResponse = await fetch('/data/programok.json');
                if (!programResponse.ok) throw new Error(`Hálózati hiba: ${programResponse.statusText}`);
                const dailyData = await programResponse.json();
                if (!Array.isArray(dailyData)) throw new Error("A programok.json formátuma nem megfelelő (nem tömb).");
                const allEvents = dailyData.flatMap(dayObject => (dayObject && Array.isArray(dayObject.esemenyek)) ? dayObject.esemenyek : []);
                if (allEvents.length === 0) {
                    console.warn("Nem található egyetlen esemény sem a 'programok.json' fájlban a várt formátumban.");
                    setEvents([]);
                } else {
                    const parsed = allEvents.map(p => {
                        const start = safeParseISO(p.idopont);
                        if (!start) return null;
                        const end = safeParseISO(p.veg_idopont) || new Date(start.getTime() + 60 * 60000);
                        return { ...p, start, end, kiemelt: !!p.kiemelt };
                    }).filter(Boolean);
                    setEvents(parsed);
                }
                fetch('https://api.openweathermap.org/data/2.5/weather?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045').then(res => res.json()).then(data => { if(data.cod === 200) setWeatherData({ temp: Math.round(data.main.temp), description: data.weather[0].description, icon: data.weather[0].icon }); });
            } catch (err) {
                console.error("Adatbetöltési hiba:", err);
                setError(err.message || "Ismeretlen hiba történt a programok betöltésekor.");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), err => console.warn('Helymeghatározás hiba:', err.message));
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(error => console.error('Service Worker regisztráció hiba:', error));
    }, []);

    useEffect(() => { const countdownTimer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000); const eventCheckTimer = setInterval(evaluateEvents, 10000); evaluateEvents(); return () => { clearInterval(countdownTimer); clearInterval(eventCheckTimer); }; }, [evaluateEvents, calculateTimeLeft]);
    useEffect(() => { if (navigator.serviceWorker && navigator.serviceWorker.controller) { const favoriteEventDetails = events.filter(event => favorites.includes(event.id)); navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_FAVORITES', favorites: favoriteEventDetails }); } }, [favorites, events]);
    const handleNotificationPermission = () => { if (window.Notification) Notification.requestPermission().then(setNotificationPermission); };
    const favoriteEvents = useMemo(() => events.filter(e => favorites.includes(e.id)).sort((a,b) => a.start - b.start), [events, favorites]);
    const fullProgramGrouped = useMemo(() => { return events.reduce((acc, event) => { const dayKey = startOfDay(event.start).getTime(); if (!acc[dayKey]) acc[dayKey] = { date: event.start, events: [] }; acc[dayKey].events.push(event); return acc; }, {}); }, [events]);
    const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const getNextEventDayInfo = () => { if (!nextEvents || nextEvents.length === 0) return ""; const nextDate = nextEvents[0].start; const now = new Date(); if (isSameDay(nextDate, now)) return `(${format(nextDate, 'HH:mm')}-kor)`; const dayDiff = differenceInDays(startOfDay(nextDate), startOfDay(now)); if (dayDiff === 1) return `(Holnap, ${format(nextDate, 'HH:mm')}-kor)`; return `(${dayDiff} nap múlva, ${format(nextDate, 'eeee', {locale: hu})})`; };

    return (
        <>
            <div className="fixed inset-y-4 sm:inset-y-8 inset-x-2 sm:inset-x-0 z-[999] px-2 pb-4 pointer-events-none">
                <div className="max-w-3xl mx-auto flex flex-col h-full pointer-events-auto">
                    <div className="sticky top-0 z-20 bg-amber-600 dark:bg-amber-900 text-white p-3 rounded-t-2xl shadow-md flex justify-between items-center"><div className="flex items-center gap-3"><h2 className="text-xl font-bold">🏰 Ostromnapok 2025</h2>{weatherData && <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg"><img src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} alt={weatherData.description} className="w-6 h-6" /><span className="text-sm font-bold">{weatherData.temp}°C</span></div>}</div><button onClick={onClose} className="text-2xl hover:text-amber-200 transition-colors" aria-label="Bezárás">×</button></div>
                    {!timeLeft.isOver && <div className="sticky top-[58px] z-10 bg-amber-800/95 backdrop-blur-sm text-white text-center p-2 shadow-inner"><span className="font-mono text-sm">Kezdésig: {timeLeft.days}n {timeLeft.hours}ó {timeLeft.minutes}p {timeLeft.seconds}s</span></div>}
                    <div className="bg-amber-50 dark:bg-zinc-900 p-4 rounded-b-2xl shadow-lg flex-grow overflow-y-auto">
                        <div className="mb-4 flex border-b-2 border-amber-200 dark:border-zinc-700"><button onClick={() => setView('today')} className={`px-4 py-2 text-sm font-semibold ${view === 'today' ? 'border-b-2 border-amber-600 text-amber-700 dark:text-amber-300' : 'text-gray-500 hover:bg-amber-100 dark:hover:bg-zinc-800'}`}>Élő</button><button onClick={() => setView('full')} className={`px-4 py-2 text-sm font-semibold ${view === 'full' ? 'border-b-2 border-amber-600 text-amber-700 dark:text-amber-300' : 'text-gray-500 hover:bg-amber-100 dark:hover:bg-zinc-800'}`}>Teljes Program</button><button onClick={() => setView('favorites')} className={`px-4 py-2 text-sm font-semibold flex items-center gap-1 ${view === 'favorites' ? 'border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-gray-500 hover:bg-amber-100 dark:hover:bg-zinc-800'}`}>Kedvenceim <span className="text-yellow-500">★</span></button></div>
                        {isLoading ? <div className="text-center py-10"><p className="text-lg font-semibold text-amber-700 dark:text-amber-300">Programok betöltése...</p></div> : error ? <div className="text-center py-10 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg"><p className="text-lg font-bold text-red-700 dark:text-red-300">Hiba történt!</p><p className="text-sm text-red-600 dark:text-red-200 mt-1">{error}</p></div> : <>
                        {notificationPermission === 'default' && (<div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 p-3 rounded-lg mb-4 text-center animate-fadein"><p className="font-semibold mb-2">Szeretnél értesítést kapni, mielőtt a kedvenc programjaid kezdődnek?</p><button onClick={handleNotificationPermission} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded-full">Értesítések engedélyezése</button></div>)}
                        {notificationPermission === 'denied' && (<p className="text-xs text-center text-gray-500 mb-4">Az értesítések le vannak tiltva a böngésződben. A beállításokban tudod engedélyezni.</p>)}
                        {view === 'today' && (<>
                            {events.length > 0 && currentEvents.length === 0 && nextEvents.length === 0 && <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">🎉 A fesztiválnak vége, köszönjük a részvételt!</p>}
                            <div className="mb-6">{currentEvents.length > 0 ? <div className="animate-fadein"><h3 className="section-title border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">🎬 Jelenleg zajlik ({currentEvents.length})</h3>{currentEvents.map(e => <EventCard key={e.id} event={e} onSelect={setSelectedProgram} isFavorite={favorites.includes(e.id)} onToggleFavorite={toggleFavorite} />)}</div> : nextEvents.length > 0 && <div className="text-center bg-amber-100 dark:bg-amber-900/40 p-4 rounded-xl animate-fadein"><p className="text-lg font-semibold text-amber-800 dark:text-amber-200">Jelenleg nincs program.</p><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">A következő ennyi idő múlva kezdődik:</p><div className="text-3xl mt-2 text-amber-700 dark:text-amber-300"><CountdownToNext targetDate={nextEvents[0].start} /></div></div>}</div>
                            {nextEvents.length > 0 && <div className="mb-4 animate-fadein"><h3 className="section-title border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">⏭️ Következő {getNextEventDayInfo()}</h3>{nextEvents.map(e => <EventCard key={e.id} event={e} onSelect={setSelectedProgram} isFavorite={favorites.includes(e.id)} onToggleFavorite={toggleFavorite} />)}</div>}
                            {userLocation && (currentEvents.length > 0 || nextEvents.length > 0) && <div className="h-[250px] rounded-xl overflow-hidden mt-6 border border-amber-300 dark:border-amber-700"><MapContainer center={[ (currentEvents[0] || nextEvents[0]).helyszin.lat, (currentEvents[0] || nextEvents[0]).helyszin.lng ]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[userLocation.lat, userLocation.lng]}><Popup>📍 Itt vagy</Popup></Marker>{currentEvents.map(e => <Marker key={`map-curr-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]}><Popup><strong>{e.nev}</strong><br/>{format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}</Popup></Marker>)}{nextEvents.map(e => !currentEvents.some(c => c.id === e.id) && <Marker key={`map-next-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]} icon={blueIcon}><Popup><strong>{e.nev}</strong><br/>Kezdés: {format(e.start, 'HH:mm')}</Popup></Marker>)}</MapContainer></div>}
                        </>)}
                        {view === 'full' && (<div className="space-y-6 animate-fadein">{Object.values(fullProgramGrouped).sort((a, b) => a.date - b.date).map(({ date, events: dayEvents }) => (<div key={date.getTime()}><h3 className="section-title border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">{format(date, 'MMMM d. (eeee)', { locale: hu })}</h3>{dayEvents.sort((a,b) => a.start - b.start).map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isFavorite={favorites.includes(event.id)} onToggleFavorite={toggleFavorite} />)}</div>))}</div>)}
                        {view === 'favorites' && (<div className="animate-fadein">{favoriteEvents.length > 0 ? favoriteEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isFavorite={true} onToggleFavorite={toggleFavorite} />) : <p className="text-center text-lg text-amber-700 dark:text-amber-200 italic py-6">Még nem jelöltél meg kedvencet.<br/>Kattints egy esemény melletti csillagra! ☆</p>}</div>)}
                        </>}
                    </div>
                </div>
            </div>
            <ProgramDetailsSheet program={selectedProgram} onClose={() => setSelectedProgram(null)} />
        </>
    );
}
