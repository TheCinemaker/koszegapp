import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAttractionById, fetchEvents } from '../api';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import {
  IoArrowBack,
  IoTimeOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoCompassOutline,
  IoLocationOutline,
  IoShareSocialOutline,
  IoSparklesOutline,
  IoBulbOutline,
  IoImagesOutline,
  IoCalendarOutline,
  IoCloseOutline,
  IoTicketOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';
import LoadingSpinner from '../components/LoadingSpinner';

const PAGE_BG = 'bg-surface-light dark:bg-surface-dark';
const NOTCH_BG = 'bg-surface-light dark:bg-surface-dark';

function Perforation() {
  return (
    <div className="relative py-1 flex items-center justify-center">
      <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${NOTCH_BG} border-r border-slate-200/80 dark:border-white/10`} />
      <div className="w-full border-b-2 border-dashed border-slate-200/80 dark:border-white/10 mx-6" />
      <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${NOTCH_BG} border-l border-slate-200/80 dark:border-white/10`} />
    </div>
  );
}

function ImageModal({ src, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
          aria-label="Bezárás"
        >
          <IoCloseOutline />
        </button>
        <motion.img
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          src={src}
          alt="Nagyított kép"
          className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-floating"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default function AttractionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attr, setAttr] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attrData, allEvents] = await Promise.all([
          fetchAttractionById(id),
          fetchEvents()
        ]);

        if (attrData) {
          setAttr(attrData);

          const normalize = (str) => (str || '').toLowerCase()
            .replace(/[‑]/g, '-')
            .replace(/[^a-z0-9áéíóöőúüű]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const attrId = attrData.id?.toLowerCase();
          const attrNameNorm = normalize(attrData.name);

          const related = allEvents.filter(ev => {
            if (!ev.location) return false;
            const locNorm = normalize(ev.location);
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

  const favorited = useMemo(() => attr ? isFavorite(attr.id) : false, [attr, isFavorite]);

  const handleShare = async () => {
    if (navigator.share && attr) {
      try {
        await navigator.share({
          title: attr.name,
          text: attr.description || attr.details,
          url: window.location.href,
        });
      } catch (e) {
        console.log('Share skipped', e);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link másolva a vágólapra!');
    }
  };

  if (loading) return <LoadingSpinner fullScreen={true} label="Látnivaló betöltése..." />;

  if (error || !attr) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${PAGE_BG}`}>
      <p className="text-red-500 mb-6 text-lg font-bold">Hiba: {error || "A látnivaló nem található."}</p>
      <button
        onClick={() => navigate('/attractions')}
        className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
      >
        Vissza a látnivalókhoz
      </button>
    </div>
  );

  const imgSrc = attr.image || '/images/koeszeg_logo_nobg.png';

  return (
    <div className={`min-h-screen pb-24 ${PAGE_BG}`}>
      {showImageModal && <ImageModal src={imgSrc} onClose={() => setShowImageModal(false)} />}

      {/* ================================================================ */}
      {/* IMMERZÍV HERO                                                    */}
      {/* ================================================================ */}
      <div className="relative h-[34vh] min-h-[260px] max-h-[380px] overflow-hidden">
        {attr.image ? (
          <>
            <img
              src={imgSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60 dark:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-surface-light dark:to-surface-dark" />

            <div className="absolute inset-0 flex items-center justify-center p-4 pt-14 pb-8">
              <motion.img
                initial={{ opacity: 0, y: 12 }}
                animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                src={imgSrc}
                alt={attr.name}
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
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-light dark:to-surface-dark" />
          </div>
        )}

        {/* Lebegő gombok a hero fölött */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            onClick={() => navigate('/attractions')}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 active:scale-95 transition-all"
            aria-label="Vissza"
          >
            <IoArrowBack className="text-xl" />
          </button>

          <button
            onClick={() => (favorited ? removeFavorite(attr.id) : addFavorite(attr.id))}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 active:scale-95 transition-all"
            aria-label={favorited ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
          >
            {favorited ? <FaHeart className="text-rose-400 text-lg" /> : <FaRegHeart className="text-lg" />}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* KÁRTYA — rácsúszik a herora                                      */}
      {/* ================================================================ */}
      <div className="relative z-10 -mt-16 sm:-mt-20 px-4 max-w-2xl mx-auto">
        <FadeUp>
          <div className="bg-surface-card dark:bg-surface-card-dark rounded-card border border-slate-200/80 dark:border-white/10 shadow-card overflow-hidden">

            {/* --- Kártya fő része --- */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                {/* Eyebrow */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  <span className="px-3 py-1 rounded-full bg-brand text-gold-light border border-gold/40 shadow-card font-bold">
                    {attr.category || "Látnivaló"}
                  </span>
                  {attr.rainSafe && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                      <IoSparklesOutline /> Esőbiztos
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-white leading-[1.15] tracking-tight mt-1">
                  {attr.name}
                </h1>

                {/* Metadata */}
                <div className="space-y-1.5 text-sm font-medium text-slate-600 dark:text-zinc-400 pt-1">
                  {attr.location && (
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="text-base text-gold-text dark:text-gold-light flex-shrink-0" />
                      <span className="truncate">{attr.location}</span>
                    </div>
                  )}
                  {attr.hours && (
                    <div className="flex items-center gap-2">
                      <IoTimeOutline className="text-base text-gold-text dark:text-gold-light flex-shrink-0" />
                      <span>{attr.hours}</span>
                    </div>
                  )}
                </div>

                {/* Nyitvatartás részletezés */}
                {attr.opening_hours && (
                  <div className="mt-4 p-4 rounded-control bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500 mb-2">Részletes nyitvatartás</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-medium">
                      {[['Hétfő','monday'],['Kedd','tuesday'],['Szerda','wednesday'],['Csütörtök','thursday'],['Péntek','friday'],['Szombat','saturday'],['Vasárnap','sunday']].map(([label, key]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-500 dark:text-zinc-400">{label}</span>
                          <span className={`font-semibold ${attr.opening_hours[key] === 'Zárva' ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-zinc-200'}`}>{attr.opening_hours[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Belépőjegy árak */}
                {attr.ticket_prices && attr.ticket_prices.length > 0 && (
                  <div className="mt-4 p-4 rounded-control bg-brand/5 dark:bg-brand/10 border border-gold/20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold-text dark:text-gold-light mb-2 flex items-center gap-1.5">
                      <IoTicketOutline className="text-sm" /> Belépőjegy
                    </p>
                    <div className="space-y-1">
                      {attr.ticket_prices.map((tp, i) => (
                        <div key={i} className="flex justify-between items-center text-sm font-medium">
                          <span className="text-slate-600 dark:text-zinc-300">{tp.type}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{tp.price.toLocaleString('hu-HU')} {tp.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Látogatási megjegyzés */}
                {attr.visit_note && (
                  <div className="mt-4 p-4 rounded-control bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <IoInformationCircleOutline className="text-sm" /> Fontos tudnivaló
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">{attr.visit_note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- Perforáció --- */}
            <Perforation />

            {/* --- Gyorsakciók szelvény --- */}
            <div className="p-5 sm:p-6 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {attr.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${attr.coordinates.lat},${attr.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-control bg-brand text-gold-light font-semibold text-xs flex items-center justify-center gap-1.5 shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
                  >
                    <IoCompassOutline className="text-base" /> Útvonal
                  </a>
                )}

                {attr.phone && (
                  <a
                    href={`tel:${attr.phone}`}
                    className="h-11 rounded-control bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-gold/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 dark:border-white/5"
                  >
                    <IoCallOutline className="text-base text-gold-text dark:text-gold-light" /> Hívás
                  </a>
                )}

                {attr.website && (
                  <a
                    href={attr.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-control bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-gold/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 dark:border-white/5"
                  >
                    <IoGlobeOutline className="text-base text-gold-text dark:text-gold-light" /> Weboldal
                  </a>
                )}

                <button
                  onClick={handleShare}
                  className="h-11 rounded-control bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-gold/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 dark:border-white/5"
                >
                  <IoShareSocialOutline className="text-base text-gold-text dark:text-gold-light" /> Megosztás
                </button>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* ================================================================ */}
      {/* ISMERD MEG — nyugodt próza, nem kártyadobozban feszítve           */}
      {/* ================================================================ */}
      {(attr.details || attr.description) && (
        <FadeUp delay={0.1}>
          <div className="max-w-2xl mx-auto px-6 sm:px-8 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-3">
              Ismerd meg
            </p>
            <p className="text-slate-700 dark:text-zinc-300 leading-[1.75] text-[15px] sm:text-base whitespace-pre-wrap font-medium">
              {attr.details || attr.description}
            </p>
          </div>
        </FadeUp>
      )}

      {/* Történelem */}
      {attr.history_full && (
        <FadeUp delay={0.15}>
          <div className="max-w-2xl mx-auto px-6 sm:px-8 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-3">
              Történelem
            </p>
            <p className="text-slate-700 dark:text-zinc-300 leading-[1.75] text-[15px] sm:text-base whitespace-pre-wrap font-medium">
              {attr.history_full}
            </p>
          </div>
        </FadeUp>
      )}

      {/* Tipp neked */}
      {attr.tips && (
        <FadeUp delay={0.2}>
          <div className="max-w-2xl mx-auto px-4 mt-8">
            <div className="bg-brand p-6 rounded-card shadow-card text-gold-light border border-gold/30 flex items-start gap-4">
              <IoBulbOutline className="text-2xl text-gold-light shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-light/80 mb-1">Tipp neked</p>
                <p className="text-white font-semibold text-sm sm:text-base leading-snug">"{attr.tips}"</p>
              </div>
            </div>
          </div>
        </FadeUp>
      )}

      {/* Közelgő programok */}
      {events.length > 0 && (
        <FadeUp delay={0.25}>
          <div className="max-w-2xl mx-auto px-4 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-4 px-2 flex items-center gap-2">
              <IoCalendarOutline className="text-gold-text dark:text-gold-light text-sm" /> Közelgő Programok
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.map((ev, i) => (
                <div
                  key={i}
                  className="p-4 rounded-control bg-surface-card dark:bg-surface-card-dark border border-slate-200/80 dark:border-white/10 shadow-card flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-semibold text-gold-text dark:text-gold-light uppercase mb-1 block">{ev.date} • {ev.time}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-3">{ev.name}</h3>
                  </div>
                  <button
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="text-xs font-bold text-gold-text dark:text-gold-light hover:underline self-start"
                  >
                    Részletek →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      )}

      {/* Galéria */}
      {attr.gallery && attr.gallery.length > 0 && (
        <FadeUp delay={0.3}>
          <div className="max-w-2xl mx-auto px-4 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-4 px-2 flex items-center gap-2">
              <IoImagesOutline className="text-gold-text dark:text-gold-light text-sm" /> Galéria
            </p>
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x snap-mandatory">
              {attr.gallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setShowImageModal(true)}
                  className="min-w-[200px] h-32 rounded-control overflow-hidden snap-center relative shadow-card border border-slate-200/60 dark:border-white/10 shrink-0 cursor-zoom-in"
                >
                  <img src={img} alt={`${attr.name} kép ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      )}

      {/* ================================================================ */}
      {/* TÉRKÉP                                                           */}
      {/* ================================================================ */}
      {attr.coordinates && (
        <FadeUp delay={0.35}>
          <div className="max-w-2xl mx-auto px-4 mt-10">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                <IoCompassOutline className="text-gold-text dark:text-gold-light text-sm" /> Helyszín
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${attr.coordinates.lat},${attr.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-gold-text dark:text-gold-light hover:opacity-80 transition-opacity"
              >
                Útvonalterv →
              </a>
            </div>
            <div className="h-64 rounded-card overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-card">
              <iframe
                title="Térkép"
                src={`https://www.google.com/maps?q=${attr.coordinates.lat},${attr.coordinates.lng}&z=16&output=embed`}
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
