import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchEventById } from '../api';
import { format, parseISO, isValid, addHours } from 'date-fns';
import { hu } from 'date-fns/locale';
import {
  IoArrowBack,
  IoTimeOutline,
  IoLocationOutline,
  IoGlobeOutline,
  IoMapOutline,
  IoCalendarOutline,
  IoTicketOutline,
  IoShareSocialOutline,
  IoCloseOutline,
  IoBedOutline,
  IoCalendarClearOutline
} from 'react-icons/io5';
import { FaApple } from "react-icons/fa";
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';
import { shouldShowBookingBubble, getBookingDatesFromEvent, getDistanceKm } from '../utils/bookingUtils';
import { LocationContext } from '../contexts/LocationContext';

// Zoomable Image Modal Component
function ImageModal({ src, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(1, zoom + delta), 5);
    setZoom(newZoom);
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[10000] w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/10 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <span className="text-2xl">×</span>
      </button>

      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt="Event poster"
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 text-white text-sm">
        {zoom === 1 ? 'Görgess a nagyításhoz' : `${Math.round(zoom * 100)}%`}
      </div>
    </div>
  );
}


function parseDateRange(evt) {
  if (evt?.date) {
    const s = parseISO(evt.date);
    const e = parseISO(evt.end_date || evt.date);

    if (evt.time && typeof evt.time === 'string') {
      const t = evt.time.replace(/\s/g, '');
      if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(t)) {
        const [ts, te] = t.split('-');
        const [hs, ms] = ts.split(':').map(Number);
        const [he, me] = te.split(':').map(Number);
        const s2 = new Date(s);
        s2.setHours(hs, ms ?? 0, 0, 0);
        const e2 = new Date(e);
        e2.setHours(he, me ?? 0, 0, 0);
        return { s: s2, e: e2 };
      }
      if (/^\d{2}:\d{2}$/.test(t)) {
        const [h, m] = t.split(':').map(Number);
        const s2 = new Date(s);
        s2.setHours(h, m ?? 0, 0, 0);
        const e2 = addHours(s2, 2);
        return { s: s2, e: e2 };
      }
    }
    const sDay = new Date(s);
    sDay.setHours(0, 0, 0, 0);
    const eDay = new Date(e);
    eDay.setHours(23, 59, 59, 999);
    return { s: sDay, e: eDay };
  }
  if (evt?.date && evt.date.includes('/')) {
    const [a, b] = evt.date.split('/');
    const s = parseISO(a);
    const e = parseISO(b);
    return { s, e };
  }
  return { s: null, e: null };
}

