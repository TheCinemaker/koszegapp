import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

const transformEntry = raw => ({
  etterem: raw['Étterm neve'] || '',
  kapcsolat: raw['Elérhetőség'] || '',
  hazhozszallitas: raw['Kiszállítás'] || '',
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

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const touchStartX = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const raw = await fetchMenus(sheetId, sheetName);
        setMenus(raw.map(transformEntry));
      } catch {
        setError('Nem sikerült betölteni a menüket.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeTimer.current = setTimeout(() => setOpen(false), 8000);
    return () => clearTimeout(closeTimer.current);
  }, [open]);

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = e => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (!open && diff > 50) setOpen(true);
    if (open && diff < -50) setOpen(false);
    touchStartX.current = null;
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-0 left-0 h-full w-80 bg-blue-100 text-blue-900 border-r-4 border-blue-500 shadow-xl transform z-50 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="sticky top-0 flex justify-between items-center bg-blue-200 border-b border-blue-400 p-4 z-10 rounded-tr-2xl">
          <h3 className="flex items-center space-x-2 text-lg font-bold">
            <span>📋</span>
            <span>Heti menük</span>
          </h3>
          <button onClick={() => setOpen(false)} className="text-2xl hover:scale-125 transition">
            ✖
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)] space-y-4">
          {loading && (
            <div className="flex justify-center my-8">
              <div className="loader animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-600 rounded-full" />
            </div>
          )}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loading && !error && (
            menus.length ? (
              menus.map((menu, idx) => <MenuCard key={idx} data={menu} />)
            ) : (
              <div className="text-center text-gray-500 py-8">Jelenleg nincs elérhető menü.</div>
            )
          )}
        </div>
      </div>

      <div className="fixed top-1/2 left-0 transform -translate-y-1/2 z-50">
        <button
          onClick={() => setOpen(o => !o)}
          className="bg-blue-500 text-white px-4 py-2 rounded-tr-lg rounded-br-lg shadow-md focus:outline-none"
        >
          Heti menük
        </button>
      </div>
    </>
  );
}
