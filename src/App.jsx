// src/App.jsx
import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { DarkModeContext } from './contexts/DarkModeContext';
import { useFavorites } from './contexts/FavoritesContext.jsx';
import { fetchAttractions, fetchEvents, fetchLeisure, fetchRestaurants, fetchHotels, fetchParking } from './api';

import Home from './pages/Home';
import Attractions from './pages/Attractions';
import AttractionDetail from './pages/AttractionDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gastronomy from './pages/Gastronomy';
import RestaurantDetail from './pages/RestaurantDetail';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';
import Leisure from './pages/Leisure';
import LeisureDetail from './pages/LeisureDetail';
import Parking from './pages/Parking';
import ParkingDetail from './pages/ParkingDetail';
import ParkingMap from './pages/ParkingMap';
import Info from './pages/Info';
import AboutDetail from './pages/AboutDetail';
import WeatherDetail from './pages/WeatherDetail';
import Adatvedelem from './pages/Adatvedelem';
import GemDetail from './pages/GemDetail';
import MyGems from './pages/MyGems';
import GameIntro from './pages/GameIntro';
import ProgramModal from './components/ProgramModal';

import FavoritesDashboard from './components/FavoritesDashboard.jsx';
import WeatherModal from './components/WeatherModal';
import FloatingButtons from './components/FloatingButtons';
import OstromDrawerFullAnimated from './components/OstromDrawerFullAnimated';
import AnimatedWeeklyMenuDrawer from './components/AnimatedWeeklyMenuDrawer';

