import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRestaurants } from '../api';
import {
  IoArrowBack,
  IoCallOutline,
  IoGlobeOutline,
  IoLogoFacebook,
  IoMailOutline,
  IoMapOutline,
  IoLocationOutline,
  IoWifi,
  IoRestaurantOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rest, setRest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRestaurants()
      .then(data => {
        const found = data.find(r => String(r.id) === id);
        if (!found) {
          setError('Nem található ilyen vendéglátóhely.');
        } else {
          setRest(found);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <LoadingSpinner fullScreen={true} label="Vendéglátóhely betöltése..." />
    );
  }

  if (error || !rest) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A hely nem található."}</p>
        <button
          onClick={() => navigate('/gastronomy')}
          className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark overflow-x-hidden pb-10">

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        {rest.image ? (
          <ParallaxImage
            src={`/images/gastro/${rest.image}`}
            className="w-full h-full"
            scale={1.15}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/gastronomy')}
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
            {rest.type && (
              <span className="px-4 py-1.5 rounded-full bg-gold/20 backdrop-blur-md text-gold-light text-xs font-semibold uppercase tracking-widest shadow-card border border-gold/40">
                {rest.type}
              </span>
            )}
            {rest.price_range && (
              <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/10 text-xs font-semibold uppercase tracking-widest shadow-card">
                {rest.price_range}
              </span>
            )}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-2xl tracking-tight leading-tight max-w-4xl">
            {rest.name}
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

                {/* Amenities Row */}
                {(rest.amenities?.length > 0 || typeof rest.delivery === "boolean") && (
                  <div className="flex flex-wrap gap-3">
                    {typeof rest.delivery === "boolean" && (
                      <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border ${rest.delivery
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25'
                        }`}>
                        <IoCheckmarkCircle className="text-base" />
                        Házhozszállítás
                      </span>
                    )}
                    {rest.amenities?.map(a => (
                      <span key={a} className="bg-gold/15 text-gold-text dark:text-gold-light text-xs font-semibold px-4 py-2 rounded-full border border-gold/30 flex items-center gap-2">
                        {a === 'Wifi' && <IoWifi />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <IoRestaurantOutline className="text-gold-text dark:text-gold-light" />
                  Rövid leírás
                </h2>

                {rest.description ? (
                  <div className="prose dark:prose-invert prose-lg max-w-none">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {rest.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nincs leírás megadva.</p>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar */}
              <div className="lg:col-span-4 space-y-6">

                {/* Address Card */}
                {rest.address && (
                  <FadeUp delay={0.1}>
                    <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-control border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-gold/15 text-gold-text dark:text-gold-light border border-gold/30">
                          <IoLocationOutline className="text-xl" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cím</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium text-sm leading-relaxed">
                        {rest.address}
                      </p>
                    </div>
                  </FadeUp>
                )}

                {/* Contact Actions List */}
                <FadeUp delay={0.2}>
                  <div className="bg-slate-100 dark:bg-white/5 rounded-control overflow-hidden border border-slate-200/60 dark:border-white/5">

                    {rest.phone && (
                      <a
                        href={`tel:${rest.phone}`}
                        className="flex items-center justify-between p-4 hover:bg-gold/10 transition-colors border-b border-slate-200/60 dark:border-white/5 last:border-0 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand text-gold-light flex items-center justify-center shadow-card border border-gold/30">
                            <IoCallOutline className="text-lg" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Hívás</span>
                        </div>
                        <span className="text-gold-text dark:text-gold-light text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Hívás indítása</span>
                      </a>
                    )}

                    {rest.website && (
                      <a
                        href={rest.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 hover:bg-gold/10 transition-colors border-b border-slate-200/60 dark:border-white/5 last:border-0 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30">
                            <IoGlobeOutline className="text-lg" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Weboldal</span>
                        </div>
                        <span className="text-gray-400 text-xs group-hover:text-gold-text transition-colors">Megnyitás</span>
                      </a>
                    )}

                    {rest.facebook && (
                      <a
                        href={rest.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 hover:bg-gold/10 transition-colors border-b border-slate-200/60 dark:border-white/5 last:border-0 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30">
                            <IoLogoFacebook className="text-lg" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Facebook</span>
                        </div>
                        <span className="text-gray-400 text-xs group-hover:text-gold-text transition-colors">Megnyitás</span>
                      </a>
                    )}

                    {rest.email && (
                      <a
                        href={`mailto:${rest.email}`}
                        className="flex items-center justify-between p-4 hover:bg-gold/10 transition-colors border-b border-slate-200/60 dark:border-white/5 last:border-0 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30">
                            <IoMailOutline className="text-lg" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">Email</span>
                        </div>
                        <span className="text-gray-400 text-xs group-hover:text-gold-text transition-colors">Levélírás</span>
                      </a>
                    )}

                  </div>
                </FadeUp>

              </div>
            </div>

            {/* Map Section */}
            {rest.coords && (
              <FadeUp delay={0.4} className="mt-12">
                <div className="overflow-hidden rounded-card border border-slate-200/80 dark:border-white/10 shadow-card relative group h-80">
                  <iframe
                    title="Helyszín térképe"
                    src={`https://www.google.com/maps?q=${rest.coords.lat},${rest.coords.lng}&z=16&output=embed`}
                    className="w-full h-full border-0 transition-all duration-700"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-card">
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <IoMapOutline /> Pontos Helyszín
                    </span>
                  </div>
                </div>
              </FadeUp>
            )}

          </div>
        </FadeUp>
      </div>

    </div>
  );
}
