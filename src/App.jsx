import React, { useState, useEffect, useRef, useContext, useMemo } from 'react'; // useMemo hozzáadva
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DarkModeContext } from './contexts/DarkModeContext';
import { useFavorites } from './contexts/FavoritesContext.jsx';
import { fetchAttractions, fetchEvents, fetchLeisure, fetchRestaurants, fetchHotels } from './api';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Attractions from './pages/Attractions';
import AttractionDetail from './pages/AttractionDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Info from './pages/Info';
import AboutDetail from './pages/AboutDetail';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';
import Gastronomy from './pages/Gastronomy';
import RestaurantDetail from './pages/RestaurantDetail';
import Leisure from './pages/Leisure';
import LeisureDetail from './pages/LeisureDetail';
import WeatherDetail from './pages/WeatherDetail';
import Adatvedelem from './pages/Adatvedelem';

import FavoritesDashboard from './components/FavoritesDashboard'; // A RÉGI HELYETT EZT HASZNÁLJUK
import WeatherModal from './components/WeatherModal';
import FloatingButtons from './components/FloatingButtons';
import ProgramModal from './components/ProgramModal';
import OstromDrawerFullAnimated from './components/OstromDrawerFullAnimated';

export default function App() {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState({ icon: '', temp: '--' });
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleDark } = useContext(DarkModeContext);
  
  const { favorites, isFavorite } = useFavorites();
  const [appData, setAppData] = useState({
    attractions: [], events: [], leisure: [], restaurants: [], hotels: [], loading: true
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const favoritesRef = useRef(null);

  const [showProgramModal, setShowProgramModal] = useState(true);
  const [showOstromDrawer, setShowOstromDrawer] = useState(false);
  const isHome = location.pathname === '/';
  
  useEffect(() => {
    Promise.all([
      fetchAttractions(), fetchEvents(), fetchLeisure(), fetchRestaurants(), fetchHotels()
    ]).then(([attractions, eventsData, leisure, restaurants, hotels]) => {
      const now = new Date();
      // Az eseményeket már betöltéskor megszűrjük a régiektől
      const normalizedEvents = eventsData.map(evt => {
          let s, e;
          if (evt.startDate) { s = new Date(evt.startDate); e = evt.endDate ? new Date(evt.endDate) : s; } 
          else if (evt.date.includes('/')) { const p = evt.date.split('/'); s = new Date(p[0]); e = new Date(p[1] || p[0]); }
          else { s = new Date(evt.date); e = s; }
          return { ...evt, _s: s, _e: e };
        }).filter(evt => evt._e >= now);

      setAppData({ attractions, events: normalizedEvents, leisure, restaurants, hotels, loading: false });
    }).catch(console.error);

    fetch('https://api.openweathermap.org/data/2.5/weather?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045')
      .then(res => res.json()).then(data => setWeather({ icon: data.weather[0].icon, temp: Math.round(data.main.temp) }))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = event => {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target)) setShowFavorites(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- AZONNALI FRISSÜLÉS JAVÍTÁSA (useMemo) ---
  // Ezek a listák most már garantáltan újra fognak számolódni, amint a 'favorites' tömb megváltozik.
  const favoriteAttractions = useMemo(() => appData.attractions.filter(item => isFavorite(item.id)), [appData.attractions, favorites]);
  const favoriteEvents = useMemo(() => appData.events.filter(item => isFavorite(item.id)), [appData.events, favorites]);
  const favoriteLeisure = useMemo(() => appData.leisure.filter(item => isFavorite(item.id)), [appData.leisure, favorites]);
  
  return (
    <div className="min-h-screen flex flex-col bg-beige-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="fixed inset-x-0 top-0 bg-beige-100/40 backdrop-blur-md border-b border-beige-200 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <img onClick={() => navigate('/')} src="/images/koeszeg_logo_nobg.png" alt="KőszegAPP logo" className="w-8 h-8 cursor-pointer" />
            <span onClick={() => navigate('/')} className="text-base sm:text-lg font-bold text-purple-700 cursor-pointer" >KőszegAPP</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowWeatherModal(true)} className="flex items-center space-x-1 text-gray-500 dark:text-white bg-beige-200/50 dark:bg-gray-700 backdrop-blur-sm px-2 py-1 rounded-full transition hover:scale-105">
              <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" className="w-5 h-5"/>
              <span className="text-sm">{weather.temp}°C</span>
            </button>
            
            {/* A KEDVENCEK GOMB AZ ÚJ, MENŐ DROPDOWN-T NYITJA MEG */}
            <div className="relative" ref={favoritesRef}>
              <button onClick={() => setShowFavorites(!showFavorites)} className="relative flex items-center px-2 py-1 rounded hover:bg-beige-200/50 dark:hover:bg-gray-700 transition" aria-label="Kedvencek megnyitása">
                <span className="text-xl text-rose-500">❤️</span>
                {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{favorites.length}</span>}
              </button>
              {showFavorites && <FavoritesDashboard attractions={favoriteAttractions} events={favoriteEvents} leisure={favoriteLeisure} onClose={() => setShowFavorites(false)} />}
            </div>
            
            <button onClick={toggleDark} className="px-2 py-1 rounded bg-beige-200/50 dark:bg-gray-700 text-sm transition">{dark ? '🌙' : '☀️'}</button>
          </div>
        </div>
      </header>

      <div className="h-16" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/attractions" element={<Attractions attractions={appData.attractions} loading={appData.loading} />} />
          <Route path="/attractions/:id" element={<AttractionDetail />} />
          <Route path="/events" element={<Events events={appData.events} loading={appData.loading} />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/gastronomy" element={<Gastronomy restaurants={appData.restaurants} loading={appData.loading} />} />
          <Route path="/gastronomy/:id" element={<RestaurantDetail />} />
          <Route path="/hotels" element={<Hotels hotels={appData.hotels} loading={appData.loading} />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/leisure" element={<Leisure leisure={appData.leisure} loading={appData.loading} />} />
          <Route path="/leisure/:id" element={<LeisureDetail />} />
          <Route path="/weather" element={<WeatherDetail />} />
          <Route path="/info" element={<Info />} />
          <Route path="/info/:id" element={<AboutDetail />} />
          <Route path="/adatvedelem" element={<Adatvedelem />} />
        </Routes>
      </main>

      {showWeatherModal && <WeatherModal onClose={() => setShowWeatherModal(false)} />}
      <Toaster position="bottom-center" />
      {/* ... a többi modal, footer, stb. változatlan ... */}
      {isHome && showProgramModal && ( <ProgramModal onClose={() => setShowProgramModal(false)} openDrawer={() => setShowOstromDrawer(true)} /> )}
      {showOstromDrawer && ( <OstromDrawerFullAnimated onClose={() => setShowOstromDrawer(false)} /> )}
      {isHome && !showProgramModal && ( <button onClick={() => setShowProgramModal(true)} className="w-12 h-12 fixed bottom-5 right-4 bg-purple-600 text-white rounded-full shadow-lg p-3 text-xl z-50 hover:bg-purple-700 transition" aria-label="Ostromprogramok megnyitása">📅</button>)}
      <footer className="mt-6 bg-beige-100/40 backdrop-blur-md text-center py-4">
        <p className="text-xs text-gray-600">© 2025 AS Software & Network Solutions Version: 1.1.5</p>
        <p className="text-xs text-gray-600">© Design: Hidalmasi Erik</p>
        <p className="text-xs text-gray-600">Email: <a href="mailto:koszegapp@gmail.com" className="underline">koszegapp@gmail.com</a></p>
        <p className="text-xs text-gray-600 mt-2"><Link to="/adatvedelem" className="underline hover:text-indigo-600">Adatkezelési tájékoztató</Link></p>
      </footer>
      <FloatingButtons />
    </div>
  );
}
