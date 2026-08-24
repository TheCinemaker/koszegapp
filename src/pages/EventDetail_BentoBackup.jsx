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

// Platform detektálás
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const IS_IOS =
  /iPad|iPhone|iPod/.test(ua) ||
  (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/.test(ua);
const IS_TOUCH = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

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

function WalletButtons({ onApple, onGoogle }) {
  const apple = (
    <button
      key="apple"
      onClick={onApple}
      className="h-12 flex items-center justify-center rounded-xl bg-black hover:opacity-90 transition-opacity p-2 border border-white/10"
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
      className="h-12 flex items-center justify-center rounded-xl bg-black hover:opacity-90 transition-opacity p-2 border border-white/10"
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

export default function EventDetail_BentoBackup() {
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

  const { s, e } = useMemo(() => parseDateRange(evt || {}), [evt]);
  const isMultiDay = !!(evt?.end_date && evt.end_date !== evt.date);

  const monthName = s && isValid(s) ? format(s, 'MMM', { locale: hu }).toUpperCase().replace('.', '') : '???';
  const dayNumber = s && isValid(s) ? format(s, 'd') : '?';

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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
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

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 max-w-5xl mx-auto selection:bg-indigo-500 selection:text-white">
      <Toaster position="top-right" />

      {showImageModal && hasImage && (
        <ImageModal src={`/images/events/${evt.image}`} onClose={() => setShowImageModal(false)} />
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (locationState?.fromAttraction) {
              navigate(`/attractions/${locationState.fromAttraction.id}`);
            } else if (locationState?.fromVarszinhaz || evt?.isVarszinhaz) {
              navigate('/varszinhaz');
            } else if (locationState?.fromSurrounding || evt?.settlement) {
              navigate('/surrounding-events');
            } else {
              navigate('/events');
            }
          }}
          className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border border-white/60 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-800 dark:text-white hover:opacity-90 transition-opacity"
          aria-label="Vissza"
        >
          <IoArrowBack className="text-xl" />
        </button>

        <button
          onClick={() => (favorited ? removeFavorite(evt.id) : addFavorite(evt.id))}
          className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border border-white/60 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-800 dark:text-white hover:opacity-90 transition-opacity"
          aria-label={favorited ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
        >
          {favorited ? <FaHeart className="text-rose-500 text-lg" /> : <FaRegHeart className="text-lg" />}
        </button>
      </div>

      <FadeUp>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            <div className="md:col-span-5 relative bg-zinc-950 min-h-[300px] flex items-center justify-center p-4 overflow-hidden">
              {hasImage ? (
                <>
                  <img
                    src={`/images/events/${evt.image}`}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 pointer-events-none"
                  />
                  <img
                    src={`/images/events/${evt.image}`}
                    alt={evt.name}
                    onLoad={() => setHeroLoaded(true)}
                    className={`relative max-w-full max-h-[360px] object-contain z-10 rounded-xl shadow-lg cursor-zoom-in hover:opacity-90 transition-all duration-500 ${
                      heroLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setShowImageModal(true)}
                  />
                </>
              ) : (
                <GhostImage className="w-full h-full rounded-xl" />
              )}
            </div>

            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-indigo-500 text-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">{monthName}</span>
                    <span className="text-xl font-bold leading-none mt-1">{dayNumber}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isMultiDay && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-widest">
                        Többnapos
                      </span>
                    )}
                    {evt.settlement && (
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-widest">
                        {evt.settlement}
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                  {evt.name}
                </h1>

                <div className="space-y-2.5 mb-6">
                  {evt.location && (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <IoLocationOutline className="text-base" />
                      </div>
                      <span>{evt.settlement ? `${evt.settlement}, ` : ''}{evt.location}</span>
                    </div>
                  )}

                  {timeText && (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <IoTimeOutline className="text-base" />
                      </div>
                      <span>{timeText}</span>
                    </div>
                  )}
                </div>
              </div>

              {ticketEvent && (
                <button
                  onClick={() => navigate('/tickets', { state: { directEventId: ticketEvent.id } })}
                  className="w-full py-3.5 bg-indigo-500 hover:opacity-90 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-opacity"
                >
                  <IoTicketOutline className="text-lg" />
                  Jegyvásárlás ({ticketEvent.price} Ft)
                </button>
              )}
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 mb-6">
          <div className={`grid gap-3 ${IS_IOS || IS_ANDROID ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
            <WalletButtons onApple={handleGeneratePass} onGoogle={handleGoogleWallet} />

            <a
              href={`data:text/calendar;charset=utf8,${encodeURIComponent(evt ? toICS(evt, s, e) : '')}`}
              download={`${(evt?.name || 'esemeny').replace(/\s+/g, '_')}.ics`}
              className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-white/10"
            >
              <IoCalendarClearOutline className="text-lg text-indigo-500 dark:text-indigo-400" /> Naptárba
            </a>

            <button
              onClick={() => {
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
              }}
              className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-white/10"
            >
              <IoShareSocialOutline className="text-lg text-indigo-500 dark:text-indigo-400" /> Megosztás
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            {evt.link && (
              <a
                href={evt.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
              >
                <IoGlobeOutline className="text-base" /> Hivatalos weboldal
              </a>
            )}

            {location && getDistanceKm(location.lat, location.lng, 47.389, 16.54) > 100 && (
              <button
                onClick={handleBookingClick}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
              >
                <IoBedOutline className="text-base" /> Szállásfoglalás
              </button>
            )}
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.2}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Esemény leírása
          </h2>
          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
            {evt.description}
          </p>
        </div>
      </FadeUp>

      {evt.coords && (
        <FadeUp delay={0.3}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <IoCompassOutline className="text-indigo-500 text-base" /> Helyszín térképen
              </h3>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${evt.coords.lat},${evt.coords.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:opacity-90 transition-opacity"
              >
                Útvonalterv →
              </a>
            </div>
            <div className="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
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
    </div>
  );
}
