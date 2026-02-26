import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchHotels } from '../api';
import {
  IoArrowBack,
  IoCallOutline,
  IoGlobeOutline,
  IoMailOutline,
  IoMapOutline,
  IoLocationOutline,
  IoWifi,
  IoBedOutline
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import GhostImage from '../components/GhostImage';
import { FadeUp, ParallaxImage } from '../components/AppleMotion';

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHotels()
      .then(data => {
        const found = data.find(h => String(h.id) === id);
        if (!found) setError('Nem található ilyen szállás.');
        else setHotel(found);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-violet-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A szállás nem található."}</p>
        <button
          onClick={() => navigate('/hotels')}
          className="px-6 py-3 bg-violet-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Vissza a listához
        </button>
      </div>
    );
  }

  const handleBooking = () => {
    if (!hotel) return;
    const baseUrl = "https://www.booking.com/searchresults.html";
    const params = new URLSearchParams({
      ss: hotel.name,
      aid: "7885594",
      label: `cj-7885594`,
      utm_source: "cj",
      utm_medium: "affiliate",
      utm_campaign: "7885594",
      utm_content: "hotel_detail"
    });
    window.open(`${baseUrl}?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10 selection:bg-violet-500 selection:text-white">

      {/* GLOBAL BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        {hotel.image ? (
          <ParallaxImage
            src={`/images/hotels/${hotel.image}`}
            className="w-full h-full object-cover"
            scale={1.05}
          />
        ) : (
          <GhostImage className="w-full h-full" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/hotels')}
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
            <span className="px-4 py-1.5 rounded-full bg-violet-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest shadow-lg">
              {hotel.type || "Szállás"}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tighter leading-none max-w-4xl">
            {hotel.name}
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

                {/* Amenities */}
                {hotel.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {hotel.amenities.map((a, i) => (
                      <span key={i} className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-200 text-sm font-bold px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 flex items-center gap-2">
                        {/* Try to match common amenities */}
                        {a.toLowerCase().includes('wifi') && <IoWifi />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <IoBedOutline className="text-violet-500" />
                  Rövid leírás
                </h2>

                <div className="prose dark:prose-invert prose-lg max-w-none">
                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-justify">
                    {hotel.description || "Nincs leírás megadva."}
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar */}
              <div className="lg:col-span-4 space-y-6">

                {/* Address Card */}
                <FadeUp delay={0.1}>
                  <div className="bg-gray-100 dark:bg-black/30 p-6 rounded-3xl border border-gray-200 dark:border-white/10 space-y-6">

                    {/* Address */}
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-500">
                          <IoLocationOutline className="text-2xl" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Cím</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium ml-16">
                        {hotel.address}
                      </p>
                    </div>

                    {/* NOTE: Prices REMOVED as per user request */}
                  </div>
                </FadeUp>

                {/* Contact Actions */}
                <FadeUp delay={0.2}>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Booking Button - Primary Action */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBooking}
                      className="bg-[#007AFF] text-white p-4 rounded-2xl flex items-center justify-start gap-4 shadow-lg shadow-blue-500/20 transition-all border border-transparent"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <IoBedOutline className="text-xl" />
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-xs uppercase tracking-tight leading-none">Foglalás</span>
                        <span className="text-[10px] opacity-80 font-bold uppercase tracking-tighter">A Booking.com-on</span>
                      </div>
                    </motion.button>

                    {hotel.website && (
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center"><IoGlobeOutline className="text-xl text-violet-500" /></div>
                        <span className="font-bold">Hivatalos Weboldal</span>
                      </a>
                    )}

                    {hotel.phone && (
                      <a
                        href={`tel:${hotel.phone}`}
                        className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center"><IoCallOutline className="text-xl text-indigo-500" /></div>
                        <span className="font-bold">Hívás</span>
                      </a>
                    )}

                    {hotel.email && (
                      <a
                        href={`mailto:${hotel.email}`}
                        className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-2xl flex items-center justify-start gap-4 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"><IoMailOutline className="text-xl text-purple-500" /></div>
                        <span className="font-bold">Email</span>
                      </a>
                    )}
                  </div>
                </FadeUp>

              </div>
            </div>

            {/* Map Section */}
            {hotel.coords && (
              <FadeUp delay={0.4} className="mt-16">
                <div className="overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-xl relative group h-96">
                  <iframe
                    title="Helyszín térképe"
                    src={`https://www.google.com/maps?q=${hotel.coords.lat},${hotel.coords.lng}&z=16&output=embed`}
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
