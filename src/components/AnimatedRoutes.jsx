import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { lazyWithRetry } from '../utils/lazyWithRetry';

// Importing Pages
const Home = lazyWithRetry(() => import('../pages/Home'));
const Attractions = lazyWithRetry(() => import('../pages/Attractions'));
const AttractionDetail = lazyWithRetry(() => import('../pages/AttractionDetail'));
const Events = lazyWithRetry(() => import('../pages/Events'));
const EventDetail = lazyWithRetry(() => import('../pages/EventDetail'));
const Gastronomy = lazyWithRetry(() => import('../pages/Gastronomy'));
const RestaurantDetail = lazyWithRetry(() => import('../pages/RestaurantDetail'));
const Hotels = lazyWithRetry(() => import('../pages/Hotels'));
const HotelDetail = lazyWithRetry(() => import('../pages/HotelDetail'));
const Leisure = lazyWithRetry(() => import('../pages/Leisure'));
const LeisureDetail = lazyWithRetry(() => import('../pages/LeisureDetail'));
const Parking = lazyWithRetry(() => import('../pages/Parking'));
const ParkingDetail = lazyWithRetry(() => import('../pages/ParkingDetail'));
const ParkingMap = lazyWithRetry(() => import('../pages/ParkingMap'));
const Info = lazyWithRetry(() => import('../pages/Info'));
const AboutDetail = lazyWithRetry(() => import('../pages/AboutDetail'));
const WeatherDetail = lazyWithRetry(() => import('../pages/WeatherDetail'));
const Adatvedelem = lazyWithRetry(() => import('../pages/Adatvedelem'));
const GemDetail = lazyWithRetry(() => import('../pages/GemDetail'));
const MyGems = lazyWithRetry(() => import('../pages/MyGems'));
const GameIntro = lazyWithRetry(() => import('../pages/GameIntro'));
const IntroExperience = lazyWithRetry(() => import('../pages/IntroExperience'));
const SoftStart = lazyWithRetry(() => import('../pages/SoftStart'));
const ScanIntro = lazyWithRetry(() => import('../pages/ScanIntro'));
const ScanLive = lazyWithRetry(() => import('../pages/ScanLive'));
const LiveCityMap = lazyWithRetry(() => import('./LiveCityMap'));
const LocalDashboard = lazyWithRetry(() => import('../pages/LocalDashboard'));
const AuthPage = lazyWithRetry(() => import('../pages/AuthPage'));
const ProviderSetup = lazyWithRetry(() => import('../pages/ProviderSetup'));
const BusinessDashboard = lazyWithRetry(() => import('../pages/BusinessDashboard'));
const Admin = lazyWithRetry(() => import('../pages/Admin.jsx'));
const SecretRegister = lazyWithRetry(() => import('../pages/SecretRegister.jsx'));
const CityPass = lazyWithRetry(() => import('../pages/CityPass'));
const LegalNotice = lazyWithRetry(() => import('../pages/LegalNotice'));
const GameRules = lazyWithRetry(() => import('../pages/GameRules'));
const TeaserPage = lazyWithRetry(() => import('../pages/TeaserPage'));
const FoodOrderPage = lazyWithRetry(() => import('../pages/FoodOrderPage'));
const FoodAdmin = lazyWithRetry(() => import('../pages/FoodAdmin'));
const FoodAuthPage = lazyWithRetry(() => import('../pages/FoodAuthPage'));
const KoszegPassRegister = lazyWithRetry(() => import('../pages/KoszegPassRegister'));
const KoszegPassProfile = lazyWithRetry(() => import('../pages/KoszegPassProfile'));
const ScannerPage = lazyWithRetry(() => import('../pages/ScannerPage'));

// Ticket System Components
const TicketPurchase = lazyWithRetry(() => import('../pages/TicketSystem/TicketPurchase'));
const TicketSuccess = lazyWithRetry(() => import('../pages/TicketSystem/TicketSuccess'));
const TicketScanner = lazyWithRetry(() => import('../pages/TicketSystem/TicketScanner'));
const TicketAdmin = lazyWithRetry(() => import('../pages/TicketSystem/TicketAdmin'));

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
          <Route path="/game/intro-experience" element={<PageWrapper><IntroExperience /></PageWrapper>} />
          <Route path="/game/start" element={<PageWrapper><SoftStart /></PageWrapper>} />
          <Route path="/game/gem/:id" element={<PageWrapper><GemDetail /></PageWrapper>} />
          <Route path="/game/gem/:id" element={<PageWrapper><GemDetail /></PageWrapper>} />
          <Route path="/game/treasure-chest" element={<PageWrapper><MyGems /></PageWrapper>} />
          <Route path="/game/scan" element={<PageWrapper><ScanIntro /></PageWrapper>} />
          <Route path="/game/scan/live" element={<ScanLive />} />
          <Route path="/game/legal" element={<PageWrapper><LegalNotice /></PageWrapper>} />
          <Route path="/game/rules" element={<PageWrapper><GameRules /></PageWrapper>} />
          <Route path="/teaser" element={<TeaserPage />} />

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
          <Route path="/business" element={<PageWrapper><BusinessDashboard /></PageWrapper>} />
          <Route path="/secret-setup" element={<PageWrapper><SecretRegister /></PageWrapper>} />
          <Route path="/city-pass" element={<PageWrapper><CityPass /></PageWrapper>} />
          <Route path="/food" element={<PageWrapper showFooter={false}><FoodOrderPage /></PageWrapper>} />
          <Route path="/food-admin" element={<PageWrapper><FoodAdmin /></PageWrapper>} />
          <Route path="/food-auth" element={<PageWrapper showFooter={false}><FoodAuthPage /></PageWrapper>} />

          {/* KőszegPass Routes (Isolated Flow) */}
          <Route path="/pass" element={<PageWrapper showFooter={false}><KoszegPassProfile /></PageWrapper>} />
          <Route path="/pass/register" element={<PageWrapper showFooter={false}><KoszegPassRegister /></PageWrapper>} />
          <Route path="/pass/profile" element={<PageWrapper showFooter={false}><KoszegPassProfile /></PageWrapper>} />
          <Route path="/scanner" element={<PageWrapper showFooter={false}><ScannerPage /></PageWrapper>} />

          {/* Ticket System Routes (Isolated Module) */}
          <Route path="/tickets" element={<PageWrapper><TicketPurchase /></PageWrapper>} />
          <Route path="/tickets/success" element={<PageWrapper><TicketSuccess /></PageWrapper>} />
          <Route path="/tickets/scanner" element={<PageWrapper showFooter={false}><TicketScanner /></PageWrapper>} />
          <Route path="/tickets/admin" element={<PageWrapper><TicketAdmin /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

// Wrapper to apply animation
const PageWrapper = ({ children, showFooter = true }) => (
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
      {showFooter && <Footer />}
    </div>
  </motion.div>
);
