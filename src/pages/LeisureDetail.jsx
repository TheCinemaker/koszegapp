import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLeisure } from '../api';
import {
  IoArrowBack,
  IoMapOutline,
  IoWalkOutline,
  IoBicycleOutline,
  IoLeafOutline,
  IoInformationCircleOutline,
  IoNavigateOutline,
  IoDownloadOutline,
  IoGlobeOutline,
  IoStatsChartOutline,
  IoCloseOutline
} from 'react-icons/io5';
import { AnimatePresence, motion } from 'framer-motion';
import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LeisureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);

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

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} label="Szabadidő adatai..." />
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A program nem található."}</p>
        <button
          onClick={() => navigate('/leisure')}
          className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark overflow-x-hidden pb-10">

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden cursor-zoom-in" onClick={() => setShowLightbox(true)}>
        {item.image ? (
          <ParallaxImage
            src={`/images/leisure/${item.image}`}
            className="w-full h-full object-cover"
            scale={1.05}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/leisure'); }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-floating hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            <IoArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Title */}
        <motion.div
          className="absolute bottom-12 left-6 right-6 z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-4 py-1.5 rounded-full bg-brand text-gold-light text-xs font-bold uppercase tracking-widest shadow-card border border-gold/40 flex items-center gap-1.5">
              {getTypeIcon(item.type, item.category)}
              {getTypeName(item.type, item.category)}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-2xl tracking-tight leading-tight max-w-4xl">
            {item.name}
          </h1>
        </motion.div>
      </div>

      {/* --- CONTENT SHEET --- */}
      <div className="relative -mt-8 px-4 z-20 max-w-7xl mx-auto">
        <FadeUp duration={1}>
          <div className="
              bg-surface-card dark:bg-surface-card-dark
              backdrop-blur-md
              rounded-card
              border border-slate-200/80 dark:border-white/10
              shadow-card
              p-6 sm:p-10
              min-h-[50vh]
          ">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT COLUMN: Main Info */}
              <div className="lg:col-span-8 space-y-6">

                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-4">
                    <IoInformationCircleOutline className="text-gold-text dark:text-gold-light" />
                    A programról
                  </h2>
                  <div className="prose dark:prose-invert prose-lg max-w-none">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-line">
                      {item.description || item.shortDescription || "Nincs részletes leírás megadva."}
                    </p>
                  </div>
                </div>

                {/* Extra Details */}
                {item.highlights && item.highlights.length > 0 && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-white/5">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Kiemelt látnivalók a túra mentén</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.highlights.map((h, idx) => (
                        <span key={idx} className="bg-gold/15 text-gold-text dark:text-gold-light text-xs font-semibold px-4 py-2 rounded-full border border-gold/30">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar Stats & Actions */}
              <div className="lg:col-span-4 space-y-6">

                {/* Stats Grid */}
                <FadeUp delay={0.1}>
                  <div className="grid grid-cols-2 gap-4">
                    {item.distance && (
                      <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-control border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center gap-1.5">
                        <IoStatsChartOutline className="text-2xl text-gold-text dark:text-gold-light" />
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{item.distance}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Távolság</span>
                        </div>
                      </div>
                    )}
                    {item.duration && (
                      <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-control border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center text-center gap-1.5">
                        <IoWalkOutline className="text-2xl text-gold-text dark:text-gold-light" />
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{item.duration}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Időtartam</span>
                        </div>
                      </div>
                    )}
                  </div>
                </FadeUp>

                {/* Contact / External Actions */}
                <FadeUp delay={0.2}>
                  <div className="grid grid-cols-1 gap-3">
                    {item.gpxUrl && (
                      <a
                        href={item.gpxUrl}
                        download
                        className="bg-brand text-gold-light p-4 rounded-control flex items-center justify-center gap-3 shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
                      >
                        <IoDownloadOutline className="text-xl" />
                        <span className="font-semibold text-sm">GPX Letöltése</span>
                      </a>
                    )}

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-control flex items-center justify-start gap-4 hover:bg-gold/10 transition-all border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30"><IoGlobeOutline className="text-lg" /></div>
                        <span className="font-semibold text-sm">Részletes térkép / Hivatalos oldal</span>
                      </a>
                    )}

                    {item.coords && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-control flex items-center justify-start gap-4 hover:bg-gold/10 transition-all border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30"><IoNavigateOutline className="text-lg" /></div>
                        <span className="font-semibold text-sm">Odaút Tervezése</span>
                      </a>
                    )}
                  </div>
                </FadeUp>

              </div>
            </div>

            {/* Map Section */}
            {item.coords && (
              <FadeUp delay={0.4} className="mt-12">
                <div className="overflow-hidden rounded-card border border-slate-200/80 dark:border-white/10 shadow-card relative group h-80">
                  <iframe
                    title="Helyszín térképe"
                    src={`https://www.google.com/maps?q=${item.coords.lat},${item.coords.lng}&z=15&output=embed`}
                    className="w-full h-full border-0 transition-all duration-700"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-card">
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <IoMapOutline /> Kiindulópont Térképe
                    </span>
                  </div>
                </div>
              </FadeUp>
            )}

          </div>
        </FadeUp>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && item.image && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-6 right-6 text-white w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
            >
              <IoCloseOutline />
            </button>
            <img
              src={`/images/leisure/${item.image}`}
              alt={item.name}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-floating"
            />
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
