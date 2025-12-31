import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoLogoFacebook, IoArrowForward, IoCloudOutline, IoOpenOutline } from 'react-icons/io5';
import GhostImage from '../components/GhostImage';

export default function WeatherDetail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-10">

      {/* --- HERO IMAGE SECTION --- */}
      <div className="relative h-[55vh] w-full">
        {/* Abstract Gradient Hero showing "Weather" vibes */}
        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
        </div>

        {/* Gradient Overlay (Top & Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* --- NAVIGATION (BLACK BACK ARROW) --- */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/80 text-white backdrop-blur-md shadow-2xl border border-white/10 hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <IoArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Title floating on image */}
        <div className="absolute bottom-12 left-6 right-6 z-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
              <IoCloudOutline className="text-xl" />
            </div>
            <span className="text-sm font-bold text-white/80 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              Hivatalos
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight leading-none">
            Ráduly László<br />
            <span className="text-white/80 text-2xl md:text-4xl font-bold">Kőszegi Időjárás</span>
          </h1>
        </div>
      </div>

      {/* --- CONTENT SHEET (GLASS CARD) --- */}
      <div className="relative -mt-10 px-4 z-20">
        <div className="
            bg-white/80 dark:bg-[#1a1c2e]/80
            backdrop-blur-[40px] backdrop-saturate-[1.8]
            rounded-[2.5rem]
            border border-white/40 dark:border-white/10
            shadow-[0_-10px_40px_rgba(0,0,0,0.15)]
            p-6 sm:p-10
            min-h-[50vh]
        ">

          {/* Intro Text */}
          <div className="prose dark:prose-invert max-w-none mb-10">
            <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
              Kőszeg és térsége leghitelesebb időjárás-előrejelzései, részletes elemzésekkel és helyi megfigyelésekkel.
              A hivatalos Facebook oldalon naprakész információkat találsz a várható időjárásról.
            </p>
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
                    bg-gradient-to-br from-[#1877F2] to-[#0C63D4]
                    p-6 sm:p-8 rounded-[2rem]
                    text-white shadow-xl shadow-blue-500/20
                    transition-all duration-500 hover:shadow-blue-500/40 hover:scale-[1.01]
                "
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-hover:rotate-6 transition-transform duration-500">
                  <IoLogoFacebook className="text-4xl" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Megnyitás a Facebookon</h3>
                  <p className="text-blue-100 text-sm mb-4 leading-relaxed max-w-md mx-auto sm:mx-0">
                    Kattints ide a teljes Ráduly László Facebook oldal megtekintéséhez az alkalmazáson kívül.
                  </p>
                  <span className="inline-flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md group-hover:bg-blue-50 transition-colors">
                    Tovább az oldalra <IoArrowForward />
                  </span>
                </div>
              </div>
            </a>

            {/* Hint Box */}
            <div className="bg-gray-100 dark:bg-black/20 p-5 rounded-3xl border border-gray-200 dark:border-white/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                <IoOpenOutline className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Külső hivatkozás</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A tartalom megtekintéséhez átirányítunk a Facebook alkalmazásba vagy a böngészőbe.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Spacing */}
          <div className="h-10" />

        </div>
      </div>
    </div>
  );
}
