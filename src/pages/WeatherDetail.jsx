import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoLogoFacebook, IoArrowForward, IoCloudOutline, IoOpenOutline, IoSunny } from 'react-icons/io5';
import GhostImage from '../components/GhostImage';
import { FadeUp } from '../components/AppleMotion';

export default function WeatherDetail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-900 overflow-x-hidden pb-10">

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        {/* Sky/Blue Gradient Hero - Apple Weather Style */}
        <div className="w-full h-full bg-gradient-to-b from-sky-400 to-blue-600 relative">

          {/* Animated Sun/Cloud Element (Visual Interest) */}
          <div className="absolute top-10 right-10 opacity-20 animate-pulse-slow">
            <IoSunny className="text-9xl text-yellow-300 blur-xl" />
          </div>

          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
        </div>

        {/* Gradient Overlay (Top & Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

        {/* --- NAVIGATION (BLACK BACK ARROW) --- */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md shadow-lg border border-white/20 text-white transition-all duration-300 group active:scale-95"
          >
            <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Title floating on image */}
        <div className="absolute bottom-16 left-6 right-6 z-10">
          <FadeUp>
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-sm overflow-hidden">
                <img src="/images/kie_logo.jpg" alt="KIE Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-sky-100 uppercase tracking-widest bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                Hivatalos Oldal
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-md tracking-tight leading-tight mb-2">
              Kőszegi Időjárás<br />
              <span className="text-sky-100">Előrejelzés</span>
            </h1>
            <p className="text-white/80 text-sm md:text-base font-medium max-w-md">
              Hiteles és részletes helyi előrejelzések egyenesen a forrásból.
            </p>
          </FadeUp>
        </div>
      </div>

      {/* --- CONTENT SHEET (GLASS CARD) --- */}
      <div className="relative -mt-10 px-4 z-20">
        <FadeUp delay={0.2} duration={1.0}>
          <div className="
                bg-white/80 dark:bg-[#1a1c2e]/80
                backdrop-blur-[40px] backdrop-saturate-[1.8]
                rounded-[2.5rem]
                border border-white/60 dark:border-white/10
                shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
                p-6 sm:p-10
                min-h-[50vh]
            ">

            {/* Quick Stats / Info Row */}
            <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex-shrink-0 bg-sky-50 dark:bg-sky-900/20 px-5 py-3 rounded-2xl border border-sky-100 dark:border-sky-800/30">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Forrás</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">Kőszegi Időjárás Előrejelzés</span>
              </div>
              <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 px-5 py-3 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Frissítés</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">Napi szinten</span>
              </div>
            </div>

            {/* Action Grid (Bento Style) */}
            <div className="grid grid-cols-1 gap-4 mb-8">

              {/* Primary Action: Open Facebook */}
              <a
                href="https://www.facebook.com/idojaraskoszeg.hu"
                target="_blank"
                rel="noopener noreferrer"
                className="
                        group relative overflow-hidden
                        bg-gradient-to-br from-[#1877F2] to-[#0056b3]
                        p-6 sm:p-8 rounded-[2rem]
                        text-white shadow-xl shadow-blue-500/20
                        transition-all duration-500 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.98]
                    "
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500 border-4 border-white/20 overflow-hidden">
                    <img src="/images/kie_logo.jpg" alt="KIE Logo" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 leading-tight">Kőszegi Időjárás<br />Előrejelzés</h3>
                    <p className="text-blue-100 text-sm mb-5 leading-relaxed max-w-sm mx-auto sm:mx-0 font-medium">
                      Kövesd a hivatalos Facebook oldalt a legfrissebb helyi adatokért és Ráduly László elemzéseiért.
                    </p>
                    <span className="inline-flex items-center gap-2 bg-white text-[#1877F2] px-6 py-3 rounded-2xl font-bold text-sm shadow-sm group-hover:bg-blue-50 transition-colors">
                      Megnyitás <IoArrowForward />
                    </span>
                  </div>
                </div>
              </a>

            </div>

            {/* Bottom Spacing */}
            <div className="h-10" />

          </div>
        </FadeUp>
      </div>
    </div>
  );
}
