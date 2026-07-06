// src/pages/Kiosk/KioskDrawGallery.jsx
import React, { useState, useEffect } from 'react';
import { IoChevronBackOutline, IoChevronForwardOutline, IoSparklesOutline, IoColorPaletteOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { useKioskLang } from '../../contexts/KioskLangContext';
import { supabase } from '../../lib/supabaseClient';

const ITEMS_PER_PAGE = 6; // Perfect grid for Kiosk screens (2 columns x 3 rows)

export default function KioskDrawGallery() {
  const { t } = useKioskLang();
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch approved drawings from Supabase
  useEffect(() => {
    async function fetchDrawings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('kiosk_drawings')
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setDrawings(data);
      } catch (err) {
        console.error("Error loading approved drawings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDrawings();
  }, []);

  const totalPages = Math.ceil(drawings.length / ITEMS_PER_PAGE);
  const displayedDrawings = drawings.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const formatArtistMeta = (drawing) => {
    const parts = [];
    const hasName = drawing.name && drawing.name !== 'Anonymous';
    
    if (hasName) {
      if (drawing.age) {
        parts.push(`${drawing.name} (${drawing.age})`);
      } else {
        parts.push(drawing.name);
      }
    } else {
      parts.push(t('draw.anonymous'));
    }

    if (drawing.country) {
      parts.push(drawing.country);
    }

    return parts.join(', ');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none animate-fadeIn">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <IoSparklesOutline className="text-sm" />
            {t('draw.subtitle')}
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            {t('draw.galleryTitle')}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            {t('draw.galleryDesc')}
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-24 text-zinc-400 font-bold">
            {t('attractions.loading')}
          </div>
        ) : drawings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center text-zinc-400 dark:text-zinc-500 gap-4">
            <IoColorPaletteOutline className="text-6xl text-indigo-400/50" />
            <p className="font-bold text-lg">{t('draw.emptyGallery')}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-6">
            
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {displayedDrawings.map((draw) => (
                <div 
                  key={draw.id}
                  className="rounded-[2rem] overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/60 shadow-lg flex flex-col h-72 group backdrop-blur-sm"
                >
                  {/* Drawing Image (Fit with blurred bg) */}
                  <div className="relative flex-1 bg-zinc-950 overflow-hidden flex items-center justify-center">
                    {/* Blurred background image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 scale-110"
                      style={{ backgroundImage: `url(${draw.image_path})` }}
                    />
                    {/* Actual drawing */}
                    <img 
                      src={draw.image_path}
                      alt={draw.theme}
                      className="relative z-10 w-full h-full object-contain p-2"
                    />
                    
                    {/* Theme badge on top left */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white rounded-full z-20 border border-white/10">
                      {draw.theme}
                    </span>
                  </div>

                  {/* Metadata section */}
                  <div className="p-4 flex flex-col gap-0.5 text-center bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-800 dark:text-zinc-200 text-xs font-black truncate">
                      {formatArtistMeta(draw)}
                    </span>
                    <span className="text-zinc-400 text-[9px] font-bold">
                      {new Date(draw.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Touch Paging controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-4 pb-8">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm active:scale-90 hover:shadow-md transition-all disabled:opacity-30 disabled:scale-100"
                >
                  <IoChevronBackOutline size={24} />
                </button>

                <span className="text-zinc-700 dark:text-zinc-300 font-extrabold text-sm">
                  {currentPage + 1} / {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm active:scale-90 hover:shadow-md transition-all disabled:opacity-30 disabled:scale-100"
                >
                  <IoChevronForwardOutline size={24} />
                </button>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
