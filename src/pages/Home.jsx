import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import {
  IoCalendarOutline,
  IoMapOutline,
  IoRestaurantOutline,
  IoWalkOutline,
  IoBedOutline,
  IoCarSportOutline,
  IoInformationCircleOutline,
  IoChevronForward,
  IoStarOutline,
  IoLockClosed,
  IoShieldOutline
} from 'react-icons/io5';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion
} from 'framer-motion';
import { FadeUp, SpringUp } from '../components/AppleMotion';
import { useTranslation } from 'react-i18next';

import LiveHero from '../components/LiveHero';
import NearbyDiscoveryCard from '../components/NearbyDiscoveryCard';
import PromoModal from '../components/PromoModal';
import SEO from '../components/SEO';

const MotionLink = motion(Link);

// ---------------------------------------------------------------------------
// OSTROMNAPOK IDŐABLAK — a countdown/élő badge ehhez igazodik.
// ---------------------------------------------------------------------------
const OSTROM_START = new Date(2026, 7, 7); // 2026. aug. 7.
const OSTROM_END = new Date(2026, 7, 9, 23, 59, 59); // 2026. aug. 9.

function getOstromBadge() {
  const now = new Date();
  if (now >= OSTROM_START && now <= OSTROM_END) {
    return { type: 'live', text: 'Most zajlik' };
  }
  if (now < OSTROM_START) {
    const days = Math.ceil((OSTROM_START - now) / (1000 * 60 * 60 * 24));
    if (days <= 30) {
      return { type: 'countdown', text: days === 1 ? 'Holnap kezdődik' : `${days} nap múlva` };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// ÉLŐ ADAT BADGE-EK az appData-ból.
// ---------------------------------------------------------------------------
function getLiveBadges(appData) {
  const badges = {};

  // Parkolás: szabad helyek száma
  const freeSpots = appData?.parking?.freeSpots;
  if (typeof freeSpots === 'number' && freeSpots >= 0) {
    badges['/parking'] = { type: 'live', text: `${freeSpots} szabad hely` };
  }

  // Események: mai programok száma
  const events = appData?.events;
  if (Array.isArray(events)) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = events.filter((e) => {
      if (!e?.date) return false;
      if (e.end_date) return e.date <= todayStr && todayStr <= e.end_date;
      return e.date === todayStr;
    }).length;
    if (todayCount > 0) {
      badges['/events'] = { type: 'count', text: `Ma ${todayCount} program` };
    }
  }

  // Gasztro: most nyitva lévő helyek
  const openNow = appData?.gastronomy?.openNowCount;
  if (typeof openNow === 'number' && openNow > 0) {
    badges['/gastronomy'] = { type: 'count', text: `${openNow} hely nyitva` };
  }

  // Ostromnapok countdown / élő
  const ostrom = getOstromBadge();
  if (ostrom) {
    badges['/ostrom'] = ostrom;
  }

  return badges;
}

// Kis badge komponens a kártyák sarkába
function LiveBadge({ badge, featured }) {
  if (!badge) return null;
  const isLive = badge.type === 'live';
  return (
    <span
      className={`
        absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-[10px] font-semibold tracking-wide backdrop-blur-md
        ${isLive
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
          : featured
            ? 'bg-white/15 text-white border border-white/20'
            : 'bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20'}
      `}
    >
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {badge.text}
    </span>
  );
}

export default function Home({ appData, weather }) {
  const { t } = useTranslation('home');
  const prefersReducedMotion = useReducedMotion();

  // -------------------------------------------------------------------------
  // SCROLL-SCRUB: a LiveHero görgetésre zsugorodik, halványul és felúszik.
  // -------------------------------------------------------------------------
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 200], [1, 0.88]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0.3]);
  const heroY = useTransform(scrollY, [0, 200], [0, -35]);

  const heroStyle = { scale: heroScale, opacity: heroOpacity, y: heroY };

  const liveBadges = useMemo(() => getLiveBadges(appData), [appData]);

  const sections = [
    { to: '/ostrom', label: 'Ostromnapok', desc: '2026.08.07. - 08.09. | Kőszeg kiemelt rendezvénye', icon: IoShieldOutline, featured: true, bgImage: '/images/ostrom_2026/ostromhero.png', span: 'col-span-2 sm:col-span-2', delay: 0.03 },
    { to: '/varszinhaz', label: 'Várszínház', desc: 'Nyári színházi szezon', icon: IoStarOutline, featured: true, span: 'col-span-1 sm:col-span-1', delay: 0.05 },
    { to: '/events', label: t('sections.events.label'), desc: t('sections.events.desc'), icon: IoCalendarOutline, morphId: 'morph-events', span: 'col-span-2 sm:col-span-2', delay: 0.07 },
    { to: '/surrounding-events', label: t('sections.surroundingEvents.label') || 'Hegyaljai programok', desc: t('sections.surroundingEvents.desc') || 'Közeli települések rendezvényei', icon: IoCalendarOutline, span: 'col-span-1 sm:col-span-1', delay: 0.08 },
    { to: '/attractions', label: t('sections.attractions.label'), desc: t('sections.attractions.desc'), icon: IoMapOutline, span: 'col-span-1 sm:col-span-1', delay: 0.09 },
    { to: '/gastronomy', label: t('sections.food.label'), desc: t('sections.food.desc'), icon: IoRestaurantOutline, span: 'col-span-1 sm:col-span-2', delay: 0.10 },
    { to: '/hotels', label: t('sections.hotels.label'), desc: t('sections.hotels.desc'), icon: IoBedOutline, span: 'col-span-1 sm:col-span-1', delay: 0.11 },
    { to: '/leisure', label: t('sections.leisure.label'), desc: t('sections.leisure.desc'), icon: IoWalkOutline, span: 'col-span-1 sm:col-span-1', delay: 0.12 },
    { to: '/parking', label: t('sections.parking.label'), desc: t('sections.parking.desc'), icon: IoCarSportOutline, span: 'col-span-1 sm:col-span-1', delay: 0.13 },
    { to: '/info', label: t('sections.info.label'), desc: t('sections.info.desc'), icon: IoInformationCircleOutline, span: 'col-span-1 sm:col-span-1', delay: 0.14 },
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

        {/* --- LIVE HERO: scroll-scrub wrapper --- */}
        <motion.div style={heroStyle} className="origin-top will-change-transform">
          <LiveHero appData={appData} weather={weather} />
        </motion.div>

        {/* --- SEARCH --- */}
        <div className="mb-8 relative z-50">
          <FadeUp delay={0.15}>
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <SearchBar />
            </div>
          </FadeUp>
        </div>

        {/* NEARBY DISCOVERY (REAL-TIME HUMANISED) */}
        <FadeUp delay={0.2}>
          <NearbyDiscoveryCard appData={appData} />
        </FadeUp>

        {/* --- BENTO GRID --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
          {sections.map((sec) => (
            <SpringUp key={sec.to} delay={sec.delay + 0.1} className={sec.span}>
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
                  whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17, mass: 0.8 }}
                  className={`
                        relative h-full rounded-2xl p-5 lg:p-6
                        ${sec.morphId
                          ? 'border border-white/50 dark:border-white/10'
                          : sec.featured
                            ? 'bg-indigo-500 border border-indigo-400/30 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white/70 dark:bg-white/5 backdrop-blur-[20px] backdrop-saturate-[1.6] border border-white/60 dark:border-white/10'}
                        shadow-sm hover:shadow-lg
                        flex flex-col justify-between group
                        ${sec.morphId ? 'overflow-visible' : 'overflow-hidden'}
                        ${sec.comingSoon ? 'opacity-80 grayscale-[0.5]' : ''}
                    `}
                >
                  {sec.bgImage && (
                    <div className="absolute top-0 right-0 bottom-0 w-[55%] pointer-events-none overflow-hidden select-none z-0 rounded-r-2xl">
                      <img
                        src={sec.bgImage}
                        alt=""
                        className="h-full w-auto object-cover object-right ml-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-indigo-500/40 to-transparent" />
                    </div>
                  )}

                  {/* ÉLŐ ADAT BADGE */}
                  <LiveBadge badge={liveBadges[sec.to]} featured={sec.featured} />

                  {/* Shared-element morph surface */}
                  {sec.morphId && (
                    <motion.div
                      layoutId={sec.morphId}
                      transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
                      className="absolute inset-0 rounded-2xl bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl -z-0"
                    />
                  )}

                  {/* Icon */}
                  <motion.div
                    layoutId={sec.morphId ? `${sec.morphId}-icon` : undefined}
                    transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
                    className={`
                        relative z-10 w-10 h-10 rounded-lg flex items-center justify-center text-2xl mb-3
                        transition-colors duration-300 ease-out group-hover:scale-105
                        ${sec.featured
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'}
                    `}>
                    <sec.icon />
                  </motion.div>

                  {/* Content */}
                  <div className={`relative z-10 ${sec.bgImage ? 'max-w-[55%] sm:max-w-[65%]' : ''}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <motion.h3
                        layoutId={sec.morphId ? `${sec.morphId}-title` : undefined}
                        transition={{ layout: { type: 'spring', stiffness: 90, damping: 18, mass: 1 } }}
                        className={`text-base font-extrabold uppercase leading-none tracking-wider ${sec.featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {sec.label}
                      </motion.h3>
                      {!sec.comingSoon && (
                        <IoChevronForward
                          className={`
                            text-sm transition-all duration-500
                            opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0
                            ${sec.featured ? 'text-white/80' : 'text-indigo-500 dark:text-indigo-400'}
                          `}
                        />
                      )}
                    </div>
                    <motion.p
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: sec.featured ? 0.9 : 0.9, y: 0 }}
                      transition={{ delay: sec.delay + 0.25, duration: 0.5, ease: 'easeOut' }}
                      className={`text-xs font-semibold leading-tight transition-colors duration-500 ${sec.featured ? 'text-white/90' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}
                    >
                      {sec.desc}
                    </motion.p>
                  </div>

                  {/* Coming Soon Lock Badge */}
                  {sec.comingSoon && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 dark:bg-black/50 backdrop-blur-[10px] rounded-2xl">
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

      {/* Supabase-vezérelt / JSON-vezérelt promo modal */}
      <PromoModal />
    </div>
  );
}
