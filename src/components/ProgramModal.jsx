/* --- FÁJL: ProgramModal.jsx (Végleges, Többnyelvű, Kőszegi Szüret 2025) --- */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next'; 
import { parseISO, isSameDay, isBefore, isAfter, format, isValid, startOfDay, differenceInDays } from 'date-fns';
import { hu, enUS, de } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ProgramDetailsSheet from './ProgramDetailsSheet';

const localeMap = {
  hu: hu,
  en: enUS,
  de: de
};

// --- BIZTONSÁGI ÉS HELPER FÜGGVÉNYEK ---

function safeParseISO(dateString) {
    if (!dateString) return null;
    try {
        const date = parseISO(dateString);
        return isValid(date) ? date : null;
    } catch (error) {
        console.error(`Hibás dátumformátum, nem sikerült feldgozni: "${dateString}"`, error);
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

function EventCard({ event, onSelect, isFavorite, onToggleFavorite, userLocation }) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    const cardClasses = "p-3 rounded-xl border-l-4 cursor-pointer hover:shadow-lg transition mb-2 " + 
        (isFavorite ? "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-500" : "bg-purple-100 dark:bg-purple-900/50 border-purple-500");
    return (
        <div className={cardClasses} onClick={() => onSelect(event)}>
            <div className="flex items-start justify-between">
                <div className="flex-grow pr-2">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{event.nev[currentLang] || event.nev.hu}</p>
                    <div className="text-sm mt-1 text-gray-700 dark:text-gray-300 space-y-1">
                        <p>📍 {event.helyszin.nev[currentLang] || event.helyszin.nev.hu}</p>
                        <p>🕘 {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}</p>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(event.id); }} className="p-2 text-2xl flex-shrink-0" aria-label={isFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}>
                    {isFavorite ? <span className="text-yellow-500 transition-transform duration-200 transform hover:scale-125">★</span> : <span className="text-gray-400 transition-transform duration-200 transform hover:scale-125">☆</span>}
                </button>
            </div>
            {userLocation && event.helyszin?.lat && (
                <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${event.helyszin.lat},${event.helyszin.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-sm font-semibold text-purple-700 underline hover:text-purple-900 dark:text-purple-300"
                    onClick={e => e.stopPropagation()}
                >
                    🧭 {t('programModal.routePlanner')}
                </a>
            )}
        </div>
    );
}