export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleDark } = useContext(DarkModeContext);
  const { favorites, isFavorite, pruneFavorites } = useFavorites();
  const favoritesRef = useRef(null);

  const [weather, setWeather] = useState({ icon: '', temp: '--' });
  const [appData, setAppData] = useState({
    attractions: [],
    events: [],
    leisure: [],
    restaurants: [],
    hotels: [],
    parking: [],
    loading: true
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(true);
  const [showOstromDrawer, setShowOstromDrawer] = useState(false);
  const isHome = location.pathname === '/';
  const isInGameMode = location.pathname.startsWith('/game/') || location.pathname.startsWith('/gem/');

  // Adatbetöltés + globális kedvenc-prune (egyszer)
  useEffect(() => {
    Promise.all([
      fetchAttractions(),
      fetchEvents(),
      fetchLeisure(),
      fetchRestaurants(),
      fetchHotels(),
      fetchParking()
    ])
      .then(([attractions, eventsData, leisure, restaurants, hotels, parking]) => {
        const now = new Date();

        const normalizedEvents = eventsData
          .map(evt => {
            let s, e;
            if (evt.startDate) {
              s = new Date(evt.startDate);
              e = evt.endDate ? new Date(evt.endDate) : s;
            } else if (evt.date?.includes('/')) {
              const p = evt.date.split('/');
              s = new Date(p[0]);
              e = new Date(p[1] || p[0]);
            } else {
              s = new Date(evt.date);
              e = s;
            }
            return { ...evt, _s: s, _e: e };
          })
          .filter(evt => evt._e >= now); // csak jövőbeliek

        setAppData({
          attractions,
          events: normalizedEvents,
          leisure,
          restaurants,
          hotels,
          parking,
          loading: false
        });

        // --- KEDVENCEK TAKARÍTÁSA (egyszer, globálisan) ---
        const validIds = new Set([
          ...attractions.map(a => String(a.id)),
          ...normalizedEvents.map(e => String(e.id)), // már jövőbeliek
          ...leisure.map(l => String(l.id)),
          ...restaurants.map(r => String(r.id)),
          ...hotels.map(h => String(h.id)),
          ...parking.map(p => String(p.id))
        ]);

        const isUpcomingById = () => true; // normalizedEvents már szűrt
        pruneFavorites(validIds, isUpcomingById);
      })
      .catch(console.error);

    // időjárás
    fetch('https://api.openweathermap.org/data/2.5/weather?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045')
      .then(res => res.json())
      .then(data => data && setWeather({ icon: data.weather[0].icon, temp: Math.round(data.main.temp) }))
      .catch(console.error);
  }, [pruneFavorites]);

  // kedvencek panel kinti kattintásra záródjon
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target)) {
        setShowFavorites(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // kedvencek szétválogatása (és opcionális rendezés)
  const favoriteAttractions = useMemo(
    () =>
      appData.attractions
        .filter(item => isFavorite(item.id))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'hu')),
    [appData.attractions, favorites, isFavorite]
  );

  const favoriteEvents = useMemo(
    () =>
      appData.events
        .filter(item => isFavorite(item.id))
        .slice()
        .sort((a, b) => a._s - b._s),
    [appData.events, favorites, isFavorite]
  );

  const favoriteLeisure = useMemo(
    () =>
      appData.leisure
        .filter(item => isFavorite(item.id))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'hu')),
    [appData.leisure, favorites, isFavorite]
  );

  const favoriteRestaurants = useMemo(
    () =>
      appData.restaurants
        .filter(item => isFavorite(item.id))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'hu')),
    [appData.restaurants, favorites, isFavorite]
  );

  const favoritesCount = useMemo(
    () =>
      favoriteAttractions.length +
      favoriteEvents.length +
      favoriteLeisure.length +
      favoriteRestaurants.length,
    [favoriteAttractions, favoriteEvents, favoriteLeisure, favoriteRestaurants]
  );

  return (
    <div className="min-h-screen flex flex-col bg-beige-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {!isInGameMode && (
        <>
          <header className="fixed inset-x-0 top-0 bg-beige-100/40 backdrop-blur-md border-b border-beige-200 z-50">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-2">
                <img
                  onClick={() => navigate('/')}
                  src="/images/koeszeg_logo_nobg.png"
                  alt="KőszegAPP logo"
                  className="w-8 h-8 cursor-pointer"
                />
                <span
                  onClick={() => navigate('/')}
                  className="text-base sm:text-lg font-bold text-purple-700 cursor-pointer"
                >
                  KőszegAPP
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowWeatherModal(true)}
                  className="flex items-center space-x-1 text-gray-500 dark:text-white bg-beige-200/50 dark:bg-gray-700 backdrop-blur-sm px-2 py-1 rounded-full transition hover:scale-105"
                >
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" className="w-5 h-5" />
                  <span className="text-sm">{weather.temp}°C</span>
                </button>

                <div className="relative" ref={favoritesRef}>
                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="relative flex items-center px-2 py-1 rounded hover:bg-beige-200/50 dark:hover:bg-gray-700 transition"
                    aria-label="Kedvencek megnyitása"
                  >
                    <span className="text-xl text-rose-500">❤️</span>
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {favoritesCount}
                      </span>
                    )}
                  </button>

                  {showFavorites && (
                    <FavoritesDashboard
                      attractions={favoriteAttractions}
                      events={favoriteEvents}
                      leisure={favoriteLeisure}
                      restaurants={favoriteRestaurants}
                      onClose={() => setShowFavorites(false)}
                    />
                  )}
                </div>

                <button
                  onClick={toggleDark}
                  className="px-2 py-1 rounded bg-beige-200/50 dark:bg-gray-700 text-sm transition"
                >
                  {dark ? '🌙' : '☀️'}
                </button>
              </div>
            </div>
          </header>
          <div className="h-16" />
        </>
      )}

      <main className={`flex-1 container mx-auto ${isInGameMode ? '' : 'px-4 py-6'}`}>
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

          <Route path="/parking" element={<Parking parking={appData.parking} loading={appData.loading} />} />
          <Route path="/parking/:id" element={<ParkingDetail />} />
          <Route path="/parking-map" element={<ParkingMap />} />

          <Route path="/weather" element={<WeatherDetail />} />
          <Route path="/info" element={<Info />} />
          <Route path="/info/:id" element={<AboutDetail />} />
          <Route path="/adatvedelem" element={<Adatvedelem />} />

          <Route path="/gem/:id" element={<GemDetail />} />
          <Route path="/my-gems" element={<MyGems />} />
          <Route path="/game/intro" element={<GameIntro />} />
          <Route path="/game/gem/:id" element={<GemDetail />} />
          <Route path="/game/treasure-chest" element={<MyGems />} />
        </Routes>
      </main>

      {!isInGameMode && (
        <>
          <Toaster position="bottom-center" />
          {showWeatherModal && <WeatherModal onClose={() => setShowWeatherModal(false)} />}

          <footer className="mt-6 bg-beige-100/40 backdrop-blur-md text-center py-4">
            <p className="text-xs text-gray-600">© 2025 AS Software & Network Solutions Version: 1.5.0</p>
            <p className="text-xs text-gray-600">© Design: Hidalmasi Erik</p>
            <p className="text-xs text-gray-600">
              Email: <a href="mailto:koszegapp@gmail.com" className="underline">koszegapp@gmail.com</a>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              <Link to="/adatvedelem" className="underline hover:text-indigo-600">Adatkezelési tájékoztató</Link>
            </p>
          </footer>

          <FloatingButtons />
          <OstromDrawerFullAnimated />
          <AnimatedWeeklyMenuDrawer />

          {isHome && showProgramModal && <ProgramModal onClose={() => setShowProgramModal(false)} />}

          {isHome && !showProgramModal && (
            <button
              onClick={() => setShowProgramModal(true)}
              className="w-14 h-14 fixed bottom-20 right-4 bg-purple-700 text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-purple-800 transition transform hover:scale-110 z-50"
              aria-label="Programfüzet megnyitása"
            >
              🍇
            </button>
          )}
        </>
      )}
    </div>
  );
}
