import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoSunny, IoMoon, IoCloudy, IoRainy, IoRefresh } from 'react-icons/io5';
import useWeatherData from './useWeatherData';
import SunBar from './SunBar';
import StatCard, { STAT_CARDS_CONFIG } from './StatCard';
import ChartCard, { CHART_CONFIGS } from './ChartCard';
import { FadeUp } from '../../components/AppleMotion';
import { Mountain, AlertTriangle, MapPin, ExternalLink } from 'lucide-react';

export default function WeatherDashboard() {
  const navigate = useNavigate();
  const {
    currentData,
    historyData,
    loading,
    error,
    lastUpdate,
    refresh
  } = useWeatherData();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastMeasure = currentData?.last_measure || {};
  const sunInfo = currentData?.sun_info || {};

  // Extract history series
  const series = historyData?.[0] || {};
  const timestamps = useMemo(() => {
    return (series.timestamps || []).map(ts => {
      const d = new Date(ts * 1000);
      return d.toLocaleTimeString('hu-HU', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'Europe/Budapest' 
      });
    });
  }, [series.timestamps]);

  const results = series.results || {};

  // Dynamic gradients & weather assets based on station data
  const weatherState = useMemo(() => {
    const now = Date.now() / 1000;
    const isNight = sunInfo?.sunrise && sunInfo?.sunset && (now < sunInfo.sunrise || now > sunInfo.sunset);
    const temp = lastMeasure.T;
    const rr = lastMeasure.RR_1H || 0;
    const u = lastMeasure.U || 50;

    if (isNight) {
      return {
        gradient: 'from-[#0f172a] via-[#1e1b4b] to-[#020617]',
        icon: <IoMoon className="text-[12rem] text-slate-300 blur-md opacity-30" />,
        label: 'Tiszta, csillagos éjszaka'
      };
    }
    if (rr > 1.0) {
      return {
        gradient: 'from-[#334155] via-[#1e293b] to-[#0f172a]',
        icon: <IoRainy className="text-[12rem] text-slate-400 blur-md opacity-30" />,
        label: 'Esős időjárás'
      };
    }
    if (rr > 0.1) {
      return {
        gradient: 'from-[#475569] via-[#334155] to-[#1e293b]',
        icon: <IoRainy className="text-[12rem] text-slate-400 blur-md opacity-35" />,
        label: 'Szemerkélő eső'
      };
    }
    if (u > 80) {
      return {
        gradient: 'from-[#64748b] via-[#475569] to-[#334155]',
        icon: <IoCloudy className="text-[12rem] text-slate-300 blur-md opacity-40" />,
        label: 'Borult égbolt'
      };
    }
    if (u > 60) {
      return {
        gradient: 'from-[#38bdf8] via-[#0284c7] to-[#1e3a8a]',
        icon: <IoCloudy className="text-[12rem] text-sky-200 blur-md opacity-50" />,
        label: 'Változóan felhős'
      };
    }
    
    // Sunny/Clear Day
    return {
      gradient: 'from-sky-400 via-blue-500 to-indigo-600',
      icon: <IoSunny className="text-[13rem] text-yellow-300 blur-xl opacity-40" />,
      label: temp && temp > 25 ? 'Meleg, napos idő' : 'Napsütéses idő'
    };
  }, [lastMeasure, sunInfo]);

  // Determine status dot class and text
  let statusColor = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
  let statusText = 'Kapcsolat stabil';
  if (loading && !currentData) {
    // Show premium page loading state with rotating square spinner
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-indigo-600 bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-2 border-indigo-600 animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Adatok betöltése...</p>
      </div>
    );
  } else if (loading) {
    statusColor = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
    statusText = 'Adatok frissítése...';
  } else if (error) {
    statusColor = 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
    statusText = 'Hiba a lekérdezéskor';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-16 selection:bg-indigo-500 selection:text-white relative">
      
      {/* Background Noise Layer */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO IMAGE SECTION --- */}
      <div className="px-4 mt-4 max-w-7xl mx-auto relative z-10">
        <div className="relative h-[26vh] md:h-[30vh] w-full rounded-[2.5rem] overflow-hidden shadow-lg border border-white/20 dark:border-white/10">
          {/* Dynamic Gradient Backdrop */}
          <div className={`w-full h-full bg-gradient-to-b ${weatherState.gradient} transition-all duration-1000 relative`}>
            
            {/* Animated Glowing Sun/Moon Element */}
            <div className="absolute top-8 right-12 opacity-80 pointer-events-none">
              {weatherState.icon}
            </div>
            
            <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("/noise.svg")' }}></div>
          </div>

          {/* Backdrop Gradient Fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

          {/* --- NAVIGATION (BACK ARROW) --- */}
          <div className="absolute top-6 left-6 z-50">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 dark:bg-black/30 dark:hover:bg-black/50 backdrop-blur-xl border border-white/20 text-white transition-all duration-300 group active:scale-95 shadow-lg"
            >
              <IoArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Floating title and station details */}
          <div className="absolute bottom-6 md:bottom-8 left-6 right-6 z-10">
            <FadeUp>
              <div className="inline-flex items-center gap-2.5 mb-3">
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-sky-200" /> Kőszeg Helyi Állomás
                </span>
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest bg-indigo-950/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-indigo-500/20 shadow-sm">
                  Állomás #72461
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-md tracking-tighter leading-tight mb-2">
                Időjárás <span className="text-sky-200">Dashboard</span>
              </h1>
              
              <p className="text-white/80 text-xs md:text-sm font-semibold max-w-lg flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-sky-200" /> 47.3971°N, 16.546°E</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <span className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-sky-200" /> Magasság: 274 m</span>
              </p>
            </FadeUp>
          </div>
        </div>
      </div>

      {/* --- CONTENT SHEET (GLASS CARD) --- */}
      <div className="relative mt-4 px-4 z-20 max-w-7xl mx-auto">
        <FadeUp delay={0.1} duration={1.0}>
          <div className="
            bg-white/80 dark:bg-[#1a1c2e]/90
            backdrop-blur-[45px] backdrop-saturate-[1.8]
            rounded-[2.5rem]
            border border-white/40 dark:border-white/5
            shadow-[0_-20px_50px_rgba(0,0,0,0.15)]
            p-5 sm:p-10
            min-h-[50vh]
          ">

            {/* Quick Status Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-5 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-3 bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-2xl">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {statusText}
                </span>
                {lastUpdate && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      Frissítve: {lastUpdate}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                  ⏱ Auto-frissítés: 5 perc
                </span>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/10 active:scale-95"
                >
                  <IoRefresh className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                  Frissítés
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>API hiba történt: {error}</span>
              </div>
            )}

            {/* Solar Cycle Times Component */}
            <SunBar sunInfo={sunInfo} loading={loading} />

            {/* Current Measurements Section */}
            <div className="text-xs font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mt-8 mb-4 flex items-center gap-2">
              <span>Aktuális mérések</span>
              <div className="flex-1 h-[1px] bg-gray-200/50 dark:bg-white/10" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {STAT_CARDS_CONFIG.map(cfg => (
                <StatCard
                  key={cfg.key}
                  config={cfg}
                  val={lastMeasure[cfg.key]}
                  loading={loading && !currentData}
                />
              ))}
            </div>

            {/* Charts Section */}
            <div className="text-xs font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mt-10 mb-4 flex items-center gap-2">
              <span>24 órás előzmények</span>
              <div className="flex-1 h-[1px] bg-gray-200/50 dark:bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHART_CONFIGS.map(cfg => (
                <ChartCard
                  key={cfg.key}
                  config={cfg}
                  timestamps={timestamps}
                  data={results[cfg.key] || []}
                  loading={loading}
                />
              ))}
            </div>

            {/* Attribution Banner */}
            <div className="mt-10 p-5 sm:p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Köszönjük az adatokat!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                  A mérések és adatok biztosításáért köszönet illeti a <strong className="text-indigo-600 dark:text-indigo-400">Kőszegi Időjárás Előrejelzés</strong> közösséget. Kövesd be őket a legfrissebb helyi elemzésekért!
                </p>
              </div>
              <a
                href="https://www.facebook.com/search/top?q=k%C5%91szegi%20id%C5%91j%C3%A1r%C3%A1s%20el%C5%91rejelz%C3%A9s"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <span>Facebook oldal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </FadeUp>
      </div>

    </div>
  );
}
