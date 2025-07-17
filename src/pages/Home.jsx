import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import OstromDrawerFullAnimated from '../components/OstromDrawerFullAnimated';

// Sections with both light and dark icons (suffix _dark)
const sections = [
  { to: '/attractions', imgLight: '/images/button/attractions.png',  imgDark: '/images/button/attractions_dark.png', label: 'Látnivalók', desc: 'Fedezd fel Kőszeg történelmi kincseit' },
  { to: '/events',      imgLight: '/images/button/events.png',       imgDark: '/images/button/events_dark.png',      label: 'Események',   desc: 'Friss programok, kiállítások és koncertek' },
  { to: '/gastronomy',  imgLight: '/images/button/gastronomy.png',   imgDark: '/images/button/gastronomy_dark.png',  label: 'Vendéglátás',  desc: 'Éttermek, cukrászdák, kávézók, borozók' },
  { to: '/weather',     imgLight: '/images/button/weather.png',      imgDark: '/images/button/weather_dark.png',         label: 'Időjárás',    desc: 'Kőszeg időjárás előrejelzés' },
  { to: '/leisure',     imgLight: '/images/button/freetime.png',     imgDark: '/images/button/freetime_dark.png',         label: 'Szabadidő',   desc: 'Túrák, kerékpárút, sport lehetőségek' },
  { to: '/parking',     imgLight: '/images/button/parking.png',      imgDark: '/images/button/parking_dark.png',     label: 'Parkolás',    desc: 'Minden hasznos infó az autósoknak' },
  { to: '/hotels',      imgLight: '/images/button/hotels.png',   imgDark: '/images/button/hotels_dark.png',      label: 'Szállások',   desc: 'Találd meg a számodra ideális szállást' },
  { to: '/info',        imgLight: '/images/button/info.png',        imgDark: '/images/button/info_dark.png',        label: 'Info',         desc: 'Hasznos tudnivalók, elérhetőségek' },
];

export default function Home() {
  return (
    <>
      <OstromDrawerFullAnimated />
      <div>
        <div className="pl-4 pr-4 max-w-xl mx-auto mb-2">
          <SearchBar /> {/* Ensure SearchBar input has dark:bg and dark:text classes */}
        </div>

        <div className="p-4 grid grid-cols-2 gap-4 animate-fadein">
          {sections.map(sec => (
            <Link
              key={sec.to}
              to={sec.to}
              aria-label={sec.label}
              className={
                `
                bg-white/80 border border-transparent
                dark:bg-gray-800/80 dark:border-gray-700
                rounded-2xl shadow-lg dark:shadow-md p-6
                flex flex-col items-center
                hover:shadow-2xl dark:hover:shadow-lg
                transition-all duration-150
                transform hover:-translate-y-1 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-purple-300
                group min-h-[140px]
                `
              }
            >
              <div className="w-16 h-16 mb-4 rounded-md overflow-hidden drop-shadow-lg group-hover:scale-110 transition-transform duration-200">
                {/* Light icon */}
                <img
                  src={sec.imgLight}
                  alt={sec.label}
                  className="w-full h-full object-contain block dark:hidden"
                  draggable="false"
                />
                {/* Dark icon */}
                <img
                  src={sec.imgDark}
                  alt={sec.label}
                  className="w-full h-full object-contain hidden dark:block"
                  draggable="false"
                />
              </div>

              <span className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-300 mb-1">
                {sec.label}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 text-center hidden md:block">
                {sec.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
