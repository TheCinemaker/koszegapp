import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Link,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DarkModeProvider, DarkModeContext } from './contexts/DarkModeContext';

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
import Parking from './pages/Parking';
import ParkingDetail from './pages/ParkingDetail';
import ParkingMap from './pages/ParkingMap';
import Leisure from './pages/Leisure';
import LeisureDetail from './pages/LeisureDetail';
import WeatherDetail from './pages/WeatherDetail';
import Adatvedelem from './pages/Adatvedelem';
import FloatingButtons from './components/FloatingButtons';
import WeeklyMenuDrawer from './components/AnimatedWeeklyMenuDrawer';

export default function App() {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState({ icon: '', temp: '--' });
  const navigate = useNavigate();
  const location = useLocation();
  const isSubPage = location.pathname !== '/';
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef(null);
  const { dark, toggleDark } = useContext(DarkModeContext);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(
      'https://api.openweathermap.org/data/2.5/weather?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045'
    )
      .then(res => res.json())
      .then(data =>
        setWeather({ icon: data.weather[0].icon, temp: Math.round(data.main.temp) })
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!showLangDropdown) return;
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangDropdown]);

  const menu = [
    { path: '/', icon: '🏠', label: t('menu.home') },
    { path: '/attractions', icon: '🏰', label: t('menu.attractions') },
    { path: '/events', icon: '🎉', label: t('menu.events') },
    { path: '/gastronomy', icon: '🍽️', label: t('menu.gastronomy') },
    { path: '/hotels', icon: '🏨', label: t('menu.hotels') },
    { path: '/parking', icon: '🅿️', label: t('menu.parking') },
    { path: '/info', icon: 'ℹ️', label: t('menu.info') }
  ];

  const flags = [
    { code: 'hu', emoji: '🇭🇺' },
    { code: 'en', emoji: '🇬🇧' },
    { code: 'de', emoji: '🇩🇪' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-beige-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">

      {/* --- KIHÚZHATÓ FOGANTYÚ --- */}
    <div
      className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50 bg-purple-600 text-white p-2 rounded-r-lg cursor-pointer select-none"
       onClick={() => setMenuOpen(o => !o)}
     >
      📋 Heti menük
    </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 bg-beige-100/40 backdrop-blur-md border-b border-beige-200 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <img
              onClick={isSubPage ? () => navigate('/') : undefined}
              src="/images/koeszeg_logo_nobg.png"
              alt="KőszegAPP logo"
              className="w-8 h-8"
            />
            <span
              onClick={isSubPage ? () => navigate('/') : undefined}
              className="text-base sm:text-lg font-bold text-purple-700"
              style={{ cursor: isSubPage ? 'pointer' : 'default', userSelect: 'none' }}
            >
              KőszegAPP
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {weather.temp !== '--' && (
              <div className="flex items-center space-x-1 text-gray-500 dark:text-white bg-beige-200/50 dark:bg-gray-700 backdrop-blur-sm px-2 py-1 rounded-full">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt="weather"
                  className="w-5 h-5"
                />
                <span className="text-sm">{weather.temp}°C</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setShowLangDropdown(o => !o)}
                  className="flex items-center px-2 py-1 rounded hover:bg-beige-200/50 dark:hover:bg-gray-700 transition"
                  aria-label="Nyelvválasztó"
                >
                  <span className="text-xl mr-1 text-gray-500 dark:text-white">
                    {flags.find(f => f.code === i18n.language)?.emoji || '🌐'}
                  </span>
                  <span className="uppercase text-xs font-bold hidden">
                    {i18n.language}
                  </span>
                  <svg
                    className="w-3 h-3 ml-1 text-gray-500 dark:text-white"
                    fill="none"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 shadow rounded z-40 min-w-[80px]">
                    {flags.map(f => (
                      <button
                        key={f.code}
                        disabled={f.code !== 'hu'}
                        onClick={() => {
                          if (f.code === 'hu') {
                            i18n.changeLanguage(f.code);
                            setShowLangDropdown(false);
                          }
                        }}
                        className={`w-full flex items-center px-3 py-2 text-sm transition ${
                          f.code === 'hu'
                            ? 'font-bold text-purple-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="mr-2">{f.emoji}</span>
                        <span className="uppercase">{f.code}</span>
                      </button>
                    ))}
                  </div>
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
        </div>
      </header>

      <div className="h-16" />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/attractions" element={<Attractions />} />
          <Route path="/attractions/:id" element={<AttractionDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/gastronomy" element={<Gastronomy />} />
          <Route path="/gastronomy/:id" element={<RestaurantDetail />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/parking" element={<Parking />} />
          <Route path="/parking/:id" element={<ParkingDetail />} />
          <Route path="/parking-map" element={<ParkingMap />} />
          <Route path="/leisure" element={<Leisure />} />
          <Route path="/leisure/:id" element={<LeisureDetail />} />
          <Route path="/weather" element={<WeatherDetail />} />
          <Route path="/info" element={<Info />} />
          <Route path="/info/:id" element={<AboutDetail />} />
          <Route path="/adatvedelem" element={<Adatvedelem />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 bg-white/60 backdrop-blur-md border-t border-beige-200 lg:hidden">
        <div className="flex justify-around py-2">
          {menu.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                (isActive ? 'text-purple-700' : 'text-gray-600') +
                ' flex flex-col items-center text-sm'
              }
            >
              <span className="text-xl">{item.icon}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <footer className="mt-6 bg-beige-100/40 backdrop-blur-md text-center py-4">
        <p className="text-xs text-gray-600">© 2025 AS Software & Network Solutions Version: 1.1.5</p>
        <p className="text-xs text-gray-600">© Design: Hidalmasi Erik</p>
        <p className="text-xs text-gray-600">
          Email:{' '}
          <a href="mailto:koszegapp@gmail.com" className="underline">
            koszegapp@gmail.com
          </a>
        </p>
        <p className="text-xs text-gray-600 mt-2">
          <Link
            to="/adatvedelem"
            className="underline hover:text-indigo-600 transition"
          >
            Adatkezelési tájékoztató
          </Link>
        </p>
        
      </footer>
      <FloatingButtons />
      {/* WeeklyMenuDrawer behúzható doboz */}
     <WeeklyMenuDrawer
      isOpen={menuOpen}
      onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}
