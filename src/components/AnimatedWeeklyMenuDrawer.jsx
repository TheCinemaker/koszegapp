import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

export default function AnimatedWeeklyMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const touchStartX = useRef(null);
  const closeTimerRef = useRef(null);
  const initializedRef = useRef(false);

  // Fetch menus on mount
  useEffect(() => {
    async function load() {
      try {
        const raw = await fetchMenus(sheetId, sheetName);
        setMenus(raw);
      } catch (e) {
        setError('Nem sikerült betölteni a menüket.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-open drawer once on first visit
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const shown = sessionStorage.getItem('drawerShown');
    if (!shown) {
      const t = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem('drawerShown', 'true');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Auto-close after inactivity
  useEffect(() => {
    if (!open) return;
    closeTimerRef.current = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(closeTimerRef.current);
  }, [open]);

  // Swipe handlers
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = e => {
    if (touchStartX.current == null) return;
    const diff = touchStartX.current - e.touches[0].clientX;
    if (diff > 50 && !open) setOpen(true);
    if (diff < -50 && open) setOpen(false);
    touchStartX.current = null;
  };

  return (
    <>
      {/* Overlay when open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer + handle container */}
      <div
        className={`fixed top-0 left-0 z-50 flex h-full transform transition-transform duration-700 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
      >
        {/* Drawer panel */}
        <div className="w-72 bg-amber-100 text-amber-900 border-r-4 border-amber-500 shadow-xl flex flex-col">
          <div className="flex justify-between items-center bg-amber-200 border-b border-amber-400 p-3 sticky top-0">
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <span>📋</span><span>Heti menük</span>
            </h3>
            <button onClick={() => setOpen(false)} className="text-xl font-bold hover:scale-125 transition">
              ✖
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {loading && <p className="text-center">Betöltés...</p>}
            {error && <p className="text-red-600 text-center">{error}</p>}
            {!loading && !error && (
              menus.length > 0 ? (
                menus.map((menu, idx) => <MenuCard key={idx} data={menu} />)
              ) : (
                <p className="text-center text-gray-500">Nincs elérhető menü.</p>
              )
            )}
          </div>
        </div>

        {/* Handle attached to panel */}
        <button
          onClick={() => setOpen(o => !o)}
          className="bg-amber-500 text-white px-3 py-1.5 border border-amber-700 shadow transform rotate-90 origin-top-left rounded-br-2xl rounded-bl-2xl hover:bg-amber-600 focus:outline-none"
        >
          Heti menük
        </button>
      </div>
    </>
  );
}
