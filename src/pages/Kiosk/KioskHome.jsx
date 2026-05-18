// src/pages/Kiosk/KioskHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCalendarOutline,
  IoMapOutline,
  IoRestaurantOutline,
  IoCameraOutline,
  IoCarSportOutline,
  IoLocationOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';

export default function KioskHome({ appData, weather }) {
  const navigate = useNavigate();
  const [showScreensaver, setShowScreensaver] = useState(() => {
    return sessionStorage.getItem('kiosk-started') !== 'true';
  });
  const [activeSlide, setActiveSlide] = useState(0);

  // Vertical slideshow images for Attract Loop (screensaver)
  const screensaverImages = [
    'https://images.unsplash.com/photo-1573155993874-d5d48af862ba?q=80&w=1080&auto=format&fit=crop', // Scenic historic street
    'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080&auto=format&fit=crop', // Grapes / Wine theme
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1080&auto=format&fit=crop'  // Beautiful scenic nature
  ];

  // Rotate screensaver images every 6 seconds
  useEffect(() => {
    if (!showScreensaver) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % screensaverImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [showScreensaver, screensaverImages.length]);

  // Listen to idle trigger event
  useEffect(() => {
    const handleIdleTrigger = () => {
      sessionStorage.setItem('kiosk-started', 'false');
      setShowScreensaver(true);
    };
    window.addEventListener('kiosk-idle-trigger', handleIdleTrigger);
    return () => window.removeEventListener('kiosk-idle-trigger', handleIdleTrigger);
  }, []);

  const handleStart = () => {
    sessionStorage.setItem('kiosk-started', 'true');
    setShowScreensaver(false);
  };

  const menuItems = [
    {
      to: '/kiosk/selfie',
      label: 'Digitális Képeslap Szelfi',
      desc: 'Készíts egy ingyenes fényképet egyedi kőszegi keretekkel, és töltsd le azonnal a telefonodra QR-kóddal!',
      icon: IoCameraOutline,
      gradient: 'from-pink-500 via-rose-500 to-purple-700',
      span: 'col-span-2',
      highlight: true
    },
    {
      to: '/kiosk/attractions',
      label: 'Látnivalók a közelemben',
      desc: 'Fedezd fel Kőszeg nevezetességeit (Jurisics-vár, Hősök kapuja) a termináltól mért távolságuk alapján!',
      icon: IoMapOutline,
      gradient: 'from-emerald-500 to-teal-700',
      span: 'col-span-2 sm:col-span-1'
    },
    {
      to: '/kiosk/events',
      label: 'Programok & Események',
      desc: 'Böngészd a város legfrissebb kulturális fesztiváljait, színházi előadásait és boros eseményeit!',
      icon: IoCalendarOutline,
      gradient: 'from-blue-500 to-indigo-700',
      span: 'col-span-2 sm:col-span-1'
    },
    {
      to: '/kiosk/gastronomy',
      label: 'Gasztronómia Kalauz',
      desc: 'Tudd meg, milyen éttermek, borozók és cukrászdák állnak hozzád a legközelebb (Portré Étterem 0 m-re)!',
      icon: IoRestaurantOutline,
      gradient: 'from-orange-500 to-red-600',
      span: 'col-span-2 sm:col-span-1'
    },
    {
      to: '/kiosk/varszinhaz',
      label: 'Kőszegi Várszínház',
      desc: 'Böngészd a Várszínház szezonális színházi, szabadtéri és zenés előadásait!',
      icon: IoSparklesOutline,
      gradient: 'from-amber-500 via-orange-500 to-amber-700',
      span: 'col-span-2 sm:col-span-1'
    }
  ];

  if (showScreensaver) {
    return (
      <div 
        onClick={handleStart}
        className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden flex flex-col justify-between cursor-pointer select-none"
      >
        {/* Background Slideshow */}
        <div className="absolute inset-0 z-0 bg-black">
          {screensaverImages.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                idx === activeSlide ? 'opacity-55' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          {/* Vignette & Radial Shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />
        </div>

        {/* Top Header Overlay */}
        <div className="relative z-10 p-8 w-full flex flex-col items-center gap-1">
          <span className="text-zinc-300 text-xs tracking-[0.25em] font-bold uppercase mb-2">Városi Információs Terminál</span>
          <div className="flex items-center text-readability-shadow">
            <span className="text-4xl font-extrabold text-white tracking-tight uppercase">visit</span>
            <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent tracking-tighter uppercase ml-1">Kőszeg</span>
          </div>
          <div className="w-12 h-1 bg-indigo-500 rounded-full mt-4" />
        </div>

        {/* Center: Message & Touch to Start */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center p-8 text-center gap-6 my-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight uppercase">
              Fedezd fel<br />Kőszeg csodáit!
            </h1>
            <p className="text-zinc-200 text-sm font-semibold max-w-sm drop-shadow-md mx-auto">
              Látnivalók, éttermek, aktív programok és ingyenes képeslap szelfipont egyetlen helyen.
            </p>
          </div>

          {/* Custom Breathe Animation Keyframes */}
          <style>{`
            @keyframes breathe {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.4);
              }
              50% {
                transform: scale(1.04);
                box-shadow: 0 20px 35px -5px rgba(79, 70, 229, 0.6), 0 12px 16px -6px rgba(79, 70, 229, 0.6);
              }
            }
            @keyframes breathe-blur {
              0%, 100% {
                transform: scale(0.95);
                opacity: 0.45;
              }
              50% {
                transform: scale(1.15);
                opacity: 0.75;
              }
            }
            .kiosk-btn-breathe {
              animation: breathe 3s ease-in-out infinite;
            }
            .kiosk-blur-breathe {
              animation: breathe-blur 3s ease-in-out infinite;
            }
          `}</style>

          {/* Large breathing touch target */}
          <div className="relative mt-8 group">
            <div 
              className="absolute inset-0 bg-indigo-600 rounded-full blur-2xl kiosk-blur-breathe" 
            />
            <button 
              className="relative px-8 py-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-lg shadow-2xl border border-indigo-400/30 flex items-center gap-3 kiosk-btn-breathe"
            >
              <span>Érintsd meg a kezdéshez!</span>
            </button>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 p-8 w-full flex justify-between items-center text-zinc-400 text-xs font-semibold border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <IoLocationOutline className="text-indigo-400 text-base" />
            <span>Most itt vagy: Fő tér 7. (Portré Étterem mellett)</span>
          </div>
          <span>www.visitkoszeg.hu</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col justify-start gap-8 select-none">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none uppercase">
            Üdvözöljük Kőszegen!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold flex items-center gap-1.5">
            <IoLocationOutline className="text-indigo-500 dark:text-indigo-400 text-base" />
            Most itt vagy: Fő tér 7. (Portré Étterem mellett)
          </p>
        </div>

        {/* Bento Touch Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.to)}
                className={`
                  ${item.span}
                  relative rounded-[2rem] p-6 cursor-pointer overflow-hidden group
                  bg-white/80 dark:bg-zinc-900/60
                  backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/80
                  shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-indigo-500/5
                  transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]
                  flex flex-col justify-between gap-6
                  ${item.highlight ? 'ring-2 ring-rose-500/20 dark:ring-rose-500/10 shadow-[0_10px_30px_rgba(244,63,94,0.06)]' : ''}
                `}
              >
                {/* Visual Accent Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-[0.08] dark:opacity-[0.15] blur-3xl rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500`} />

                {/* Top Section: Icon & Pulsing indicators */}
                <div className="flex justify-between items-start">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center text-3xl
                    bg-gradient-to-br ${item.gradient} text-white shadow-md
                    group-hover:rotate-3 group-hover:scale-105 transition-all duration-300
                  `}>
                    <Icon />
                  </div>

                  {item.highlight && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 dark:bg-rose-500/20 text-rose-500 text-[10px] font-black tracking-wider uppercase border border-rose-500/20">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      INGYENES
                    </div>
                  )}
                </div>

                {/* Bottom Section: Text Content */}
                <div className="flex flex-col gap-1.5 relative z-10">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