function InfoModal({ onClose }) {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-4 text-2xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition">×</button>
                <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-200 mb-4">ℹ️ {t('infoModal.title')}</h2>
                <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                        <span className="text-xl pt-1">🔴</span>
                        <div>{t('infoModal.item1')}</div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-xl pt-1">🗓️</span>
                        <div>{t('infoModal.item2')}</div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-xl pt-1">★</span>
                        <div>{t('infoModal.item3')}</div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-xl pt-1">🍇</span>
                        <div>{t('infoModal.item4')}</div>
                    </li>
                </ul>
                <div className="mt-6 text-center">
                    <button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition">
                        {t('infoModal.button')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CountdownToNext({ targetDate }) {
    const { t } = useTranslation(); // Fordító hook használata
    const calculateTimeLeft = useCallback(() => { /* ... kód változatlan ... */ }, [targetDate]);
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
    useEffect(() => { /* ... kód változatlan ... */ }, [calculateTimeLeft]);

    if (timeLeft.isOver) {
        return <span className="font-bold text-green-600 text-2xl">{t('programModal.nowStarting')}</span>;
    }

    return (
        <div className="flex justify-center items-baseline space-x-2 sm:space-x-4 font-mono">
            {timeLeft.days > 0 && (
                <div className="text-center">
                    <span className="text-4xl font-bold">{timeLeft.days}</span>
                    <span className="block text-xs uppercase tracking-wider">{t('programModal.timeUnits.day')}</span>
                </div>
            )}
            <div className="text-center">
                <span className="text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="block text-xs uppercase tracking-wider">{t('programModal.timeUnits.hour')}</span>
            </div>
            <div className="text-center">
                <span className="text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="block text-xs uppercase tracking-wider">{t('programModal.timeUnits.minute')}</span>
            </div>
            <div className="text-center">
                <span className="text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="block text-xs uppercase tracking-wider">{t('programModal.timeUnits.second')}</span>
            </div>
        </div>
    );
}

function InlineCountdown({ targetDate }) {
    const { t } = useTranslation(); // Fordító hook használata
    const calculateTimeLeft = useCallback(() => { /* ... kód változatlan ... */ }, [targetDate]);
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
    useEffect(() => { /* ... kód változatlan ... */ }, [calculateTimeLeft]);

    if (timeLeft.over) {
        return <span className="text-green-600 font-semibold animate-pulse">{t('programModal.nowStartingInline')}</span>;
    }

    const parts = [];
    if (timeLeft.hours > 0) parts.push(`${timeLeft.hours} ${t('programModal.inlineTimeUnits.hour')}`);
    if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes} ${t('programModal.inlineTimeUnits.minute')}`);
    if (timeLeft.hours === 0 && timeLeft.minutes < 10) parts.push(`${timeLeft.seconds} ${t('programModal.inlineTimeUnits.second')}`);

    return (
        <span className="text-purple-700 dark:text-purple-300 font-semibold">
            {t('programModal.inlineCountdownFormat', { parts: parts.join(' ') })}
        </span>
    );
}

// --- A FŐ KOMPONENS ---

export default function ProgramModal({ onClose }) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;
    const currentLocale = localeMap[currentLang] || hu;

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
    const [showInfoModal, setShowInfoModal] = useState(false);

    const calculateTimeLeft = useCallback(() => {
        const now = new Date();
        const festivalStart = new Date('2025-09-26T17:00:00');
        const diff = festivalStart - now;
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
                    console.warn("Nem található egyetlen esemény sem a 'programok.json' fájlban.");
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
    
    const fullProgramGrouped = useMemo(() => {
        return events.reduce((acc, event) => {
            const dayKey = startOfDay(event.start).getTime();
            if (!acc[dayKey]) acc[dayKey] = { date: event.start, events: [] };
            acc[dayKey].events.push(event);
            return acc;
        }, {});
    }, [events]);

    const blueIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    
    const getNextEventDayInfo = () => {
    if (!nextEvents || nextEvents.length === 0) return "";
    const nextDate = nextEvents[0].start;
    const now = new Date();

    if (isSameDay(nextDate, now)) return ""; // Ha ma van, nem kell kiírni semmit

    const dayDiff = differenceInDays(startOfDay(nextDate), startOfDay(now));

    if (dayDiff === 1) {
        return t('programModal.nextDayTomorrow', { time: format(nextDate, 'HH:mm') });
    }

    const dayName = format(nextDate, 'eeee', { locale: currentLocale });
    return t('programModal.nextDayInXDays', { count: dayDiff, dayName: dayName });
};
    const mapFocusEvent = currentEvents.length > 0 ? currentEvents[0] : nextEvents[0];

    return (
        <>
            <div className="fixed inset-y-4 sm:inset-y-8 inset-x-2 sm:inset-x-0 z-[999] px-2 pb-4 pointer-events-none">
                <div className="max-w-3xl mx-auto flex flex-col h-full pointer-events-auto">
                    <div className="sticky top-0 z-20 bg-purple-800 dark:bg-purple-950 text-white p-3 rounded-t-2xl shadow-md flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">🍇 {t('programModal.title')}</h2>
                            <button onClick={() => setShowInfoModal(true)} className="bg-black/20 w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold hover:bg-black/40 transition" aria-label="Súgó">i</button>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {weatherData && (
                            <div className="hidden sm:flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
                                <img src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} alt={weatherData.description} className="w-6 h-6" />
                                <span className="text-sm font-bold">{weatherData.temp}°C</span>
                            </div>
                            )}
                            
                            <div className="flex items-center space-x-1 bg-black/20 p-1 rounded-full">
                                <button onClick={() => i18n.changeLanguage('hu')} className={`w-6 h-6 rounded-full text-xs transition flex items-center justify-center ${currentLang === 'hu' ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`} aria-label="Magyar">🇭🇺</button>
                                <button onClick={() => i18n.changeLanguage('en')} className={`w-6 h-6 rounded-full text-xs transition flex items-center justify-center ${currentLang === 'en' ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`} aria-label="English">🇬🇧</button>
                                <button onClick={() => i18n.changeLanguage('de')} className={`w-6 h-6 rounded-full text-xs transition flex items-center justify-center ${currentLang === 'de' ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`} aria-label="Deutsch">🇩🇪</button>
                            </div>

                            <button onClick={onClose} className="text-2xl hover:text-purple-200 transition-colors" aria-label="Bezárás">×</button>
                        </div>
                    </div>
                    
                    {/*
                    <div className="sticky top-[58px] z-10 bg-red-600 text-white text-center p-2 shadow-inner font-semibold">
                        <p>FONTOS KÖZLEMÉNY: Itt jelenhet meg egy rendkívüli információ!</p>
                    </div>
                    */}

                    {!timeLeft.isOver && (
                        <div className="sticky top-[58px] z-10 bg-purple-900/95 backdrop-blur-sm text-white text-center p-2 shadow-inner">
                            <span className="font-mono text-sm">
        {t('programModal.countdownPrefix')}{' '}
        {t('programModal.countdownFormat', { days: timeLeft.days, hours: timeLeft.hours, minutes: timeLeft.minutes, seconds: timeLeft.seconds })}
    </span>
                        </div>
                    )}

                    <div className="bg-purple-50 dark:bg-zinc-900 p-4 rounded-b-2xl shadow-lg flex-grow overflow-y-auto">
                        <div className="mb-4 flex border-b-2 border-purple-200 dark:border-zinc-700">
                            <button onClick={() => setView('today')} className={`px-4 py-2 text-sm font-semibold ${view === 'today' ? 'border-b-2 border-purple-600 text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:bg-purple-100 dark:hover:bg-zinc-800'}`}>{t('programModal.live')}</button>
                            <button onClick={() => setView('full')} className={`px-4 py-2 text-sm font-semibold ${view === 'full' ? 'border-b-2 border-purple-600 text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:bg-purple-100 dark:hover:bg-zinc-800'}`}>{t('programModal.fullProgram')}</button>
                            <button onClick={() => setView('favorites')} className={`px-4 py-2 text-sm font-semibold flex items-center gap-1 ${view === 'favorites' ? 'border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-gray-500 hover:bg-purple-100 dark:hover:bg-zinc-800'}`}>{t('programModal.favorites')} <span className="text-yellow-500">★</span></button>
                        </div>
                        
                        {isLoading ? <div className="text-center py-10"><p className="text-lg font-semibold text-purple-700 dark:text-purple-300">Programok betöltése...</p></div> : error ? <div className="text-center py-10 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg"><p className="text-lg font-bold text-red-700 dark:text-red-300">Hiba történt!</p><p className="text-sm text-red-600 dark:text-red-200 mt-1">{error}</p></div> : <>
                        {notificationPermission === 'default' && (<div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 p-3 rounded-lg mb-4 text-center animate-fadein"><p className="font-semibold mb-2">Szeretnél értesítést kapni, mielőtt a kedvenc programjaid kezdődnek?</p><button onClick={handleNotificationPermission} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded-full">Értesítések engedélyezése</button></div>)}
                        {notificationPermission === 'denied' && (<p className="text-xs text-center text-gray-500 mb-4">Az értesítések le vannak tiltva a böngésződben. A beállításokban tudod engedélyezni.</p>)}
                        
                        {view === 'today' && (<>
                            {events.length > 0 && currentEvents.length === 0 && nextEvents.length === 0 && <p className="text-center text-lg text-purple-700 dark:text-purple-200 italic py-6">🎉 {t('programModal.festivalOver')}</p>}
                            <div className="mb-6">{currentEvents.length > 0 ? <div className="animate-fadein"><h3 className="section-title border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200">🎬 {t('programModal.currentlyRunning')} ({currentEvents.length})</h3>{currentEvents.map(e => <EventCard key={e.id} event={e} onSelect={setSelectedProgram} isFavorite={favorites.includes(e.id)} onToggleFavorite={toggleFavorite} userLocation={userLocation} />)}</div> : nextEvents.length > 0 && <div className="text-center bg-purple-100 dark:bg-purple-900/40 p-4 rounded-xl animate-fadein"><p className="text-lg font-semibold text-purple-800 dark:text-purple-200">{t('programModal.noCurrentEvent')}</p><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('programModal.countdownStartsIn')}</p><div className="text-3xl mt-2 text-purple-700 dark:text-purple-300"><CountdownToNext targetDate={nextEvents[0].start} /></div></div>}</div>
                            
                            {nextEvents.length > 0 && <div className="mb-4 animate-fadein">
                                <h3 className="section-title border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 flex items-baseline gap-2">
                                    <span>⏭️ {t('programModal.nextEvent')}</span>
                                    {isSameDay(nextEvents[0].start, new Date()) ? (
                                        <InlineCountdown targetDate={nextEvents[0].start} />
                                    ) : (
                                        <span className="text-sm font-normal">{getNextEventDayInfo()}</span>
                                    )}
                                </h3>
                                {nextEvents.map(e => <EventCard key={e.id} event={e} onSelect={setSelectedProgram} isFavorite={favorites.includes(e.id)} onToggleFavorite={toggleFavorite} userLocation={userLocation} />)}</div>}
                            
                            {userLocation && mapFocusEvent && (
                                <div className="mt-6">
                                    <div className="mb-2 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-purple-800 dark:text-purple-200">{currentEvents.length > 0 ? t('programModal.currentlyRunning') : t('programModal.nextEvent')}</h4>
                                            <p className="text-xs text-gray-500">{mapFocusEvent.helyszin.nev[currentLang] || mapFocusEvent.helyszin.nev.hu}</p>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${mapFocusEvent.helyszin.lat},${mapFocusEvent.helyszin.lng}&travelmode=walking`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-semibold text-purple-700 underline hover:text-purple-900 dark:text-purple-300 flex items-center gap-1"
                                        >
                                            <span>🧭</span>
                                            <span>{t('programModal.takeMeThere')}</span>
                                        </a>
                                    </div>
                                    <div className="h-[250px] rounded-xl overflow-hidden border border-purple-300 dark:border-purple-700">
                                        <MapContainer center={[ mapFocusEvent.helyszin.lat, mapFocusEvent.helyszin.lng ]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[userLocation.lat, userLocation.lng]}><Popup>📍 Itt vagy</Popup></Marker>
                                            {currentEvents.map(e => <Marker key={`map-curr-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]}><Popup><strong>{e.nev[currentLang] || e.nev.hu}</strong><br/>{format(e.start, 'HH:mm')} - {format(e.end, 'HH:mm')}</Popup></Marker>)}
                                            {nextEvents.map(e => !currentEvents.some(c => c.id === e.id) && <Marker key={`map-next-${e.id}`} position={[e.helyszin.lat, e.helyszin.lng]} icon={blueIcon}><Popup><strong>{e.nev[currentLang] || e.nev.hu}</strong><br/>Kezdés: {format(e.start, 'HH:mm')}</Popup></Marker>)}
                                        </MapContainer>
                                    </div>
                                </div>
                            )}
                        </>)}

                        {view === 'full' && (
                            <div className="space-y-6 animate-fadein">
                                {Object.values(fullProgramGrouped)
                                .sort((a, b) => a.date - b.date)
                                .map(({ date, events: dayEvents }) => (
                                    <div key={date.getTime()}>
                                    <h3 className="section-title border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 capitalize">
                                        {format(date, 'MMMM d. (eeee)', { locale: currentLocale })}
                                    </h3>
                                    {dayEvents
                                        .sort((a, b) => a.start - b.start)
                                        .map(event => (
                                        <EventCard 
                                            key={event.id} 
                                            event={event} 
                                            onSelect={setSelectedProgram} 
                                            isFavorite={favorites.includes(event.id)} 
                                            onToggleFavorite={toggleFavorite} 
                                            userLocation={userLocation} 
                                        />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        {view === 'favorites' && (
                          <div className="animate-fadein">
                            {favoriteEvents.length > 0 ? 
                              favoriteEvents.map(event => <EventCard key={event.id} event={event} onSelect={setSelectedProgram} isFavorite={true} onToggleFavorite={toggleFavorite} userLocation={userLocation} />) : 
                          <p className="text-center text-lg text-purple-700 dark:text-purple-200 italic py-6">
                            {t('programModal.favoritesEmptyTitle')}<br/>
                            {t('programModal.favoritesEmptySubtitle')}
                        </p>
        }
    </div>
)}
                        </>}
                    </div>
                </div>
            </div>

            <ProgramDetailsSheet program={selectedProgram} onClose={() => setSelectedProgram(null)} />
            
            {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
        </>
    );
}
