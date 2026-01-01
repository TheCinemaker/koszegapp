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
  IoStatsChartOutline
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

export default function LeisureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-screen text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A program nem található."}</p>
        <button
          onClick={() => navigate('/leisure')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

  // Icon logic based on type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'hike': return <IoWalkOutline />;
      case 'bike': return <IoBicycleOutline />;
      case 'park': return <IoLeafOutline />;
      default: return <IoInformationCircleOutline />;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'hike': return 'Túraútvonal';
      case 'park': return 'Park / Tanösvény';
      case 'playground': return 'Játszótér';
      case 'bike': return 'Kerékpárút';
      default: return type || 'Egyéb';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10 selection:bg-teal-500 selection:text-white">

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        {item.image ? (
          <ParallaxImage
            src={`/images/leisure/${item.image}`}
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
            onClick={() => navigate('/leisure')}
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
          <div className="flex gap-2 mb-4">
            <span className="px-4 py-1.5 rounded-full bg-teal-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
              {getTypeIcon(item.type)} {getTypeName(item.type)}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tighter leading-none max-w-4xl">
            {item.name}
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

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <IoInformationCircleOutline className="text-teal-500" />
                  Rövid leírás
                </h2>

                {item.shortDescription && (
                  <p className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {item.shortDescription}
                  </p>
                )}

                <div className="prose dark:prose-invert prose-lg max-w-none">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-justify">
                    {item.description || "Nincs bővebb leírás."}
                  </p>
                </div>

              </div>

              {/* RIGHT COLUMN: Sidebar Stats & Actions */}
              <div className="lg:col-span-4 space-y-6">

                {/* Stats Card */}
                <FadeUp delay={0.1}>
                  <div className="bg-gray-100 dark:bg-black/30 p-6 rounded-3xl border border-gray-200 dark:border-white/10">
                    {item.lengthKm ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-2">
                          <IoStatsChartOutline className="text-3xl" />
                        </div>
                        <div className="text-4xl font-black text-gray-900 dark:text-white">
                          {item.lengthKm} <span className="text-lg text-gray-500 font-medium">km</span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Távolság</span>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 italic">
                        Nincs távolsági adat.
                      </div>
                    )}
                  </div>
                </FadeUp>

                {/* Actions Grid */}
                <FadeUp delay={0.2}>
                  <div className="grid grid-cols-1 gap-3">
                    {item.mapUrl && (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl flex items-center justify-start gap-4 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><IoNavigateOutline className="text-xl" /></div>
                        <span className="font-bold">Útvonaltervezés</span>
                      </a>
                    )}

                    {item.moreInfoUrl && (
                      <a
                        href={item.moreInfoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all border border-sky-200 dark:border-sky-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center"><IoGlobeOutline className="text-xl" /></div>
                        <span className="font-bold">Bővebb infó</span>
                      </a>
                    )}

                    {item.gpxUrl && (
                      <a
                        href={item.gpxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all border border-teal-200 dark:border-teal-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center"><IoDownloadOutline className="text-xl" /></div>
                        <span className="font-bold">GPX Letöltés</span>
                      </a>
                    )}
                  </div>
                </FadeUp>

              </div>
            </div>

            {/* Map Section */}
            {item.coords && (
              <FadeUp delay={0.4} className="mt-16">
                <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-xl relative group h-96">
                  <iframe
                    title="Helyszín térképe"
                    src={`https://www.google.com/maps?q=${item.coords.lat},${item.coords.lng}&z=15&output=embed`}
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
