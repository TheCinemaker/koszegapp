// src/components/Kiosk/KioskHeader.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoChevronBackOutline, IoChevronDownOutline, IoSunnyOutline } from 'react-icons/io5';
import { DarkModeContext } from '../../contexts/DarkModeContext';
import { useKioskLang } from '../../contexts/KioskLangContext';
import KioskFlag from './KioskFlag';

const LANGS = [
  { code: 'hu', label: 'HU' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

const OWM_LANG = { hu: 'hu', en: 'en', de: 'de' };

export default function KioskHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setDark } = useContext(DarkModeContext);
  const { lang, setLang, t, highContrast, toggleContrast } = useKioskLang();
  const [timeStr, setTimeStr] = useState('');

  const [weatherData, setWeatherData] = useState(null);
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  const isHome = location.pathname === '/kiosk' || location.pathname === '/kiosk/';

  // 1) Automatic Dark Mode: 21:00–06:00 (skipped when high-contrast is active)
  useEffect(() => {
    if (highContrast) return;
    const checkDarkTime = () => {
      const hour = new Date().getHours();
      setDark(hour >= 21 || hour < 6);
    };
    checkDarkTime();
    const interval = setInterval(checkDarkTime, 30000);
    return () => clearInterval(interval);
  }, [setDark, highContrast]);

  // 2) Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3) Weather — re-fetches when language changes to get translated descriptions
  useEffect(() => {
    const owmLang = OWM_LANG[lang] || 'hu';
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Koszeg,HU&units=metric&appid=ebe4857b9813fcfd39e7ce692e491045&lang=${owmLang}`)
      .then(res => res.json())
      .then(data => {
        if (!data?.list) return;
        const nowReading = data.list[0];

        const dailyData = data.list.reduce((acc, reading) => {
          const dateStr = reading.dt_txt.split(' ')[0];
          if (!acc[dateStr]) {
            const d = new Date(reading.dt * 1000);
            acc[dateStr] = { dayIndex: d.getDay(), temps: [], icons: [] };
          }
          acc[dateStr].temps.push(reading.main.temp);
          acc[dateStr].icons.push(reading.weather[0].icon);
          return acc;
        }, {});

        const daily = Object.values(dailyData).map(day => ({
          dayIndex: day.dayIndex,
          minTemp: Math.round(Math.min(...day.temps)),
          maxTemp: Math.round(Math.max(...day.temps)),
          icon: day.icons[Math.floor(day.icons.length / 2)] || day.icons[0],
        })).slice(1, 4);

        setWeatherData({
          now: {
            temp: Math.round(nowReading.main.temp),
            description: nowReading.weather[0].description,
            icon: nowReading.weather[0].icon,
          },
          daily,
        });
      })
      .catch(err => console.error('Error loading kiosk header weather:', err));
  }, [lang]);

  // 4) Close dropdown on outside click
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

  // 5) Logo secret tap (admin exit)
  const handleLogoTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 2000);
    if (logoTapCount.current === 5) {
      logoTapCount.current = 0;
      const pass = prompt('Add meg a kioszk karbantartói jelszót:');
      if (pass === 'admin9730') navigate('/');
      else if (pass !== null) alert('Hibás jelszó!');
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-[60] transition-colors duration-500 shadow-sm">

      {/* Left: Back button */}
      <div className="w-1/4 flex items-center justify-start">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold active:scale-95 transition-all text-base border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm"
          >
            <IoChevronBackOutline className="text-xl" />
            {t('common.back')}
          </button>
        )}
      </div>

      {/* Center: Brand */}
      <div className="w-2/4 flex justify-center">
        <div
          onClick={handleLogoTap}
          className="flex items-center cursor-pointer select-none active:scale-98 transition-transform text-readability-shadow"
        >
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">visit</span>
          <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent tracking-tighter uppercase ml-0.5">Kőszeg</span>
        </div>
      </div>

      {/* Right: Language switcher + Weather + Clock */}
      <div ref={dropdownRef} className="w-1/4 flex items-center justify-end gap-3 relative">

        {/* Language switcher */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all duration-200 ${
                lang === code
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <KioskFlag code={code} className="w-5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* High-contrast / outdoor toggle */}
        <button
          onClick={toggleContrast}
          title={highContrast ? 'Napsütéses mód: BE' : 'Napsütéses mód: KI'}
          className={`p-2 rounded-xl transition-all duration-200 border ${
            highContrast
              ? 'bg-amber-400 text-amber-900 border-amber-500 shadow-md'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/50 hover:text-amber-500'
          }`}
        >
          <IoSunnyOutline className="text-xl" />
        </button>

        {/* Weather + Clock capsule */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/15 dark:border-indigo-400/15 shadow-sm">
          {weatherData && (
            <button
              onClick={() => setShowWeatherDropdown(!showWeatherDropdown)}
              className="flex items-center gap-1.5 pr-2.5 border-r border-zinc-200 dark:border-zinc-800 hover:scale-105 active:scale-95 transition-all text-zinc-700 dark:text-zinc-300 font-black text-sm"
            >
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.now.icon}.png`}
                alt="weather"
                className="w-7 h-7 object-contain"
              />
              <span className="font-mono flex items-center gap-0.5">
                {weatherData.now.temp}°
                <IoChevronDownOutline className={`text-[10px] opacity-70 transition-transform duration-300 ${showWeatherDropdown ? 'rotate-180 text-amber-500' : ''}`} />
              </span>
            </button>
          )}
          <div className="text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-wider font-mono pl-1">
            {timeStr}
          </div>
        </div>

        {/* Weather dropdown */}
        {showWeatherDropdown && weatherData && (
          <div className="absolute right-0 top-14 w-72 bg-zinc-950/95 dark:bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl text-white z-[100] flex flex-col gap-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('header.today')}</span>
                <span className="text-sm font-bold capitalize mt-0.5 leading-tight">{weatherData.now.description}</span>
              </div>
              <span className="text-3xl font-black font-mono leading-none">{weatherData.now.temp}°C</span>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{t('header.nextDays')}</span>
              {weatherData.daily.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                  <span className="w-20 text-zinc-300">{t(`header.days.${day.dayIndex}`)}</span>
                  <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt="icon" className="w-7 h-7 object-contain" />
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
