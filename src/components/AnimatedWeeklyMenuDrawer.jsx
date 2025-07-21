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
  menu_fri_c: raw['Péntek C menü'] || ''
});

const getTodayMenus = (menus, selectedRestaurant) => {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const todayIdx = Math.min(new Date().getDay() - 1, 4);
  const today = days[todayIdx];
  return menus.filter(m => !selectedRestaurant || m.etterem === selectedRestaurant).map(m => ({
    ...m,
    todayMenus: [m[`menu_${today}_a`], m[`menu_${today}_b`], m[`menu_${today}_c`]].filter(Boolean)
  })).filter(m => m.todayMenus.length > 0);
};

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const touchStartX = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const rawData = await fetchMenus(sheetId, sheetName);
        const transformed = rawData.map(transformEntry);
        setMenus(transformed);
      } catch (err) {
        console.error('Error fetching menus:', err);
        setError('Hiba a menük betöltésekor.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (open) {
      closeTimer.current = setTimeout(() => setOpen(false), 12000);
      return () => clearTimeout(closeTimer.current);
    }
  }, [open]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (!open && diff > 50) setOpen(true);
    if (open && diff < -50) setOpen(false);
    touchStartX.current = null;
  };

  const restaurants = [...new Set(menus.map(m => m.etterem))];
  const todayMenus = getTodayMenus(menus, selectedRestaurant);
  const todayDate = new Date().toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 transition-all duration-700 ease-in-out bg-black/20" style={{ backdropFilter: 'blur(4px) grayscale(100%)' }} onClick={() => setOpen(false)} />
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-[50px] left-0 z-50 transform transition-transform duration-700 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="w-72 h-[75vh] shadow-xl border-r-4 rounded-r-2xl overflow-y-auto bg-blue-100 text-blue-900 border-blue-500 font-sans flex flex-col">
          <div className="sticky top-0 px-4 py-3 flex justify-between items-center border-b bg-blue-200 border-blue-400 z-10">
            <h2 className="text-sm font-bold text-blue-900">{todayDate}</h2>
            <button onClick={() => setOpen(false)} className="text-xl font-bold hover:scale-125 transition" aria-label="Bezárás">✖</button>
          </div>

          <div className="text-center text-lg font-extrabold text-blue-800 px-4 pb-2 border-b border-blue-300">Éttermek napi menüi</div>

          <div className="px-4 py-3">
            <select className="w-full border p-2 rounded text-sm" value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}>
              <option value="">Összes étterem</option>
              {restaurants.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="p-4 flex-1 space-y-4 text-sm leading-relaxed">
            {loading && <div className="loader animate-spin mx-auto my-8 h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />}
            {error && <p className="text-red-500 text-center">{error}</p>}
            {!loading && !error && (
              todayMenus.length ? (
                todayMenus.map((menu, idx) => (
                  <MenuCard key={idx} data={menu} showTodayOnly />
                ))
              ) : (
                <div className="text-center text-blue-500 py-8">
                  <p>Nincs elérhető napi menü.</p>
                </div>
              )
            )}
          </div>

          <div className="sticky bottom-0 text-center py-2 text-xs font-bold border-t bg-blue-200 border-blue-400">
            © KőszegAPP – 2025
          </div>
        </div>
      </div>

      <div
        className={`fixed top-[40%] px-3 py-1.5 left-0 w-35 h-10 flex items-center justify-center border rounded-tr-2xl rounded-br-2xl shadow transform -rotate-90 origin-top-left cursor-pointer z-50 transition bg-blue-200 text-blue-700 border-blue-400 hover:bg-blue-300`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-bold">NAPI MENÜK</span>
      </div>
    </>
  );
}
