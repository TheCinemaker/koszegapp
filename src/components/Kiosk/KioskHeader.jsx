// src/components/Kiosk/KioskHeader.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoChevronBackOutline, IoChevronDownOutline } from 'react-icons/io5';
import { DarkModeContext } from '../../contexts/DarkModeContext';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function KioskHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setDark } = useContext(DarkModeContext);
  const [timeStr, setTimeStr] = useState('');
  
  // Weather & dropdown states
  const [weatherData, setWeatherData] = useState(null);
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Secret tap logic for admins
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  const isHome = location.pathname === '/kiosk' || location.pathname === '/kiosk/';

  // 1) Automatic Dark Mode: 21:00 to 06:00
  useEffect(() => {
    const checkDarkTime = () => {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 21 || hour < 6;
      setDark(shouldBeDark);
    };
    checkDarkTime();
    
    // Check every 30 seconds
    const interval = setInterval(checkDarkTime, 30000);
    return () => clearInterval(interval);
  }, [setDark]);

  // 2) Kiosk Clock (HH:MM)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hh}:${mm}`);
    };
    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3) Live OpenWeatherMap Kőszeg forecast fetching
  useEffect(() => {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045&lang=hu`)
      .then(res => res.json())
      .then(data => {
        if (data && data.list) {
          const nowReading = data.list[0];
          
          // Group forecast readings by day name
          const dailyData = data.list.reduce((acc, reading) => {
            const dateStr = reading.dt_txt.split(' ')[0];
            if (!acc[dateStr]) {
              const d = new Date(reading.dt * 1000);
              const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
              acc[dateStr] = {
                dayName: dayNames[d.getDay()],
                temps: [],
                icons: []
              };
            }
            acc[dateStr].temps.push(reading.main.temp);
            acc[dateStr].icons.push(reading.weather[0].icon);
            return acc;
          }, {});

          // Map the grouped readings to min/max and average icon
          const daily = Object.values(dailyData).map(day => ({
            dayName: day.dayName,
            minTemp: Math.round(Math.min(...day.temps)),
            maxTemp: Math.round(Math.max(...day.temps)),
            icon: day.icons[Math.floor(day.icons.length / 2)] || day.icons[0]
          })).slice(1, 4); // Next 3 days

          setWeatherData({
            now: {
              temp: Math.round(nowReading.main.temp),
              description: nowReading.weather[0].description,
              icon: nowReading.weather[0].icon
            },
            daily
          });
        }
      })
      .catch(err => console.error("Error loading kiosk header weather:", err));
  }, []);

  // 4) Close dropdown when tapping anywhere else
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowWeatherDropdown(false);
      }
    };
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // 5) Logo Secret Tap (5 taps to navigate to admin / exit kiosk)
  const handleLogoTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);

    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 2000);

    if (logoTapCount.current === 5) {
      logoTapCount.current = 0;
      const pass = prompt("Add meg a kioszk karbantartói jelszót:");
      if (pass === "admin9730") {
        navigate('/');
      } else if (pass !== null) {
        alert("Hibás jelszó!");
      }
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-[60] transition-colors duration-500 shadow-sm">
      {/* Left section: Back button or placeholder */}
      <div className="w-1/4 flex items-center justify-start">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold active:scale-95 transition-all text-base border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm"
          >
            <IoChevronBackOutline className="text-xl" />
            Vissza
          </button>
        )}
      </div>

      {/* Middle section: Brand Identity */}
      <div className="w-2/4 flex justify-center">
        <div
          onClick={handleLogoTap}
          className="flex items-center cursor-pointer select-none active:scale-98 transition-transform group text-readability-shadow"
        >
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
            visit
          </span>
          <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent tracking-tighter uppercase ml-0.5">
            Kőszeg
          </span>
        </div>
      </div>

      {/* Right section: Unified Weather & Clock Capsule */}
      <div ref={dropdownRef} className="w-1/4 flex items-center justify-end relative">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/15 dark:border-indigo-400/15 shadow-sm">
          {/* Weather Toggle Button */}
          {weatherData && (
            <button 
              onClick={() => setShowWeatherDropdown(!showWeatherDropdown)}
              className="flex items-center gap-1.5 pr-2.5 border-r border-zinc-200 dark:border-zinc-800 hover:scale-105 active:scale-95 transition-all text-zinc-700 dark:text-zinc-300 font-black text-sm"
            >
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData.now.icon}.png`} 
                alt="Időjárás" 
                className="w-7 h-7 object-contain"
              />
              <span className="font-mono flex items-center gap-0.5">
                {weatherData.now.temp}°
                <IoChevronDownOutline className={`text-[10px] opacity-70 transition-transform duration-300 ${showWeatherDropdown ? 'rotate-180 text-amber-500' : ''}`} />
              </span>
            </button>
          )}

          {/* Clock Display */}
          <div className="text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-wider font-mono pl-1">
            {timeStr}
          </div>
        </div>

        {/* Dropdown Forecast Panel */}
        {showWeatherDropdown && weatherData && (
          <div className="absolute right-0 top-14 w-72 bg-zinc-950/95 dark:bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl text-white z-[100] transition-all duration-300 flex flex-col gap-4 animate-fadeIn">
            {/* Header / Today */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Kőszeg Ma</span>
                <span className="text-sm font-bold capitalize mt-0.5 leading-tight">{weatherData.now.description}</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black font-mono leading-none">{weatherData.now.temp}°C</span>
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-white/10 w-full" />

            {/* Next 3 Days Forecast */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider text-left">Következő napok</span>
              {weatherData.daily.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                  <span className="w-20 text-zinc-300 text-left">{day.dayName}</span>
                  <img 
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                    alt="icon" 
                    className="w-7 h-7 object-contain"
                  />
                  <div className="w-20 text-right font-mono flex justify-end gap-1.5">
                    <span className="text-zinc-500">{day.minTemp}°</span>
                    <span className="text-zinc-400">/</span>
                    <span className="text-white font-black">{day.maxTemp}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
