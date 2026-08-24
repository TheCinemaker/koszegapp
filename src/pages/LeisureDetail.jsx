import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLeisure } from '../api';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import {
  IoArrowBack,
  IoWalkOutline,
  IoBicycleOutline,
  IoLeafOutline,
  IoInformationCircleOutline,
  IoCompassOutline,
  IoDownloadOutline,
  IoGlobeOutline,
  IoShareSocialOutline,
  IoStatsChartOutline,
  IoCloseOutline
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

export default function LeisureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    fetchLeisure()
      .then(data => {
        const found = data.find(i => String(i.id) === id);
        if (!found) setError('Nem található ilyen szabadidős program.');
        else setItem(found);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const favorited = useMemo(() => item ? isFavorite(item.id) : false, [item, isFavorite]);

  const getTypeIcon = (type, category) => {
    if (category && category.toLowerCase().includes('alpannonia')) return <IoWalkOutline />;
    switch (type) {
      case 'hike': return <IoWalkOutline />;
      case 'bike': return <IoBicycleOutline />;
      case 'park': return <IoLeafOutline />;
      default: return <IoInformationCircleOutline />;
    }
  };

  const getTypeName = (type, category) => {
    if (category) return category;
    switch (type) {
      case 'hike': return 'Túraútvonal';
      case 'park': return 'Park / Tanösvény';
      case 'playground': return 'Játszótér';
      case 'bike': return 'Kerékpárút';
      default: return type || 'Egyéb';
    }
  };

  const handleShare = async () => {
    if (navigator.share && item) {
      try {
        await navigator.share({
          title: item.name,
          text: item.description || item.shortDescription,
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

  if (loading) return <LoadingSpinner fullScreen={true} label="Szabadidő betöltése..." />;

  if (error || !item) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${PAGE_BG}`}>
      <p className="text-red-500 mb-6 text-lg font-bold">Hiba: {error || "A program nem található."}</p>
      <button
        onClick={() => navigate('/leisure')}
        className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
      >
        Vissza a szabadidőhöz
      </button>
    </div>
  );

  const imgSrc = item.image ? `/images/leisure/${item.image}` : null;

  return (
    <div className={`min-h-screen pb-24 ${PAGE_BG}`}>
      {showImageModal && imgSrc && <ImageModal src={imgSrc} onClose={() => setShowImageModal(false)} />}

      {/* ================================================================ */}
      {/* IMMERZÍV HERO                                                    */}
      {/* ================================================================ */}
      <div className="relative h-[34vh] min-h-[260px] max-h-[380px] overflow-hidden">
        {imgSrc ? (
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
                alt={item.name}
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
            onClick={() => navigate('/leisure')}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 active:scale-95 transition-all"
            aria-label="Vissza"
          >
            <IoArrowBack className="text-xl" />
          </button>

          <button
            onClick={() => (favorited ? removeFavorite(item.id) : addFavorite(item.id))}
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
                  <span className="px-3 py-1 rounded-full bg-brand text-gold-light border border-gold/40 shadow-card font-bold flex items-center gap-1.5">
                    {getTypeIcon(item.type, item.category)}
                    {getTypeName(item.type, item.category)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-white leading-[1.15] tracking-tight mt-1">
                  {item.name}
                </h1>

                {/* Metadata badges (Distance & Duration) */}
                {(item.distance || item.duration) && (
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-400 pt-1">
                    {item.distance && (
                      <div className="flex items-center gap-1.5">
                        <IoStatsChartOutline className="text-gold-text dark:text-gold-light" />
                        <span>Táv: {item.distance}</span>
                      </div>
                    )}
                    {item.duration && (
                      <div className="flex items-center gap-1.5">
                        <IoWalkOutline className="text-gold-text dark:text-gold-light" />
                        <span>Idő: {item.duration}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* --- Perforáció --- */}
            <Perforation />

            {/* --- Gyorsakciók szelvény --- */}
            <div className="p-5 sm:p-6 pt-4">
              {/* GPX letöltés CTA */}
              {item.gpxUrl && (
                <a
                  href={item.gpxUrl}
                  download
                  className="w-full py-3.5 mb-3 bg-brand text-gold-light rounded-control font-semibold text-sm flex items-center justify-center gap-2 shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
                >
                  <IoDownloadOutline className="text-lg" />
                  GPX Útvonal letöltése
                </a>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {item.coords && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-control bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-gold/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 dark:border-white/5"
                  >
                    <IoCompassOutline className="text-base text-gold-text dark:text-gold-light" /> Útvonal
                  </a>
                )}

                {item.link && (
                  <a
                    href={item.link}
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
      {/* LEÍRÁS — nyugodt próza, nem kártyadobozban feszítve               */}
      {/* ================================================================ */}
      {(item.description || item.shortDescription) && (
        <FadeUp delay={0.1}>
          <div className="max-w-2xl mx-auto px-6 sm:px-8 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-3">
              A programról
            </p>
            <p className="text-slate-700 dark:text-zinc-300 leading-[1.75] text-[15px] sm:text-base whitespace-pre-wrap font-medium">
              {item.description || item.shortDescription}
            </p>
          </div>
        </FadeUp>
      )}

      {/* Kiemelt látnivalók */}
      {item.highlights && item.highlights.length > 0 && (
        <FadeUp delay={0.15}>
          <div className="max-w-2xl mx-auto px-4 mt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-3 px-2">
              Kiemelt látnivalók az útvonalon
            </p>
            <div className="flex flex-wrap gap-2">
              {item.highlights.map((h, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-surface-card dark:bg-surface-card-dark text-slate-700 dark:text-zinc-300 text-xs font-semibold border border-slate-200/80 dark:border-white/10 shadow-card"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      )}

      {/* ================================================================ */}
      {/* TÉRKÉP                                                           */}
      {/* ================================================================ */}
      {item.coords && (
        <FadeUp delay={0.2}>
          <div className="max-w-2xl mx-auto px-4 mt-10">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                <IoCompassOutline className="text-gold-text dark:text-gold-light text-sm" /> Helyszín
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`}
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
                src={`https://www.google.com/maps?q=${item.coords.lat},${item.coords.lng}&z=16&output=embed`}
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
