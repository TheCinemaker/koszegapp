import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SOURCES = [
  { url: "/data/attractions.json", label: "Látnivalók", key: "attractions", route: "/attractions" },
  { url: "/data/events.json", label: "Események", key: "events", route: "/events" },
  { url: "/data/hotels.json", label: "Szállások", key: "hotels", route: "/hotels" },
  { url: "/data/restaurants.json", label: "Vendéglátás", key: "restaurants", route: "/gastronomy" },
  { url: "/data/parking.json", label: "Parkolás", key: "parking", route: "/parking" },
  { url: "/data/info.json", label: "Info", key: "info", route: "/info" }
];

export default function SearchBar() { // Refreshed
  const [q, setQ] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const ref = useRef();
  const navigate = useNavigate(); // Hook for navigation

  // "Élő" keresés useEffect-fel, ami a 'q' (keresőszó) változását figyeli
  useEffect(() => {
    // Ha a keresőmező üres, vagy kevesebb mint 2 karakter van benne, mindent törlünk.
    if (q.trim().length < 2) {
      setResults({});
      setShowResults(false);
      setLoading(false);
      return;
    }

    setShowResults(true);
    setLoading(true);

    // Késleltetjük a keresést, hogy ne minden billentyűleütésre fusson le
    const delayDebounceFn = setTimeout(async () => {
      let found = {};
      for (let src of SOURCES) {
        try {
          const resp = await fetch(src.url);
          const data = await resp.json();
          const list = data.filter(item =>
            (item.name && item.name.toLowerCase().includes(q.toLowerCase())) ||
            (item.tags && item.tags.join(" ").toLowerCase().includes(q.toLowerCase()))
          );
          if (list.length) found[src.key] = { label: src.label, items: list, route: src.route };
        } catch (error) {
          console.error(`Hiba a(z) ${src.url} betöltésekor:`, error);
        }
      }
      setResults(found);
      setLoading(false);
    }, 300); // 300ms várakozás a gépelés befejezése után

    // Takarítás: ha a felhasználó újra gépel, a régi időzítőt töröljük
    return () => clearTimeout(delayDebounceFn);
  }, [q]);

  // Külső kattintás figyelése a találati lista bezárásához
  useEffect(() => {
    function clickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Megakadályozza, hogy az Enter lenyomása újratöltse az oldalt
  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  function handleItemClick(item, route) {
    // Navigate immediately to the detail page
    navigate(`${route}/${item.id}`);
    setShowResults(false);
    setQ(""); // Optional: Clear search after navigation
  }

  return (
    <div className="relative" ref={ref}>
      <form onSubmit={handleFormSubmit} className="flex gap-4">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (q.trim().length > 1) setShowResults(true); }}
          placeholder="Keress bármire..."
          className="flex-1 h-9 px-4 rounded-xl
                     bg-white/80 dark:bg-gray-800/80
                     backdrop-blur-md
                     border border-white/20 dark:border-gray-700/50
                     text-sm text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                     transition-all duration-300
                     hover:bg-white/90 dark:hover:bg-gray-800/90"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-xl flex items-center justify-center
                     bg-gradient-to-br from-indigo-500 to-purple-600
                     text-white shadow-lg
                     hover:from-indigo-600 hover:to-purple-700
                     transition-all duration-300
                     hover:scale-105 active:scale-95
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <FaSearch className="text-xs" />
        </button>
      </form>

      {showResults && (
        <div className="absolute z-[100] w-full max-h-80 overflow-auto mt-2
                         bg-white dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         rounded-2xl shadow-xl">
          {loading && <div className="p-4 text-gray-500 dark:text-gray-400">Keresés…</div>}
          {Object.keys(results).length === 0 && !loading && q.length > 1 && (
            <div className="p-4 text-gray-500 dark:text-gray-400">Nincs találat.</div>
          )}
          {Object.entries(results).map(([cat, { label, items, route }]) => (
            <div key={cat}>
              <div className="px-4 pt-3 pb-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {label}
              </div>
              <ul>
                {items.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item, route)}
                      className="w-full text-left px-4 py-3
                                 rounded-xl mx-2 my-1
                                 transition-all duration-200
                                 hover:bg-indigo-50/80 dark:hover:bg-gray-700/80
                                 text-gray-900 dark:text-gray-100"
                    >
                      <span className="font-semibold">{item.name}</span>
                      {item.tags && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {item.tags.join(", ")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
