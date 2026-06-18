import React from 'react';
import { 
  Thermometer, 
  Flame, 
  Droplet, 
  Droplets, 
  CloudFog, 
  Gauge, 
  Wind, 
  Compass, 
  CloudRain, 
  Umbrella, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

// Wind direction helper
function ddToText(deg) {
  const dirs = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
  return dirs[Math.round(deg / 45) % 8] || '–';
}

export const STAT_CARDS_CONFIG = [
  { key: 'T',          label: 'Hőmérséklet',    icon: <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-[#38bdf8]" />, unit: '°C', color: '#38bdf8', fmt: v => v.toFixed(1) },
  { key: 'HEAT_INDEX', label: 'Hőérzet',         icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#fb923c]" />, unit: '°C', color: '#fb923c', fmt: v => v.toFixed(1) },
  { key: 'HUMIDEX',    label: 'Humidex',          icon: <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-[#818cf8]" />, unit: '',   color: '#818cf8', fmt: v => v.toFixed(1) },
  { key: 'U',          label: 'Páratartalom',    icon: <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-[#34d399]" />, unit: '%',  color: '#34d399', fmt: v => v.toFixed(0) },
  { key: 'DP',         label: 'Harmatpont',      icon: <CloudFog className="w-4 h-4 sm:w-5 sm:h-5 text-[#94a3b8]" />, unit: '°C', color: '#94a3b8', fmt: v => v.toFixed(1) },
  { key: 'SLP',        label: 'Légnyomás',       icon: <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-[#c084fc]" />, unit: 'hPa',color: '#c084fc', fmt: v => v.toFixed(1) },
  { key: 'FF',         label: 'Szélsebesség',    icon: <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-[#60a5fa]" />, unit: 'm/s',color: '#60a5fa', fmt: v => v.toFixed(1) },
  { key: 'FXY',        label: 'Széllökés',       icon: <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-[#f472b6]" />, unit: 'm/s',color: '#f472b6', fmt: v => v.toFixed(1) },
  { key: 'DD',         label: 'Szélirány',       icon: <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#a78bfa]" />, unit: '°',  color: '#a78bfa', fmt: v => v.toFixed(0), isWind: true },
  { key: 'RR_1H',      label: '1h csapadék',     icon: <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-[#38bdf8]" />, unit: 'mm', color: '#38bdf8', fmt: v => v.toFixed(1) },
  { key: 'RR_TODAY',   label: 'Mai csapadék',    icon: <Umbrella className="w-4 h-4 sm:w-5 sm:h-5 text-[#0ea5e9]" />, unit: 'mm', color: '#0ea5e9', fmt: v => v.toFixed(1) },
  { key: 'AIR_DENSITY',label: 'Levegősűrűség',   icon: <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-[#6ee7b7]" />, unit: 'kg/m³', color: '#6ee7b7', fmt: v => v.toFixed(4) },
  { key: 'T_MAX',      label: 'Napi max.',        icon: <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#f87171]" />, unit: '°C', color: '#f87171', fmt: v => v.toFixed(1) },
  { key: 'T_MIN',      label: 'Napi min.',        icon: <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#93c5fd]" />, unit: '°C', color: '#93c5fd', fmt: v => v.toFixed(1) },
  { key: 'T_TREND',    label: 'Hőm. trend',       icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24]" />, unit: '',    color: '#fbbf24', fmt: v => typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' °C/h' : v, isTrend: true },
  { key: 'SLP_TREND',  label: 'Légnyomás trend',  icon: <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#a5f3fc]" />, unit: '',    color: '#a5f3fc', fmt: v => typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' hPa/h' : v, isTrend: true },
];

export default function StatCard({ config, val, loading }) {
  const { label, icon, unit, color, isWind, isTrend } = config;

  const hasValue = val !== undefined && val !== null;
  const isNum = hasValue && typeof val === 'number' && !isNaN(val);
  
  let displayVal = '–';
  if (hasValue) {
    try {
      displayVal = config.fmt(val);
    } catch {
      displayVal = String(val);
    }
  }

  // Determine sub label contents
  let subContent = null;
  if (!hasValue) {
    subContent = <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold italic">Nincs adat</span>;
  } else if (isWind && isNum) {
    subContent = (
      <div className="flex items-center gap-2 mt-1">
        <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[9px] font-bold uppercase tracking-wider">
          {ddToText(val)} ({val}°)
        </span>
        <div className="w-5 h-5 rounded-full bg-gray-950/5 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 relative shrink-0">
          <div 
            className="w-0.5 h-3 bg-gradient-to-t from-red-500 to-sky-400 rounded-full origin-center" 
            style={{ transform: `rotate(${val}deg)` }} 
          />
        </div>
      </div>
    );
  } else if (isTrend) {
    if (isNum) {
      const isUp = val > 0.05;
      const isDown = val < -0.05;
      const cls = isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : isDown ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      const arrow = isUp ? '↑' : isDown ? '↓' : '→';
      subContent = (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${cls}`}>
          {arrow} {displayVal}
        </span>
      );
    } else {
      const strVal = String(val).toLowerCase();
      const isUp = strVal === 'up';
      const isDown = strVal === 'down';
      const cls = isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : isDown ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      const arrow = isUp ? '↑' : isDown ? '↓' : '→';
      const trendLabel = isUp ? 'emelkedő' : isDown ? 'csökkenő' : 'stabil';
      displayVal = arrow;
      subContent = (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${cls}`}>
          {trendLabel}
        </span>
      );
    }
  }

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between h-[115px] sm:h-[135px] relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-md">
      {/* Dynamic top line accent matching config color */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />
      
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-950/5 dark:bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">
          {label}
        </div>
      </div>

      <div className="mt-1 flex flex-col">
        <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-baseline tracking-tight">
          {displayVal}
          {hasValue && unit && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-0.5">{unit}</span>}
        </div>
        <div className="mt-0.5">
          {subContent}
        </div>
      </div>
    </div>
  );
}
