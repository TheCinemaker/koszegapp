import React, { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheet.js';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

export default function AnimatedWeeklyMenuDrawer() {
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
        console.log('Fetched menus:', data);
        setMenus(data);
      } catch (err) {
        console.error('Error fetching menus:', err);
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => (touchStartX.current = null)}
        className={`fixed top-0 left-0 h-full w-2/3 max-w-sm bg-white shadow-lg backdrop-blur-sm transform z-50 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-end p-2 border-b">
          {/* Close icon from lucide-react could be used here */}
          <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-900">
            ✕
          </button>
        </div>
        <div
          className="p-4 overflow-y-auto h-full space-y-4"
          onScroll={handleUserInteraction}
          onTouchMove={handleUserInteraction}
        >
          {loading && (
            <div className="flex justify-center">
              {/* Spinner component placeholder */}
              <div className="loader h-6 w-6 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            menus.length > 0 ? (
              menus.map((menu, idx) => (
                <MenuCard key={idx} data={menu} />
              ))
            ) : (
              <div className="text-center text-gray-500 space-y-2">
                <p>Nincs megjeleníthető menü.</p>
                <EmptyState message="Jelenleg nincs elérhető heti menü." />
              </div>
            )
          )}
        </div>
      </div>

      {/* Handle */}
      <div
        className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-purple-600 text-white px-3 py-2 rounded-r-lg cursor-pointer select-none z-50"
        onClick={() => setOpen(o => !o)}
      >
        Heti menük
      </div>
    </>
  );
}
