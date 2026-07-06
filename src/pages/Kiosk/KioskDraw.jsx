// src/pages/Kiosk/KioskDraw.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoBrushOutline, IoTrashOutline, IoCheckmarkCircleOutline, 
  IoSparklesOutline, IoCloseCircleOutline, IoArrowForwardOutline
} from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { useKioskLang } from '../../contexts/KioskLangContext';
import { supabase } from '../../lib/supabaseClient';
import { containsProfanity } from '../../utils/badWordsHU';
import KioskKeyboard from '../../components/Kiosk/KioskKeyboard';
import { toast, Toaster } from 'react-hot-toast';

const PRESET_COLORS = [
  '#000000', '#4B5563', '#9CA3AF', '#FFFFFF', // Black, Dark Grey, Light Grey, White
  '#DC2626', '#EA580C', '#EAB308', '#16A34A', // Red, Orange, Yellow, Green
  '#84CC16', '#06B6D4', '#0284C7', '#2563EB', // Lime, Cyan, Sky Blue, Blue
  '#7C3AED', '#DB2777', '#F43F5E', '#78350F'  // Purple, Pink, Rose, Brown
];

const BRUSH_SIZES = [
  { label: 'Kicsi', value: 6, key: 'small' },
  { label: 'Közepes', value: 14, key: 'medium' },
  { label: 'Nagy', value: 28, key: 'large' }
];