function toICS(evt, s, e) {
  if (!s || !e) return '';
  const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `SUMMARY:${evt.name}`,
    `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`,
    `LOCATION:${evt.location || ''}`,
    `DESCRIPTION:${(evt.description || '').replace(/\r?\n/g, ' ')}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\n');
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location, requestLocation } = useContext(LocationContext);
  const { t } = useTranslation('booking');
  const [evt, setEvt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEventById(id)
      .then(data => {
        if (!data) throw new Error('A keresett esemény nem található.');
        setEvt(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!location) {
      requestLocation();
    }
  }, []);

  useEffect(() => {
    if (evt && location) {
      const show = shouldShowBookingBubble(location.lat, location.lng, evt);
      if (show) {
        // Delay bubble for better UX
        const timer = setTimeout(() => setShowBubble(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [evt, location]);

  const handleDismissBubble = (e) => {
    e.stopPropagation();
    setShowBubble(false);
    if (evt) {
      localStorage.setItem(`booking_bubble_dismissed_${evt.id}`, 'true');
    }
  };

  const handleBookingClick = () => {
    if (!evt) return;
    const { checkin, checkout } = getBookingDatesFromEvent(evt.date);
    navigate(`/booking?checkin=${checkin}&checkout=${checkout}`);
  };

  const handleGeneratePass = async () => {
    if (!evt) return;
    const toastId = toast.loading("Wallet Pass készítése...");
    try {
      const res = await fetch('/.netlify/functions/create-event-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generálási hiba');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${evt.id}.pkpass`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Letöltve!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(`Hiba: ${e.message}`, { id: toastId });
    }
  };

  const { s, e } = useMemo(() => parseDateRange(evt || {}), [evt]);
  const isMultiDay = !!(evt?.end_date && evt.end_date !== evt.date);

  // Formatting for "Apple Calendar" Icon
  const monthName = s && isValid(s) ? format(s, 'MMM', { locale: hu }).toUpperCase().replace('.', '') : '???';
  const dayNumber = s && isValid(s) ? format(s, 'd') : '?';

  // Time logic
  const timeText = useMemo(() => {
    if (!s || !isValid(s)) return '';
    if (evt?.time) return evt.time; // Use raw string if available and simple
    return format(s, 'HH:mm');
  }, [s, evt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !evt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "Az esemény nem található."}</p>
        <button
          onClick={() => navigate('/events')}
          className="px-6 py-3 bg-purple-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Vissza az eseményekhez
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10 selection:bg-purple-500 selection:text-white relative">
      <Toaster position="top-right" />

      {/* Zoomable Image Modal */}
      {showImageModal && evt.image && evt.image !== 'balkep_default.jpg' && (
        <ImageModal
          src={`/images/events/${evt.image}`}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <div
          onClick={() => setShowImageModal(true)}
          className="cursor-zoom-in hover:opacity-95 transition-opacity w-full h-full"
          title="Kattints a nagyításhoz"
        >
          {evt.image && evt.image !== 'balkep_default.jpg' ? (
            <ParallaxImage
              src={`/images/events/${evt.image}`}
              className="w-full h-full"
              scale={1.15}
            />
          ) : (
            <GhostImage className="w-full h-full" />
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10 pointer-events-none" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50 pointer-events-none">
          <button
            onClick={() => navigate('/events')}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-900 dark:text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group pointer-events-auto"
          >
            <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Title (Parallaxed) */}
        <motion.div
          className="absolute bottom-16 left-6 right-6 z-20 pointer-events-none"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex gap-4 items-end mb-6">
            {/* Giant Calendar Date */}
            <div className="shrink-0 w-24 h-24 bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/20 overflow-hidden flex flex-col text-center shadow-2xl">
              <div className="bg-red-500 text-white text-xs font-bold uppercase py-1.5 tracking-widest">
                {monthName}
              </div>
              <div className="flex-1 flex items-center justify-center text-4xl font-black text-gray-900 dark:text-white">
                {dayNumber}
              </div>
            </div>
            <div>
              {isMultiDay && (
                <span className="px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest mb-2 inline-block shadow-lg">
                  Többnapos
                </span>
              )}
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tighter leading-none max-w-4xl">
            {evt.name}
          </h1>
        </motion.div>
      </div>

      {/* --- CONTENT SHEET (GLASS CARD) --- */}
      <div className="relative -mt-10 px-4 z-20 max-w-7xl mx-auto">
        <FadeUp duration={1}>
          <div className="
              bg-white/80 dark:bg-[#1a1c2e]/90
              backdrop-blur-[50px]
              rounded-[3rem]
              border border-white/40 dark:border-white/5
              shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)]
              p-8 sm:p-12
              min-h-[50vh]
          ">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              {/* LEFT COLUMN: Main Info */}
              <div className="lg:col-span-8 space-y-8">
                {/* Info Bar (Merged Location & Time) */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 dark:text-gray-400">
                  {evt.location && (
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="text-blue-500 text-xl" />
                      <span className="font-bold text-lg">{evt.location}</span>
                    </div>
                  )}
                  {(evt.location && timeText) && <span className="text-gray-300 dark:text-gray-700">•</span>}
                  {timeText && (
                    <div className="flex items-center gap-2">
                      <IoTimeOutline className="text-blue-500 text-xl" />
                      <span className="font-bold text-lg">{timeText}</span>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rövid leírás</h2>
                <div className="prose dark:prose-invert prose-lg max-w-none">
                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                    {evt.description}
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar Actions */}
              <div className="lg:col-span-4 space-y-6">
                {/* Actions Section - Refined 3-column layout */}
                <FadeUp delay={0.1}>
                  <div className="space-y-4">
                    {/* Primary Actions: Wallet, Calendar, Share */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={handleGeneratePass}
                        className="h-14 flex items-center justify-center rounded-2xl bg-transparent hover:scale-[1.02] active:scale-95 transition-all outline-none border border-gray-200 dark:border-white/10 px-2"
                        title="Add to Apple Wallet"
                      >
                        <img
                          src="/images/apple_badges/addtoapplewallet.png"
                          alt="Add to Apple Wallet"
                          className="h-8 w-auto min-w-0" // Removed dark:invert as the badge should stay original black usually, but user might prefer it. For now keeping original for compliance.
                        />
                      </button>

                      <a
                        href={`data:text/calendar;charset=utf8,${encodeURIComponent(evt ? toICS(evt, s, e) : '')}`}
                        download={`${evt?.name.replace(/\s+/g, '_')}.ics`}
                        className="h-14 flex items-center justify-center rounded-2xl bg-transparent text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-gray-200 dark:border-white/10"
                        title="Esemény naptárhoz adása"
                      >
                        <IoCalendarClearOutline className="text-blue-500 text-2xl" />
                      </a>

                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: evt.name,
                              text: `Nézd meg ezt az eseményt a KőszegApp-ban: ${evt.name}`,
                              url: window.location.href,
                            }).catch(console.error);
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link másolva!');
                          }
                        }}
                        className="h-14 flex items-center justify-center rounded-2xl bg-transparent text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-gray-200 dark:border-white/10"
                        title="Megosztás"
                      >
                        <IoShareSocialOutline className="text-purple-500 text-2xl" />
                      </button>
                    </div>

                    {/* Booking Button - Large CTA if far away */}
                    {location && (getDistanceKm(location.lat, location.lng, 47.389, 16.540) > 100) && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleBookingClick}
                        className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                      >
                        <IoBedOutline className="text-xl" />
                        FOGLALÁS A BOOKING-ON
                      </motion.button>
                    )}

                    {/* Secondary Actions: Website */}
                    {evt.link && (
                      <motion.a
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        href={evt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 w-full bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-transparent dark:border-white/5"
                      >
                        <IoGlobeOutline className="text-sm text-purple-500" />
                        Hivatalos weboldal megnyitása
                      </motion.a>
                    )}
                  </div>
                </FadeUp>
              </div>

            </div>

            {/* Map Section */}
            {evt.coords && (
              <FadeUp delay={0.3} className="mt-16">
                <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-xl relative group h-80">
                  <iframe
                    title="Térkép"
                    src={`https://www.google.com/maps?q=${evt.coords.lat},${evt.coords.lng}&z=16&output=embed`}
                    className="w-full h-full border-0 grayscale-[50%] group-hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 shadow-lg">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                      Helyszín
                    </span>
                  </div>
                </div>
              </FadeUp>
            )}

          </div>
        </FadeUp>
      </div>

      {/* --- SMART BOOKING BUBBLE --- */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:w-80"
          >
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white dark:border-white/10 p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition-colors" />

              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <IoBedOutline className="text-2xl text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight mb-0.5">
                  {t('bubbleTitle')}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">
                  {t('bubbleSubtitle')}
                </p>
                <button
                  onClick={handleBookingClick}
                  className="mt-2 text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  {t('bubbleBtn')} <span>→</span>
                </button>
              </div>

              <button
                onClick={handleDismissBubble}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <IoCloseOutline className="text-lg" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
