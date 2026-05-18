// src/pages/Kiosk/KioskAttractionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IoLocationOutline, IoWalkOutline, IoBookmarkOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { fetchAttractionById } from '../../api';
import { getDistance, formatDistance } from './KioskAttractions';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

export default function KioskAttractionDetail() {
  const { id } = useParams();
  const [attr, setAttr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchAttractionById(id)
      .then(data => {
        if (isMounted) {
          setAttr(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load attraction detail in Kiosk:", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black">
        <KioskHeader />
        <div className="flex-1 flex items-center justify-center text-zinc-400 font-bold animate-pulse">
          Részletek betöltése...
        </div>
      </div>
    );
  }

  if (!attr) {
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black">
        <KioskHeader />
        <div className="flex-1 flex items-center justify-center text-rose-500 font-bold">
          A látnivaló nem található.
        </div>
      </div>
    );
  }

  const distance = getDistance(KIOSK_LAT, KIOSK_LNG, attr.coords?.lat, attr.coords?.lng);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none">
        
        {/* Large Portrait banner card */}
        <div className="relative rounded-[2.5rem] overflow-hidden w-full h-[320px] shadow-lg shrink-0 border border-zinc-200/50 dark:border-zinc-800/50">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${
                attr.image 
                  ? (attr.image.startsWith('http') || attr.image.startsWith('/images/') ? attr.image : `/images/${attr.image}`) 
                  : '/images/event_default.jpg'
              })`
            }}
          />
          {/* Subtle Shadow Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

          {/* Floating Proximity Badge */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 px-4 py-2 rounded-full bg-white/90 dark:bg-zinc-900/90 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm shadow-md border border-zinc-200/20 dark:border-zinc-700/20">
            <IoWalkOutline className="text-lg" />
            <span>{formatDistance(distance)} tőled</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            {attr.tags && attr.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="px-2.5 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50 text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight uppercase">
            {attr.name}
          </h2>
          <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <IoLocationOutline className="text-base text-indigo-500 dark:text-indigo-400" />
            <span>{attr.address}</span>
          </div>
        </div>

        {/* Description & Content */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-zinc-900/55 border border-zinc-200/50 dark:border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <IoBookmarkOutline />
              Leírás
            </h3>
            <p className="text-zinc-700 dark:text-zinc-250 text-sm leading-relaxed font-semibold whitespace-pre-line">
              {attr.details || attr.description}
            </p>
          </div>

          {/* Quick Static Information Widget */}
          <div className="rounded-3xl p-5 bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/10 dark:border-indigo-400/10 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Nyitva tartás</span>
              <span className="text-zinc-950 dark:text-white font-extrabold">Egész évben szabadon látogatható</span>
            </div>
            <div className="w-full h-[1px] bg-zinc-200/50 dark:bg-zinc-800/50 my-1" />
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Belépés</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Ingyenes</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
