import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

const transformEntry = (raw) => ({
  etterem: raw['Étterm neve'] || raw['Étterem neve'] || raw['Etterem neve'] || '',
  kapcsolat: raw['Elérhetőség (telefon)'] || raw['Elérhetőség'] || '',
  hazhozszallitas: raw['Kiszállítás'] || raw['Házhozszállítás'] || '',
  menu_allando: raw['Állandó menü'] || '',
  menu_mon_a: raw['Hétfő A menü'] || '',
  menu_mon_b: raw['Hétfő B menü'] || '',
  menu_mon_c: raw['Hétfő C menü'] || '',
  menu_tue_a: raw['Kedd A menü'] || '',
  menu_tue_b: raw['Kedd B menü'] || '',
  menu_tue_c: raw['Kedd C menü'] || '',
  menu_wed_a: raw['Szerda A menü'] || '',
  menu_wed_b: raw['Szerda B menü'] || '',
  menu_wed_c: raw['Szerda C menü'] || '',
  menu_thu_a: raw['Csütörtök A menü'] || '',
  menu_thu_b: raw['Csütörtök B menü'] || '',
  menu_thu_c: raw['Csütörtök C menü'] || '',
  menu_fri_a: raw['Péntek A menü'] || '',
  menu_fri_b: raw['Péntek B menü'] || '',
  menu_fri_c: raw['Péntek C menü'] || '',
  menu_sat_a: raw['Szombat A menü'] || '',
  menu_sat_b: raw['Szombat B menü'] || '',
  menu_sat_c: raw['Szombat C menü'] || '',
  price_a: raw['"A" menü ára'] || '',
  price_b: raw['"B" menü ára'] || '',
  price_c: raw['"C" menü ára'] || '',
  price_allando: raw['Állandó menü ára'] || '',
  validFrom: raw['Kezdő dátum'] ? raw['Kezdő dátum'].toString().trim() : '',
  validTo: raw['Utolsó nap dátum'] ? raw['Utolsó nap dátum'].toString().trim() : ''
});

const parseDate = (str) => {
  if (!str) return null;
  if (typeof str === 'string' && str.startsWith('Date(')) {
    const parts = str.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (parts) {
      const [_, y, m, d] = parts.map((n, i) => i > 0 ? parseInt(n, 10) : null);
      return new Date(y, m, d);
    }
  }
  if (typeof str === 'string' && str.includes('.')) {
    const cleaned = str.trim().replace(/\.+$/, '');
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(cleaned)) {
      const [year, month, day] = cleaned.split('.').map(s => parseInt(s, 10));
      return new Date(year, month - 1, day);
    }
  }
  return null;
};

const isMenuValidToday = (menu) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const start = parseDate(menu.validFrom);
  const end   = parseDate(menu.validTo);
  if (!start || !end) return false;
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  return today >= start && today <= end;
};

const getTodayMenus = (menus, selectedRestaurant) => {
  const days = ['mon','tue','wed','thu','fri','sat'];
  const idx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const today = days[idx];
  const valid = menus.filter(isMenuValidToday);
  if (selectedRestaurant) {
    return valid.filter(m => m.etterem === selectedRestaurant);
  }
  return valid.map(m => {
    const todayMenus = [m[`menu_${today}_a`], m[`menu_${today}_b`], m[`menu_${today}_c`]]
      .filter(x => x && x.trim());
    return {...m, todayMenus};
  }).filter(m => m.todayMenus.length);
};

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const touchStartX = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchMenus(sheetId, sheetName)
      .then(data => {
        if (!mounted) return;
        setMenus(data.map(transformEntry));
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setError('Hiba a menük betöltésekor.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = e => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (!open && diff > 50) setOpen(true);
    if (open  && diff < -50) setOpen(false);
    touchStartX.current = null;
  };

  const restaurants = Array.from(new Set(menus.map(m => m.etterem))).sort();
  const todayMenus   = getTodayMenus(menus, selectedRestaurant);
  const todayDate    = new Date().toLocaleDateString('hu-HU',{
    weekday:'long',year:'numeric',month:'long',day:'numeric'
  });

return (
  <>
    {/* Overlay háttér ha nyitva van */}
    {open && (
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
    )}

    {/* Drawer + Fül container */}
    <div className="fixed top-0 left-0 h-[85%] mt-6 z-50 flex items-start pointer-events-none">

      {/* Drawer panel */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
          className={`w-2/3 max-w-sm h-full bg-blue-100 shadow-lg transform transition-transform duration-300 ease-in-out
            ${open ? 'translate-x-0' : '-translate-x-full'}
              border-r-4 border-blue-400 rounded-r-xl pointer-events-auto relative overflow-visible`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4 bg-blue-200">
          <h2 className="text-sm font-bold text-blue-800">{todayDate}</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-blue-800 hover:text-blue-900"
            aria-label="Bezárás"
          >
            ✕
          </button>
        </div>

        {/* Cím */}
        <div className="text-center text-lg font-bold text-blue-900 px-4 pb-2">
          Éttermek napi menüi
        </div>

        {/* Étterem választó */}
        <div className="px-4 pb-3">
          <select
            className="w-full border p-2 rounded text-sm"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            aria-label="Válassz éttermet"
          >
            <option value="">Összes étterem</option>
            {restaurants.map((r, idx) => (
              <option key={idx} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Menü tartalom */}
        <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-180px)] space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
              >
                Újrapróbálom
              </button>
            </div>
          ) : todayMenus.length ? (
            todayMenus.map((menu, idx) => (
              <div key={`${menu.etterem}-${idx}`} className="bg-white p-3 rounded shadow">
                <div className="text-sm font-semibold text-blue-700">
                  {menu.etterem}
                  <div className="text-xs text-blue-700 italic">
                    {menu.kapcsolat && <div>Kapcsolat: {menu.kapcsolat}</div>}
                    {menu.hazhozszallitas && <div>Házhozszállítás: {menu.hazhozszallitas}</div>}
                    {(menu.price_a || menu.price_b || menu.price_c || menu.price_allando) && (
                      <div>
                        Árak:
                        {menu.price_a && ` A: ${menu.price_a} Ft`}
                        {menu.price_b && ` B: ${menu.price_b} Ft`}
                        {menu.price_c && ` C: ${menu.price_c} Ft`}
                        {menu.price_allando && ` Állandó: ${menu.price_allando} Ft`}
                      </div>
                    )}
                  </div>
                </div>
                <MenuCard data={menu} showTodayOnly={!selectedRestaurant} />
              </div>
            ))
          ) : (
            <div className="text-center text-blue-500 py-8">
              <p>Nincs elérhető napi menü.</p>
              {menus.length > 0 && (
                <p className="text-xs mt-2">
                  ({menus.length} étterem van a rendszerben, de nincs ma érvényes menü)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-center text-blue-800 py-2 border-t bg-blue-200">
          © KőszegAPP – {new Date().getFullYear()}
        </div>
      </div>

      {/* Fül – mindig a képernyő bal szélén, drawer része, de kívül marad */}
     <div
        className="absolute top-1/2 right-[-32px] z-50 transform -translate-y-1/2 pointer-events-auto"
          onClick={() => setOpen(o => !o)}
      >
    <div className="w-8 h-24 flex items-center justify-center bg-blue-400 text-white border border-blue-600 rounded-l-lg shadow hover:bg-blue-500">
      <span className="text-xs font-bold transform rotate-90 whitespace-nowrap">
            NAPI MENÜK
          </span>
        </div>
      </div>
    </div>
  </>
);

}
