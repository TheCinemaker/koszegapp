import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import {
  IoCalendarOutline,
  IoMapOutline,
  IoRestaurantOutline,
  IoCloudyNightOutline,
  IoWalkOutline,
  IoBedOutline,
  IoCarSportOutline,
  IoInformationCircleOutline,
  IoDiamondOutline,
  IoChevronForward,
  IoQrCode,
  IoTicketOutline,
  IoStarOutline,
  IoLockClosed,
  IoShieldOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeUp, SpringUp } from '../components/AppleMotion';

import { useTranslation } from 'react-i18next'; // Added import

import LiveHero from '../components/LiveHero';
import NearbyDiscoveryCard from '../components/NearbyDiscoveryCard';
// import MomentsStrip from '../components/MomentsStrip';
import SEO from '../components/SEO';

// Link with framer-motion spring physics on hover/press — felt every interaction, mouse or touch.
const MotionLink = motion(Link);

export default function Home({ appData, weather }) {
  const { t } = useTranslation('home'); // Load 'home' namespace
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    const today = new Date();
    // 2026. június 20. (month is 0-indexed, so June is 5)
    const isJune20_2026 = today.getFullYear() === 2026 && today.getMonth() === 5 && today.getDate() === 20;

    if (isJune20_2026) {
      const isShown = sessionStorage.getItem('museumNightPromoShown');
      if (!isShown) {
        const timer = setTimeout(() => {
          setShowPromo(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const closePromo = () => {
    setShowPromo(false);
    sessionStorage.setItem('museumNightPromoShown', 'true');
  };

  const sections = [
    { to: '/ostrom', label: 'Ostromnapok', desc: '2026.08.07. - 08.09. | Kőszeg kiemelt rendezvénye', icon: IoShieldOutline, featured: true, bgImage: '/images/ostrom_2026/ostromhero.png', span: 'col-span-2 sm:col-span-2', delay: 0.03 },
    { to: '/pass', label: 'KőszegPass', desc: 'A Te személyes kedvezménykártyád', icon: IoQrCode, featured: true, span: 'col-span-2 sm:col-span-2', delay: 0.05 },
    // { to: '/tickets', label: t('sections.tickets.label') || 'Jegyek', desc: t('sections.tickets.desc') || 'Események és foglalás', icon: IoTicketOutline, featured: true, span: 'col-span-1 sm:col-span-1', delay: 0.08 },
    { to: '/varszinhaz', label: 'Várszínház', desc: 'Nyári színházi szezon', icon: IoStarOutline, featured: true, span: 'col-span-1 sm:col-span-1', delay: 0.10 },
    { to: '/events', label: t('sections.events.label'), desc: t('sections.events.desc'), icon: IoCalendarOutline, morphId: 'morph-events', span: 'col-span-2 sm:col-span-2', delay: 0.12 },
    { to: '/attractions', label: t('sections.attractions.label'), desc: t('sections.attractions.desc'), icon: IoMapOutline, span: 'col-span-1 sm:col-span-1', delay: 0.14 },
    { to: '/gastronomy', label: t('sections.food.label'), desc: t('sections.food.desc'), icon: IoRestaurantOutline, span: 'col-span-1 sm:col-span-2', delay: 0.16 },
    // { to: '/booking', label: t('sections.booking.label'), desc: t('sections.booking.desc'), icon: IoBedOutline, span: 'col-span-1 sm:col-span-1', delay: 0.18 },
    { to: '/hotels', label: t('sections.hotels.label'), desc: t('sections.hotels.desc'), icon: IoBedOutline, span: 'col-span-1 sm:col-span-1', delay: 0.20 },
    { to: '/leisure', label: t('sections.leisure.label'), desc: t('sections.leisure.desc'), icon: IoWalkOutline, span: 'col-span-1 sm:col-span-1', delay: 0.24 },
    { to: '/parking', label: t('sections.parking.label'), desc: t('sections.parking.desc'), icon: IoCarSportOutline, span: 'col-span-1 sm:col-span-1', delay: 0.26 },
    { to: '/info', label: t('sections.info.label'), desc: t('sections.info.desc'), icon: IoInformationCircleOutline, span: 'col-span-1 sm:col-span-1', delay: 0.28 },
  ];

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 overflow-x-hidden selection:bg-indigo-500 selection:text-white relative">
        <SEO
            title="Fedezd fel Kőszeg csodáit"
            description="Kőszeg digitális szuperappja: élő térkép, jegyvásárlás, ételrendelés, AR kalandjáték, KőszegReels és időpontfoglaló — mindezt egyetlen helyen, ingyen."
            url="/"
            keywords="Kőszeg, VisitKőszeg, Kőszeg app, Kőszeg program, Kőszeg látnivalók"
        />

      {/* GLOBAL BACKGROUND NOISE (Subtle) */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* --- LIVE HERO SECTION --- */}
        <LiveHero appData={appData} weather={weather} />

        {/* --- HEADER SECTION --- */}
        <div className="mb-8 relative z-50">
          <FadeUp delay={0.2}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <SearchBar />
            </div>
          </FadeUp>
        </div>

        {/* NEARBY DISCOVERY (REAL-TIME HUMANISED) */}
        <FadeUp delay={0.3}>
          <NearbyDiscoveryCard appData={appData} />
        </FadeUp>

        {/* EPHEMERAL CITY MOMENTS */}
        {/* <MomentsStrip /> */}


        {/* --- ULTRA-COMPACT BENTO GRID --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
          {sections.map((sec) => (
            <SpringUp key={sec.label} delay={sec.delay * 0.5 + 0.1} className={sec.span}>
              <Link
                to={sec.external || sec.comingSoon ? '#' : sec.to}
                onClick={(e) => {
                  if (sec.comingSoon) {
                    e.preventDefault();
                    toast(t('comingSoonMessage'), { icon: '🚧' });
                  } else if (sec.external) {
                    e.preventDefault();
                    window.open(sec.to, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="block h-full cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17, mass: 0.8 }}
                  className={`
                        relative h-full rounded-[1.5rem] p-5 lg:p-6
                        ${sec.morphId
                          ? 'border border-white/50 dark:border-white/10'
                          : sec.label === 'KőszegPass'
                            ? 'bg-gradient-to-br from-[#0c234b] via-[#16366f] to-[#0c234b] border border-[#c8af64]/40 text-white shadow-[0_4px_25px_rgba(200,175,100,0.15)]'
                            : sec.featured
                              ? 'bg-[#123a57] dark:bg-[#0e2c44] border border-white/10 text-white'
                              : 'bg-white/70 dark:bg-white/5 backdrop-blur-[20px] backdrop-saturate-[1.6] border border-white/60 dark:border-white/10'}
                        shadow-sm hover:shadow-lg
                        flex flex-col justify-between group
                        ${sec.morphId ? 'overflow-visible' : 'overflow-hidden'}
                        ${sec.comingSoon ? 'opacity-80 grayscale-[0.5]' : ''}
                    `}
                >
                  {sec.bgImage && (
                    <div className="absolute top-0 right-0 bottom-0 w-[55%] pointer-events-none overflow-hidden select-none z-0 rounded-r-[1.5rem]">
                      <img 
                        src={sec.bgImage} 
                        alt="" 
                        className="h-full w-auto object-cover object-right ml-auto" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#123a57] via-[#123a57]/45 to-transparent dark:from-[#0e2c44] dark:via-[#0e2c44]/45" />
                    </div>
                  )}
                  {/* Shared-element morph surface — flies up to become the Events page header */}
                  {sec.morphId && (
                    <motion.div
                      layoutId={sec.morphId}
                      transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
                      className="absolute inset-0 rounded-[1.5rem] bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl -z-0"
                    />
                  )}

                  {/* Icon — monochrome on neutral material; for the morph card it flies into the page hero */}
                  <motion.div
                    layoutId={sec.morphId ? `${sec.morphId}-icon` : undefined}
                    transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
                    className={`
                        relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3
                        transition-colors duration-300 ease-out group-hover:scale-105
                        ${sec.label === 'KőszegPass'
                          ? 'bg-[#c8af64]/20 text-[#e4cc7d]'
                          : sec.featured
                            ? 'bg-white/15 text-white'
                            : 'bg-gray-900/[0.06] dark:bg-white/10 text-gray-800 dark:text-gray-100 group-hover:text-[#0a97be]'}
                    `}>
                    <sec.icon />
                  </motion.div>

                  {/* Content (Delayed Reveal) */}
                  <div className={`relative z-10 ${sec.bgImage ? 'max-w-[55%] sm:max-w-[65%]' : ''}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <motion.h3
                        layoutId={sec.morphId ? `${sec.morphId}-title` : undefined}
                        transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
                        className={`text-xl font-bold leading-none tracking-tight ${sec.featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {sec.label}
                      </motion.h3>
                      {!sec.comingSoon && (
                        <IoChevronForward className={`opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-sm ${sec.featured ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`} />
                      )}
                    </div>
                    {/* Delayed Fade-in for slogan */}
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: sec.featured ? 0.8 : 0.9, y: 0 }}
                      transition={{ delay: sec.delay * 0.5 + 0.3, duration: 0.6, ease: "easeOut" }}
                      className={`text-xs font-semibold leading-tight transition-colors duration-500 ${sec.featured ? 'text-white/80' : 'text-gray-500 dark:text-gray-400 group-hover:text-[#0a97be]'}`}
                    >
                      {sec.desc}
                    </motion.p>
                  </div>

                  {/* Coming Soon Lock Badge */}
                  {sec.comingSoon && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 dark:bg-black/50 backdrop-blur-[10px] rounded-[1.5rem]">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/70 dark:bg-white/15 rounded-full">
                        <IoLockClosed className="text-white text-sm" />
                        <span className="text-white text-xs font-semibold tracking-wide">Hamarosan</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </Link>
            </SpringUp>
          ))}
        </div>
      </div>

      {/* Múzeumok Éjszakája Promo Modal */}
      <AnimatePresence>
        {showPromo && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePromo}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
            >
              {/* Header Banner - Sleek Dark Gradient representing Night */}
              <div className="relative h-48 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 p-6 flex flex-col justify-end overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
                
                {/* Close Button */}
                <button
                  onClick={closePromo}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90 text-xl font-light focus:outline-none"
                  aria-label="Bezárás"
                >
                  &times;
                </button>

                {/* Badge & Title */}
                <div className="relative z-10 flex flex-col items-start">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                    Rendkívüli program
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2 leading-none tracking-tight">
                    Múzeumok Éjszakája
                  </h2>
                  <p className="text-xs font-semibold text-[#0bc9f8] mt-1">
                    2026. június 20. szombat
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Ma van a <span className="text-[#0a97be] dark:text-[#0bc9f8] font-bold">Múzeumok Éjszakája</span>! 
                  Válogass a lehetőségek közül és érezd jól magad a Kőszegi Városi Múzeum, Könyvtár és Levéltár programjain, 
                  vagy fedezd fel a Posta Múzeumot és a Boráriumot aperitivo üzemmódban!
                </p>
                
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 mb-6">
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    🏛️ 5 helyszínen, több mint 20 izgalmas programmal várunk!
                  </p>
                </div>

                {/* Action Button */}
                <Link
                  to="/events"
                  onClick={closePromo}
                  className="flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 text-center"
                >
                  Mutasd a programokat!
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
