import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoCloudy, IoRefresh } from 'react-icons/io5';
import useWeatherData from './useWeatherData';
import SunBar from './SunBar';
import StatCard, { STAT_CARDS_CONFIG } from './StatCard';
import ChartCard, { CHART_CONFIGS } from './ChartCard';
import StatDetailModal from './StatDetailModal';
import { FadeUp } from '../../components/AppleMotion';
import { Mountain, AlertTriangle, MapPin, ExternalLink } from 'lucide-react';

// Holdfázis a mai dátumból. phase: 0=újhold, 0.5=telihold; illumination: 0..1.
const SYNODIC = 29.530588853; // szinodikus hónap napokban
function getMoonPhase(date = new Date()) {
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0); // ismert újhold
  let phase = (((date.getTime() - ref) / 86400000) % SYNODIC) / SYNODIC;
  if (phase < 0) phase += 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const waxing = phase < 0.5;
  let name;
  if (phase < 0.03 || phase > 0.97) name = 'Újhold';
  else if (phase < 0.22) name = 'Növő sarló';
  else if (phase < 0.28) name = 'Első negyed';
  else if (phase < 0.47) name = 'Növő hold';
  else if (phase < 0.53) name = 'Telihold';
  else if (phase < 0.72) name = 'Fogyó hold';
  else if (phase < 0.78) name = 'Utolsó negyed';
  else name = 'Fogyó sarló';
  return { phase, illumination, waxing, name };
}

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

  // Részletező modal: mely metrikákhoz van előzmény-grafikon, és melyik aktív
  const [activeKey, setActiveKey] = useState(null);
  const chartableKeys = useMemo(() => new Set(CHART_CONFIGS.map(c => c.key)), []);
  const activeMetric = useMemo(() => CHART_CONFIGS.find(c => c.key === activeKey) || null, [activeKey]);

  // Napszakhoz igazodó égbolt + időjárás-állapot (VisitKőszeg paletta).
  const weatherState = useMemo(() => {
    const nowSec = Date.now() / 1000;
    const { sunrise, sunset } = sunInfo || {};
    const tw = 45 * 60; // szürkületi ablak (~45 perc)

    let timeOfDay;
    if (sunrise && sunset) {
      if (nowSec < sunrise - tw || nowSec > sunset + tw) timeOfDay = 'night';
      else if (nowSec < sunrise + tw) timeOfDay = 'dawn';
      else if (nowSec > sunset - tw) timeOfDay = 'dusk';
      else timeOfDay = 'day';
    } else {
      const h = new Date().getHours();
      timeOfDay = (h < 6 || h >= 21) ? 'night' : h < 8 ? 'dawn' : h >= 19 ? 'dusk' : 'day';
    }

    // Az állomásnak NINCS felhőzet-szenzora, ezért csak a ténylegesen mért
    // csapadékra és (extrém) páratartalomra támaszkodunk — nem találunk ki felhőzetet.
    const rr = lastMeasure.RR_1H || 0;
    const rate = lastMeasure.RR_RATE || 0;
    const u = lastMeasure.U ?? 50;
    const temp = lastMeasure.T;
    let condition = 'clear';
    if (rr > 1.0 || rate > 0.5) condition = 'rain';
    else if (rr > 0.1 || rate > 0) condition = 'drizzle';
    else if (u >= 92) condition = 'fog'; // telítettséghez közeli pára → köd/pára

    const SKY = {
      night: 'from-[#0a1a2e] via-[#123a57] to-[#020617]',
      dawn:  'from-[#123a57] via-[#0a97be] to-[#d68743]',
      day:   'from-[#0bc9f8] via-[#0a97be] to-[#123a57]',
      dusk:  'from-[#1a2a40] via-[#b36022] to-[#0a1a2e]',
    };
    const isMurky = condition === 'rain' || condition === 'fog';
    const sky = isMurky ? 'from-[#41535f] via-[#2a3a4a] to-[#0f1b2a]' : SKY[timeOfDay];

    let label;
    if (condition === 'rain') label = 'Esős időjárás';
    else if (condition === 'drizzle') label = 'Szemerkélő eső';
    else if (condition === 'fog') label = 'Párás, ködös';
    else if (timeOfDay === 'night') label = 'Tiszta éjszaka';
    else if (timeOfDay === 'dawn') label = 'Derült hajnal';
    else if (timeOfDay === 'dusk') label = 'Tiszta alkonyat';
    else label = temp && temp > 25 ? 'Meleg, napos idő' : 'Napsütéses idő';

    return {
      timeOfDay,
      condition,
      sky,
      label,
      isNight: timeOfDay === 'night',
      // Felhő-ikon csak valódi csapadéknál (nem páratartalomból kitalálva)
      showCloud: condition === 'rain' || condition === 'drizzle',
    };
  }, [lastMeasure, sunInfo]);

  // Holdfázis (éjjel jelenik meg) — naponta egyszer elég kiszámolni
  const moon = useMemo(() => getMoonPhase(new Date()), []);

  // Aktuális hőfok a hero kiemelt kijelzéséhez
  const heroTemp = typeof lastMeasure.T === 'number' ? lastMeasure.T.toFixed(1) : null;
  const heroFeels = typeof lastMeasure.HEAT_INDEX === 'number' ? lastMeasure.HEAT_INDEX.toFixed(1) : null;

  // Determine status dot class and text
  let statusColor = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
  let statusText = 'Kapcsolat stabil';
  if (loading && !currentData) {
    // Show premium page loading state with rotating square spinner
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#0a97be] bg-beige-50 dark:bg-[#030816]">
        <div className="w-10 h-10 border-2 border-[#0a97be] animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#123a57]/60 dark:text-gray-400">Adatok betöltése...</p>
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
    <div className="min-h-screen bg-beige-50 dark:bg-[#030816] overflow-x-hidden pb-16 selection:bg-[#0bc9f8] selection:text-[#123a57] relative">
      
      {/* Background Noise Layer */}
      <div className="fixed inset-0 opacity-[0.03] bg-[url('/noise.svg')] mix-blend-overlay pointer-events-none z-0"></div>

      {/* --- HERO SKY SECTION --- */}
      <div className="px-4 mt-4 max-w-7xl mx-auto relative z-10">
        <div className="relative h-[34vh] md:h-[42vh] w-full rounded-[2.5rem] overflow-hidden shadow-lg border border-white/20 dark:border-white/10">
          {/* Napszakhoz igazodó égbolt-gradiens */}
          <div className={`absolute inset-0 bg-gradient-to-b ${weatherState.sky} transition-all duration-1000`} />

          {/* Csillagok éjjel */}
          {weatherState.isNight && (
            <div
              className="absolute inset-0 opacity-70 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(1.2px 1.2px at 15% 25%, #fff, transparent), radial-gradient(1px 1px at 35% 15%, #fff, transparent), radial-gradient(1.4px 1.4px at 55% 30%, #fff, transparent), radial-gradient(1px 1px at 72% 18%, #fff, transparent), radial-gradient(1.2px 1.2px at 85% 35%, #fff, transparent), radial-gradient(1px 1px at 25% 45%, #fff, transparent), radial-gradient(1px 1px at 64% 48%, #fff, transparent)',
              }}
            />
          )}

          {/* Nap / Hold (holdfázissal) — finoman elmosva, a szöveg mögött */}
          <div className="absolute top-1/2 right-[12%] -translate-y-[60%] pointer-events-none">
            {weatherState.isNight ? (
              <div
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full blur-[2px]"
                style={{ boxShadow: '0 0 70px 14px rgba(207,232,245,0.22)' }}
              >
                <div
                  className="absolute inset-0 rounded-full overflow-hidden"
                  style={{ background: 'radial-gradient(circle at 38% 34%, #f6fbff 0%, #d7e8f2 58%, #b5cede 100%)' }}
                >
                  {/* Fázis-árnyék: azonos méretű korong eltolva → valódi sarló/dagadó terminátor */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: '#0b1a2b',
                      transform: `translateX(${(moon.waxing ? -1 : 1) * moon.illumination * 100}%)`,
                    }}
                  />
                </div>
                {/* halvány kráterek */}
                <div className="absolute top-[30%] left-[34%] w-2.5 h-2.5 rounded-full bg-[#9fbccd]/40" />
                <div className="absolute top-[52%] left-[52%] w-3.5 h-3.5 rounded-full bg-[#9fbccd]/30" />
                <div className="absolute top-[40%] left-[60%] w-2 h-2 rounded-full bg-[#9fbccd]/30" />
              </div>
            ) : (
              <div
                className={`w-32 h-32 md:w-44 md:h-44 rounded-full blur-[3px] ${weatherState.timeOfDay === 'day' ? 'opacity-80' : 'opacity-70'}`}
                style={{
                  background:
                    weatherState.timeOfDay === 'day'
                      ? 'radial-gradient(circle at 50% 50%, #fffaf0 0%, #ffe9b0 34%, #ffd27a 54%, rgba(255,210,122,0) 72%)'
                      : 'radial-gradient(circle at 50% 50%, #fff1d6 0%, #ffc98a 32%, #e08a4a 54%, rgba(224,138,74,0) 72%)',
                }}
              />
            )}
          </div>

          {/* Felhő csak valódi csapadéknál (nincs felhőzet-szenzor az állomáson) */}
          {weatherState.showCloud && (
            <IoCloudy className="absolute top-[14%] right-[6%] text-[8rem] md:text-[11rem] text-white/35 blur-md pointer-events-none" />
          )}

          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("/noise.svg")' }}></div>

          {/* Bottom legibility fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* --- NAVIGATION (BACK ARROW) --- */}
          <div className="absolute top-6 left-6 z-50">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 dark:bg-black/30 dark:hover:bg-black/50 backdrop-blur-xl border border-white/20 text-white transition-all duration-300 group active:scale-95 shadow-lg"
            >
              <IoArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Live temperature badge (top-right) */}
          {heroTemp && (
            <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-black/25 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-2xl shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#0bc9f8] shadow-[0_0_8px_#0bc9f8] animate-pulse" />
              <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Élő mérés</span>
            </div>
          )}

          {/* Floating title, big temperature and station details */}
          <div className="absolute bottom-6 md:bottom-8 left-6 right-6 z-10">
            <FadeUp>
              <div className="inline-flex flex-wrap items-center gap-2.5 mb-3">
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-[#0bc9f8]" /> Kőszeg Helyi Állomás
                </span>
                {weatherState.isNight && (
                  <span className="text-[10px] font-black text-[#cfe8f5] uppercase tracking-widest bg-[#123a57]/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-[#0a97be]/30 shadow-sm">
                    🌙 {moon.name}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <p className="text-[#ffe6a8]/90 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-1 drop-shadow">
                    Kőszeg · Időjárás
                  </p>
                  {heroTemp ? (
                    <div className="flex items-start gap-1 text-white drop-shadow-lg leading-none">
                      <span className="text-6xl md:text-8xl font-black tracking-tighter">{heroTemp}</span>
                      <span className="text-2xl md:text-3xl font-bold mt-2 text-white/80">°C</span>
                    </div>
                  ) : (
                    <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-md tracking-tighter leading-tight">
                      Időjárás <span className="text-[#0bc9f8]">Dashboard</span>
                    </h1>
                  )}
                </div>

                <div className="mb-1.5 space-y-1.5">
                  <span className="inline-block text-sm md:text-base font-bold text-white drop-shadow">
                    {weatherState.label}
                  </span>
                  {heroFeels && (
                    <p className="text-white/75 text-xs font-semibold">
                      Hőérzet: <span className="text-[#ffd9a8] font-bold">{heroFeels} °C</span>
                    </p>
                  )}
                </div>
              </div>

              <p className="text-white/80 text-[11px] md:text-xs font-semibold max-w-lg flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#0bc9f8]" /> 47.3971°N, 16.546°E</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <span className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-[#0bc9f8]" /> Magasság: 274 m</span>
              </p>
            </FadeUp>
          </div>
        </div>
      </div>

      {/* --- CONTENT SHEET (GLASS CARD) --- */}
      <div className="relative mt-4 px-4 z-20 max-w-7xl mx-auto">
        <FadeUp delay={0.1} duration={1.0}>
          <div className="
            bg-[#f9f5f1]/85 dark:bg-[#0c1726]/90
            backdrop-blur-[45px] backdrop-saturate-[1.8]
            rounded-[2.5rem]
            border border-[#e9d8c9]/60 dark:border-white/5
            shadow-[0_-20px_50px_rgba(18,58,87,0.15)]
            p-5 sm:p-10
            min-h-[50vh]
          ">

            {/* Quick Status Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-5 border-b border-[#e9d8c9]/60 dark:border-white/10">
              <div className="flex items-center gap-3 bg-[#f2e9e1]/60 dark:bg-white/5 border border-[#e9d8c9]/70 dark:border-white/10 px-4 py-2 rounded-2xl">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span className="text-xs font-bold text-[#123a57] dark:text-gray-300">
                  {statusText}
                </span>
                {lastUpdate && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#e9d8c9] dark:bg-gray-700" />
                    <span className="text-[10px] font-bold text-[#0a97be] dark:text-gray-400">
                      Frissítve: {lastUpdate}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#0a97be] dark:text-gray-400 tracking-wide">
                  ⏱ Auto-frissítés: 5 perc
                </span>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#123a57] hover:bg-[#0a97be] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-[#123a57]/20 active:scale-95"
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
            <div className="text-xs font-black tracking-widest uppercase text-[#b36022] dark:text-gray-500 mt-8 mb-4 flex items-center gap-2">
              <span>Aktuális mérések</span>
              <div className="flex-1 h-[1px] bg-[#e9d8c9]/70 dark:bg-white/10" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {STAT_CARDS_CONFIG.map(cfg => (
                <StatCard
                  key={cfg.key}
                  config={cfg}
                  val={lastMeasure[cfg.key]}
                  loading={loading && !currentData}
                  onClick={chartableKeys.has(cfg.key) ? () => setActiveKey(cfg.key) : undefined}
                />
              ))}
            </div>

            {/* Charts Section */}
            <div className="text-xs font-black tracking-widest uppercase text-[#b36022] dark:text-gray-500 mt-10 mb-4 flex items-center gap-2">
              <span>24 órás előzmények</span>
              <div className="flex-1 h-[1px] bg-[#e9d8c9]/70 dark:bg-white/10" />
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
            <div className="mt-10 p-5 sm:p-6 rounded-3xl bg-[#f2e9e1]/60 dark:bg-[#123a57]/20 border border-[#e9d8c9]/70 dark:border-[#0a97be]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#123a57] dark:text-white">Köszönjük az adatokat!</h3>
                <p className="text-xs text-[#123a57]/70 dark:text-gray-400 leading-relaxed max-w-2xl">
                  A mérések és adatok biztosításáért köszönet <strong className="text-[#b36022] dark:text-[#e0a05c]">Ráduly Lászlónak</strong> (Kőszegi Időjárás Előrejelzés)! Kövesd be a legfrissebb helyi elemzésekért!
                </p>
              </div>
              <a
                href="https://www.facebook.com/search/top?q=k%C5%91szegi%20id%C5%91j%C3%A1r%C3%A1s%20el%C5%91rejelz%C3%A9s"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#123a57] hover:bg-[#0a97be] text-white font-bold text-xs shadow-md shadow-[#123a57]/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <span>Facebook oldal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </FadeUp>
      </div>

      {/* Részletező modal — a csempéből morfol elő */}
      <StatDetailModal
        metric={activeMetric}
        timestamps={timestamps}
        data={activeKey ? (results[activeKey] || []) : []}
        currentValue={activeKey ? lastMeasure[activeKey] : null}
        onClose={() => setActiveKey(null)}
      />

    </div>
  );
}
