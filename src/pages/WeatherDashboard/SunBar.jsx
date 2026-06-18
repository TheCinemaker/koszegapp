import React from 'react';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';

function formatTime(val) {
  if (!val) return '–';
  try {
    const d = typeof val === 'number' ? new Date(val * 1000) : new Date(val);
    return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' });
  } catch {
    return String(val);
  }
}

export default function SunBar({ sunInfo, loading }) {
  const items = [
    { label: 'Napkelte', icon: <Sunrise className="w-5 h-5 text-amber-500" />, value: sunInfo?.sunrise },
    { label: 'Dél', icon: <Sun className="w-5 h-5 text-yellow-500" />, value: sunInfo?.noon },
    { label: 'Napnyugta', icon: <Sunset className="w-5 h-5 text-orange-500" />, value: sunInfo?.sunset },
    { label: 'Szürkület', icon: <Moon className="w-5 h-5 text-indigo-400" />, value: sunInfo?.dusk }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-3xl p-4 md:p-5 shadow-sm backdrop-blur-xl">
      {items.map((item, idx) => (
        <div 
          className="flex items-center gap-3 px-4 py-2 border-r last:border-r-0 border-gray-200/50 dark:border-white/10 last:border-0 sm:last:border-0 sm:border-r" 
          key={idx}
        >
          <span>{item.icon}</span>
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mb-1">
              {item.label}
            </div>
            <div className="text-sm font-black text-amber-600 dark:text-amber-400 leading-none">
              {loading && !item.value ? (
                <div className="w-3.5 h-3.5 border border-amber-600 dark:border-amber-400 animate-spin mt-1" />
              ) : (
                formatTime(item.value)
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
