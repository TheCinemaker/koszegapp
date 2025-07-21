import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

// Map raw column names from the Sheet to standardized field names
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
        const rawData = await fetchMenus(sheetId, sheetName);
        console.log('Fetched raw menus:', rawData);
        const transformed = rawData.map(transformEntry);
        console.log('Transformed menus:', transformed);
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
      closeTimer.current = setTimeout(() => setOpen(false), 8000);
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

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-0 left-0 h-full w-2/3 max-w-sm bg-white shadow-lg backdrop-blur-sm transform z-50 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-end p-2 border-b">
          <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-900">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-full space-y-4">
          {loading && <div className="loader animate-spin mx-auto my-8 h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full" />}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!loading && !error && (
            menus.length ? (
              menus.map((menu, idx) => <MenuCard key={idx} data={menu} />)
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Nincs megjeleníthető menü.</p>
              </div>
            )
          )}
        </div>
      </div>
      <div
        className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-purple-600 text-white px-3 py-2 rounded-r-lg cursor-pointer select-none z-50"
        onClick={() => setOpen(o => !o)}
      >
        Heti menük
      </div>
    </>
  );
}
