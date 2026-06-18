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

export const CHART_CONFIGS = [
  { key: 'T',          label: 'Hőmérséklet',  icon: <Thermometer className="w-4 h-4 text-[#38bdf8]" />, unit: '°C', color: '#38bdf8' },
  { key: 'U',          label: 'Páratartalom', icon: <Droplets className="w-4 h-4 text-[#34d399]" />, unit: '%',  color: '#34d399' },
  { key: 'FF',         label: 'Szélsebesség', icon: <Wind className="w-4 h-4 text-[#60a5fa]" />, unit: 'm/s',color: '#60a5fa' },
  { key: 'FXY',        label: 'Széllökések',  icon: <Wind className="w-4 h-4 text-[#f472b6]" />, unit: 'm/s',color: '#f472b6' },
  { key: 'SLP',        label: 'Légnyomás',    icon: <Gauge className="w-4 h-4 text-[#c084fc]" />, unit: 'hPa',color: '#c084fc' },
  { key: 'RR_1H',      label: 'Csapadék 1h',  icon: <CloudRain className="w-4 h-4 text-[#0ea5e9]" />, unit: 'mm', color: '#0ea5e9', type: 'bar' },
  { key: 'HEAT_INDEX', label: 'Hőérzet',      icon: <Flame className="w-4 h-4 text-[#fb923c]" />, unit: '°C', color: '#fb923c' },
  { key: 'HUMIDEX',    label: 'Humidex',       icon: <Droplet className="w-4 h-4 text-[#818cf8]" />, unit: '',   color: '#818cf8' },
];

export default function ChartCard({ config, timestamps, data, loading }) {
  const { label, icon, color, unit, type } = config;
  const isBar = type === 'bar';

  const hasData = useMemo(() => data && data.length > 0 && data.some(v => v !== null && v !== undefined), [data]);

  const chartData = useMemo(() => {
    if (!timestamps || !data || data.length === 0) return null;
    return {
      labels: timestamps,
      datasets: [{
        data: data,
        borderColor: color,
        backgroundColor: isBar ? color + 'aa' : color + '15',
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
  }, [timestamps, data, color, isBar]);

  const options = {
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

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-950/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
            <div className="w-6 h-6 border-2 border-indigo-500 animate-spin" />
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
