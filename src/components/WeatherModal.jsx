import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { WiHumidity, WiStrongWind, WiRaindrop, WiSunrise, WiSunset, WiBarometer, WiThermometer } from 'react-icons/wi';
import { IoClose } from 'react-icons/io5';

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

  // Apple Weather Style Gradients (Vibrant & Deep)
  const getGradient = (weatherDesc, icon) => {
    if (!weatherDesc) return 'bg-gradient-to-br from-blue-500 to-cyan-400';
    const desc = weatherDesc.toLowerCase();
    const isNight = icon && icon.includes('n');

    if (desc.includes('clear') || desc.includes('tiszta') || desc.includes('nap')) {
      return isNight
        ? 'bg-gradient-to-b from-[#1c1c35] to-[#4343bf]' // Deep Night Blue
        : 'bg-gradient-to-b from-[#2980b9] to-[#6dd5fa]'; // Vibrant Day Blue
    }
    if (desc.includes('cloud') || desc.includes('felhő')) {
      return isNight
        ? 'bg-gradient-to-b from-[#232526] to-[#414345]' // Dark Gray Night
        : 'bg-gradient-to-b from-[#567a98] to-[#99aabb]'; // Blue-Gray Cloudy
    }
    if (desc.includes('rain') || desc.includes('eső')) {
      return 'bg-gradient-to-b from-[#203a43] to-[#2c5364]'; // Deep Rainy Slate
    }
    if (desc.includes('storm') || desc.includes('zivatar')) {
      return 'bg-gradient-to-b from-[#0f2027] to-[#203a43]'; // Stormy Dark
    }
    if (desc.includes('snow') || desc.includes('hó')) {
      return 'bg-gradient-to-b from-[#83a4d4] to-[#b6fbff]'; // Icy Blue
    }
    return 'bg-gradient-to-br from-blue-500 to-cyan-400'; // Default Vivid Blue
  };

  const gradientClass = processedData
    ? getGradient(processedData.now.weather[0].main, processedData.now.weather[0].icon)
    : 'bg-gradient-to-br from-blue-500 to-cyan-500'; // Default loading vibrant

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Main Card */}
      <div
        className={`
          relative w-full max-w-sm flex flex-col overflow-hidden rounded-[40px] 
          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform
          ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'}
          ${gradientClass}
          border border-white/20 ring-1 ring-white/10
        `}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors backdrop-blur-md"
        >
          <IoClose className="text-xl" />
        </button>

        {loading || !processedData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white relative z-10 min-h-[400px]">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
          </div>
        ) : (
          <div className="relative z-10 text-white overflow-y-auto scrollbar-hide max-h-[80vh]">

            {/* Top Section: City & Big Temp */}
            <div className="pt-10 px-6 flex flex-col items-center text-center">
              <h2 className="text-3xl font-semibold tracking-tight mb-0 drop-shadow-md">{processedData.city.name}</h2>
              <p className="text-lg font-medium opacity-90 mb-4 drop-shadow-sm">{capitalize(processedData.now.weather[0].description)}</p>

              <div className="relative flex items-center justify-center -my-2">
                <span className="text-[7rem] leading-none font-thin tracking-tighter drop-shadow-xl ml-4">
                  {Math.round(processedData.now.main.temp)}°
                </span>
              </div>

              <div className="flex justify-center gap-4 mt-2 text-base font-medium opacity-100">
                <span className="drop-shadow-md">H: {Math.round(processedData.now.main.temp_max)}°</span>
                <span className="drop-shadow-md">L: {Math.round(processedData.now.main.temp_min)}°</span>
              </div>
            </div>

            {/* Hourly Scroller (Glass Strip) */}
            <div className="mt-8 mb-6 border-y border-white/20 bg-white/10 backdrop-blur-md">
              <div className="flex gap-4 overflow-x-auto px-6 py-4 scrollbar-hide">
                {processedData.hourly.map((period, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 w-[50px]">
                    <span className="text-xs font-semibold opacity-90">{format(new Date(period.dt * 1000), 'HH')}</span>
                    <img src={`https://openweathermap.org/img/wn/${period.weather[0].icon}.png`} className="w-8 h-8 drop-shadow-sm" alt="" />
                    <span className="font-bold text-lg leading-none">{Math.round(period.main.temp)}°</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Details & Daily */}
            <div className="px-5 pb-8 space-y-4">

              {/* 5 Day Forecast List (IOS List Style) */}
              <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <div className="space-y-3 text-sm">
                  {processedData.daily.map((day, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/10 last:border-0 pb-2 last:pb-0">
                      <span className="w-20 font-semibold text-base">{day.dayName}</span>
                      <div className="flex-1 flex items-center justify-center">
                        <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} className="w-8 h-8 opacity-100 drop-shadow-sm" alt="" />
                      </div>
                      <div className="flex gap-3 text-right w-20 justify-end font-medium">
                        <span className="opacity-60">{day.minTemp}°</span>
                        //
                        <span className="opacity-100">{day.maxTemp}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-2xl p-3 pl-4 flex flex-col justify-center backdrop-blur-md border border-white/10 min-h-[100px]">
                  <div className="flex items-center gap-1 opacity-70 mb-1">
                    <WiStrongWind className="text-xl" />
                    <span className="text-xs font-semibold uppercase">Szél</span>
                  </div>
                  <p className="text-2xl font-semibold">{Math.round(processedData.now.wind.speed * 3.6)} <span className="text-sm font-normal">km/h</span></p>
                </div>

                <div className="bg-black/20 rounded-2xl p-3 pl-4 flex flex-col justify-center backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1 opacity-70 mb-1">
                    <WiHumidity className="text-xl" />
                    <span className="text-xs font-semibold uppercase">Pára</span>
                  </div>
                  <p className="text-2xl font-semibold">{processedData.now.main.humidity}%</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-3 pl-4 flex flex-col justify-center backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1 opacity-70 mb-1">
                    <WiSunrise className="text-xl" />
                    <span className="text-xs font-semibold uppercase">Napkelte</span>
                  </div>
                  <p className="text-xl font-semibold">{format(new Date(processedData.city.sunrise * 1000), 'HH:mm')}</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-3 pl-4 flex flex-col justify-center backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1 opacity-70 mb-1">
                    <WiSunset className="text-xl" />
                    <span className="text-xs font-semibold uppercase">Napnyugta</span>
                  </div>
                  <p className="text-xl font-semibold">{format(new Date(processedData.city.sunset * 1000), 'HH:mm')}</p>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
