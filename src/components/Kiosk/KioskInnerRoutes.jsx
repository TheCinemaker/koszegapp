import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const KioskHome           = lazy(() => import('../../pages/Kiosk/KioskHome'));
const KioskAttractions    = lazy(() => import('../../pages/Kiosk/KioskAttractions'));
const KioskAttractionDetail = lazy(() => import('../../pages/Kiosk/KioskAttractionDetail'));
const KioskEvents         = lazy(() => import('../../pages/Kiosk/KioskEvents'));
const KioskEventDetail    = lazy(() => import('../../pages/Kiosk/KioskEventDetail'));
const KioskGastronomy     = lazy(() => import('../../pages/Kiosk/KioskGastronomy'));
const KioskVarszinhaz     = lazy(() => import('../../pages/Kiosk/KioskVarszinhaz'));
const KioskSelfie         = lazy(() => import('../../pages/Kiosk/KioskSelfie'));
const KioskServices       = lazy(() => import('../../pages/Kiosk/KioskServices'));
const KioskMap            = lazy(() => import('../../pages/Kiosk/KioskMap'));

const fadeSlide = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.16, ease: 'easeIn' } },
};

export default function KioskInnerRoutes({ appData, weather }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={fadeSlide}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%', minHeight: '100dvh' }}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/"               element={<KioskHome appData={appData} weather={weather} />} />
            <Route path="/attractions"    element={<KioskAttractions attractions={appData.attractions} />} />
            <Route path="/attractions/:id" element={<KioskAttractionDetail />} />
            <Route path="/events"         element={<KioskEvents events={appData.events} />} />
            <Route path="/events/:id"     element={<KioskEventDetail />} />
            <Route path="/gastronomy"     element={<KioskGastronomy restaurants={appData.restaurants} />} />
            <Route path="/varszinhaz"     element={<KioskVarszinhaz />} />
            <Route path="/selfie"         element={<KioskSelfie />} />
            <Route path="/services"       element={<KioskServices />} />
            <Route path="/map"            element={<KioskMap />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