export default function KioskDraw() {
  const navigate = useNavigate();
  const { t } = useKioskLang();

  // Phase: 'welcome' | 'canvas' | 'form' | 'success'
  const [phase, setPhase] = useState('welcome');
  
  // Theme Selection
  const [selectedTheme, setSelectedTheme] = useState(null);

  // Drawing Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastCoords, setLastCoords] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('pencil'); // 'pencil' | 'eraser'
  const [activeColor, setActiveColor] = useState('#DC2626'); // Red default
  const [brushSize, setBrushSize] = useState(14); // Medium default
  const [hasDrawn, setHasDrawn] = useState(false);

  // Modal State
  const [showConfirmDone, setShowConfirmDone] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState(null);
  const [country, setCountry] = useState('');
  const [activeInput, setActiveInput] = useState(null); // null | 'name' | 'country'
  const [profanityWarning, setProfanityWarning] = useState(false);
  
  // Image result for success animation
  const [savedImageUrl, setSavedImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize Canvas to Solid White
  useEffect(() => {
    if (phase === 'canvas' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }, [phase]);

  // Welcome page themes
  const themes = [
    { key: 'sight', label: t('draw.themes.sight'), bg: 'from-amber-500 to-orange-600' },
    { key: 'liked', label: t('draw.themes.liked'), bg: 'from-emerald-500 to-teal-600' },
    { key: 'adventure', label: t('draw.themes.adventure'), bg: 'from-blue-500 to-indigo-600' },
    { key: 'free', label: t('draw.themes.free'), bg: 'from-purple-500 to-pink-600' }
  ];

  // 60 FPS Drawing Pointer Handlers
  const handlePointerDown = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Scale back to internal high-res coordinates
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setIsDrawing(true);
    setLastCoords({ x, y });
    setHasDrawn(true);

    // Draw single point on tap
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : activeColor;
    ctx.fill();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(lastCoords.x, lastCoords.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : activeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setLastCoords({ x, y });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Restart / Reset Drawing
  const handleRestart = () => {
    if (window.confirm(t('draw.confirmRestart'))) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Upload and Save flow
  const handleSaveDrawing = async () => {
    if (!canvasRef.current || saving) return;

    const finalName = name.trim();
    const finalCountry = country.trim();

    // Profanity check on Name
    if (containsProfanity(finalName) || containsProfanity(finalCountry)) {
      setProfanityWarning(true);
      return;
    }

    setSaving(true);
    const toastId = toast.loading(t('draw.saveLoading'));

    try {
      const canvas = canvasRef.current;
      
      // 1) Get image as Blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob) throw new Error("Canvas to Blob failed");

      if (blob.size > 2 * 1024 * 1024) {
        toast.error("A kép mérete túl nagy (max. 2MB)!", { id: toastId });
        setSaving(false);
        return;
      }

      // 2) Generate unique filename
      const filename = `drawing_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.png`;

      // 3) Upload PNG file to kiosk-drawings storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kiosk-drawings')
        .upload(filename, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // 4) Get Public URL
      const { data: urlData } = supabase.storage
        .from('kiosk-drawings')
        .getPublicUrl(filename);

      const imageUrl = urlData.publicUrl;
      setSavedImageUrl(imageUrl);

      // 5) Save metadata record in kiosk_drawings table
      const { error: dbError } = await supabase.from('kiosk_drawings').insert({
        theme: selectedTheme,
        name: finalName || 'Anonymous',
        age: age ? parseInt(age) : null,
        country: finalCountry || null,
        image_path: imageUrl,
        approved: false
      });

      if (dbError) throw dbError;

      // Successful save - proceed to success screen!
      toast.success(t('draw.toastSuccess'), { id: toastId });
      setPhase('success');
    } catch (err) {
      console.error("Failed to save kid drawing:", err);
      toast.error(t('draw.toastError'), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Redirect to Kiosk Home on success page timeout
  useEffect(() => {
    if (phase !== 'success') return;
    const timer = setTimeout(() => {
      navigate('/kiosk');
    }, 4500);
    return () => clearTimeout(timer);
  }, [phase, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto relative">
      <Toaster position="bottom-center" />
      <KioskHeader />

      {/* --- PHASE 1: WELCOME SCREEN --- */}
      {phase === 'welcome' && (
        <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-start gap-8 select-none animate-fadeIn">
          <div className="flex flex-col gap-1">
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <IoSparklesOutline className="text-sm" />
              {t('draw.subtitle')}
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
              {t('draw.title')}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
              {t('draw.themeSelect')}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.key}
                  onClick={() => {
                    setSelectedTheme(theme.label);
                    setPhase('canvas');
                  }}
                  className={`rounded-[2rem] p-6 text-white bg-gradient-to-br ${theme.bg} shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between aspect-video relative overflow-hidden group`}
                >
                  {/* Subtle decorative circles */}
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                  <IoBrushOutline className="text-3xl text-white/30" />
                  <span className="text-xl font-extrabold leading-tight text-readability-shadow">
                    {theme.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery redirect button */}
          <button
            onClick={() => navigate('/kiosk/draw-gallery')}
            className="w-full py-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 font-extrabold text-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
          >
            <span>{t('draw.galleryButton')}</span>
          </button>
        </main>
      )}

      {/* --- PHASE 2: DRAWING CANVAS --- */}
      <main className={`flex-1 w-full max-w-5xl mx-auto px-6 py-6 flex flex-col justify-start gap-4 select-none animate-fadeIn h-[calc(100vh-90px)] overflow-hidden ${phase === 'canvas' ? '' : 'hidden'}`}>
          
          {/* Top Panel: Theme & Tool Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Téma: {selectedTheme}
              </span>
              <h3 className="text-lg font-extrabold text-zinc-800 dark:text-zinc-200">
                {t('draw.title')}
              </h3>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setTool('pencil')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  tool === 'pencil' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                ✏️ {t('draw.pencil')}
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  tool === 'eraser' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                🧽 {t('draw.eraser')}
              </button>
            </div>
          </div>

          {/* Middle Layout: Canvas & Sidebar */}
          <div className="flex-1 flex gap-4 h-[60vh] min-h-[360px]">
            {/* Drawing Canvas Container */}
            <div className="flex-1 rounded-[2rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl bg-white relative">
              <canvas
                ref={canvasRef}
                width={1024}
                height={768}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-full object-contain cursor-crosshair touch-none"
              />
            </div>

            {/* Sidebar Controls (Colors & Brush Sizes) */}
            <div className="w-48 flex flex-col gap-4 bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 p-4 rounded-[2rem] backdrop-blur-md justify-between">
              
              {/* Color Grid Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-left">
                  Színek
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setTool('pencil');
                        setActiveColor(color);
                      }}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full border-2 transition-all active:scale-90 ${
                        activeColor === color && tool === 'pencil'
                          ? 'border-indigo-600 scale-110 shadow-lg shadow-indigo-600/30'
                          : 'border-white/40 dark:border-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Brush Sizes Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-left">
                  {t('draw.brushSize')}
                </span>
                <div className="flex flex-col gap-2">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size.key}
                      onClick={() => setBrushSize(size.value)}
                      className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all border flex items-center justify-center gap-2 ${
                        brushSize === size.value
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-white/90 dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span 
                        style={{ width: `${Math.max(4, size.value / 2)}px`, height: `${Math.max(4, size.value / 2)}px` }} 
                        className={`rounded-full ${brushSize === size.value ? 'bg-white' : 'bg-zinc-600 dark:bg-zinc-400'}`} 
                      />
                      <span>{size.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-between mt-2 pb-4">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-extrabold text-sm active:scale-95 transition-all border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm"
            >
              <IoTrashOutline className="text-lg" />
              <span>{t('draw.restart')}</span>
            </button>

            <button
              onClick={() => {
                if (!hasDrawn) {
                  toast.error('Rajzolj valamit a táblára mielőtt továbblépsz!');
                  return;
                }
                setShowConfirmDone(true);
              }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm active:scale-95 transition-all border border-indigo-500/30 shadow-md"
            >
              <IoCheckmarkCircleOutline className="text-lg" />
              <span>{t('draw.done')}</span>
            </button>
          </div>

          {/* DONE CONFIRMATION MODAL */}
          <AnimatePresence>
            {showConfirmDone && (
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-2 items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mb-2 shadow-inner">
                      <IoCheckmarkCircleOutline />
                    </div>
                    <h4 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                      {t('draw.confirmFinish')}
                    </h4>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowConfirmDone(false);
                        setPhase('form');
                      }}
                      className="flex-1 py-4 bg-indigo-600 text-white font-extrabold rounded-2xl active:scale-95 transition-all shadow-md text-sm border border-indigo-500"
                    >
                      {t('draw.yes')}
                    </button>
                    <button
                      onClick={() => setShowConfirmDone(false)}
                      className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-extrabold rounded-2xl active:scale-95 transition-all text-sm border border-zinc-200/50 dark:border-zinc-700/50"
                    >
                      {t('draw.no')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

      </main>

      {/* --- PHASE 4: METADATA FORM --- */}
      {phase === 'form' && (
        <main className="flex-1 w-full max-w-xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none animate-fadeIn pb-96">
          <div className="flex flex-col gap-1">
            <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <IoSparklesOutline className="text-sm" />
              {t('draw.subtitle')}
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
              {t('draw.formTitle')}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
              {t('draw.formDesc')}
            </p>
          </div>

          {profanityWarning && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold text-center">
              ⚠️ Kérjük, használj kulturált kifejezéseket! 🙏
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-wider pl-1">
                {t('draw.nameLabel')}
              </label>
              <input
                type="text"
                readOnly
                onClick={() => setActiveInput('name')}
                value={name}
                placeholder={t('draw.namePlaceholder')}
                className={`w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm outline-none transition-all ${
                  activeInput === 'name' 
                    ? 'border-indigo-500 bg-white dark:bg-zinc-900 shadow-lg' 
                    : 'border-transparent'
                }`}
              />
            </div>

            {/* Country Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-wider pl-1">
                {t('draw.countryLabel')}
              </label>
              <input
                type="text"
                readOnly
                onClick={() => setActiveInput('country')}
                value={country}
                placeholder={t('draw.countryPlaceholder')}
                className={`w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm outline-none transition-all ${
                  activeInput === 'country' 
                    ? 'border-indigo-500 bg-white dark:bg-zinc-900 shadow-lg' 
                    : 'border-transparent'
                }`}
              />
            </div>

            {/* Age selector (circular grid) */}
            <div className="flex flex-col gap-2.5 text-left">
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-wider pl-1">
                {t('draw.ageLabel')}
              </label>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 13 }, (_, i) => i + 3).map((num) => (
                  <button
                    key={num}
                    onClick={() => setAge(num)}
                    className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all active:scale-90 flex items-center justify-center ${
                      age === num
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {/* 16+ option */}
                <button
                  onClick={() => setAge(16)}
                  className={`col-span-2 h-10 rounded-full border-2 font-bold text-xs transition-all active:scale-90 flex items-center justify-center ${
                    age === 16
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  16+
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSaveDrawing}
              disabled={saving}
              className="flex-1 py-5 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-lg shadow-xl active:scale-95 transition-all border border-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{t('draw.saveButton')}</span>
              <IoArrowForwardOutline />
            </button>
          </div>

          {/* VIRTUAL KEYBOARD POPUP */}
          {activeInput && (
            <KioskKeyboard
              value={activeInput === 'name' ? name : country}
              onChange={(val) => {
                setProfanityWarning(false);
                if (activeInput === 'name') {
                  if (val.length <= 30) setName(val);
                } else {
                  if (val.length <= 40) setCountry(val);
                }
              }}
              onClose={() => setActiveInput(null)}
              onEnter={() => setActiveInput(null)}
            />
          )}
        </main>
      )}

      {/* --- PHASE 5: SUCCESS & FLY-UP ANIMATION --- */}
      {phase === 'success' && (
        <main className="flex-1 w-full max-w-xl mx-auto px-6 py-12 flex flex-col justify-center items-center gap-8 select-none overflow-hidden h-[80vh]">
          {/* Fly-up Drawing Container */}
          <div className="relative w-full max-w-[320px] aspect-[4/3] flex justify-center items-center">
            <motion.div
              initial={{ y: 200, scale: 0.8, opacity: 0 }}
              animate={{ 
                y: -300, 
                scale: 0.4, 
                opacity: [0, 1, 1, 0],
                rotate: -6
              }}
              transition={{ 
                duration: 4.2,
                times: [0, 0.15, 0.85, 1],
                ease: "easeInOut"
              }}
              className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-white"
            >
              <img
                src={savedImageUrl}
                alt="Szép rajz"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Success messages */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col gap-3 text-center max-w-sm"
          >
            <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              {t('draw.thanksTitle')}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm font-semibold leading-relaxed">
              {t('draw.thanksDesc')}
            </p>
            <div className="w-10 h-1 bg-indigo-500 rounded-full mx-auto mt-4" />
          </motion.div>
        </main>
      )}

    </div>
  );
}
