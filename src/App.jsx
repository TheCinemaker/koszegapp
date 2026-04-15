// src/App.jsx
import React, { useState, useEffect, useRef, useContext, useMemo, Suspense } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { DarkModeContext } from './contexts/DarkModeContext';
import { useFavorites } from './contexts/FavoritesContext.jsx';
import { fetchAttractions, fetchEvents, fetchLeisure, fetchRestaurants, fetchHotels, fetchParking } from './api';
import { AuthProvider } from './contexts/AuthContext';
import { parseISO, endOfDay } from 'date-fns';
import {
  IoCloudyNightOutline,
  IoMapOutline,
  IoHeartOutline,
  IoHeart,
  IoMoonOutline,
  IoSunnyOutline,
  IoHomeOutline
} from 'react-icons/io5';
import { triggerHaptic, HapticType } from './utils/haptics';
import AIAssistant from './components/AIAssistant';
import { AIOrchestratorProvider } from './contexts/AIOrchestratorContext.jsx';
import AISmartLayer from './components/AISmartLayer.jsx';
import AIDebugPanel from './components/AIDebugPanel.jsx';

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
import GameIntro from './pages/GameIntro';
import IntroExperience from './pages/IntroExperience';
import ProgramModal from './components/ProgramModal';
import FeatureShowcase from './pages/FeatureShowcase';

import FavoritesDashboard from './components/FavoritesDashboard.jsx';
import WeatherModal from './components/WeatherModal';
import FloatingNavbar from './components/FloatingNavbar';
import FloatingButtons from './components/FloatingButtons';
import SmartSpotlight from './components/SmartSpotlight';
import LiveCityMap from './components/LiveCityMap';
import ResidentCheckModal from './components/ResidentCheckModal';

import AnimatedRoutes from './components/AnimatedRoutes';
import SettingsMenu from './components/SettingsMenu';
import UserMessageRibbon from './components/UserMessageRibbon';


import { lazyWithRetry } from './utils/lazyWithRetry';

const Admin = lazyWithRetry(() => import('./pages/Admin.jsx'));
const MaintenancePage = lazyWithRetry(() => import('./pages/Maintenance.jsx'));
const ARView = lazyWithRetry(() => import('./pages/ARView.jsx'));
const CityPass = lazyWithRetry(() => import('./pages/CityPass.jsx'));

import { LocationProvider } from './contexts/LocationContext';
import { updateInterest } from './ai/BehaviorEngine';

// A LÉNYEG: A FŐ APP KOMPONENS CSAK A PROVIDERT ÁLLÍTJA BE
export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <MainAppContent />
      </LocationProvider>
    </AuthProvider>
  );
}

import AmbientBackground from './components/AmbientBackground';
import { fetchCurrentWeather, fetchUpcomingWeather } from './api/weather';

// ... (imports remain)

