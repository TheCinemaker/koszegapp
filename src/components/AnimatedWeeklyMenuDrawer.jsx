import React, { useState, useEffect, useRef, useMemo } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';
const EMPTY_DAY = { leves: null, foetelek: [] };

const transformEntry = (raw) => {
  const days = {
    hetfo: { a: 'Hétfő A menü', b: 'Hétfő B menü', c: 'Hétfő C menü', leves: 'Hétfő leves' },
    kedd: { a: 'Kedd A menü', b: 'Kedd B menü', c: 'Kedd C menü', leves: 'Kedd leves' },
    szerda: { a: 'Szerda A menü', b: 'Szerda B menü', c: 'Szerda C menü', leves: 'Szerda leves' },
    csutortok: { a: 'Csütörtök A menü', b: 'Csütörtök B menü', c: 'Csütörtök C menü', leves: 'Csütörtök leves' },
    pentek: { a: 'Péntek A menü', b: 'Péntek B menü', c: 'Péntek C menü', leves: 'Péntek leves' },
    szombat: { a: 'Szombat A menü', b: 'Szombat B menü', c: 'Szombat C menü', leves: 'Szombat leves' }
  };

  const menuData = {};
  for (const dayKey in days) {
    const dayColumns = days[dayKey];
    const foetelek = ['a','b','c']
      .map(label => ({ label: label.toUpperCase(), etel: raw[dayColumns[label]] || null }))
      .filter(f => f.etel);
    if (raw[dayColumns.leves] || foetelek.length > 0) {
      menuData[dayKey] = { leves: raw[dayColumns.leves] || null, foetelek };
    }
  }

  return {
    etterem: raw['Étterm neve'] || raw['Étterem neve'] || raw['Etterem neve'] || '',
    kapcsolat: raw['Elérhetőség (telefon)'] || raw['Elérhetőség'] || '',
    hazhozszallitas: raw['Kiszállítás'] || raw['Házhozszállítás'] || '',
    menu: menuData,
    arak: {
      a: raw['"A" menü ára'] || null,
      b: raw['"B" menü ára'] || null,
      c: raw['"C" menü ára'] || null,
      allando: raw['Állandó menü ára'] || null
    },
    menu_allando: raw['Állandó menü'] || raw['Állandó menü:'] || '',
    validFrom: raw['Kezdő dátum'] ? raw['Kezdő dátum'].toString().trim() : '',
    validTo: raw['Utolsó nap dátum'] ? raw['Utolsó nap dátum'].toString().trim() : ''
  };
};

const parseDate = (str) => {
  if (!str) return null;
  if (typeof str === 'string' && str.startsWith('Date(')) {
    const parts = str.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (parts) { const [_, y, m, d] = parts.map((n,i)=> i>0?parseInt(n,10):null); return new Date(y, m, d); }
  }
  if (typeof str === 'string' && str.includes('.')) {
    const cleaned = str.trim().replace(/\.+$/, '');
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(cleaned)) {
      const [year, month, day] = cleaned.split('.').map(s=>parseInt(s,10));
      return new Date(year, month-1, day);
    }
  }
  return null;
};

