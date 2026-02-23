import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import {
  IoCalendarOutline,
  IoMapOutline,
  IoRestaurantOutline,
  IoCloudyNightOutline,
  IoWalkOutline,
  IoBedOutline,
  IoCarSportOutline,
  IoInformationCircleOutline,
  IoDiamondOutline,
  IoChevronForward,
  IoQrCode
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';

import { useTranslation } from 'react-i18next'; // Added import

export default function Home() {
  const { t } = useTranslation('home'); // Load 'home' namespace

  const sections = [
    { to: '/pass', label: t('sections.pass.label'), desc: t('sections.pass.desc'), icon: IoQrCode, gradient: 'from-indigo-600 to-purple-800', span: 'col-span-2 row-span-1', delay: 0.05 },
    { to: '/events', label: t('sections.events.label'), desc: t('sections.events.desc'), icon: IoCalendarOutline, gradient: 'from-blue-600 to-indigo-700', span: 'col-span-1 row-span-1', delay: 0.1 },
    { to: '/attractions', label: t('sections.attractions.label'), desc: t('sections.attractions.desc'), icon: IoMapOutline, gradient: 'from-emerald-500 to-teal-700', span: 'col-span-1 row-span-1', delay: 0.15 },
    { to: '/food', label: t('sections.food.label'), desc: t('sections.food.desc'), icon: IoRestaurantOutline, gradient: 'from-orange-500 to-red-600', span: 'col-span-1 row-span-1', delay: 0.2 },
    { to: '/tickets', label: t('sections.tickets.label'), desc: t('sections.tickets.desc'), icon: IoQrCode, gradient: 'from-pink-500 to-rose-600', span: 'col-span-1', delay: 0.25, comingSoon: true },
    { to: '/hotels', label: t('sections.hotels.label'), desc: t('sections.hotels.desc'), icon: IoBedOutline, gradient: 'from-violet-600 to-purple-800', span: 'col-span-1', delay: 0.3 },
    { to: '/weather', label: t('sections.weather.label'), desc: t('sections.weather.desc'), icon: IoCloudyNightOutline, gradient: 'from-sky-500 to-blue-700', span: 'col-span-1', delay: 0.35 },
    { to: '/game/intro', label: t('sections.game.label'), desc: t('sections.game.desc'), icon: IoDiamondOutline, gradient: 'from-amber-500 to-yellow-700', span: 'col-span-2 row-span-1', delay: 0.4, comingSoon: true },
    { to: '/leisure', label: t('sections.leisure.label'), desc: t('sections.leisure.desc'), icon: IoWalkOutline, gradient: 'from-lime-500 to-green-700', span: 'col-span-1', delay: 0.45 },
    { to: '/parking', label: t('sections.parking.label'), desc: t('sections.parking.desc'), icon: IoCarSportOutline, gradient: 'from-zinc-600 to-gray-800', span: 'col-span-1', delay: 0.5 },
    { to: '/info', label: t('sections.info.label'), desc: t('sections.info.desc'), icon: IoInformationCircleOutline, gradient: 'from-teal-500 to-cyan-700', span: 'col-span-2 sm:col-span-1', delay: 0.55 },
  ];

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 overflow-x-hidden selection:bg-indigo-500 selection:text-white relative">

      {/* GLOBAL BACKGROUND NOISE (Subtle) */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* --- HEADER SECTION --- */}
        <div className="mb-8 relative z-50">
          <FadeUp delay={0.2}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <SearchBar />
            </div>
          </FadeUp>
        </div>


        {/* --- ULTRA-COMPACT BENTO GRID --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
          {sections.map((sec) => (
            <FadeUp key={sec.label} delay={sec.delay + 0.2} duration={1.6} className={sec.span}>
              <Link
                to={sec.comingSoon ? '#' : sec.to}
                onClick={(e) => {
                  if (sec.comingSoon) {
                    e.preventDefault();
                    toast(t('comingSoonMessage'), { icon: '🚧' });
                  }
                }}
                className={`
                      relative h-full block rounded-[1.5rem] p-5 lg:p-6
                      bg-white/70 dark:bg-white/5 
                      backdrop-blur-[20px] backdrop-saturate-[1.6]
                      border border-white/60 dark:border-white/10
                      shadow-sm hover:shadow-xl hover:shadow-indigo-500/10
                      transition-all duration-700 hover:scale-[1.02] active:scale-[0.98]
                      flex flex-col justify-between overflow-hidden group
                      ${sec.comingSoon ? 'opacity-80 grayscale-[0.5]' : ''}
                  `}
              >
                {/* Internal Glow Gradient */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${sec.gradient} opacity-40 blur-[40px] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-1000 ease-out`} />

                {/* Icon (Ultra Compact) */}
                <div className={`
                      relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3
                      bg-gradient-to-br ${sec.gradient} text-white shadow-md shadow-gray-300/30 dark:shadow-none
                      group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 ease-out
                  `}>
                  <sec.icon />
                </div>

                {/* Content (Delayed Reveal) */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                      {sec.label}
                    </h3>
                    {!sec.comingSoon && (
                      <IoChevronForward className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-sm" />
                    )}
                  </div>
                  {/* Delayed Fade-in for slogan */}
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.9, y: 0 }}
                    transition={{ delay: sec.delay + 0.8, duration: 1.2, ease: "easeOut" }}
                    className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-tight group-hover:text-indigo-500 transition-colors duration-500"
                  >
                    {sec.desc}
                  </motion.p>
                </div>

                {/* Coming Soon Overlay (Centered) */}
                {sec.comingSoon && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[1.5rem]">
                    <span className="text-lg font-black uppercase tracking-widest text-white drop-shadow-md transform -rotate-12 border-2 border-white/50 px-4 py-1 rounded-xl">
                      {t('comingSoon')}
                    </span>
                  </div>
                )}

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-200%] group-hover:animate-shine opacity-30 duration-1000" />

              </Link>
            </FadeUp>
          ))}
        </div>
      </div>

    </div>
  );
}