// AZ ÖSSZES TÖBBI LOGIKA ÉS JSX ÁTKÖLTÖZIK IDE, EZ A KOMPONENS MÁR A PROVIDEREN BELÜL VAN
function MainAppContent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggleDark } = useContext(DarkModeContext);
  const { favorites, isFavorite, pruneFavorites } = useFavorites();

  // 🧠 Page Tracking for Behavior Engine
  useEffect(() => {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;

      // If spent > 10s on specific pages, boost interest
      if (duration > 10000) {
        if (location.pathname.includes("food") || location.pathname.includes("gasztro")) {
          updateInterest("foodInterest", 2);
        }
        if (location.pathname.includes("events")) {
          updateInterest("eventInterest", 2);
        }
        if (location.pathname.includes("attractions")) {
          updateInterest("attractionInterest", 2);
        }
      }
    };
  }, [location.pathname]);

  const favoritesRef = useRef(null);

  const [weather, setWeather] = useState({ icon: '', temp: '--' });
  const [upcomingWeather, setUpcomingWeather] = useState([]);
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
  const [showResidentModal, setShowResidentModal] = useState(false);
  const isHome = location.pathname === '/';
  // Treat food-auth + QR Platform as "game mode" to hide the global header/UI
  const isInGameMode = location.pathname.startsWith('/game/') ||
    location.pathname.startsWith('/gem/') ||
    location.pathname === '/teaser' ||
    location.pathname === '/eats-auth' ||
    location.pathname.startsWith('/menu');  // QR Platform – teljesen izolált

  // --- MAINTENANCE MODE LOGIC ---
  const [maintenanceMode, setMaintenanceMode] = useState(false); // Devben nyitva, élesben karbantartás

  // 🧑‍💻 Developer Mode Flag
  const [devMode, setDevMode] = useState(
    localStorage.getItem("dev_mode") === "true"
  );
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  const handleSecretTap = () => {
    navigate('/');

    // 5 taps within 2 seconds toggles dev mode
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);

    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 2000);

    if (logoTapCount.current === 5) {
      const newState = !devMode;
      setDevMode(newState);
      localStorage.setItem("dev_mode", newState);
      if (newState) alert("👨‍💻 Developer Mode Activated");
      else alert("Developer Mode Deactivated");
      logoTapCount.current = 0;
    }
  };


  useEffect(() => {
    const handleDevModeChange = (e) => {
      setDevMode(e.detail);
    };
    window.addEventListener('dev-mode-change', handleDevModeChange);
    return () => window.removeEventListener('dev-mode-change', handleDevModeChange);
  }, []);
  useEffect(() => {
    // 1. Ellenőrizzük, hogy van-e bypass kulcs a localStorage-ban
    const isBypassed = localStorage.getItem('maintenance_bypass') === 'true';

    // 2. Ellenőrizzük az URL query paramétert (pl. ?dev=1234)
    const params = new URLSearchParams(location.search);
    if (params.get('dev') === 'start' || isBypassed) {
      if (!isBypassed) {
        localStorage.setItem('maintenance_bypass', 'true');
        window.history.replaceState({}, document.title, "/");
      }
      setMaintenanceMode(false);
    }
  }, [location.search]);
  // --- END MAINTENANCE LOGIC ---

  // Adatbetöltés + globális kedvenc-prune (egyszer)
  useEffect(() => {
    let isMounted = true;

    // --- BIZTONSÁGI IDŐZÍTŐ (Safety Timeout) ---
    // Ha 5 másodperc után még mindig töltenénk (pl. lógó hálózat), 
    // erőszakkal továbbengedjük a felhasználót.
    const safetyTimer = setTimeout(() => {
      if (isMounted && appData.loading) {
        console.warn('[AppInit] Safety timeout reached! Forcing loading: false to prevent blank screen.');
        setAppData(prev => ({ ...prev, loading: false }));
      }
    }, 5000);

    const fetchData = async () => {
      console.log('[AppInit] Starting data fetch sequence...');
      
      const endpoints = [
        { name: 'attractions', fetch: fetchAttractions },
        { name: 'events', fetch: fetchEvents },
        { name: 'leisure', fetch: fetchLeisure },
        { name: 'restaurants', fetch: fetchRestaurants },
        { name: 'hotels', fetch: fetchHotels },
        { name: 'parking', fetch: fetchParking }
      ];

      const results = await Promise.allSettled(endpoints.map(e => e.fetch()));
      
      if (!isMounted) return;
      clearTimeout(safetyTimer);

      const data = {};
      results.forEach((res, i) => {
        const key = endpoints[i].name;
        if (res.status === 'fulfilled') {
          data[key] = res.value;
        } else {
          console.error(`[AppInit] Failed to load ${key}:`, res.reason);
          data[key] = []; // Fallback to empty array
        }
      });

      // Normalize events
      const eventsData = data.events || [];
      const normalizedEvents = eventsData.map(evt => {
        if (!evt) return null;
        let s, e;
        const parseLocal = (dateStr) => {
          if (!dateStr) return null;
          let base = dateStr;
          if (base.length === 10) base += 'T00:00:00';
          base = base.replace(' ', 'T');
          try { return parseISO(base); } catch { return null; }
        };

        if (evt.startDate) {
          s = parseLocal(evt.startDate);
          e = evt.endDate ? parseLocal(evt.endDate) : s;
        } else if (evt.date?.includes('/')) {
          const p = evt.date.split('/');
          s = parseLocal(p[0]);
          e = parseLocal(p[1] || p[0]);
        } else {
          s = parseLocal(evt.date);
          e = evt.end_date ? parseLocal(evt.end_date) : s;
        }

        if (evt.time && s) {
          const timePart = evt.time.split('-')[0].trim();
          if (timePart.includes(':')) {
            const [h, m] = timePart.split(':');
            s.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
          }
        }
        return { ...evt, _s: s, _e: e };
      }).filter(Boolean);

      setAppData({
        attractions: data.attractions || [],
        events: normalizedEvents,
        leisure: data.leisure || [],
        restaurants: data.restaurants || [],
        hotels: data.hotels || [],
        parking: data.parking || [],
        loading: false
      });

      // Prune favorites
      const validIds = new Set([
        ...(data.attractions || []).map(a => String(a.id)),
        ...normalizedEvents.map(e => String(e.id)),
        ...(data.leisure || []).map(l => String(l.id)),
        ...(data.restaurants || []).map(r => String(r.id)),
        ...(data.hotels || []).map(h => String(h.id)),
        ...(data.parking || []).map(p => String(p.id))
      ]);
      pruneFavorites(validIds, () => true);
      
      console.log('[AppInit] Initialization complete.');
    };

    fetchData().catch(err => {
      console.error('[AppInit] Fatal initialization error:', err);
      if (isMounted) setAppData(prev => ({ ...prev, loading: false }));
    });

    // Weather fetches (independent)
    fetchCurrentWeather().then(setWeather).catch(console.error);
    fetchUpcomingWeather().then(setUpcomingWeather).catch(console.error);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
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

  // Loading állapot REMOVED to allow non-dependent pages (like Auth, Home) to load instantly.
  // Individual pages handle loading state via the 'loading' prop.
  // if (!appData || appData.loading) {
  //   return <div className="flex h-screen items-center justify-center bg-beige-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div></div>;
  // }

  // MAINTENANCE PAGE RENDER
  if (maintenanceMode) {
    return <Suspense fallback={<div>...</div>}><MaintenancePage /></Suspense>;
  }

  return (
    <>
      <AmbientBackground weather={weather} upcoming={upcomingWeather} dark={dark} />
      <div className="min-h-screen flex flex-col text-gray-900 dark:text-gray-100 font-sans transition-colors duration-500 relative">
        <AIOrchestratorProvider appData={appData} weather={weather}>
          {!isInGameMode && !location.pathname.startsWith('/eats') && !location.pathname.startsWith('/scanner') && (
            <>
              <header className="fixed top-2 left-2 right-2 sm:top-10 sm:left-4 sm:right-4 h-12 sm:h-16 z-50 transition-all duration-300 pointer-events-none flex justify-center">
                <div className="
                pointer-events-auto
                w-full max-w-5xl
                h-full
                flex items-center justify-between px-3 sm:px-6
                bg-white/40 dark:bg-[#1a1c2e]/40 
                backdrop-blur-[25px] 
                backdrop-saturate-[1.8]
                backdrop-brightness-[1.1]
                rounded-[2rem] 
                border border-white/50 dark:border-white/20 
                shadow-[0_10px_40px_rgba(0,0,0,0.1)]
                relative
                ">
                  {/* Subtle Gradient Accent (Top Lip) */}
                  <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70" />

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <div
                      onClick={handleSecretTap}
                      className="flex items-center cursor-pointer whitespace-nowrap select-none active:scale-95 transition-all duration-300 group"
                    >
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white items-center tracking-tight uppercase text-readability-shadow">
                        visit
                      </span>
                      <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-700 to-indigo-900 bg-clip-text text-transparent tracking-tighter uppercase text-readability-shadow">
                        Kőszeg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">

                    {/* Local Resident Info Button */}
                    <button
                      onClick={() => { setShowResidentModal(true); triggerHaptic(); }}
                      className="flex items-center gap-1.5 h-8 px-2.5 sm:h-10 sm:px-4 rounded-full
                                bg-white/20 dark:bg-black/20
                                backdrop-blur-md
                                text-gray-700 dark:text-gray-200
                                border border-white/20
                                hover:bg-white/40 dark:hover:bg-black/40
                                transition-all duration-300 hover:scale-105 active:scale-95"
                      aria-label="Lakossági infók"
                    >
                      <IoHomeOutline className="text-base sm:text-lg" />
                      <span className="text-[10px] sm:text-xs font-bold hidden md:inline">Helyi</span>
                    </button>

                    {/* Weather Button (Compact) */}
                    <button
                      onClick={() => { setShowWeatherModal(true); triggerHaptic(); }}
                      className="flex items-center gap-1.5 h-8 px-2.5 sm:h-10 sm:px-4 rounded-full
                                bg-white/20 dark:bg-black/20
                                backdrop-blur-md
                                text-gray-700 dark:text-gray-200
                                border border-white/20
                                hover:bg-white/40 dark:hover:bg-black/40
                                transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <IoCloudyNightOutline className="text-base sm:text-lg" />
                      <span className="text-[10px] sm:text-xs font-bold">{weather.temp}°</span>
                    </button>

                    {/* Map Button */}
                    <Link
                      to="/live-map"
                      onClick={() => triggerHaptic()}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full
                                bg-white/20 dark:bg-black/20
                                backdrop-blur-md
                                text-gray-700 dark:text-gray-200
                                border border-white/20
                                hover:bg-white/40 dark:hover:bg-black/40
                                transition-all duration-300 hover:scale-105 active:scale-95"
                      aria-label="Térkép"
                    >
                      <IoMapOutline className="text-lg sm:text-xl" />
                    </Link>

                    {/* Favorites Button */}
                    <div className="relative" ref={favoritesRef}>
                      <button
                        onClick={() => { setShowFavorites(!showFavorites); triggerHaptic(HapticType.MEDIUM); }}
                        className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full
                                bg-white/20 dark:bg-black/20
                                backdrop-blur-md
                                text-gray-700 dark:text-gray-200
                                border border-white/20
                                hover:bg-white/40 dark:hover:bg-black/40
                                transition-all duration-300 hover:scale-105 active:scale-95 group"
                        aria-label="Kedvencek megnyitása"
                      >
                        {favoritesCount > 0 ? (
                          <IoHeart className="text-lg sm:text-xl text-rose-500 drop-shadow-sm" />
                        ) : (
                          <IoHeartOutline className="text-lg sm:text-xl group-hover:text-rose-500 transition-colors" />
                        )}

                        {favoritesCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
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

                    {/* Settings Menu (Language + Dark Mode) */}
                    <SettingsMenu />
                  </div>
                </div>
              </header>
              <div className="h-16" />
            </>
          )}

          <main className={`flex-1 container mx-auto relative w-full h-full min-h-screen overflow-hidden ${isInGameMode ? '' : 'px-4 pt-4'}`}>
            {/* <Routes> (Moved to AnimatedRoutes) </Routes> */}
            <AnimatedRoutes appData={appData} weather={weather} />
          </main>

          {!isInGameMode && (
            <>
              <Toaster position="bottom-center" />
              {showWeatherModal && <WeatherModal onClose={() => setShowWeatherModal(false)} />}
              {showResidentModal && <ResidentCheckModal onClose={() => setShowResidentModal(false)} />}
              <UserMessageRibbon />

              {/* Footer moved to PageWrapper in AnimatedRoutes to support Transitions */}

              {!location.pathname.startsWith('/eats') && !location.pathname.startsWith('/scanner') && <FloatingNavbar />}
              {/* Hide SmartSpotlight on Dashboards, Auth & Pass Pages */}
              {!location.pathname.startsWith('/koszegieknek') &&
                !location.pathname.startsWith('/business') &&
                !location.pathname.startsWith('/auth') &&
                !location.pathname.startsWith('/eats') &&
                !location.pathname.startsWith('/pass') &&
                !location.pathname.startsWith('/scanner') && (
                  <SmartSpotlight appData={appData} />
                )}


              {/* TEMPORARILY DISABLED - Program Modal & Grape Icon */}
              {/* {isHome && showProgramModal && <ProgramModal onClose={() => setShowProgramModal(false)} />} */}

              {/* {isHome && !showProgramModal && (
                <button
                onClick={() => setShowProgramModal(true)}
                className="w-14 h-14 fixed bottom-20 right-4 bg-purple-700 text-white rounded-full flex items-center justify-center text-3xl shadow-lg hover:bg-purple-800 transition transform hover:scale-110 z-50"
                aria-label="Programfüzet megnyitása"
                >
                🍇
                </button>
            )} */}
            </>
          )}

          {/* AI Core System (Deactivated per user request) */}
          {/* <AISmartLayer />
          <AIAssistant /> */}

          {/* AI Debug Panel (STILL DEV ONLY) */}
          {devMode && <AIDebugPanel />}
        </AIOrchestratorProvider>
      </div>
    </>
  );
}
