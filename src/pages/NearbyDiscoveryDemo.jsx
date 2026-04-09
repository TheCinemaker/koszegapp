import React, { useState } from 'react';
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
  IoChevronForward,
  IoQrCode
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LiveHero from '../components/LiveHero';
import NearbyDiscoveryCard from '../components/NearbyDiscoveryCard';

export default function NearbyDiscoveryDemo({ appData, weather }) {
  const { t } = useTranslation('home');

  const sections = [
    { to: '/pass', label: t('sections.pass.label'), desc: t('sections.pass.desc'), icon: IoQrCode, gradient: 'from-indigo-600 to-purple-800', span: 'col-span-2 row-span-1', delay: 0.05 },
    { to: '/events', label: t('sections.events.label'), desc: t('sections.events.desc'), icon: IoCalendarOutline, gradient: 'from-blue-600 to-indigo-700', span: 'col-span-1 row-span-1', delay: 0.1 },
    { to: '/attractions', label: t('sections.attractions.label'), desc: t('sections.attractions.desc'), icon: IoMapOutline, gradient: 'from-emerald-500 to-teal-700', span: 'col-span-1 row-span-1', delay: 0.15 },
    { to: '/gastronomy', label: t('sections.food.label'), desc: t('sections.food.desc'), icon: IoRestaurantOutline, gradient: 'from-orange-500 to-red-600', span: 'col-span-1 row-span-1', delay: 0.2 },
    { to: '/booking', label: t('sections.booking.label'), desc: t('sections.booking.desc'), icon: IoBedOutline, gradient: 'from-blue-700 to-blue-900', span: 'col-span-1', delay: 0.25 },
    { to: '/hotels', label: t('sections.hotels.label'), desc: t('sections.hotels.desc'), icon: IoBedOutline, gradient: 'from-violet-600 to-purple-800', span: 'col-span-1', delay: 0.3 },
    { to: '/weather', label: t('sections.weather.label'), desc: t('sections.weather.desc'), icon: IoCloudyNightOutline, gradient: 'from-sky-500 to-blue-700', span: 'col-span-1', delay: 0.35 },
    { to: '/leisure', label: t('sections.leisure.label'), desc: t('sections.leisure.desc'), icon: IoWalkOutline, gradient: 'from-lime-500 to-green-700', span: 'col-span-1', delay: 0.45 },
    { to: '/parking', label: t('sections.parking.label'), desc: t('sections.parking.desc'), icon: IoCarSportOutline, gradient: 'from-zinc-600 to-gray-800', span: 'col-span-1', delay: 0.5 },
    { to: '/info', label: t('sections.info.label'), desc: t('sections.info.desc'), icon: IoInformationCircleOutline, gradient: 'from-teal-500 to-cyan-700', span: 'col-span-2 sm:col-span-1', delay: 0.55 },
  ];

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 overflow-x-hidden selection:bg-indigo-500 selection:text-white relative bg-slate-50 dark:bg-zinc-950">
      
      {/* BACKGROUND NOISE */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* 1. ORIGINAL LIVE HERO */}
        <LiveHero appData={appData} weather={weather} />

        {/* 2. SEARCH BAR */}
        <div className="mb-6 relative z-50">
          <FadeUp delay={0.1}>
             <SearchBar />
          </FadeUp>
        </div>

        {/* 3. NEW: NEARBY DISCOVERY (REAL-TIME) */}
        <FadeUp delay={0.2}>
           <NearbyDiscoveryCard appData={appData} />
        </FadeUp>

        {/* 4. ORIGINAL BENTO GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
          {sections.map((sec) => (
            <FadeUp key={sec.label} delay={sec.delay + 0.3} duration={1} className={sec.span}>
              <Link
                to={sec.to}
                className="relative h-full block rounded-[1.5rem] p-5 lg:p-6 bg-white/70 dark:bg-white/5 backdrop-blur-[20px] border border-white/60 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${sec.gradient} opacity-20 blur-[30px] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-1000`} />
                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3 bg-gradient-to-br ${sec.gradient} text-white`}>
                  <sec.icon />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{sec.label}</h3>
                    <IoChevronForward className="text-gray-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-sm" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 transition-colors">{sec.desc}</p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </div>
  );
}
