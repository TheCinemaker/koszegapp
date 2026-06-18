import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { IoClose } from 'react-icons/io5';
import { makeChartData, makeChartOptions } from './ChartCard';

// Min / átlag / max a nem-null értékekből
function summarize(data) {
  const vals = (data || []).filter(v => v !== null && v !== undefined && !isNaN(v));
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return { min: Math.min(...vals), max: Math.max(...vals), avg: sum / vals.length };
}

export default function StatDetailModal({ metric, timestamps, data, currentValue, onClose }) {
  // Esc-re zárás + háttér-görgetés tiltása amíg nyitva van
  useEffect(() => {
    if (!metric) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [metric, onClose]);

  const isBar = metric?.type === 'bar';
  const Chart = isBar ? Bar : Line;
  const chartData = useMemo(() => (metric ? makeChartData(metric, timestamps, data) : null), [metric, timestamps, data]);
  const options = useMemo(() => (metric ? makeChartOptions(metric) : null), [metric]);
  const stats = useMemo(() => summarize(data), [data]);

  const fmt = (v) => (typeof v === 'number' ? v.toFixed(metric?.unit === '%' ? 0 : 1) : '–');

  return (
    <AnimatePresence>
      {metric && [
        /* Backdrop — CSAK ez halványul, hogy a kártya morph közben végig tömör legyen */
        <motion.div
          key="stat-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          onClick={onClose}
          className="fixed inset-0 z-[9998] bg-[#0a1626]/50 backdrop-blur-md"
        />,
        /* Középre igazító réteg (sima div) + a layoutId-s, teljesen átlátszatlan kártya.
           Záráskor a rácsban lévő csempe morfol vissza a kártya helyéről (layoutId). */
        <div
          key="stat-modal-card"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
        >
          <motion.div
            layoutId={`metric-${metric.key}`}
            transition={{ type: 'spring', stiffness: 30, damping: 9 }}
            className="relative w-full max-w-2xl bg-beige-50 dark:bg-[#0c1726] rounded-[2rem] border border-[#e9d8c9]/70 dark:border-white/10 shadow-2xl shadow-[#123a57]/30 overflow-hidden pointer-events-auto"
          >
            {/* Szín-akcentus felül */}
            <div className="h-1.5 w-full" style={{ backgroundColor: metric.color }} />

            <div className="p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                {/* Fejléc */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#123a57]/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                      {metric.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#0a97be] mb-0.5">
                        Aktuális
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#123a57] dark:text-white tracking-tight">
                          {fmt(currentValue)}
                        </span>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{metric.unit}</span>
                      </div>
                      <div className="text-sm font-bold text-[#123a57] dark:text-gray-200 mt-0.5">{metric.label}</div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#123a57]/5 hover:bg-[#123a57]/10 dark:bg-white/10 dark:hover:bg-white/20 text-[#123a57] dark:text-white transition-all active:scale-95 shrink-0"
                  >
                    <IoClose className="text-lg" />
                  </button>
                </div>

                {/* Min / átlag / max */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                    {[
                      { label: 'Minimum', val: stats.min },
                      { label: 'Átlag', val: stats.avg },
                      { label: 'Maximum', val: stats.max },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#f2e9e1]/60 dark:bg-white/5 border border-[#e9d8c9]/70 dark:border-white/10 rounded-2xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[#0a97be] mb-1">{s.label}</div>
                        <div className="text-base font-black text-[#123a57] dark:text-white">
                          {fmt(s.val)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">{metric.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nagy grafikon */}
                <div className="text-[10px] font-black uppercase tracking-widest text-[#b36022] mb-3 flex items-center gap-2">
                  <span>24 órás előzmény</span>
                  <div className="flex-1 h-px bg-[#e9d8c9]/70 dark:bg-white/10" />
                </div>
                <div className="relative h-[260px] w-full">
                  {chartData ? (
                    <Chart data={chartData} options={options} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                      Nincs mérési adat az elmúlt 24 órában.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ]}
    </AnimatePresence>
  );
}
