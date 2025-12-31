import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAttractionById } from '../api';
import {
  IoArrowBack,
  IoTimeOutline,
  IoWalletOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoMapOutline,
  IoDiamond
} from 'react-icons/io5';
import { motion } from 'framer-motion';

import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

export default function AttractionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attr, setAttr] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAttractionById(id)
      .then(data => {
        setAttr(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setAttr(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !attr) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A látnivaló nem található."}</p>
        <button
          onClick={() => navigate('/attractions')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Vissza a látnivalókhoz
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10 selection:bg-indigo-500 selection:text-white">

      {/* GLOBAL BACKGROUND NOISE (Subtle) */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO IMAGE SECTION (PARALLAX) --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        {/* Parallax Image */}
        {attr.image ? (
          <ParallaxImage
            src={attr.image}
            className="w-full h-full"
            scale={1.15} // Slight zoom for parallax room
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/attractions')}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Hero Title (Parallaxed Text) */}
        <motion.div
          className="absolute bottom-16 left-6 right-6 z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="px-4 py-1.5 rounded-full bg-indigo-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest mb-4 inline-block shadow-lg">
            {attr.category || "Látnivaló"}
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tighter leading-none max-w-4xl">
            {attr.name}
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

              {/* LEFT COLUMN: Description */}
              <div className="lg:col-span-8 space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <IoDiamond className="text-indigo-500" />
                  Áttekintés
                </h2>
                <div className="prose dark:prose-invert prose-lg max-w-none">
                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-justify">
                    {attr.details || attr.description || "Nincs részletes leírás ehhez a látnivalóhoz."}
                  </p>
                </div>

                {/* Gallery Placeholder (If existed, would go here) */}
              </div>

              {/* RIGHT COLUMN: Info Grid (Bento) */}
              <div className="lg:col-span-4 space-y-6">

                {/* Hours */}
                <FadeUp delay={0.1}>
                  <div className="bg-gray-100 dark:bg-black/30 p-6 rounded-3xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-500">
                        <IoTimeOutline className="text-2xl" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Nyitvatartás</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium whitespace-pre-line ml-16">
                      {attr.hours || "Nincs megadva"}
                    </p>
                  </div>
                </FadeUp>

                {/* Prices */}
                {attr.price && (
                  <FadeUp delay={0.2}>
                    <div className="bg-gray-100 dark:bg-black/30 p-6 rounded-3xl border border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-green-500/20 text-green-500">
                          <IoWalletOutline className="text-2xl" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Jegyárak</h3>
                      </div>
                      <ul className="space-y-3 ml-16">
                        {attr.price.adult && <li className="flex justify-between text-sm"><span className="text-gray-500">Felnőtt</span> <span className="font-bold dark:text-white">{attr.price.adult}</span></li>}
                        {attr.price.studentSenior && <li className="flex justify-between text-sm"><span className="text-gray-500">Diák/Nyugg.</span> <span className="font-bold dark:text-white">{attr.price.studentSenior}</span></li>}
                        {attr.price.childUnder6 && <li className="flex justify-between text-sm"><span className="text-gray-500">Gyermek</span> <span className="font-bold dark:text-white">{attr.price.childUnder6}</span></li>}
                      </ul>
                    </div>
                  </FadeUp>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  {attr.phone && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`tel:${attr.phone}`}
                      className="col-span-1 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors"
                    >
                      <IoCallOutline className="text-2xl" />
                      <span className="text-xs font-bold uppercase tracking-wider">Hívás</span>
                    </motion.a>
                  )}
                  {attr.website && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={attr.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-1 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg transition-colors"
                    >
                      <IoGlobeOutline className="text-2xl" />
                      <span className="text-xs font-bold uppercase tracking-wider">Web</span>
                    </motion.a>
                  )}
                </div>

              </div>

            </div>

            {/* Map Section (Full Width) */}
            <FadeUp delay={0.4} className="mt-16">
              <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-xl relative group h-96">
                <iframe
                  title="Térkép"
                  src={`https://www.google.com/maps?q=${attr.coordinates.lat},${attr.coordinates.lng}&z=16&output=embed`}
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

          </div>
        </FadeUp>
      </div>
    </div>
  );
}
