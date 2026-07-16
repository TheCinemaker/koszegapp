import React, { Suspense } from 'react';
import { Routes, Route, useLocation, useNavigationType, Navigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { lazyWithRetry } from '../utils/lazyWithRetry';
import KioskInnerRoutes from './Kiosk/KioskInnerRoutes';

// Importing Pages
const ProvidersPage = lazyWithRetry(() => import('../pages/ProvidersPage'));
const Home = lazyWithRetry(() => import('../pages/Home'));
const Attractions = lazyWithRetry(() => import('../pages/Attractions'));
const AttractionDetail = lazyWithRetry(() => import('../pages/AttractionDetail'));
const Events = lazyWithRetry(() => import('../pages/Events'));
const Varszinhaz = lazyWithRetry(() => import('../pages/Varszinhaz'));
const EventDetail = lazyWithRetry(() => import('../pages/EventDetail'));
const Gastronomy = lazyWithRetry(() => import('../pages/Gastronomy'));
const RestaurantDetail = lazyWithRetry(() => import('../pages/RestaurantDetail'));
const Hotels = lazyWithRetry(() => import('../pages/Hotels'));
const Booking = lazyWithRetry(() => import('../pages/Booking'));
const HotelDetail = lazyWithRetry(() => import('../pages/HotelDetail'));
const Leisure = lazyWithRetry(() => import('../pages/Leisure'));
const LeisureDetail = lazyWithRetry(() => import('../pages/LeisureDetail'));
const Parking = lazyWithRetry(() => import('../pages/Parking'));
const ParkingDetail = lazyWithRetry(() => import('../pages/ParkingDetail'));
const ParkingMap = lazyWithRetry(() => import('../pages/ParkingMap'));
const Info = lazyWithRetry(() => import('../pages/Info'));
const AboutDetail = lazyWithRetry(() => import('../pages/AboutDetail'));
const WeatherDashboard = lazyWithRetry(() => import('../pages/WeatherDashboard/WeatherDashboard'));
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
const OrderPrintView = lazyWithRetry(() => import('../pages/OrderPrintView'));
const PassLanding = lazyWithRetry(() => import('../pages/KoszegPass/PassLanding'));
const PassRegister = lazyWithRetry(() => import('../pages/KoszegPass/PassRegister'));
const PassPurchase = lazyWithRetry(() => import('../pages/KoszegPass/PassPurchase'));
const PassSuccess = lazyWithRetry(() => import('../pages/KoszegPass/PassSuccess'));
const PassProfile = lazyWithRetry(() => import('../pages/KoszegPass/PassProfile'));
const PassLookup = lazyWithRetry(() => import('../pages/KoszegPass/PassLookup'));
const PassScanner = lazyWithRetry(() => import('../pages/KoszegPass/PassScanner'));
const KioskPurchase = lazyWithRetry(() => import('../pages/KoszegPass/KioskPurchase'));
const Partners = lazyWithRetry(() => import('../pages/Partners'));
const SuperAdmin = lazyWithRetry(() => import('../pages/SuperAdmin'));
const TermsProvider = lazyWithRetry(() => import('../pages/TermsProvider'));
const FeatureShowcase = lazyWithRetry(() => import('../pages/FeatureShowcase'));
const NearbyDiscoveryDemo = lazyWithRetry(() => import('../pages/NearbyDiscoveryDemo'));
const EatsLanding = lazyWithRetry(() => import('../pages/EatsLanding'));
const Moments = lazyWithRetry(() => import('../pages/Moments'));
const OstromPage = lazyWithRetry(() => import('../pages/OstromPage'));
const KoszegChat = lazyWithRetry(() => import('../pages/KoszegChat'));

// QR Platform (Standalone – Digitális Pincér)
const QRMenu = lazyWithRetry(() => import('../pages/QRPlatform/QRMenu'));
const QRAdmin = lazyWithRetry(() => import('../pages/QRPlatform/QRAdmin'));


// Ticket System Components
const TicketPurchase = lazyWithRetry(() => import('../pages/TicketSystem/TicketPurchase'));
const TicketSuccess = lazyWithRetry(() => import('../pages/TicketSystem/TicketSuccess'));
const TicketScanner = lazyWithRetry(() => import('../pages/TicketSystem/TicketScanner'));
const TicketAdmin = lazyWithRetry(() => import('../pages/TicketSystem/TicketAdmin'));
const TicketPrint = lazyWithRetry(() => import('../pages/TicketSystem/TicketPrint'));

// Kiosk System Components (Fully Isolated)
const KioskIdleWrapper = lazyWithRetry(() => import('./Kiosk/KioskIdleWrapper'));

// VisitPointer Standalone Apps
const VisitPointerDisplay = lazyWithRetry(() => import('../pages/VisitPointer/Display'));
const VisitPointerPhone = lazyWithRetry(() => import('../pages/VisitPointer/Phone'));

// Footer is small and used everywhere, keep static to avoid flicker
import Footer from './Footer';

// iOS-style Slide Over Variants
// direction: 1 = forward (push), -1 = back (pop). Mirrors iOS native push/pop.
const DirectionContext = React.createContext(1);

const pageVariants = {
  initial: (dir) => ({
    x: dir >= 0 ? '100%' : '-28%',   // forward: enter full from right | back: enter as parallax from left
    scale: dir >= 0 ? 1 : 0.96,
    zIndex: dir >= 0 ? 2 : 1,        // the full-travel page rides on top
  }),
  in: {
    x: 0,
    scale: 1,
    zIndex: 1,
  },
  out: (dir) => ({
    x: dir >= 0 ? '-28%' : '100%',   // forward: exit as parallax to left | back: exit full to right
    scale: dir >= 0 ? 0.96 : 1,
    zIndex: dir >= 0 ? 1 : 2,
  }),
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 32,
  mass: 0.9,
};

export default function AnimatedRoutes({ appData, weather }) {
  const location = useLocation();
  const navType = useNavigationType();
  // Direction by route depth — robust even when "back" buttons use navigate('/path') (a PUSH).
  // Going to a shallower path (detail → list → home) reads as back, mirroring iOS pop.
  const prevDepthRef = React.useRef(null);
  const depth = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean).length;
  const direction =
    prevDepthRef.current !== null && depth < prevDepthRef.current ? -1
    : navType === 'POP' && prevDepthRef.current !== null && depth === prevDepthRef.current ? -1
    : 1;
  React.useEffect(() => { prevDepthRef.current = depth; }, [location.pathname]);

  return (
    <DirectionContext.Provider value={direction}>
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-medium text-sm animate-pulse">Betöltés...</p>
          </div>
        </div>
      }>
        <LayoutGroup>
        <AnimatePresence custom={direction} initial={false}>
          <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper morph><Home appData={appData} weather={weather} /></PageWrapper>} />

          <Route path="/attractions" element={<PageWrapper><Attractions attractions={appData.attractions} loading={appData.loading} /></PageWrapper>} />
          <Route path="/attractions/:id" element={<PageWrapper><AttractionDetail /></PageWrapper>} />

          <Route path="/events" element={<PageWrapper morph><Events events={appData.events} loading={appData.loading} /></PageWrapper>} />
          <Route path="/varszinhaz" element={<PageWrapper><Varszinhaz /></PageWrapper>} />
          <Route path="/events/:id" element={<PageWrapper><EventDetail /></PageWrapper>} />

          <Route path="/gastronomy" element={<PageWrapper><Gastronomy restaurants={appData.restaurants} loading={appData.loading} /></PageWrapper>} />
          <Route path="/gastronomy/:id" element={<PageWrapper><RestaurantDetail /></PageWrapper>} />

          <Route path="/hotels" element={<PageWrapper><Hotels hotels={appData.hotels} loading={appData.loading} /></PageWrapper>} />
          <Route path="/hotels/:id" element={<PageWrapper><HotelDetail /></PageWrapper>} />
          <Route path="/booking" element={<PageWrapper><Booking /></PageWrapper>} />

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

          <Route path="/superadmin" element={<PageWrapper showFooter={false}><SuperAdmin /></PageWrapper>} />

          <Route path="/weather" element={<PageWrapper><WeatherDashboard /></PageWrapper>} />
          <Route path="/info" element={<PageWrapper><Info /></PageWrapper>} />
          <Route path="/info/:id" element={<PageWrapper><AboutDetail /></PageWrapper>} />
          <Route path="/adatvedelem" element={<PageWrapper><Adatvedelem /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutDetail /></PageWrapper>} />
          <Route path="/partners" element={<PageWrapper><Partners /></PageWrapper>} />
          <Route path="/terms-provider" element={<PageWrapper><TermsProvider /></PageWrapper>} />
          <Route path="/showcase" element={<PageWrapper showFooter={false}><FeatureShowcase /></PageWrapper>} />


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
          <Route path="/idopontfoglalas" element={<PageWrapper><ProvidersPage /></PageWrapper>} />

          <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
          <Route path="/provider-setup" element={<PageWrapper><ProviderSetup /></PageWrapper>} />
          <Route path="/business" element={<PageWrapper><BusinessDashboard /></PageWrapper>} />
          <Route path="/secret-setup" element={<PageWrapper><SecretRegister /></PageWrapper>} />
          <Route path="/city-pass" element={<PageWrapper><CityPass /></PageWrapper>} />
          <Route path="/eats" element={<PageWrapper showFooter={false}><FoodOrderPage appData={appData} /></PageWrapper>} />
          <Route path="/eats-admin" element={<PageWrapper><FoodAdmin /></PageWrapper>} />
          <Route path="/eats-auth" element={<PageWrapper showFooter={false}><FoodAuthPage /></PageWrapper>} />
          <Route path="/eats/print/:orderId" element={<OrderPrintView />} />

          {/* Legacy Redirects */}
          <Route path="/food" element={<Navigate to="/eats" replace />} />
          <Route path="/food-admin" element={<Navigate to="/eats-admin" replace />} />
          <Route path="/food-auth" element={<Navigate to="/eats-auth" replace />} />

          {/* KőszegPass Routes (Isolated Flow) */}
          <Route path="/pass" element={<PageWrapper showFooter={false}><PassLanding /></PageWrapper>} />
          <Route path="/pass/register" element={<PageWrapper showFooter={false}><PassRegister /></PageWrapper>} />
          <Route path="/pass/buy" element={<PageWrapper showFooter={false}><PassPurchase /></PageWrapper>} />
          <Route path="/pass/success" element={<PageWrapper showFooter={false}><PassSuccess /></PageWrapper>} />
          <Route path="/pass/profile" element={<PageWrapper showFooter={false}><PassProfile /></PageWrapper>} />
          <Route path="/pass/megkeresem" element={<PageWrapper showFooter={false}><PassLookup /></PageWrapper>} />
          <Route path="/pass/scanner" element={<PageWrapper showFooter={false}><PassScanner /></PageWrapper>} />
          <Route path="/buy-pass" element={<PageWrapper showFooter={false}><KioskPurchase /></PageWrapper>} />
          <Route path="/p/:slug" element={<PageWrapper showFooter={false}><PassProfile /></PageWrapper>} />

          {/* Ticket System Routes (Isolated Module) */}
          <Route path="/tickets" element={<PageWrapper><TicketPurchase /></PageWrapper>} />
          <Route path="/tickets/success" element={<PageWrapper><TicketSuccess /></PageWrapper>} />
          <Route path="/ostrom" element={<PageWrapper><OstromPage /></PageWrapper>} />
          <Route path="/tickets/scanner" element={<PageWrapper showFooter={false}><TicketScanner /></PageWrapper>} />
          <Route path="/tickets/admin" element={<PageWrapper><TicketAdmin /></PageWrapper>} />
          <Route path="/tickets/print/:ticketId" element={<PageWrapper showFooter={false}><TicketPrint /></PageWrapper>} />

          {/* Redesign Preview (Temporary) */}
          <Route path="/nearby-demo" element={<PageWrapper><NearbyDiscoveryDemo appData={appData} weather={weather} /></PageWrapper>} />

          {/* New Eats Landing */}
          <Route path="/eats-landing" element={<EatsLanding />} />

          {/* KőszegAI – szituációs chatbot */}
          <Route path="/koszegai" element={<PageWrapper showFooter={false}><KoszegChat /></PageWrapper>} />

          {/* Ephemeral Moments Feed */}
          <Route path="/moments" element={<PageWrapper><Moments /></PageWrapper>} />

          {/* VisitPointer Standalone Apps */}
          <Route path="/remote" element={<VisitPointerPhone />} />
          <Route path="/pointer-display" element={<VisitPointerDisplay appData={appData} />} />

          {/* ═══════════════════════════════════════════════ */}
          {/* Kioszk Felület – Városi Terminál (Teljesen Izolált) */}
          {/* ═══════════════════════════════════════════════ */}
          <Route path="/kiosk/*" element={
            <KioskIdleWrapper>
              <KioskInnerRoutes appData={appData} weather={weather} />
            </KioskIdleWrapper>
          } />

          {/* ═══════════════════════════════════════════════ */}
          {/* QR Platform – Digitális Pincér                 */}
          {/* Teljesen izolált, saját UI, saját adatbázis  */}
          {/* ═══════════════════════════════════════════════ */}
          <Route path="/menu/:restaurantId/:tableId" element={<QRMenu />} />
          <Route path="/menu-admin" element={<QRAdmin />} />

          </Routes>
        </AnimatePresence>
        </LayoutGroup>
      </Suspense>
    </DirectionContext.Provider>
  );
}

// Wrapper to apply animation
// Opacity-only variants for routes that own a shared-element morph — the slide would fight the morph.
const morphVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const PageWrapper = ({ children, showFooter = true, morph = false }) => {
  const direction = React.useContext(DirectionContext);
  return (
  <motion.div
    custom={direction}
    initial="initial"
    animate="in"
    exit="out"
    variants={morph ? morphVariants : pageVariants}
    transition={morph ? { duration: 0.25 } : pageTransition}
    className="w-full bg-gray-50 dark:bg-zinc-900"
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
};
