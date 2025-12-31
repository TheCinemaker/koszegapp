import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { WiHumidity, WiStrongWind, WiRaindrop, WiSunrise, WiSunset, WiBarometer, WiThermometer } from 'react-icons/wi';
import { FaTimes } from 'react-icons/fa';

const API_KEY = 'ebe4857b9813fcfd39e7ce692e491045';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function WeatherModal({ onClose }) {
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Koszeg,HU&units=metric&appid=${API_KEY}&lang=hu`)
      .then(res => res.json())
      .then(data => {
        if (data && data.list) {
          setFullData(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const processedData = useMemo(() => {
    if (!fullData) return null;
    const now = fullData.list[0];
    const hourly = fullData.list.slice(0, 8);

    // Napi bontás
    const dailyData = fullData.list.reduce((acc, reading) => {
      const date = format(new Date(reading.dt * 1000), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          dayName: format(new Date(reading.dt * 1000), 'eeee', { locale: hu }),
          temps: [],
          icons: []
        };
      }
      acc[date].temps.push(reading.main.temp);
      acc[date].icons.push(reading.weather[0].icon);
      return acc;
    }, {});

    const daily = Object.values(dailyData).map(day => ({
      dayName: capitalize(day.dayName),
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      icon: day.icons[Math.floor(day.icons.length / 2)] || day.icons[0]
    })).slice(0, 5);

    return { city: fullData.city, now, hourly, daily };
  }, [fullData]);

  // Dinamikus háttér a várható időjárás alapján
  const getGradient = (weatherDesc) => {
    if (!weatherDesc) return 'bg-gradient-to-br from-blue-500 to-cyan-400';
    const desc = weatherDesc.toLowerCase();
    if (desc.includes('clear') || desc.includes('tiszta') || desc.includes('nap')) return 'bg-gradient-to-br from-orange-400 via-amber-300 to-blue-400';
    if (desc.includes('cloud') || desc.includes('felhő')) return 'bg-gradient-to-br from-slate-400 via-gray-300 to-blue-200';
    if (desc.includes('rain') || desc.includes('eső')) return 'bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800';
    if (desc.includes('storm') || desc.includes('zivatar')) return 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900';
    if (desc.includes('snow') || desc.includes('hó')) return 'bg-gradient-to-br from-blue-100 via-white to-blue-200';
    return 'bg-gradient-to-br from-blue-500 to-cyan-400'; // Fallback
  };

  const gradientClass = processedData ? getGradient(processedData.now.weather[0].main) : 'bg-gradient-to-br from-gray-200 to-gray-400';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Main Card */}
      <div
        className={`
          relative w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-[32px] 
          shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]
          transition-all duration-500 ease-out transform
          ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'}
          ${gradientClass}
        `}
      >
        {/* Glass Overlay for depth */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] pointer-events-none" />

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors backdrop-blur-md"
        >
          <FaTimes />
        </button>

        {loading || !processedData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white relative z-10 min-h-[300px]">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
            <p className="font-medium tracking-wide">Meteorológia indítása...</p>
          </div>
        ) : (
          <div className="relative z-10 text-white overflow-y-auto scrollbar-hide">

            {/* Top Section: Big Temp */}
            <div className="pt-8 px-6 text-center">
              <h2 className="text-lg font-medium opacity-90 tracking-widest uppercase mb-1">{processedData.city.name}</h2>
              <p className="text-sm opacity-70 mb-4">{capitalize(processedData.now.weather[0].description)}</p>

              <div className="relative flex items-center justify-center h-32">
                <span className="text-7xl sm:text-9xl leading-none font-black tracking-tighter drop-shadow-lg">
                  {Math.round(processedData.now.main.temp)}°
                </span>
                <img
                  src={`https://openweathermap.org/img/wn/${processedData.now.weather[0].icon}@4x.png`}
                  alt="icon"
                  className="w-24 h-24 sm:w-32 sm:h-32 absolute -right-2 -top-2 drop-shadow-2xl"
                />
              </div>

              <div className="flex justify-center gap-6 mt-2 opacity-90 text-sm font-medium">
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">H: {Math.round(processedData.now.main.temp_max)}°</span>
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">L: {Math.round(processedData.now.main.temp_min)}°</span>
              </div>
            </div>

            {/* Middle Section: Hourly Scroller */}
            <div className="mt-6 mb-6">
              <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
                {processedData.hourly.map((period, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-2 w-[60px] backdrop-blur-md border border-white/10">
                    <span className="text-xs opacity-80">{format(new Date(period.dt * 1000), 'HH')}h</span>
                    <img src={`https://openweathermap.org/img/wn/${period.weather[0].icon}@2x.png`} className="w-8 h-8 my-1 drop-shadow-md" alt="" />
                    <span className="font-bold text-sm">{Math.round(period.main.temp)}°</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Bento Grid Details */}
            <div className="px-6 pb-6 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-2 backdrop-blur-md border border-white/5">
                  <WiStrongWind className="text-3xl opacity-80" />
                  <div>
                    <p className="text-[10px] opacity-60 uppercase tracking-wider">Szél</p>
                    <p className="text-sm font-bold">{Math.round(processedData.now.wind.speed * 3.6)} km/h</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-2 backdrop-blur-md border border-white/5">
                  <WiHumidity className="text-3xl opacity-80" />
                  <div>
                    <p className="text-[10px] opacity-60 uppercase tracking-wider">Pára</p>
                    <p className="text-sm font-bold">{processedData.now.main.humidity}%</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-2 backdrop-blur-md border border-white/5">
                  <WiSunrise className="text-3xl opacity-80" />
                  <div>
                    <p className="text-[10px] opacity-60 uppercase tracking-wider">Napkelte</p>
                    <p className="text-sm font-bold">{format(new Date(processedData.city.sunrise * 1000), 'HH:mm')}</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-2 backdrop-blur-md border border-white/5">
                  <WiSunset className="text-3xl opacity-80" />
                  <div>
                    <p className="text-[10px] opacity-60 uppercase tracking-wider">Napnyugta</p>
                    <p className="text-sm font-bold">{format(new Date(processedData.city.sunset * 1000), 'HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* 5 Day Forecast List */}
              <div className="bg-white/10 rounded-3xl p-4 backdrop-blur-lg border border-white/10">
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">5 Napos Előrejelzés</h3>
                <div className="space-y-2 text-sm">
                  {processedData.daily.map((day, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="w-20 font-medium text-xs">{day.dayName}</span>
                      <div className="flex-1 flex items-center justify-center">
                        <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} className="w-6 h-6 opacity-90" alt="" />
                      </div>
                      <div className="flex gap-2 text-right w-16 justify-end">
                        <span className="font-bold">{day.maxTemp}°</span>
                        <span className="opacity-50 text-xs">{day.minTemp}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
