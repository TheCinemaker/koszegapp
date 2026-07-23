import React, { useEffect, useState, useMemo, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchEventById } from '../api';
import { format, parseISO, isValid, addHours } from 'date-fns';
import { hu } from 'date-fns/locale';
import {
  IoArrowBack,
  IoTimeOutline,
  IoLocationOutline,
  IoGlobeOutline,
  IoCalendarClearOutline,
  IoTicketOutline,
  IoShareSocialOutline,
  IoCloseOutline,
  IoBedOutline,
  IoCompassOutline,
} from 'react-icons/io5';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import LoadingSpinner from '../components/LoadingSpinner';
import { shouldShowBookingBubble, getBookingDatesFromEvent, getDistanceKm } from '../utils/bookingUtils';
import { LocationContext } from '../contexts/LocationContext';
import { useFavorites } from '../contexts/FavoritesContext';

// ---------------------------------------------------------------------------
// DESIGN KONCEPCIÓ: "A jegy"
// Az oldal nem kártyahalmaz, hanem egyetlen tárgy: egy esemény-jegy.
// - Immerzív plakát-hero, ami a lap tetejéből "nő ki"
// - A jegytest rácsúszik a plakátra (negatív margó)
// - Perforált leszakítható szelvény ("stub") a cselekvésekkel
// - A dátum nem badge, hanem tipográfiai elem, mint egy nyomtatott jegyen
// ---------------------------------------------------------------------------
const PAGE_BG = 'bg-[#f4f3f0] dark:bg-[#0c0c0e]';
const NOTCH_BG = 'bg-[#f4f3f0] dark:bg-[#0c0c0e]';

