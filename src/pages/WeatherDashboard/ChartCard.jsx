import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  CloudRain, 
  Flame, 
  Droplet 
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

// VisitKőszeg paletta: terrakotta (#d68743 / #b36022) a meleg metrikákhoz,
// mély tengerkék–türkiz (#123a57 / #0a97be / #0bc9f8) a hűvös/légköri metrikákhoz.
export const CHART_CONFIGS = [
  { key: 'T',          label: 'Hőmérséklet',  icon: <Thermometer className="w-4 h-4 text-[#d68743]" />, unit: '°C', color: '#d68743' },
  { key: 'U',          label: 'Páratartalom', icon: <Droplets className="w-4 h-4 text-[#0bc9f8]" />, unit: '%',  color: '#0bc9f8' },
  { key: 'FF',         label: 'Szélsebesség', icon: <Wind className="w-4 h-4 text-[#0a97be]" />, unit: 'km/h',color: '#0a97be' },
  { key: 'FXY',        label: 'Széllökések',  icon: <Wind className="w-4 h-4 text-[#3385a2]" />, unit: 'km/h',color: '#3385a2' },
  { key: 'SLP',        label: 'Légnyomás',    icon: <Gauge className="w-4 h-4 text-[#123a57]" />, unit: 'hPa',color: '#123a57' },
  { key: 'RR_1H',      label: 'Csapadék 1h',  icon: <CloudRain className="w-4 h-4 text-[#0bc9f8]" />, unit: 'mm', color: '#0bc9f8', type: 'bar' },
  { key: 'HEAT_INDEX', label: 'Hőérzet',      icon: <Flame className="w-4 h-4 text-[#b36022]" />, unit: '°C', color: '#b36022' },
  { key: 'HUMIDEX',    label: 'Humidex',       icon: <Droplet className="w-4 h-4 text-[#0a97be]" />, unit: '',   color: '#0a97be' },
];

// Megosztott chart-építők, hogy a ChartCard és a részletező modal ugyanazt használja.
export function makeChartData(config, timestamps, data) {
  if (!timestamps || !data || data.length === 0) return null;
  const { color, type } = config;
  const isBar = type === 'bar';
  return {
    labels: timestamps,
    datasets: [{
      data: data,
      borderColor: color,
      // Függőleges gradiens kitöltés a vonaldiagramokhoz (felül telített, lent áttetsző)
      backgroundColor: isBar
        ? color + 'cc'
        : (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return color + '20';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, color + '59');
            g.addColorStop(1, color + '00');
            return g;
          },
      borderWidth: isBar ? 0 : 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: color,
      fill: !isBar,
      tension: 0.4,
      borderRadius: isBar ? 4 : 0,
      spanGaps: true,
    }]
  };
}

export function makeChartOptions(config) {
  const { unit } = config;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleColor: 'rgba(240, 244, 248, 0.7)',
        bodyColor: 'rgba(240, 244, 248, 1)',
        cornerRadius: 12,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return ` ${val !== null && val !== undefined ? val.toFixed(2) : '–'} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          maxTicksLimit: 6,
          maxRotation: 0,
          color: 'rgba(148, 163, 184, 0.6)',
          font: {
            family: "-apple-system, system-ui, sans-serif",
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.6)',
          font: {
            family: "-apple-system, system-ui, sans-serif",
            size: 10
          },
          callback: (value) => `${value}${unit ? ' ' + unit : ''}`
        }
      }
    }
  };
}

export default function ChartCard({ config, timestamps, data, loading }) {
  const { label, icon, type } = config;
  const isBar = type === 'bar';

  const hasData = useMemo(() => data && data.length > 0 && data.some(v => v !== null && v !== undefined), [data]);
  const chartData = useMemo(() => makeChartData(config, timestamps, data), [config, timestamps, data]);
  const options = useMemo(() => makeChartOptions(config), [config]);

  return (
    <div className="bg-beige-50/70 dark:bg-white/5 border border-[#e9d8c9]/60 dark:border-white/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-[#123a57] dark:text-white flex items-center gap-2">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#123a57]/5 dark:bg-white/10 text-[#0a97be] dark:text-gray-400 uppercase tracking-wider">
          24h
        </div>
      </div>
      <div className="relative h-[160px] w-full">
        {hasData && chartData ? (
          isBar ? (
            <Bar data={chartData} options={options} />
          ) : (
            <Line data={chartData} options={options} />
          )
        ) : loading ? (
          <div className="w-full h-full bg-gray-200/5 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0a97be] animate-spin" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Diagram betöltése...
            </span>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200/5 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">
              Nincs mérési adat
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed">
              Az elmúlt 24 órában nem érkezett adat ettől a szenzortól.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
