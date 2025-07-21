import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheets.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

export default function WeeklyMenuDrawerAnimated() {
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const touchStartX = useRef(null);
  const closeTimer = useRef(null);

  // Load menus once on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMenus(sheetId, sheetName);
        setMenus(data);
      } catch (err) {
        console.error(err);
        setError('Hiba a menük betöltésekor.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-close after inactivity
  useEffect(() => {
    if (open && !hasInteracted) {
      closeTimer.current = setTimeout(() => setOpen(false), 8000);
      return () => clearTimeout(closeTimer.current);
    }
  }, [open, hasInteracted]);

  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      clearTimeout(closeTimer.current);
    }
  };

  // Swipe to open/close
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
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform z-50 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-end p-2 border-b">
          <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-900">
            ✕
          </button>
        </div>
        <div
          className="p-4 overflow-y-auto h-full"
          onScroll={handleUserInteraction}
          onTouchMove={handleUserInteraction}
        >
          {loading && <p>Betöltés...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            menus.length > 0 ? (
              menus.map((menu, idx) => (
                <MenuCard key={idx} data={menu} />
              ))
            ) : (
              <p>Nincs megjeleníthető menü.</p>
            )
          )}
        </div>
      </div>

      {/* Handle */}
      <div
        className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-purple-600 text-white p-2 rounded-r-lg cursor-pointer select-none z-50"
        onClick={() => setOpen(o => !o)}
      >
        📋
      </div>
    </>
  );
}
