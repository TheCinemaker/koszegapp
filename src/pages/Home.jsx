import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { fetchAttractions, fetchEvents } from '../api';
import { useFavorites } from '../hooks/useFavorites';
import MiniAttractionCard from '../components/MiniAttractionCard';
import MiniEventCard from '../components/MiniEventCard';

// A meglévő szekcióid, ez nem változik
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
  const [attractions, setAttractions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favorites, isFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAttractions(), fetchEvents()])
      .then(([attractionsData, eventsData]) => {
        setAttractions(attractionsData);
        
        const now = new Date();
        const normalizedEvents = eventsData
          .map(evt => {
            let s, e;
            if (evt.startDate) { s = new Date(evt.startDate); e = evt.endDate ? new Date(evt.endDate) : s; } 
            else if (evt.date.includes('/')) { const p = evt.date.split('/'); s = new Date(p[0]); e = new Date(p[1] || p[0]); }
            else { s = new Date(evt.date); e = s; }
            return { ...evt, _s: s, _e: e };
          })
          .filter(evt => evt._e >= now);
        setEvents(normalizedEvents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const favoriteAttractions = attractions.filter(item => isFavorite(item.id));
  const favoriteEvents = events.filter(item => isFavorite(item.id));

  return (
    <div className="space-y-8">
      {/* ÚJ: Kedvencek Szekció vagy Üdvözlő Üzenet */}
      {!loading && (
        favorites.length > 0 ? (
          <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg animate-fadein">
            <h2 className="text-2xl font-bold text-center text-rose-500 mb-4">Személyes Programfüzeted</h2>
            <div className="space-y-6">
              {favoriteAttractions.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-purple-900 dark:text-purple-300">Elmentett Helyek</h3>
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-hide">
                    {favoriteAttractions.map(item => <MiniAttractionCard key={item.id} item={item} />)}
                  </div>
                </section>
              )}
              {favoriteEvents.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-purple-900 dark:text-purple-300">Közelgő Eseményeid</h3>
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-hide">
                    {favoriteEvents.map(event => <MiniEventCard key={event.id} event={event} />)}
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center bg-white/20 dark:bg-gray-800/50 p-6 rounded-lg shadow animate-fadein">
            <p className="font-semibold text-lg text-purple-900 dark:text-purple-300">Állítsd össze a saját programfüzeted!</p>
            <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">Böngéssz a <Link to="/attractions" className="text-purple-600 underline">látnivalók</Link> és <Link to="/events" className="text-purple-600 underline">események</Link> között, és a ❤️ ikonnal mentsd el őket ide a főoldalra!</p>
          </div>
        )
      )}

      {/* A MEGLÉVŐ INDÍTÓPULTOD */}
      <div>
        <div className="pl-4 pr-4 max-w-xl mx-auto mb-2">
          <SearchBar />
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          {sections.map(sec => (
            <Link
              key={sec.to}
              to={sec.to}
              aria-label={sec.label}
              className="bg-white/80 border border-transparent dark:bg-gray-800/80 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-md p-6 flex flex-col items-center hover:shadow-2xl dark:hover:shadow-lg transition-all duration-150 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-300 group min-h-[140px]"
            >
              <div className="w-16 h-16 mb-4 rounded-md overflow-hidden drop-shadow-lg group-hover:scale-110 transition-transform duration-200">
                <img src={sec.imgLight} alt={sec.label} className="w-full h-full object-contain block dark:hidden" draggable="false" />
                <img src={sec.imgDark} alt={sec.label} className="w-full h-full object-contain hidden dark:block" draggable="false" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-300 mb-1">{sec.label}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 text-center hidden md:block">{sec.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
