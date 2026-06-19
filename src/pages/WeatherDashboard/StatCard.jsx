import React from 'react';
import { motion } from 'framer-motion';
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
  TrendingDown,
  Maximize2
} from 'lucide-react';

// Wind direction helper
function ddToText(deg) {
  const dirs = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
  return dirs[Math.round(deg / 45) % 8] || '–';
}

// VisitKőszeg paletta: meleg metrikák terrakotta (#d68743 / #b36022 / #e0a05c),
// hűvös/légköri metrikák tengerkék–türkiz (#123a57 / #0a97be / #0bc9f8 / #3385a2).
export const STAT_CARDS_CONFIG = [
  { key: 'T',          label: 'Hőmérséklet',    icon: <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-[#d68743]" />, unit: '°C', color: '#d68743', fmt: v => v.toFixed(1) },
  { key: 'HEAT_INDEX', label: 'Hőérzet',         icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#b36022]" />, unit: '°C', color: '#b36022', fmt: v => v.toFixed(1) },
  { key: 'HUMIDEX',    label: 'Humidex',          icon: <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a97be]" />, unit: '',   color: '#0a97be', fmt: v => v.toFixed(1) },
  { key: 'U',          label: 'Páratartalom',    icon: <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-[#0bc9f8]" />, unit: '%',  color: '#0bc9f8', fmt: v => v.toFixed(0) },
  { key: 'DP',         label: 'Harmatpont',      icon: <CloudFog className="w-4 h-4 sm:w-5 sm:h-5 text-[#3385a2]" />, unit: '°C', color: '#3385a2', fmt: v => v.toFixed(1) },
  { key: 'SLP',        label: 'Légnyomás',       icon: <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-[#123a57]" />, unit: 'hPa',color: '#123a57', fmt: v => v.toFixed(1) },
  { key: 'FF',         label: 'Szélsebesség',    icon: <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a97be]" />, unit: 'km/h',color: '#0a97be', fmt: v => v.toFixed(1) },
  { key: 'FXY',        label: 'Széllökés',       icon: <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-[#3385a2]" />, unit: 'km/h',color: '#3385a2', fmt: v => v.toFixed(1) },
  { key: 'DD',         label: 'Szélirány',       icon: <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a97be]" />, unit: '°',  color: '#0a97be', fmt: v => v.toFixed(0), isWind: true },
  { key: 'RR_1H',      label: '1h csapadék',     icon: <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-[#0bc9f8]" />, unit: 'mm', color: '#0bc9f8', fmt: v => v.toFixed(1) },
  { key: 'RR_TODAY',   label: 'Mai csapadék',    icon: <Umbrella className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a97be]" />, unit: 'mm', color: '#0a97be', fmt: v => v.toFixed(1) },
  { key: 'AIR_DENSITY',label: 'Levegősűrűség',   icon: <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-[#3385a2]" />, unit: 'kg/m³', color: '#3385a2', fmt: v => v.toFixed(4) },
  { key: 'T_MAX',      label: 'Napi max.',        icon: <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#b36022]" />, unit: '°C', color: '#b36022', fmt: v => v.toFixed(1) },
  { key: 'T_MIN',      label: 'Napi min.',        icon: <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#0bc9f8]" />, unit: '°C', color: '#0bc9f8', fmt: v => v.toFixed(1) },
  { key: 'T_TREND',    label: 'Hőm. trend',       icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#d68743]" />, unit: '',    color: '#d68743', fmt: v => typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' °C/h' : v, isTrend: true },
  { key: 'SLP_TREND',  label: 'Légnyomás trend',  icon: <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a97be]" />, unit: '',    color: '#0a97be', fmt: v => typeof v === 'number' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' hPa/h' : v, isTrend: true },
];

export default function StatCard({ config, val, loading, onClick }) {
  const { label, icon, unit, color, isWind, isTrend } = config;
  const clickable = typeof onClick === 'function';

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
            className="w-0.5 h-3 bg-gradient-to-t from-[#b36022] to-[#0bc9f8] rounded-full origin-center"
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
    <motion.div
      layoutId={clickable ? `metric-${config.key}` : undefined}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 30, damping: 9 }}
      className={`bg-beige-50/70 dark:bg-white/5 border rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between h-[115px] sm:h-[135px] relative overflow-hidden transition-shadow ${clickable ? 'cursor-pointer group border-[#e9d8c9]/60 hover:border-[#0a97be]/50 hover:shadow-lg hover:shadow-[#123a57]/10 dark:border-white/10' : 'border-[#e9d8c9]/60 dark:border-white/10 hover:shadow-md'}`}
    >
      {/* Dynamic top line accent matching config color */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />

      {/* Kattinthatóság jelzése */}
      {clickable && (
        <Maximize2 className="absolute top-3 right-3 w-3.5 h-3.5 text-[#0a97be]/40 group-hover:text-[#0a97be] transition-colors" />
      )}

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#123a57]/5 dark:bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[9px] sm:text-[10px] font-bold text-[#0a97be] dark:text-gray-400 uppercase tracking-wider leading-none">
          {label}
        </div>
      </div>

      <div className="mt-1 flex flex-col">
        <div className="text-xl sm:text-2xl font-black text-[#123a57] dark:text-white flex items-baseline tracking-tight">
          {displayVal}
          {hasValue && unit && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-0.5">{unit}</span>}
        </div>
        <div className="mt-0.5">
          {subContent}
        </div>
      </div>
    </motion.div>
  );
}
