import React, { useState, useRef, useEffect } from "react";

const SOURCES = [
  { url: "/data/attractions.json", label: "Látnivalók",   key: "attractions",   route: "/attractions" },
  { url: "/data/events.json",      label: "Események",    key: "events",        route: "/events" },
  { url: "/data/hotels.json",      label: "Szállások",    key: "hotels",        route: "/hotels" },
  { url: "/data/restaurants.json", label: "Vendéglátás",  key: "restaurants",   route: "/gastronomy" },
  { url: "/data/parking.json",     label: "Parkolás",     key: "parking",       route: "/parking" },
  { url: "/data/info.json",        label: "Info",         key: "info",          route: "/info" }
];

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [modal, setModal] = useState(null);
  const ref = useRef();

  useEffect(() => {
    function clickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(true);
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
      } catch {}
    }

    setResults(found);
    setLoading(false);
  };

  function handleItemClick(item, route) {
    setModal({ ...item, route });
  }

  function closeModal() {
    setModal(null);
  }

  return (
    <div className="relative" ref={ref}>
      <form onSubmit={handleSearch} className="flex mb-2">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => q.length > 1 && setShowResults(true)}
          placeholder="Keresés: étterem, esemény, látnivaló…"
          className="border px-3 py-2 rounded-l w-full
                     border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700
                     text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          className="bg-purple-700 text-white px-4 rounded-r
                     hover:bg-purple-600
                     dark:bg-purple-700 dark:hover:bg-purple-600
                     transition-colors duration-150
                     focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          Keres
        </button>
      </form>

      {showResults && (
        <div className="absolute z-50 w-full max-h-80 overflow-auto
                         bg-white dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         rounded shadow-md dark:shadow-lg">
          {loading && <div className="p-3 text-gray-500 dark:text-gray-400">Keresés…</div>}
          {Object.keys(results).length === 0 && !loading && q.length > 1 && (
            <div className="p-3 text-gray-500 dark:text-gray-400">Nincs találat.</div>
          )}
          {Object.entries(results).map(([cat, { label, items, route }]) => (
            <div key={cat}>
              <div className="px-3 pt-2 pb-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                {label}
              </div>
              <ul>
                {items.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item, route)}
                      className="w-full text-left px-3 py-2
                                 rounded transition-colors duration-150
                                 hover:bg-purple-50 dark:hover:bg-gray-700
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

      {modal && (
        <div
          className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl
                       shadow-lg dark:shadow-xl
                       max-w-sm w-full p-5
                       text-gray-900 dark:text-gray-100
                       relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Bezár"
              className="absolute top-2 right-2 text-gray-400 dark:text-gray-500
                         hover:text-gray-700 dark:hover:text-gray-200 text-xl"
            >×</button>
            <div className="text-lg font-bold mb-1">{modal.name}</div>
            {modal.tags && <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">{modal.tags.join(", ")}</div>}
            {modal.address && <div className="mb-1"><b>Cím:</b> {modal.address}</div>}
            {modal.date && <div className="mb-1"><b>Dátum:</b> {modal.date} {modal.time || ""}</div>}
            {modal.description && <div className="mb-2">{modal.description}</div>}
            {modal.website && (
              <div>
                <a
                  href={modal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-purple-700 dark:text-purple-300"
                >Weboldal megnyitása</a>
              </div>
            )}
            {modal.route && modal.id && (
              <div className="mt-4">
                <a
                  href={`${modal.route}/${modal.id}`}
                  className="bg-purple-600 dark:bg-purple-500
                             text-white px-4 py-2 rounded
                             hover:bg-purple-700 dark:hover:bg-purple-600
                             transition-colors duration-150"
                >Részletek oldal →</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
