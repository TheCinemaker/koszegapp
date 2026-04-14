import React, { useState, useEffect, useRef } from 'react';

export default function OstromDrawerFullAnimated() {
  const [openDrawer, setOpenDrawer] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const closeTimerRef = useRef(null);
  const initializedRef = useRef(false);

  // Alapértelmezett fül, ami automatikusan megnyílik. Ha a szüret az aktuális, legyen 'szuret'.
  const defaultTab = 'szuret';

  const [highlightImages] = useState([
    "/images/highlights/noevent.png"
  ]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onBeforeUnload = () => {
      sessionStorage.removeItem("drawerShown");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const alreadyShown = sessionStorage.getItem("drawerShown");
    if (!alreadyShown) {
      const t = setTimeout(() => {
        setOpenDrawer(defaultTab);
        sessionStorage.setItem("drawerShown", "true");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (openDrawer !== null && !hasInteracted) {
      closeTimerRef.current = setTimeout(() => setOpenDrawer(null), 5000);
      return () => clearTimeout(closeTimerRef.current);
    }
  }, [openDrawer, hasInteracted]);

  useEffect(() => {
    if (openDrawer === 'kiemelt' && !modalOpen) {
      const iv = setInterval(() => {
        setCurrentImageIdx(i => (i + 1) % highlightImages.length);
      }, 2000);
      return () => clearInterval(iv);
    }
  }, [openDrawer, modalOpen, highlightImages.length]);

  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    }
  };

  const handleDrawerClick = (type) => {
    setOpenDrawer(type);
    setHasInteracted(true);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  };

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches[0].clientX;
    const diffX = touchStartX.current - currentX;

    if (diffX > 50 && !openDrawer) {
      handleDrawerClick(defaultTab);
      touchStartX.current = null;
    }
    if (diffX < -50 && openDrawer) {
      handleDrawerClick(null);
      touchStartX.current = null;
    }
  };
  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  return (
    <>
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] transition-all duration-700"
          onClick={() => setModalOpen(false)}
        >
          <div className="text-center absolute top-4 w-full text-white text-xs font-bold">
            Kattints a bezáráshoz!
          </div>
          <img 
            src={highlightImages[currentImageIdx]} 
            alt={`kiemelt-${currentImageIdx}`} 
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-2xl transition-transform duration-700 transform scale-100"
          />
        </div>
      )}

      {openDrawer && (
        <div
          className="fixed inset-0 z-40 transition-all duration-700 ease-in-out bg-black/20"
          style={{ backdropFilter: 'blur(4px) grayscale(100%)' }}
          onClick={() => setOpenDrawer(null)}
        />
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-[50px] right-0 z-50 transform transition-transform duration-700 ease-in-out
          ${openDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div
          onScroll={handleUserInteraction}
          onMouseDown={handleUserInteraction}
          className={`w-72 h-[75vh] shadow-xl border-l-4 rounded-l-2xl overflow-y-auto font-sans flex flex-col
            ${
              openDrawer === 'kiemelt'
              ? 'bg-purple-100 text-purple-900 border-purple-500'
              : 'bg-green-100 text-green-900 border-green-500'
            }`}
        >
          <div className={`sticky top-0 px-4 py-3 flex justify-between items-center border-b z-10
            ${
              openDrawer === 'kiemelt'
              ? 'bg-purple-200 border-purple-400'
              : 'bg-green-200 border-green-400'
            }`}
          >
            <h3 className="text-lg font-extrabold">
              {
               openDrawer === 'kiemelt' ? '✨ KIEMELT FELÜLET' :
               'ORSOLYA NAP'
              }
            </h3>
            <button
              onClick={() => setOpenDrawer(null)}
              className="text-2xl font-bold hover:scale-125 transition"
              aria-label="Bezárás"
            >
              ✖
            </button>
          </div>

          <div className="p-4 flex-1 space-y-6 text-sm leading-relaxed overflow-y-auto">
            {openDrawer === 'kiemelt' ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-extrabold text-purple-800">✨ KIEMELT</h2>
                <img
                  src={highlightImages[currentImageIdx]}
                  alt={`kiemelt-${currentImageIdx}`}
                  className="w-full rounded-xl shadow-lg cursor-pointer transition-all duration-700"
                  onClick={() => setModalOpen(true)}
                />
                <p className="text-center text-xs text-purple-700">Kiemelt hirdetések & események</p>
              </div>
            ) : ( // Az alapértelmezett a 'szuret' lesz
             <div className="text-left text-sm text-green-900 space-y-5">
    {/* --- PÉNTEK --- */}
    <div>
        <h4 className="font-extrabold text-base text-green-800 pb-2 mb-3 border-b-2 border-green-300">
            2025. Október 24. - 2025. Október 25., 10:00 - 18:00
        </h4>
        <div className="space-y-3">
            <div>
                <p className="font-semibold">ORSOLYA NAPI VÁSÁR</p>
                <p className="text-xs text-green-700/80 ml-5">📍 Diáksétány</p>
            </div>
        </div>
    </div>

    {/* --- KIEGÉSZÍTŐ INFORMÁCIÓK --- */}
    <div className="pt-4 mt-4 border-t-2 border-green-300 text-xs italic text-green-800/80 text-center">
        <p>ORSOLYA NAPI VÁSÁR PROGRAMFÜZET HAMAROSAN</p>
        <p className="mt-2">A műsorváltoztatás jogát fenntartjuk!</p>
    </div>
</div>
            )}
          </div>

          <div className={`sticky bottom-0 text-center py-2 text-xs font-bold border-t
            ${
              openDrawer === 'kiemelt'
              ? 'bg-purple-200 border-purple-400'
              : 'bg-green-200 border-green-400'
            }`}
          >
            © visitkoszeg – 2025
          </div>
        </div>

        {/* Drawer toggle buttons */}
        <div
          onClick={() => handleDrawerClick('szuret')}
          className={`absolute top-[35%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center
            border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left
            cursor-pointer transition
            ${
              openDrawer === 'szuret'
              ? 'bg-green-400 text-green-900 border-green-600'
              : 'bg-green-200 text-green-700 border-green-400 opacity-70'
            }
            hover:bg-green-300`}
        >
          <span className="text-xs font-bold">ORSOLYA NAP 2025</span>
        </div>

        <div
          onClick={() => handleDrawerClick('kiemelt')}
          className={`absolute top-[55%] px-3 py-1.5 -left-4 w-35 h-10 flex items-center justify-center
            border rounded-br-2xl rounded-bl-2xl shadow transform rotate-90 origin-left
            cursor-pointer transition
            ${
              openDrawer === 'kiemelt'
              ? 'bg-purple-400 text-white border-purple-600'
              : 'bg-purple-200 text-purple-700 border-purple-400 opacity-70'
            }
            hover:bg-purple-300`}
        >
          <span className="text-xs font-bold">KIEMELT FELÜLET</span>
        </div>
      </div>
    </>
  );
}
