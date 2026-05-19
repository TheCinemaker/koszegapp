import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { IoCameraOutline, IoTimeOutline } from 'react-icons/io5';
import { differenceInMinutes } from 'date-fns';
import { FadeUp } from './AppleMotion';

function timeLeft(expiresAt) {
  const mins = differenceInMinutes(new Date(expiresAt), new Date());
  if (mins < 1) return 'most';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}ó`;
}

export default function MomentsStrip() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLatestMoments() {
      try {
        const { data } = await supabase
          .from('city_moments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);
        if (data) setMoments(data);
      } catch (err) {
        console.error("Hiba a Moments betöltésekor:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestMoments();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse mb-3" />
        <div className="flex gap-3 overflow-x-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-24 h-36 rounded-2xl bg-gray-200 dark:bg-zinc-800 animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <FadeUp delay={0.35}>
      <div className="mb-8 relative z-20">
        {/* Title */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            📸 Kőszeg most · Élő pillanatok
          </h2>
          <Link
            to="/moments"
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95 transition-all"
          >
            Összes ({moments.length})
          </Link>
        </div>

        {/* Horizontal Strip */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory mask-image-horizontal">
          
          {/* Post Moment Card (mindig az első) */}
          <div 
            onClick={() => navigate('/moments')}
            className="w-24 h-36 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 shrink-0 snap-start flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/40 dark:bg-zinc-900/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 active:scale-95 transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
              <IoCameraOutline />
            </div>
            <span className="text-[10px] font-black text-gray-600 dark:text-zinc-300 text-center leading-none">Te jössz!</span>
          </div>

          {/* Active Moments */}
          {moments.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate('/moments')}
              className="w-24 h-36 rounded-2xl overflow-hidden relative shrink-0 snap-start cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 bg-zinc-100 dark:bg-zinc-900 group"
            >
              <img
                src={m.photo_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* Time Remaining Badge */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold">
                <IoTimeOutline size={9} />
                {timeLeft(m.expires_at)}
              </div>

              {/* Mini Caption at bottom */}
              {m.caption && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <p className="text-white text-[9px] font-semibold leading-tight line-clamp-2 truncate-2-lines">
                    {m.caption}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Empty state prompt if no moments yet */}
          {moments.length === 0 && (
            <div 
              onClick={() => navigate('/moments')}
              className="flex-1 min-w-[200px] h-36 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 p-4 flex flex-col justify-center gap-1 cursor-pointer shrink-0 snap-start hover:border-indigo-500/30 transition-all"
            >
              <p className="text-[11px] font-black text-gray-800 dark:text-zinc-200">Mutasd meg mi újság! 🌟</p>
              <p className="text-[9px] font-medium text-gray-500 dark:text-zinc-400 leading-tight">
                Légy te az első, aki élő képet tölt fel a városról! 24 óra múlva automatikusan eltűnik.
              </p>
            </div>
          )}

        </div>
      </div>
    </FadeUp>
  );
}
