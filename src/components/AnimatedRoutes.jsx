import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Importing Pages (Same imports as App.jsx)
import Home from '../pages/Home';
import Attractions from '../pages/Attractions';
import AttractionDetail from '../pages/AttractionDetail';
import Events from '../pages/Events';
import EventDetail from '../pages/EventDetail';
import Gastronomy from '../pages/Gastronomy';
import RestaurantDetail from '../pages/RestaurantDetail';
import Hotels from '../pages/Hotels';
import HotelDetail from '../pages/HotelDetail';
import Leisure from '../pages/Leisure';
import LeisureDetail from '../pages/LeisureDetail';
import Parking from '../pages/Parking';
import ParkingDetail from '../pages/ParkingDetail';
import ParkingMap from '../pages/ParkingMap';
import Info from '../pages/Info';
import AboutDetail from '../pages/AboutDetail';
import WeatherDetail from '../pages/WeatherDetail';
import Adatvedelem from '../pages/Adatvedelem';
import GemDetail from '../pages/GemDetail';
import MyGems from '../pages/MyGems';
import GameIntro from '../pages/GameIntro';
import LiveCityMap from './LiveCityMap';
import Footer from './Footer';

const Admin = React.lazy(() => import('../pages/Admin.jsx'));

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
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageWrapper><Home /></PageWrapper>
        } />

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
            <Suspense fallback={<div className="p-6">Admin betöltése…</div>}>
              <Admin />
            </Suspense>
          </PageWrapper>
        } />

        <Route path="/weather" element={<PageWrapper><WeatherDetail /></PageWrapper>} />
        <Route path="/info" element={<PageWrapper><Info /></PageWrapper>} />
        <Route path="/info/:id" element={<PageWrapper><AboutDetail /></PageWrapper>} />
        <Route path="/adatvedelem" element={<PageWrapper><Adatvedelem /></PageWrapper>} />

        <Route path="/gem/:id" element={<PageWrapper><GemDetail /></PageWrapper>} />
        <Route path="/my-gems" element={<PageWrapper><MyGems /></PageWrapper>} />
        <Route path="/game/intro" element={<PageWrapper><GameIntro /></PageWrapper>} />
        <Route path="/game/gem/:id" element={<PageWrapper><GemDetail /></PageWrapper>} />
        <Route path="/game/treasure-chest" element={<PageWrapper><MyGems /></PageWrapper>} />

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
      </Routes>
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
