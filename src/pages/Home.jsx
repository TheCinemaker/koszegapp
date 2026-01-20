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
  IoChevronForward
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import { FadeUp } from '../components/AppleMotion';

const sections = [
  { to: '/events', label: 'Események', desc: 'Élmények. Élőben.', icon: IoCalendarOutline, gradient: 'from-blue-600 to-indigo-700', span: 'col-span-2 row-span-1', delay: 0.1 },
  { to: '/attractions', label: 'Látnivalók', desc: 'Időtlen kincsek.', icon: IoMapOutline, gradient: 'from-emerald-500 to-teal-700', span: 'col-span-1 row-span-1', delay: 0.15 },
  { to: '/gastronomy', label: 'Gasztró', desc: 'Ízek harmóniája.', icon: IoRestaurantOutline, gradient: 'from-orange-500 to-red-700', span: 'col-span-1', delay: 0.2 },
  { to: '/weather', label: 'Időjárás', desc: 'Tiszta kilátások.', icon: IoCloudyNightOutline, gradient: 'from-sky-500 to-blue-700', span: 'col-span-1', delay: 0.25 },
  { to: '/leisure', label: 'Szabadidő', desc: 'Kalandra hív.', icon: IoWalkOutline, gradient: 'from-lime-500 to-green-700', span: 'col-span-1', delay: 0.3 },
  { to: '/hotels', label: 'Szállás', desc: 'Nyugalom szigete.', icon: IoBedOutline, gradient: 'from-violet-600 to-purple-800', span: 'col-span-1', delay: 0.35 },
  { to: '/parking', label: 'Parkolás', desc: 'Célba értél.', icon: IoCarSportOutline, gradient: 'from-zinc-600 to-gray-800', span: 'col-span-1', delay: 0.4 },
  { to: '/info', label: 'Infó', desc: 'Hasznos tudás.', icon: IoInformationCircleOutline, gradient: 'from-teal-500 to-cyan-700', span: 'col-span-1', delay: 0.45 },
  // { to: '/game/intro', label: 'KőszegQuest', desc: 'A te legendád.', icon: IoDiamondOutline, gradient: 'from-amber-500 to-yellow-700', span: 'col-span-2 sm:col-span-3', special: true, delay: 0.5 },
];

export default function Home() {

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
                to={sec.to}
                className={`
                      relative h-full block rounded-[1.5rem] p-5 lg:p-6
                      bg-white/70 dark:bg-white/5 
                      backdrop-blur-[20px] backdrop-saturate-[1.6]
                      border border-white/60 dark:border-white/10
                      shadow-sm hover:shadow-xl hover:shadow-indigo-500/10
                      transition-all duration-700 hover:scale-[1.02] active:scale-[0.98]
                      flex flex-col justify-between overflow-hidden group
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
                    <IoChevronForward className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-sm" />
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
