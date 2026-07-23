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
import LoadingSpinner from '../components/LoadingSpinner';

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
      <LoadingSpinner fullScreen={true} label="Szállás betöltése..." />
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-6 text-lg font-medium">Hiba: {error || "A szállás nem található."}</p>
        <button
          onClick={() => navigate('/hotels')}
          className="px-6 py-3 bg-brand text-gold-light rounded-control font-semibold shadow-card border border-gold/30 hover:opacity-90 transition-opacity"
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
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark overflow-x-hidden pb-10">

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

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />

        {/* --- NAVIGATION --- */}
        <div className="absolute top-6 left-6 z-50">
          <button
            onClick={() => navigate('/hotels')}
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
            <span className="px-4 py-1.5 rounded-full bg-brand text-gold-light text-xs font-bold uppercase tracking-widest shadow-card border border-gold/40">
              {hotel.type || "Szállás"}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-2xl tracking-tight leading-tight max-w-4xl">
            {hotel.name}
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

                {/* Amenities */}
                {hotel.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {hotel.amenities.map((a, i) => (
                      <span key={i} className="bg-gold/15 text-gold-text dark:text-gold-light text-xs font-semibold px-4 py-2 rounded-full border border-gold/30 flex items-center gap-2">
                        {a.toLowerCase().includes('wifi') && <IoWifi />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <IoBedOutline className="text-gold-text dark:text-gold-light" />
                  Rövid leírás
                </h2>

                <div className="prose dark:prose-invert prose-lg max-w-none">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {hotel.description || "Nincs leírás megadva."}
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar */}
              <div className="lg:col-span-4 space-y-6">

                {/* Address Card */}
                <FadeUp delay={0.1}>
                  <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-control border border-slate-200/60 dark:border-white/5 space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-gold/15 text-gold-text dark:text-gold-light border border-gold/30">
                          <IoLocationOutline className="text-xl" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cím</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium text-sm leading-relaxed">
                        {hotel.address}
                      </p>
                    </div>
                  </div>
                </FadeUp>

                {/* Contact Actions */}
                <FadeUp delay={0.2}>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Booking Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBooking}
                      className="bg-brand text-gold-light p-4 rounded-control flex items-center justify-start gap-4 shadow-card border border-gold/30 transition-all hover:opacity-90"
                    >
                      <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40">
                        <IoBedOutline className="text-lg text-gold-light" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-xs uppercase tracking-wider leading-none">Foglalás</span>
                        <span className="text-[10px] opacity-80 font-medium uppercase tracking-wider">A Booking.com-on</span>
                      </div>
                    </motion.button>

                    {hotel.website && (
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-control flex items-center justify-start gap-4 hover:bg-gold/10 transition-all border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30"><IoGlobeOutline className="text-lg" /></div>
                        <span className="font-semibold text-sm">Hivatalos Weboldal</span>
                      </a>
                    )}

                    {hotel.phone && (
                      <a
                        href={`tel:${hotel.phone}`}
                        className="bg-slate-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-control flex items-center justify-start gap-4 hover:bg-gold/10 transition-all border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30"><IoCallOutline className="text-lg" /></div>
                        <span className="font-semibold text-sm">Hívás</span>
                      </a>
                    )}

                    {hotel.email && (
                      <a
                        href={`mailto:${hotel.email}`}
                        className="bg-slate-100 dark:bg-white/5 text-gray-900 dark:text-white p-4 rounded-control flex items-center justify-start gap-4 hover:bg-gold/10 transition-all border border-slate-200/60 dark:border-white/5"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/15 text-gold-text dark:text-gold-light flex items-center justify-center border border-gold/30"><IoMailOutline className="text-lg" /></div>
                        <span className="font-semibold text-sm">Email</span>
                      </a>
                    )}
                  </div>
                </FadeUp>

              </div>
            </div>

            {/* Map Section */}
            {hotel.coords && (
              <FadeUp delay={0.4} className="mt-12">
                <div className="overflow-hidden rounded-card border border-slate-200/80 dark:border-white/10 shadow-card relative group h-80">
                  <iframe
                    title="Helyszín térképe"
                    src={`https://www.google.com/maps?q=${hotel.coords.lat},${hotel.coords.lng}&z=16&output=embed`}
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
