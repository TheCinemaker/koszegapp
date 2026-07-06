// src/pages/Kiosk/KioskDrawAdmin.jsx
import React, { useState, useEffect } from 'react';
import { IoShieldCheckmarkOutline, IoCheckmarkCircleOutline, IoTrashOutline, IoLockClosedOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { useKioskLang } from '../../contexts/KioskLangContext';
import { supabase } from '../../lib/supabaseClient';
import KioskKeyboard from '../../components/Kiosk/KioskKeyboard';
import { toast, Toaster } from 'react-hot-toast';

export default function KioskDrawAdmin() {
  const { t } = useKioskLang();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(true);

  // Moderation state
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewTab, setViewTab] = useState('pending'); // 'pending' | 'approved'

  // Password verification
  const handleAuthSubmit = () => {
    if (password === 'admin9730') {
      setIsAuthenticated(true);
      setShowKeyboard(false);
      toast.success('Sikeres belépés!');
    } else {
      toast.error(t('draw.adminPasswordError'));
      setPassword('');
    }
  };

  // Fetch drawings from DB
  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const isApprovedValue = viewTab === 'approved';
      const { data, error } = await supabase
        .from('kiosk_drawings')
        .select('*')
        .eq('approved', isApprovedValue)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (err) {
      console.error("Failed to load drawings:", err);
      toast.error("Hiba történt a rajzok betöltésekor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDrawings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, viewTab]);

  // Approve drawing
  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('kiosk_drawings')
        .update({ approved: true })
        .eq('id', id);

      if (error) throw error;

      toast.success("Rajz sikeresen jóváhagyva!");
      setDrawings(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Approve failed:", err);
      toast.error("Nem sikerült jóváhagyni a rajzot.");
    }
  };

  // Delete drawing (DB + Storage bucket)
  const handleDelete = async (id, imagePath) => {
    if (!window.confirm("Biztosan véglegesen törlöd ezt a rajzot a rendszerből?")) return;

    try {
      // 1) Parse filename from image path
      const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1);

      // 2) Remove file from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('kiosk-drawings')
        .remove([filename]);

      if (storageError) {
        console.warn("Storage deletion warning (might already be deleted):", storageError);
      }

      // 3) Delete row from DB
      const { error: dbError } = await supabase
        .from('kiosk_drawings')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success("Rajz sikeresen törölve!");
      setDrawings(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Nem sikerült törölni a rajzot.");
    }
  };

  // --- PASSWORD LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black">
        <Toaster position="bottom-center" />
        <KioskHeader />
        
        <main className="flex-1 w-full max-w-md mx-auto px-6 py-16 flex flex-col justify-start items-center gap-6 select-none animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl shadow-inner mb-2">
            <IoLockClosedOutline />
          </div>

          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
              {t('draw.adminTitle')}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
              Karbantartó belépés
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full text-left">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-wider pl-1">
              {t('draw.adminPasswordPrompt')}
            </label>
            <input
              type="password"
              readOnly
              onClick={() => setShowKeyboard(true)}
              value={password}
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent text-center text-zinc-900 dark:text-zinc-100 font-bold text-lg outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleAuthSubmit}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-lg active:scale-95 transition-all text-sm border border-indigo-500"
          >
            Belépés
          </button>

          {showKeyboard && (
            <KioskKeyboard
              value={password}
              onChange={(val) => setPassword(val)}
              onClose={() => setShowKeyboard(false)}
              onEnter={handleAuthSubmit}
            />
          )}
        </main>
      </div>
    );
  }

  // --- MODERATION PANEL ---
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <Toaster position="bottom-center" />
      <KioskHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none animate-fadeIn pb-16">
        
        {/* Title & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <IoShieldCheckmarkOutline className="text-sm" />
              {t('draw.adminTitle')}
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
              Rajzok Kezelése
            </h2>
          </div>

          {/* Pending / Approved Tabs */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
            <button
              onClick={() => setViewTab('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                viewTab === 'pending'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Elbírálásra vár
            </button>
            <button
              onClick={() => setViewTab('approved')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                viewTab === 'approved'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Jóváhagyott
            </button>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex-1 flex justify-center items-center py-24 text-zinc-400 font-bold">
            Rajzok betöltése...
          </div>
        ) : drawings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-zinc-400 dark:text-zinc-500 gap-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-white/40 dark:bg-zinc-900/10">
            <p className="font-extrabold text-lg">
              {viewTab === 'pending' ? t('draw.adminNoDrawings') : 'Nincsenek jóváhagyott rajzok.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drawings.map((draw) => (
              <div 
                key={draw.id}
                className="rounded-[2rem] overflow-hidden border border-zinc-200/50 dark:border-zinc-800/85 bg-white/95 dark:bg-zinc-900/60 shadow-lg flex gap-4 p-4 items-center backdrop-blur-sm"
              >
                {/* Thumbnail */}
                <div className="w-32 h-32 bg-zinc-900 rounded-2xl overflow-hidden relative shadow-inner shrink-0 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur opacity-30"
                    style={{ backgroundImage: `url(${draw.image_path})` }}
                  />
                  <img
                    src={draw.image_path}
                    alt={draw.theme}
                    className="relative z-10 w-full h-full object-contain p-1"
                  />
                </div>

                {/* Details & Actions */}
                <div className="flex-1 flex flex-col justify-between h-32 py-1 text-left min-w-0">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">
                      Téma: {draw.theme}
                    </span>
                    <h4 className="text-base font-extrabold text-zinc-950 dark:text-white truncate mt-0.5">
                      {draw.name} {draw.age ? `(${draw.age} év)` : ''}
                    </h4>
                    <p className="text-zinc-400 text-xs font-bold truncate mt-0.5">
                      Ország: {draw.country || 'Nincs megadva'}
                    </p>
                    <p className="text-zinc-400 text-[10px] font-semibold mt-1">
                      Dátum: {new Date(draw.created_at).toLocaleString('hu-HU')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 mt-2">
                    {viewTab === 'pending' && (
                      <button
                        onClick={() => handleApprove(draw.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md border border-emerald-500/20"
                      >
                        <IoCheckmarkCircleOutline className="text-sm" />
                        <span>Elfogad</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(draw.id, draw.image_path)}
                      className={`py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-red-500 dark:text-red-400 font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-1 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm ${
                        viewTab === 'approved' ? 'w-full' : 'w-auto'
                      }`}
                    >
                      <IoTrashOutline className="text-sm" />
                      <span>{t('draw.adminDelete')}</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