// ---------------------------------------------------------------------------
// Platform detektálás
// ---------------------------------------------------------------------------
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const IS_IOS =
  /iPad|iPhone|iPod/.test(ua) ||
  (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/.test(ua);
const IS_TOUCH = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// ---------------------------------------------------------------------------
// Zoomable Image Modal — touch pinch + drag, wheel, dupla koppintás, Escape
// ---------------------------------------------------------------------------
function ImageModal({ src, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const containerRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef({ dist: 0, zoom: 1 });
  const lastTap = useRef(0);
  const touchMode = useRef(null);

  const clampZoom = (z) => Math.min(Math.max(1, z), 5);

  const applyZoom = useCallback((newZoom) => {
    const z = clampZoom(newZoom);
    setZoom(z);
    if (z === 1) setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((prev) => {
        const next = clampZoom(prev + e.deltaY * -0.0015);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };
  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  const touchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchMode.current = 'pinch';
      pinchStart.current = { dist: touchDist(e.touches), zoom };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        applyZoom(zoom > 1 ? 1 : 2.5);
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      if (zoom > 1) {
        touchMode.current = 'drag';
        dragStart.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    }
  };

  const handleTouchMove = (e) => {
    if (touchMode.current === 'pinch' && e.touches.length === 2) {
      const scale = touchDist(e.touches) / pinchStart.current.dist;
      applyZoom(pinchStart.current.zoom * scale);
    } else if (touchMode.current === 'drag' && e.touches.length === 1 && zoom > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) touchMode.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Esemény plakát nagyítva"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[10000] w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
        aria-label="Bezárás"
      >
        <IoCloseOutline className="text-2xl" />
      </button>

      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt="Esemény plakát"
          onLoad={() => setImgLoaded(true)}
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging || touchMode.current ? 'none' : 'transform 0.2s ease-out',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 text-white/80 text-xs font-semibold pointer-events-none">
        {zoom === 1
          ? IS_TOUCH
            ? 'Csippentsd vagy koppints duplán a nagyításhoz'
            : 'Görgess a nagyításhoz'
          : `${Math.round(zoom * 100)}%`}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dátum-parszolás
// ---------------------------------------------------------------------------
function parseDateRange(evt) {
  if (!evt?.date) return { s: null, e: null };

  if (evt.date.includes('/')) {
    const [a, b] = evt.date.split('/');
    const s = parseISO(a);
    const e = parseISO(b);
    if (isValid(s) && isValid(e)) {
      const sDay = new Date(s);
      sDay.setHours(0, 0, 0, 0);
      const eDay = new Date(e);
      eDay.setHours(23, 59, 59, 999);
      return { s: sDay, e: eDay };
    }
    return { s: null, e: null };
  }

  const s = parseISO(evt.date);
  const e = parseISO(evt.end_date || evt.date);
  if (!isValid(s) || !isValid(e)) return { s: null, e: null };

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

function toICS(evt, s, e) {
  if (!s || !e) return '';
  const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `SUMMARY:${evt.name || 'Esemény'}`,
    `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`,
    `LOCATION:${evt.location || ''}`,
    `DESCRIPTION:${(evt.description || '').replace(/\r?\n/g, ' ')}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Perforáció: szaggatott vonal két félkör "kivágással" a szélein
// ---------------------------------------------------------------------------
function Perforation() {
  return (
    <div className="relative flex items-center h-0 my-1" aria-hidden="true">
      <div className={`absolute -left-3 w-6 h-6 rounded-full ${NOTCH_BG}`} />
      <div className="flex-1 mx-5 border-t-2 border-dashed border-slate-400 dark:border-white/30" />
      <div className={`absolute -right-3 w-6 h-6 rounded-full ${NOTCH_BG}`} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wallet gombok — platform szerint
// ---------------------------------------------------------------------------
function WalletButtons({ onApple, onGoogle }) {
  const apple = (
    <button
      key="apple"
      onClick={onApple}
      className="h-11 flex items-center justify-center rounded-xl bg-black hover:opacity-90 transition-opacity p-2 border border-white/10"
      title="Hozzáadás Apple Wallethez"
    >
      <img
        src="/images/apple_badges/addtoapplewallet.png"
        alt="Add to Apple Wallet"
        className="h-full w-auto object-contain"
      />
    </button>
  );

  const google = (
    <button
      key="google"
      onClick={onGoogle}
      className="h-11 flex items-center justify-center rounded-xl bg-black hover:opacity-90 transition-opacity p-2 border border-white/10"
      title="Hozzáadás Google Wallethez"
    >
      <img
        src="/images/google_badges/hu_add_to_google_wallet_add-wallet-badge.svg"
        alt="Add to Google Wallet"
        className="h-full w-auto object-contain"
      />
    </button>
  );

  if (IS_IOS) return apple;
  if (IS_ANDROID) return google;
  return (
    <>
      {apple}
      {google}
    </>
  );
}

// ---------------------------------------------------------------------------
// EventDetail
// ---------------------------------------------------------------------------
export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation().state;
  const { location, requestLocation } = useContext(LocationContext);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { t } = useTranslation('booking');
  const [evt, setEvt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [ticketEvent, setTicketEvent] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEventById(id)
      .then((data) => {
        if (!data) throw new Error('A keresett esemény nem található.');
        setEvt(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!location) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (evt && location) {
      const dismissed = localStorage.getItem(`booking_bubble_dismissed_${evt.id}`) === 'true';
      if (dismissed) return;

      const show = shouldShowBookingBubble(location.lat, location.lng, evt);
      if (show) {
        const timer = setTimeout(() => setShowBubble(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [evt, location]);

  useEffect(() => {
    if (evt) {
      const checkTickets = async () => {
        try {
          const { data } = await supabase
            .from('ticket_events')
            .select('*')
            .eq('name', evt.name)
            .eq('status', 'active')
            .maybeSingle();

          if (data) setTicketEvent(data);
        } catch (err) {
          console.error('Ticket check failed:', err);
        }
      };
      checkTickets();
    }
  }, [evt]);

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
    const toastId = toast.loading('Apple Wallet pass készítése...');
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

      toast.success('Letöltve!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(`Hiba: ${e.message}`, { id: toastId });
    }
  };

  const handleGoogleWallet = async () => {
    if (!evt) return;
    const toastId = toast.loading('Google Wallet mentés...');
    try {
      const res = await fetch('/.netlify/functions/create-event-pass-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      });
      if (!res.ok) throw new Error('Generálási hiba');
      const { url } = await res.json();
      toast.success('Átirányítás...', { id: toastId });
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      toast.error(`Hiba: ${e.message}`, { id: toastId });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: evt.name,
          text: `Nézd meg ezt az eseményt a visitkoszeg-ben: ${evt.name}`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link másolva!');
    }
  };

  const handleBack = () => {
    if (locationState?.fromAttraction) {
      navigate(`/attractions/${locationState.fromAttraction.id}`);
    } else if (locationState?.fromVarszinhaz || evt?.isVarszinhaz) {
      navigate('/varszinhaz');
    } else if (locationState?.fromSurrounding || evt?.settlement) {
      navigate('/surrounding-events');
    } else {
      navigate('/events');
    }
  };

  const { s, e } = useMemo(() => parseDateRange(evt || {}), [evt]);
  const isMultiDay = !!(evt?.end_date && evt.end_date !== evt.date);

  const monthName = s && isValid(s) ? format(s, 'MMM', { locale: hu }).toUpperCase().replace('.', '') : '';
  const dayNumber = s && isValid(s) ? format(s, 'd') : '';
  const weekday = s && isValid(s) ? format(s, 'EEEE', { locale: hu }) : '';

  const timeText = useMemo(() => {
    if (!s || !isValid(s)) return '';
    if (evt?.time) return evt.time;
    return format(s, 'HH:mm');
  }, [s, evt]);

  if (loading) {
    return <LoadingSpinner fullScreen={true} label="Esemény betöltése..." />;
  }

  if (error || !evt) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${PAGE_BG}`}>
        <p className="text-red-500 mb-6 text-lg font-bold">Hiba: {error || 'Az esemény nem található.'}</p>
        <button
          onClick={() => navigate('/events')}
          className="px-6 py-3 bg-indigo-500 hover:opacity-90 text-white rounded-xl font-bold shadow-sm transition-opacity"
        >
          Vissza az eseményekhez
        </button>
      </div>
    );
  }

  const favorited = isFavorite(evt.id);
  const hasImage = evt.image && evt.image !== 'balkep_default.jpg';
  const imgSrc = `/images/events/${evt.image}`;

  return (
    <div className={`min-h-screen pb-24 ${PAGE_BG} selection:bg-indigo-500 selection:text-white`}>
      <Toaster position="top-right" />

      {showImageModal && hasImage && <ImageModal src={imgSrc} onClose={() => setShowImageModal(false)} />}

      {/* ================================================================ */}
      {/* IMMERZÍV PLAKÁT-HERO                                             */}
      {/* ================================================================ */}
      <div className="relative h-[34vh] min-h-[260px] max-h-[380px] overflow-hidden">
        {hasImage ? (
          <>
            {/* Elmosott háttér a plakátból */}
            <img
              src={imgSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60 dark:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#f4f3f0] dark:to-[#0c0c0e]" />

            {/* Maga a plakát */}
            <div className="absolute inset-0 flex items-center justify-center p-4 pt-14 pb-8">
              <motion.img
                initial={{ opacity: 0, y: 12 }}
                animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                src={imgSrc}
                alt={evt.name}
                onLoad={() => setHeroLoaded(true)}
                onClick={() => setShowImageModal(true)}
                className="max-h-full max-w-[80%] object-contain rounded-xl shadow-2xl shadow-black/30 cursor-zoom-in"
                draggable={false}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <GhostImage className="w-full h-full max-w-md rounded-xl opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f4f3f0] dark:to-[#0c0c0e]" />
          </div>
        )}

        {/* Lebegő navigáció a plakát fölött */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            onClick={handleBack}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 active:scale-95 transition-all"
            aria-label="Vissza"
          >
            <IoArrowBack className="text-xl" />
          </button>

          <button
            onClick={() => (favorited ? removeFavorite(evt.id) : addFavorite(evt.id))}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 active:scale-95 transition-all"
            aria-label={favorited ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
          >
            {favorited ? <FaHeart className="text-rose-400 text-lg" /> : <FaRegHeart className="text-lg" />}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* A JEGY — rácsúszik a plakátra                                    */}
      {/* ================================================================ */}
      <div className="relative z-10 -mt-16 sm:-mt-20 px-4 max-w-2xl mx-auto">
        <FadeUp>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/30 overflow-hidden">

            {/* --- Jegy fő része --- */}
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-5">

                {/* Tartalom */}
                <div className="flex-1 min-w-0">
                  {/* Eyebrow */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    {evt.settlement && <span className="text-indigo-500 dark:text-indigo-400">{evt.settlement}</span>}
                    {evt.settlement && (isMultiDay || weekday) && <span aria-hidden="true">·</span>}
                    {isMultiDay ? <span>Többnapos program</span> : weekday && <span>{weekday}</span>}
                  </div>

                  <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-4">
                    {evt.name}
                  </h1>

                  <div className="space-y-1.5 text-sm font-medium text-slate-600 dark:text-zinc-400">
                    {evt.location && (
                      <div className="flex items-center gap-2">
                        <IoLocationOutline className="text-base text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                        <span className="truncate">
                          {evt.settlement ? `${evt.settlement}, ` : ''}
                          {evt.location}
                        </span>
                      </div>
                    )}
                    {timeText && (
                      <div className="flex items-center gap-2">
                        <IoTimeOutline className="text-base text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                        <span>{timeText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tipográfiai dátum — mint egy nyomtatott jegyen */}
                {dayNumber && (
                  <div className="flex-shrink-0 text-right border-l border-slate-100 dark:border-white/5 pl-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 leading-none mb-1">
                      {monthName}
                    </div>
                    <div className="text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white leading-none tabular-nums">
                      {dayNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- Perforáció --- */}
            <Perforation />

            {/* --- A "szelvény": cselekvések --- */}
            <div className="p-5 sm:p-6 pt-4">
              {/* Fő CTA */}
              {ticketEvent && (
                <button
                  onClick={() => navigate('/tickets', { state: { directEventId: ticketEvent.id } })}
                  className="w-full py-3.5 mb-3 bg-indigo-500 hover:opacity-90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 transition-opacity"
                >
                  <IoTicketOutline className="text-lg" />
                  Jegyvásárlás · {ticketEvent.price} Ft
                </button>
              )}

              {/* Wallet + gyorsműveletek */}
              <div className={`grid gap-2.5 ${IS_IOS || IS_ANDROID ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                <WalletButtons onApple={handleGeneratePass} onGoogle={handleGoogleWallet} />

                <a
                  href={`data:text/calendar;charset=utf8,${encodeURIComponent(evt ? toICS(evt, s, e) : '')}`}
                  download={`${(evt?.name || 'esemeny').replace(/\s+/g, '_')}.ics`}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <IoCalendarClearOutline className="text-base text-indigo-500 dark:text-indigo-400" /> Naptárba
                </a>

                <button
                  onClick={handleShare}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <IoShareSocialOutline className="text-base text-indigo-500 dark:text-indigo-400" /> Megosztás
                </button>
              </div>

              {/* Másodlagos linkek */}
              {(evt.link || (location && getDistanceKm(location.lat, location.lng, 47.389, 16.54) > 100)) && (
                <div className="flex flex-wrap gap-2.5 mt-2.5">
                  {evt.link && (
                    <a
                      href={evt.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-11 rounded-xl text-indigo-500 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-500/5 transition-colors border border-indigo-500/20"
                    >
                      <IoGlobeOutline className="text-base" /> Hivatalos weboldal
                    </a>
                  )}
                  {location && getDistanceKm(location.lat, location.lng, 47.389, 16.54) > 100 && (
                    <button
                      onClick={handleBookingClick}
                      className="flex-1 h-11 rounded-xl text-indigo-500 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-500/5 transition-colors border border-indigo-500/20"
                    >
                      <IoBedOutline className="text-base" /> Szállásfoglalás
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </FadeUp>
      </div>

      {/* ================================================================ */}
      {/* LEÍRÁS — nyugodt próza, nem kártya-dobozban feszítve             */}
      {/* ================================================================ */}
      {evt.description && (
        <FadeUp delay={0.1}>
          <div className="max-w-2xl mx-auto px-6 sm:px-8 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-4">
              A programról
            </p>
            <p className="text-slate-700 dark:text-zinc-300 leading-[1.75] text-[15px] sm:text-base whitespace-pre-wrap">
              {evt.description}
            </p>
          </div>
        </FadeUp>
      )}

      {/* ================================================================ */}
      {/* TÉRKÉP                                                           */}
      {/* ================================================================ */}
      {evt.coords && (
        <FadeUp delay={0.15}>
          <div className="max-w-2xl mx-auto px-4 mt-10">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                <IoCompassOutline className="text-indigo-500 dark:text-indigo-400 text-sm" /> Helyszín
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${evt.coords.lat},${evt.coords.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:opacity-80 transition-opacity"
              >
                Útvonalterv →
              </a>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-sm">
              <iframe
                title="Térkép"
                src={`https://www.google.com/maps?q=${evt.coords.lat},${evt.coords.lng}&z=16&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </FadeUp>
      )}

      {/* ================================================================ */}
      {/* SMART BOOKING BUBBLE                                             */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:w-80"
          >
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <IoBedOutline className="text-2xl" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">
                  {t('bubbleTitle')}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-widest">
                  {t('bubbleSubtitle')}
                </p>
                <button
                  onClick={handleBookingClick}
                  className="mt-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  {t('bubbleBtn')} <span>→</span>
                </button>
              </div>

              <button
                onClick={handleDismissBubble}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                aria-label="Bezárás"
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
