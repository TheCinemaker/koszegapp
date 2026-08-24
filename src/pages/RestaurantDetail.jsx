import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRestaurants } from '../api';
import { useFavorites } from '../contexts/FavoritesContext.jsx';
import {
  IoArrowBack,
  IoCallOutline,
  IoGlobeOutline,
  IoLocationOutline,
  IoCompassOutline,
  IoShareSocialOutline,
  IoRestaurantOutline,
  IoTimeOutline,
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

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rest, setRest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    fetchRestaurants()
      .then(data => {
        const found = data.find(r => String(r.id) === id);
        if (!found) setError('Nem található ilyen vendéglátóhely.');
        else setRest(found);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const favorited = useMemo(() => rest ? isFavorite(rest.id) : false, [rest, isFavorite]);

  const handleShare = async () => {
    if (navigator.share && rest) {
      try {
        await navigator.share({
          title: rest.name,
          text: rest.description || rest.shortDescription,
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

  if (loading) return <LoadingSpinner fullScreen={true} label="Vendéglátóhely betöltése..." />;

  if (error || !rest) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${PAGE_BG}`}>
      <p className="text-red-500 mb-6 text-lg font-bold">Hiba: {error || "A hely nem található."}</p>
      <button
        onClick={() => navigate('/gastronomy')}
        className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
      >
        Vissza a vendéglátáshoz
      </button>
    </div>
  );

  const imgSrc = rest.image ? `/images/gastro/${rest.image}` : null;

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
                alt={rest.name}
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
            onClick={() => navigate('/gastronomy')}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 active:scale-95 transition-all"
            aria-label="Vissza"
          >
            <IoArrowBack className="text-xl" />
          </button>

          <button
            onClick={() => (favorited ? removeFavorite(rest.id) : addFavorite(rest.id))}
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
                  {rest.type && (
                    <span className="px-3 py-1 rounded-full bg-brand text-gold-light border border-gold/40 shadow-card font-bold">
                      {rest.type}
                    </span>
                  )}
                  {rest.price_range && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/60 dark:border-white/10 font-bold">
                      {rest.price_range}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-white leading-[1.15] tracking-tight mt-1">
                  {rest.name}
                </h1>

                {/* Metadata */}
                <div className="space-y-1.5 text-sm font-medium text-slate-600 dark:text-zinc-400 pt-1">
                  {rest.address && (
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="text-base text-gold-text dark:text-gold-light flex-shrink-0" />
                      <span className="truncate">{rest.address}</span>
                    </div>
                  )}
                  {rest.hours && (
                    <div className="flex items-center gap-2">
                      <IoTimeOutline className="text-base text-gold-text dark:text-gold-light flex-shrink-0" />
                      <span>{rest.hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- Perforáció --- */}
            <Perforation />

            {/* --- Gyorsakciók szelvény --- */}
            <div className="p-5 sm:p-6 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {rest.coords && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${rest.coords.lat},${rest.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-control bg-brand text-gold-light font-semibold text-xs flex items-center justify-center gap-1.5 shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
                  >
                    <IoCompassOutline className="text-base" /> Útvonal
                  </a>
                )}

                {rest.phone && (
                  <a
                    href={`tel:${rest.phone}`}
                    className="h-11 rounded-control bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-gold/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 dark:border-white/5"
                  >
                    <IoCallOutline className="text-base text-gold-text dark:text-gold-light" /> Hívás
                  </a>
                )}

                {rest.website && (
                  <a
                    href={rest.website}
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
      {(rest.description || rest.shortDescription) && (
        <FadeUp delay={0.1}>
          <div className="max-w-2xl mx-auto px-6 sm:px-8 mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-3">
              Az étteremről
            </p>
            <p className="text-slate-700 dark:text-zinc-300 leading-[1.75] text-[15px] sm:text-base whitespace-pre-wrap font-medium">
              {rest.description || rest.shortDescription}
            </p>
          </div>
        </FadeUp>
      )}

      {/* Szolgáltatások / Amenities */}
      {rest.amenities && rest.amenities.length > 0 && (
        <FadeUp delay={0.15}>
          <div className="max-w-2xl mx-auto px-4 mt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 mb-3 px-2">
              Szolgáltatások
            </p>
            <div className="flex flex-wrap gap-2">
              {rest.amenities.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-surface-card dark:bg-surface-card-dark text-slate-700 dark:text-zinc-300 text-xs font-semibold border border-slate-200/80 dark:border-white/10 shadow-card"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      )}

      {/* ================================================================ */}
      {/* TÉRKÉP                                                           */}
      {/* ================================================================ */}
      {rest.coords && (
        <FadeUp delay={0.2}>
          <div className="max-w-2xl mx-auto px-4 mt-10">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                <IoCompassOutline className="text-gold-text dark:text-gold-light text-sm" /> Helyszín
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${rest.coords.lat},${rest.coords.lng}`}
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
                src={`https://www.google.com/maps?q=${rest.coords.lat},${rest.coords.lng}&z=16&output=embed`}
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