const isMenuValidToday = (menu) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = parseDate(menu.validFrom);
  const end   = parseDate(menu.validTo);
  if (!start || !end) return false;
  start.setHours(0,0,0,0); end.setHours(0,0,0,0);
  return today >= start && today <= end;
};

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    fetchMenus(sheetId, sheetName)
      .then(data => { if (mounted) setMenus(data.map(transformEntry)); })
      .catch(() => { if (mounted) setError('Hiba a menük betöltésekor.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [open]);

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = e => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (!open && diff > 50) setOpen(true);
    if (open  && diff < -50) setOpen(false);
    touchStartX.current = null;
  };

  const validMenus = useMemo(() => menus.filter(isMenuValidToday), [menus]);
  const restaurants = useMemo(
    () => Array.from(new Set(validMenus.map(m => m.etterem))).filter(Boolean).sort(),
    [validMenus]
  );

  // ⬇️ ÚJ: ha kiválasztasz egy éttermet, automatikusan a heti nézetre vált
  useEffect(() => {
    if (!selectedRestaurant) { setExpandedRestaurant(null); return; }
    const found = validMenus.find(m => m.etterem === selectedRestaurant) || null;
    setExpandedRestaurant(found);
  }, [selectedRestaurant, validMenus]);

  const todayDate = new Date().toLocaleDateString('hu-HU', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
  const dayKey = ['vasarnap','hetfo','kedd','szerda','csutortok','pentek','szombat'][new Date().getDay()];

  const weekDays = [
    { key: 'hetfo', label: 'Hétfő' },
    { key: 'kedd', label: 'Kedd' },
    { key: 'szerda', label: 'Szerda' },
    { key: 'csutortok', label: 'Csütörtök' },
    { key: 'pentek', label: 'Péntek' },
    { key: 'szombat', label: 'Szombat' },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={()=>setOpen(false)} />}

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-0 left-0 h-full z-50 w-full max-w-sm 
                    transform transition-transform duration-700 ease-in-out
                    pointer-events-auto
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="w-full h-full bg-blue-100 dark:bg-zinc-900 shadow-lg border-r-4 border-blue-400 dark:border-purple-500 rounded-r-xl overflow-hidden relative flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center border-b p-4 bg-blue-200 dark:bg-zinc-800 border-blue-300 dark:border-zinc-700">
            <h2 className="text-sm font-bold text-blue-800 dark:text-purple-300">{todayDate}</h2>
            <button onClick={()=>setOpen(false)} className="text-blue-800 dark:text-purple-300 hover:text-blue-900 dark:hover:text-purple-100" aria-label="Bezárás">✕</button>
          </div>

          {/* Title */}
          <div className="text-center px-4 pt-3 pb-2">
            <h2 className="text-lg font-bold text-blue-900 dark:text-purple-200">
              {expandedRestaurant ? 'Heti menü' : 'Napi menü ajánlatok'}
            </h2>
          </div>

          {/* Étterem választó – MINDIG látszik */}
          <div className="px-4 pb-3">
            <select
              className="w-full border p-2 rounded text-sm bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 text-gray-800 dark:text-gray-200"
              value={selectedRestaurant}
              onChange={(e)=>setSelectedRestaurant(e.target.value)}
              aria-label="Válassz éttermet"
            >
              <option value="">Összes étterem</option>
              {restaurants.map((r, idx) => (<option key={idx} value={r}>{r}</option>))}
            </select>
          </div>

                    {/* Tartalom */}
          <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />
              </div>
            ) : error ? (
              <div className="text-center p-4 text-red-500">
                {error}
                <button onClick={()=>window.location.reload()} className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">Újrapróbálom</button>
              </div>
            ) : expandedRestaurant ? (
              {/* --- HETI NÉZET: kiválasztott étterem teljes hete --- */}
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow">
                <h3 className="text-lg font-bold text-blue-800 dark:text-purple-300">
                  {expandedRestaurant.etterem}
                </h3>

                <div className="text-xs italic mt-1 text-blue-700 dark:text-purple-400">
                  {expandedRestaurant.kapcsolat && <div>Kapcsolat: {expandedRestaurant.kapcsolat}</div>}
                  {expandedRestaurant.hazhozszallitas && <div>Házhozszállítás: {expandedRestaurant.hazhozszallitas}</div>}
                </div>

                <div className="mt-4 space-y-3">
                  {weekDays.map(day => {
                    const d = expandedRestaurant.menu?.[day.key] || EMPTY_DAY;
                    if (!d.leves && d.foetelek.length === 0) {
                      return null;
                    }
                    return (
                      <div key={day.key}>
                        <h4 className="font-bold">{day.label}</h4>
                        <MenuCard dayMenu={d} />
                      </div>
                    );
                  })}
                  {expandedRestaurant.menu_allando && (
                    <p className="text-sm mt-4 pt-2 border-t border-gray-200 dark:border-zinc-700">
                      <strong>Állandó ajánlat:</strong> {expandedRestaurant.menu_allando}
                    </p>
                  )}
                </div>
              </div>
            ) : validMenus.length > 0 ? (
              validMenus.map((menu, index) => (
                <div key={index} className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow">
                  <h3 className="text-lg font-bold text-blue-800 dark:text-purple-300">
                    {menu.etterem}
                  </h3>
                  
                  <div className="text-xs italic mt-1 text-blue-700 dark:text-purple-400">
                    {menu.kapcsolat && <div>Kapcsolat: {menu.kapcsolat}</div>}
                    {menu.hazhozszallitas && <div>Házhozszállítás: {menu.hazhozszallitas}</div>}
                  </div>

                  <div className="mt-3">
                    <h4 className="font-bold">{['Vasárnap','Hétfő','Kedd','Szerda','Csütörtök','Péntek','Szombat'][new Date().getDay()]}</h4>
                    <MenuCard dayMenu={menu.menu?.[dayKey] || EMPTY_DAY} />
                  </div>

                  {menu.menu_allando && (
                    <p className="text-sm mt-4 pt-2 border-t border-gray-200 dark:border-zinc-700">
                      <strong>Állandó ajánlat:</strong> {menu.menu_allando}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-blue-500 dark:text-purple-400 py-8">
                <p>Ma nincs érvényes napi menü.</p>
              </div>
            )}
          </div>

          <div className="text-xs text-center text-blue-800 dark:text-purple-300 py-2 border-t bg-blue-200 dark:bg-zinc-800 border-blue-300 dark:border-zinc-700">
            © KőszegAPP – {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Fül */}
      <div
        onClick={() => setOpen(o=>!o)}
        className={`fixed top-1/2 z-[51] -translate-y-1/2 
                    px-3 py-1.5 w-24 h-8 flex items-center justify-center
                    border rounded-sm shadow rotate-90 origin-bottom-left cursor-pointer
                    transition-all duration-700 ease-in-out
                    ${open ? 'left-[384px] bg-blue-400 text-white border-blue-600'
                           : 'left-0 -ml-px bg-blue-200 text-blue-700 border-blue-400 opacity-80'}
                    hover:opacity-100`}
      >
        <span className="text-xs font-bold whitespace-nowrap">NAPI MENÜ</span>
      </div>
    </>
  );
}
