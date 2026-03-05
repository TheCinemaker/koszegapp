import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { fetchAttractionById, fetchEvents } from '../api';
import {
  IoArrowBack,
  IoTimeOutline,
  IoWalletOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoMapOutline,
  IoDiamond,
  IoCalendarOutline,
  IoImagesOutline,
  IoBulbOutline,
  IoInformationCircleOutline,
  IoAccessibilityOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import { motion, useScroll, useTransform } from 'framer-motion';

import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

export default function AttractionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attr, setAttr] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scroll animations for Hero
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 500], [1.1, 1.0]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.5]);
  const backBtnBlur = useTransform(scrollY, [0, 100], [0, 10]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attrData, allEvents] = await Promise.all([
          fetchAttractionById(id),
          fetchEvents()
        ]);

        if (attrData) {
          setAttr(attrData);

          // --- ROBUST EVENT FILTERING ---
          // Normalize names to handle: Jurisics-vár vs Jurisics vár vs Jurisics‑vár (special hyphen)
          const normalize = (str) => (str || '').toLowerCase()
            .replace(/[‑]/g, '-') // Non-breaking hyphen korrekció
            .replace(/[^a-z0-9áéíóöőúüű]/gi, ' ') // Csak betűk és számok maradjanak (magyar ékezetekkel)
            .replace(/\s+/g, ' ')
            .trim();

          const attrId = attrData.id?.toLowerCase();
          const attrNameNorm = normalize(attrData.name);

          const related = allEvents.filter(ev => {
            if (!ev.location) return false;
            const locNorm = normalize(ev.location);

            // Egyezés keresése névben vagy helyszínben
            return locNorm.includes(attrNameNorm) ||
              attrNameNorm.includes(locNorm) ||
              (attrId && ev.attractionId === attrId);
          });

          setEvents(related.slice(0, 4));
        }
      } catch (err) {
        console.error("Hiba az adatok betöltésekor:", err);
        setError(err.message || "Ismeretlen hiba történt.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !attr) return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-4xl font-black mb-4">Látnivaló nem található.</h2>
        <button onClick={() => navigate('/attractions')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Vissza a listához</button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] overflow-x-hidden pb-20 selection:bg-indigo-500 selection:text-white relative">

      {/* --- NAVIGATION (FLOATING APPLE STYLE) --- */}
      <motion.div
        style={{ backdropFilter: `blur(${backBtnBlur}px)` }}
        className="fixed top-24 left-8 z-[100]"
      >
        <button
          onClick={() => navigate('/attractions')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 text-gray-900 dark:text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* --- HERO IMAGE SECTION (SCALE DOWN ON SCROLL) --- */}
      <div className="relative h-[85vh] w-full overflow-hidden bg-black">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="w-full h-full relative"
        >
          {attr.image ? (
            <>
              {/* Blurred background layer to prevent "empty" bars */}
              <img
                src={attr.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110"
              />
              {/* Main "No-Crop" Hero Image */}
              <img
                src={attr.image}
                alt={attr.name}
                className="relative w-full h-full object-contain z-10"
              />
            </>
          ) : (
            <GhostImage className="w-full h-full" />
          )}
        </motion.div>

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f5f5f7] dark:from-[#000000] via-transparent to-transparent z-20" />
        <div className="absolute inset-0 bg-black/10 z-0" />

        {/* Hero Title Container */}
        <div className="absolute bottom-24 left-8 right-8 z-20 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/10">
                {attr.category || "Látnivaló"}
              </span>
              {attr.rainSafe && (
                <span className="p-2 rounded-full bg-blue-500/20 backdrop-blur-xl text-blue-200 border border-blue-500/30">
                  <IoSparklesOutline className="text-sm" />
                </span>
              )}
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-white dark:text-white drop-shadow-2xl tracking-tighter leading-[0.9] max-w-5xl">
              {attr.name}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* --- BENTO CONTENT SHEET --- */}
      <div className="relative z-30 px-6 -mt-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Description Card (The "Story") */}
            <FadeUp>
              <div className="bg-white dark:bg-[#1c1c1e] rounded-[3rem] p-10 shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <IoInformationCircleOutline className="text-lg" /> Ismerd meg
                </h2>
                <p className="text-2xl md:text-3xl text-gray-900 dark:text-gray-100 font-bold leading-snug tracking-tight">
                  {attr.details || attr.description}
                </p>
              </div>
            </FadeUp>

            {/* 2. History & Details (Extended) */}
            {attr.history_full && (
              <FadeUp delay={0.1}>
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[3rem] p-10 shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                  <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <IoDiamond className="text-lg" /> Történelem
                  </h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                      {attr.history_full}
                    </p>
                  </div>
                </div>
              </FadeUp>
            )}

            {/* 3. Near Events (The Interactive part) */}
            {events.length > 0 && (
              <FadeUp delay={0.2}>
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[3rem] p-10 shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <IoCalendarOutline className="text-lg" /> Közelgő Programok
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((ev, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 rounded-[2rem] bg-[#f5f5f7] dark:bg-black/40 border border-black/[0.02] dark:border-white/[0.02]"
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <span className="text-[10px] font-black text-indigo-500 uppercase mb-2 block">{ev.date} • {ev.time}</span>
                            <h3 className="text-lg font-black dark:text-white leading-tight mb-2 leading-none">{ev.name}</h3>
                          </div>
                          <Link
                            to={`/events/${ev.id}`}
                            state={{ fromAttraction: { id, name: attr.name } }}
                            className="text-xs font-bold text-gray-400 hover:text-indigo-500 transition-colors"
                          >
                            Részletek →
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            )}

            {/* 4. Gallery Section (Premium Slider) */}
            {attr.gallery && attr.gallery.length > 0 && (
              <FadeUp delay={0.3}>
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[3rem] p-10 shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                  <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <IoImagesOutline className="text-lg" /> Galéria
                  </h2>

                  <div className="relative group">
                    <div className="flex overflow-x-auto gap-6 no-scrollbar pb-6 snap-x snap-mandatory px-4">
                      {attr.gallery.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          className="min-w-[70vw] md:min-w-[400px] aspect-[3/4] rounded-[2.5rem] overflow-hidden snap-center relative shadow-2xl border border-white/10"
                        >
                          <div className="absolute inset-0 bg-black/10 dark:bg-white/5" />
                          <img
                            src={img}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110"
                          />
                          <img
                            src={img}
                            alt={`${attr.name} galléria kép ${idx + 1}`}
                            className="relative w-full h-full object-contain z-10"
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Visual Indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                      {attr.gallery.map((_, idx) => (
                        <div key={idx} className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                      ))}
                    </div>
                  </div>
                </div>
              </FadeUp>
            )}
          </div>

          {/* Sidebar Column (Bento Cards) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Info Card: Hours */}
            <FadeUp delay={0.1}>
              <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2.5rem] shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <IoTimeOutline className="text-xl" />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">Nyitvatartás</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-bold whitespace-pre-line leading-relaxed">
                  {attr.hours || "Nincs adat"}
                </p>
              </div>
            </FadeUp>

            {/* Info Card: Tips (Interactive Bulb) */}
            {attr.tips && (
              <FadeUp delay={0.2}>
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                      <IoBulbOutline className="text-xl" />
                    </div>
                    <h3 className="font-black uppercase text-xs tracking-widest">Tipp neked</h3>
                  </div>
                  <p className="font-bold text-lg leading-snug">
                    "{attr.tips}"
                  </p>
                </div>
              </FadeUp>
            )}

            {/* Info Card: Fun Fact */}
            {attr.fun_fact && (
              <FadeUp delay={0.3}>
                <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2.5rem] shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <IoSparklesOutline className="text-xl" />
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">Tudtad?</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-bold leading-relaxed italic">
                    {attr.fun_fact}
                  </p>
                </div>
              </FadeUp>
            )}

            {/* Accessibility Card */}
            {attr.accessibility && (
              <FadeUp delay={0.4}>
                <div className="bg-gray-100 dark:bg-black p-8 rounded-[2.5rem] shadow-sm border border-black/[0.03] dark:border-white/[0.03]">
                  <div className="flex items-center gap-4 mb-4 text-gray-900 dark:text-white">
                    <IoAccessibilityOutline className="text-xl" />
                    <h3 className="font-black uppercase text-xs tracking-widest">Akadálymentesség</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-500 font-medium text-sm">
                    {attr.accessibility}
                  </p>
                </div>
              </FadeUp>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {attr.phone && (
                <motion.a
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  href={`tel:${attr.phone}`}
                  className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 border border-black/[0.03] dark:border-white/[0.03] shadow-sm"
                >
                  <IoCallOutline className="text-2xl text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">Hívás</span>
                </motion.a>
              )}
              {attr.website && (
                <motion.a
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  href={attr.website}
                  target="_blank"
                  className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 border border-black/[0.03] dark:border-white/[0.03] shadow-sm"
                >
                  <IoGlobeOutline className="text-2xl text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">Web</span>
                </motion.a>
              )}
            </div>

            {/* Sidebar Map */}
            <FadeUp delay={0.5}>
              <div className="rounded-[2.5rem] overflow-hidden h-64 border border-black/[0.03] dark:border-white/[0.03] shadow-lg relative group">
                <iframe
                  src={`https://www.google.com/maps?q=${attr.coordinates.lat},${attr.coordinates.lng}&z=16&output=embed`}
                  className="w-full h-full border-0 transition-all duration-700"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest dark:text-white">
                  <IoMapOutline className="inline mr-1" /> Térkép
                </div>
              </div>
            </FadeUp>

          </div>
        </div>
      </div>
    </div>
  );
}
