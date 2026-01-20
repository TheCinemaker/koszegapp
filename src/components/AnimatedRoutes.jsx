import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Importing Pages (Same imports as App.jsx)
// Lazy Load Pages for Performance
const Home = React.lazy(() => import('../pages/Home'));
const Attractions = React.lazy(() => import('../pages/Attractions'));
const AttractionDetail = React.lazy(() => import('../pages/AttractionDetail'));
const Events = React.lazy(() => import('../pages/Events'));
const EventDetail = React.lazy(() => import('../pages/EventDetail'));
const Gastronomy = React.lazy(() => import('../pages/Gastronomy'));
const RestaurantDetail = React.lazy(() => import('../pages/RestaurantDetail'));
const Hotels = React.lazy(() => import('../pages/Hotels'));
const HotelDetail = React.lazy(() => import('../pages/HotelDetail'));
const Leisure = React.lazy(() => import('../pages/Leisure'));
const LeisureDetail = React.lazy(() => import('../pages/LeisureDetail'));
const Parking = React.lazy(() => import('../pages/Parking'));
const ParkingDetail = React.lazy(() => import('../pages/ParkingDetail'));
const ParkingMap = React.lazy(() => import('../pages/ParkingMap'));
const Info = React.lazy(() => import('../pages/Info'));
const AboutDetail = React.lazy(() => import('../pages/AboutDetail'));
const WeatherDetail = React.lazy(() => import('../pages/WeatherDetail'));
const Adatvedelem = React.lazy(() => import('../pages/Adatvedelem'));
const GemDetail = React.lazy(() => import('../pages/GemDetail'));
const MyGems = React.lazy(() => import('../pages/MyGems'));
const GameIntro = React.lazy(() => import('../pages/GameIntro'));
const LiveCityMap = React.lazy(() => import('./LiveCityMap'));
const LocalDashboard = React.lazy(() => import('../pages/LocalDashboard'));
const AuthPage = React.lazy(() => import('../pages/AuthPage'));
const ProviderSetup = React.lazy(() => import('../pages/ProviderSetup'));
const BusinessDashboard = React.lazy(() => import('../pages/BusinessDashboard'));
const Admin = React.lazy(() => import('../pages/Admin.jsx'));
const SecretRegister = React.lazy(() => import('../pages/SecretRegister.jsx'));
const CityPass = React.lazy(() => import('../pages/CityPass'));
// Footer is small and used everywhere, keep static to avoid flicker
import Footer from './Footer';

// iOS-style Slide Over Variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: '20vw',  // Slide in from right (reduced distance for smoother feel)
    scale: 0.99 // Slight depth effect
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: '-5vw',  // Slight parallax exit to left
    scale: 0.99
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1], // iOS ease curve
  duration: 0.35
};

export default function AnimatedRoutes({ appData }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-medium text-sm animate-pulse">Betöltés...</p>
          </div>
        </div>
      }>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />

          <Route path="/attractions" element={<PageWrapper><Attractions attractions={appData.attractions} loading={appData.loading} /></PageWrapper>} />
          <Route path="/attractions/:id" element={<PageWrapper><AttractionDetail /></PageWrapper>} />

          <Route path="/events" element={<PageWrapper><Events events={appData.events} loading={appData.loading} /></PageWrapper>} />
          <Route path="/events/:id" element={<PageWrapper><EventDetail /></PageWrapper>} />

          <Route path="/gastronomy" element={<PageWrapper><Gastronomy restaurants={appData.restaurants} loading={appData.loading} /></PageWrapper>} />
          <Route path="/gastronomy/:id" element={<PageWrapper><RestaurantDetail /></PageWrapper>} />

          <Route path="/hotels" element={<PageWrapper><Hotels hotels={appData.hotels} loading={appData.loading} /></PageWrapper>} />
          <Route path="/hotels/:id" element={<PageWrapper><HotelDetail /></PageWrapper>} />

          <Route path="/leisure" element={<PageWrapper><Leisure leisure={appData.leisure} loading={appData.loading} /></PageWrapper>} />
          <Route path="/leisure/:id" element={<PageWrapper><LeisureDetail /></PageWrapper>} />

          <Route path="/parking" element={<PageWrapper><Parking parking={appData.parking} loading={appData.loading} /></PageWrapper>} />
          <Route path="/parking/:id" element={<PageWrapper><ParkingDetail /></PageWrapper>} />
          <Route path="/parking-map" element={<PageWrapper><ParkingMap /></PageWrapper>} />


          <Route path="/admin/*" element={
            <PageWrapper>
              <Admin />
            </PageWrapper>
          } />

          <Route path="/weather" element={<PageWrapper><WeatherDetail /></PageWrapper>} />
          <Route path="/info" element={<PageWrapper><Info /></PageWrapper>} />
          <Route path="/info/:id" element={<PageWrapper><AboutDetail /></PageWrapper>} />
          <Route path="/adatvedelem" element={<PageWrapper><Adatvedelem /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutDetail /></PageWrapper>} />

          <Route path="/gem/:id" element={<PageWrapper><GemDetail /></PageWrapper>} />
          <Route path="/my-gems" element={<PageWrapper><MyGems /></PageWrapper>} />
          <Route path="/game/intro" element={<PageWrapper><GameIntro /></PageWrapper>} />
          <Route path="/game/gem/:id" element={<PageWrapper><GemDetail /></PageWrapper>} />
          <Route path="/game/treasure-chest" element={<PageWrapper><MyGems /></PageWrapper>} />

          {/* <Route path="/kronoszkop" element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] pointer-events-none"
            >
              
            </motion.div>
          } /> */}

          <Route path="/live-map" element={
            <PageWrapper>
              <LiveCityMap
                events={appData.events}
                attractions={appData.attractions}
                leisure={appData.leisure}
                restaurants={appData.restaurants}
              />
            </PageWrapper>
          }
          />
          <Route path="/koszegieknek" element={<PageWrapper><LocalDashboard /></PageWrapper>} />
          <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
          <Route path="/provider-setup" element={<PageWrapper><ProviderSetup /></PageWrapper>} />
          <Route path="/provider-setup" element={<PageWrapper><ProviderSetup /></PageWrapper>} />
          <Route path="/business" element={<PageWrapper><BusinessDashboard /></PageWrapper>} />
          <Route path="/business-dashboard" element={<PageWrapper><BusinessDashboard /></PageWrapper>} />
          <Route path="/secret-setup" element={<PageWrapper><SecretRegister /></PageWrapper>} />
          <Route path="/city-pass" element={<PageWrapper><CityPass /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

// Wrapper to apply animation
const PageWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className="w-full"
    style={{
      position: 'absolute', // Critical for preventing layout jumps (flicker)
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      overflowY: 'auto', // Enable scrolling within the page
      overflowX: 'hidden'
    }}
  >
    <div className="pt-4 min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  </motion.div>
);
