// src/pages/Kiosk/KioskSelfie.jsx
import React, { useState, useEffect, useRef } from 'react';
import { IoCameraOutline, IoRefreshOutline, IoDownloadOutline, IoSparklesOutline, IoCloseCircleOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { supabase } from '../../lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import QRCode from 'qrcode';

export default function KioskSelfie() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // UI States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Post-capture States
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [qrImageSrc, setQrImageSrc] = useState('');

  // 3 Postcard Overlays
  const frames = [
    {
      id: 0,
      name: 'Üdvözlet Kőszegről',
      color: 'from-amber-400 to-amber-600',
      draw: (ctx, w, h) => {
        // Gold double border
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, w - 14, h - 14);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        // Bottom text plate
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fillRect(18, h - 110, w - 36, 92);

        // Serif Elegant title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Üdvözlet Kőszegről!', w / 2, h - 68);

        // Subtitle
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#A1A1AA';
        ctx.fillText(`Látogatás dátuma: ${new Date().toLocaleDateString('hu-HU')}`, w / 2, h - 38);
      }
    },
    {
      id: 1,
      name: 'Kőszegi Borkóstoló',
      color: 'from-red-500 to-rose-700',
      draw: (ctx, w, h) => {
        // Burgundy double border
        ctx.strokeStyle = '#800020';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, w - 14, h - 14);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        // Bottom text plate
        ctx.fillStyle = 'rgba(45, 0, 10, 0.7)';
        ctx.fillRect(18, h - 110, w - 36, 92);

        // Title
        ctx.fillStyle = '#F472B6';
        ctx.font = 'black 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PÜNKÖSDI BORKÓSTOLÓ', w / 2, h - 68);

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#FCD34D'; // Golden grape text
        ctx.fillText('🍷 KŐSZEG BORVIDÉK 🍷', w / 2, h - 38);
      }
    },
    {
      id: 2,
      name: 'Kőszegi Várkapitány',
      color: 'from-blue-500 to-indigo-700',
      draw: (ctx, w, h) => {
        // Slate border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, w - 14, h - 14);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        // Bottom text plate
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(18, h - 110, w - 36, 92);

        // Title
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'italic bold 30px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ Kőszegi Várkapitány ⚔️', w / 2, h - 68);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('HŐSÖK TERMÉNEK EMLÉKÉRE', w / 2, h - 38);
      }
    }
  ];

  // Start Webcam stream on mount
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1080 },
            height: { ideal: 1440 }
          },
          audio: false
        });
        
        if (active && videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Webcam stream access failed:", err);
        if (active) setCameraError(true);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      capturePhoto();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const triggerShutter = () => {
    if (countdown !== null || uploading) return;
    setCountdown(3);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    // Flash visual effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    
    // Create capturing canvas matching postcard dimensions
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800; // 3:4 portrait
    const ctx = canvas.getContext('2d');

    // 1) Mirror horizontally and draw video frame
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale transform

    // 2) Draw selected overlay frame
    frames[activeFrame].draw(ctx, canvas.width, canvas.height);

    // Save state
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    
    // Stop camera stream to free resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }

    // Upload to Supabase Storage
    await uploadSelfie(dataUrl);
  };

  const uploadSelfie = async (dataUrl) => {
    setUploading(true);
    const toastId = toast.loading('Képeslap mentése és letöltő QR-kód generálása...');

    try {
      // Convert base64 to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const filename = `selfie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

      // Upload file directly into the dedicated public kiosk-postcards bucket
      const { data, error } = await supabase.storage
        .from('kiosk-postcards')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kiosk-postcards')
        .getPublicUrl(filename);

      setDownloadUrl(urlData.publicUrl);
      
      // Generate QR Code locally in the browser
      try {
        const qrUrl = await QRCode.toDataURL(urlData.publicUrl, { 
          width: 300, 
          margin: 2, 
          errorCorrectionLevel: 'M' 
        });
        setQrImageSrc(qrUrl);
      } catch (qrErr) {
        console.error("Local QR generation failed:", qrErr);
      }

      toast.success('Képeslap sikeresen elkészült!', { id: toastId });
    } catch (err) {
      console.error("Postcard upload failed:", err);
      toast.error('Hiba történt a feltöltés során. Próbáld újra!', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = async () => {
    setCapturedImage(null);
    setDownloadUrl('');
    setQrImageSrc('');
    setCameraError(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1440 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera restart failed:", err);
      setCameraError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto relative">
      <Toaster position="bottom-center" />
      <KioskHeader />

      {/* FLASH SCREEN EFFECT */}
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-[100] animate-fadeOut opacity-100 pointer-events-none" />
      )}

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none animate-fadeIn">
        
        {/* Title */}
        <div className="flex flex-col gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <IoSparklesOutline className="text-sm" />
            Turinform Szelfipont
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            Digitális Képeslap Küldő
          </h2>
        </div>

        {/* --- CAMERA ACTIVE PHASE --- */}
        {!capturedImage && (
          <div className="flex flex-col gap-6 items-center">
            
            {/* Shutter Camera frame box */}
            <div className="relative rounded-[2.5rem] overflow-hidden w-full max-w-[450px] aspect-[3/4] shadow-2xl border-4 border-white dark:border-zinc-800 bg-black">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-400 gap-3">
                  <IoCloseCircleOutline className="text-5xl text-rose-500" />
                  <h4 className="font-bold text-lg text-white">Webkamera Hiba</h4>
                  <p className="text-xs">Nem sikerült elérni a gép beépített webkameráját. Kérjük ellenőrizze a csatlakozást és a böngésző engedélyeket!</p>
                </div>
              ) : (
                <>
                  {/* Camera stream video element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]" // Mirrored for natural selfie preview
                  />

                  {/* Dynamic HTML Preview Overlay Frame */}
                  <div className="absolute inset-0 z-10 pointer-events-none border-[12px] border-double border-white/60 flex flex-col justify-between p-4">
                    <div />
                    <div className="bg-black/60 backdrop-blur-sm p-4 rounded-2xl text-center border border-white/10">
                      <span className="text-white font-extrabold tracking-tight uppercase block text-sm sm:text-base">
                        {activeFrame === 0 && 'Üdvözlet Kőszegről!'}
                        {activeFrame === 1 && '🍷 PÜNKÖSDI BORKÓSTOLÓ 🍷'}
                        {activeFrame === 2 && '⚔️ KŐSZEGI VÁRKAPITÁNY ⚔️'}
                      </span>
                    </div>
                  </div>

                  {/* Countdown overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/45 z-20 flex items-center justify-center">
                      <span className="text-white text-8xl font-black font-mono animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Frame selector (Carousel-like big touch tiles) */}
            <div className="w-full max-w-[450px] flex flex-col gap-3">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">Válassz egy egyedi kőszegi keretet!</span>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((f, idx) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFrame(idx)}
                    className={`
                      py-3.5 rounded-2xl text-xs font-black tracking-tight uppercase border transition-all duration-300
                      ${activeFrame === idx 
                        ? 'bg-gradient-to-r ' + f.color + ' border-transparent text-white scale-105 shadow-md shadow-indigo-500/10' 
                        : 'bg-white/80 dark:bg-zinc-900/60 border-zinc-200/50 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                      }
                    `}
                  >
                    {f.name.split(' ')[1] || f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Exp Shutter button */}
            {!cameraError && (
              <button
                onClick={triggerShutter}
                disabled={countdown !== null}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold flex items-center justify-center text-3xl shadow-xl shadow-pink-500/20 active:scale-95 transition-transform duration-300 relative border-4 border-white dark:border-zinc-800"
              >
                <div className="absolute inset-2 bg-transparent border-2 border-white/60 rounded-full" />
                <IoCameraOutline />
              </button>
            )}

          </div>
        )}

        {/* --- POST-CAPTURE DISPLAY / QR BRIDGE --- */}
        {capturedImage && (
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            
            {/* Captured Picture Frame */}
            <div className="shrink-0 relative rounded-[2rem] overflow-hidden w-full max-w-[280px] aspect-[3/4] shadow-2xl border-4 border-white dark:border-zinc-800 bg-zinc-900">
              <img 
                src={capturedImage} 
                alt="Elkészült képeslap" 
                className="w-full h-full object-cover block"
              />
            </div>

            {/* QR Download box */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 max-w-sm">
              <div className="flex items-center gap-1.5 justify-center md:justify-start text-xs font-black text-rose-500 tracking-widest uppercase">
                <IoSparklesOutline className="animate-spin text-base" />
                ELKÉSZÜLT A KÉPESLAPOD!
              </div>
              <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight uppercase leading-none">
                Töltsd le a mobilodra!
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                Olvasd be ezt a QR-kódot a telefonod kamerájával, és töltsd le az egyedi képeslapot azonnal a mobilodra, hogy megoszthasd a barátaiddal és családoddal!
              </p>

              {/* QR Image Box */}
              {uploading ? (
                <div className="w-48 h-48 bg-white/50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 flex flex-col items-center justify-center text-xs font-bold text-indigo-500 gap-2 mt-2">
                  <IoRefreshOutline className="text-2xl animate-spin" />
                  Kód generálása...
                </div>
              ) : qrImageSrc ? (
                <div className="p-4 bg-white rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-700 mt-2 active:scale-95 transition-transform duration-300">
                  <img 
                    src={qrImageSrc} 
                    alt="Letöltő QR kód" 
                    className="w-40 h-40 object-contain block rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-rose-500/10 rounded-3xl border border-rose-500/20 flex flex-col items-center justify-center text-xs font-bold text-rose-500 gap-1 mt-2">
                  Feltöltési hiba.
                </div>
              )}

              {/* Shutter reset button */}
              <button
                onClick={handleRetake}
                className="mt-4 flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold active:scale-95 transition-all text-sm shadow-md border border-zinc-700/50"
              >
                <IoRefreshOutline className="text-lg" />
                Új kép készítése
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
