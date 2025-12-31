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
  IoCheckmarkCircle,
  IoTimeOutline
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

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
      <div className="flex items-center justify-center min-h-screen text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !rest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A hely nem található."}</p>
        <button
          onClick={() => navigate('/gastronomy')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10 selection:bg-orange-500 selection:text-white">

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

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

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/gastronomy')}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Title (Parallaxed) */}
        <motion.div
          className="absolute bottom-16 left-6 right-6 z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {rest.type && (
              <span className="px-4 py-1.5 rounded-full bg-orange-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest shadow-lg">
                {rest.type}
              </span>
            )}
            {rest.price_range && (
              <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/10 text-xs font-bold uppercase tracking-widest shadow-lg">
                {rest.price_range}
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tighter leading-none max-w-4xl">
            {rest.name}
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

                {/* Amenities Row */}
                {(rest.amenities?.length > 0 || typeof rest.delivery === "boolean") && (
                  <div className="flex flex-wrap gap-3">
                    {typeof rest.delivery === "boolean" && (
                      <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${rest.delivery
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                        }`}>
                        <IoCheckmarkCircle className="text-lg" />
                        Házhozszállítás
                      </span>
                    )}
                    {rest.amenities?.map(a => (
                      <span key={a} className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-200 text-sm font-bold px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 flex items-center gap-2">
                        {a === 'Wifi' && <IoWifi />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <IoRestaurantOutline className="text-orange-500" />
                  A konyháról
                </h2>

                {rest.description ? (
                  <div className="prose dark:prose-invert prose-lg max-w-none">
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-justify">
                      {rest.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nincs leírás megadva.</p>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar (Contact) */}
              <div className="lg:col-span-4 space-y-6">

                {/* Address Card */}
                {rest.address && (
                  <FadeUp delay={0.1}>
                    <div className="bg-gray-100 dark:bg-black/30 p-6 rounded-3xl border border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-500">
                          <IoLocationOutline className="text-2xl" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Cím</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium ml-16 leading-relaxed">
                        {rest.address}
                      </p>
                    </div>
                  </FadeUp>
                )}

                {/* Contact Actions Grid */}
                <FadeUp delay={0.2}>
                  <div className="grid grid-cols-1 gap-3">
                    {rest.phone && (
                      <a
                        href={`tel:${rest.phone}`}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl flex items-center justify-start gap-4 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><IoCallOutline className="text-xl" /></div>
                        <span className="font-bold">Asztalfoglalás</span>
                      </a>
                    )}

                    {rest.website && (
                      <a
                        href={rest.website}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all border border-sky-200 dark:border-sky-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center"><IoGlobeOutline className="text-xl" /></div>
                        <span className="font-bold">Weboldal</span>
                      </a>
                    )}

                    {rest.facebook && (
                      <a
                        href={rest.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-200 dark:border-blue-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><IoLogoFacebook className="text-xl" /></div>
                        <span className="font-bold">Facebook</span>
                      </a>
                    )}
                    {rest.email && (
                      <a
                        href={`mailto:${rest.email}`}
                        className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all border border-purple-200 dark:border-purple-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"><IoMailOutline className="text-xl" /></div>
                        <span className="font-bold">Email írása</span>
                      </a>
                    )}
                  </div>
                </FadeUp>

              </div>
            </div>

            {/* Map Section */}
            {rest.coords && (
              <FadeUp delay={0.4} className="mt-16">
                <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-xl relative group h-96">
                  <iframe
                    title="Helyszín térképe"
                    src={`https://www.google.com/maps?q=${rest.coords.lat},${rest.coords.lng}&z=16&output=embed`}
                    className="w-full h-full border-0 grayscale-[50%] group-hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 shadow-lg">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
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
