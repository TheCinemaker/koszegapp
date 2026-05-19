// src/pages/Kiosk/KioskSelfie.jsx
import React, { useState, useEffect, useRef } from 'react';
import { IoCameraOutline, IoRefreshOutline, IoSparklesOutline, IoCloseCircleOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { supabase } from '../../lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import QRCode from 'qrcode';
import { useKioskLang } from '../../contexts/KioskLangContext';

export default function KioskSelfie() {
  const { t } = useKioskLang();
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

  // Helper to draw rounded rectangles on 2D context
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // 3 Postcard Overlays — translated via useMemo so canvas text updates on lang change
  const frames = React.useMemo(() => [
    {
      id: 0,
      name: t('selfie.frame0.name'),
      color: 'from-slate-800 to-slate-950',
      draw: (ctx, w, h) => {
        // Thin elegant white inner border framing the photo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        // Frosted Dark Glassmorphism Bottom Capsule
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
        drawRoundedRect(ctx, 40, h - 110, w - 80, 80, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Typography
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('selfie.frame0.text'), w / 2, h - 70);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`${t('selfie.frame0.datePrefix')} ${new Date().toLocaleDateString()}`, w / 2, h - 45);
      }
    },
    {
      id: 1,
      name: t('selfie.frame1.name'),
      color: 'from-zinc-500 to-zinc-700',
      draw: (ctx, w, h) => {
        // Thin elegant white inner border framing the photo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        // Frosted White Glassmorphism Bottom Capsule
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
        drawRoundedRect(ctx, 40, h - 110, w - 80, 80, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Typography
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('selfie.frame1.text'), w / 2, h - 72);

        ctx.font = 'italic bold 13px Georgia, serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(t('selfie.frame1.subtext'), w / 2, h - 47);
      }
    },
    {
      id: 2,
      name: t('selfie.frame2.name'),
      color: 'from-indigo-600 to-indigo-800',
      draw: (ctx, w, h) => {
        // Thin elegant white inner border framing the photo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        // Frosted Dark Indigo Glassmorphism Bottom Capsule
        ctx.save();
        ctx.fillStyle = 'rgba(20, 15, 45, 0.84)';
        drawRoundedRect(ctx, 40, h - 110, w - 80, 80, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Typography
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('selfie.frame2.text'), w / 2, h - 70);

        ctx.font = 'black 10px sans-serif';
        ctx.fillStyle = '#C7D2FE';
        ctx.fillText(t('selfie.frame2.subtext'), w / 2, h - 45);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

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
    const videoWidth = video.videoWidth || video.width || 640;
    const videoHeight = video.videoHeight || video.height || 480;

    // Create capturing canvas matching postcard dimensions
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800; // 3:4 portrait
    const ctx = canvas.getContext('2d');

    // Calculate cropping parameters for center-cover (preserving 3:4 aspect ratio)
    const targetRatio = canvas.width / canvas.height; // 0.75
    const sourceRatio = videoWidth / videoHeight;

    let sX = 0;
    let sY = 0;
    let sWidth = videoWidth;
    let sHeight = videoHeight;

    if (sourceRatio > targetRatio) {
      // Source is wider than 3:4 (standard landscape) -> crop sides
      sWidth = videoHeight * targetRatio;
      sX = (videoWidth - sWidth) / 2;
    } else {
      // Source is taller than 3:4 -> crop top/bottom
      sHeight = videoWidth / targetRatio;
      sY = (videoHeight - sHeight) / 2;
    }

    // 1) Mirror horizontally and draw cropped video frame
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sX, sY, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
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
    const toastId = toast.loading(t('selfie.toastLoading'));

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

      toast.success(t('selfie.toastSuccess'), { id: toastId });
    } catch (err) {
      console.error("Postcard upload failed:", err);
      toast.error(t('selfie.toastError'), { id: toastId });
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
            {t('selfie.subtitle')}
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
            {t('selfie.title')}
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
                  <h4 className="font-bold text-lg text-white">{t('selfie.cameraError.title')}</h4>
                  <p className="text-xs">{t('selfie.cameraError.desc')}</p>
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

                  {/* Premium, dynamic HTML Glassmorphism Preview Overlay Frame */}
                  <div className="absolute inset-0 z-10 pointer-events-none p-5 flex flex-col justify-between">
                    {/* Sleek, thin white inner border line (Apple style) */}
                    <div className="absolute inset-5 border border-white/40 rounded-3xl" />
                    
                    <div />
                    
                    {/* Elegant frosted bottom glass capsules */}
                    {activeFrame === 0 && (
                      <div className="bg-slate-950/75 backdrop-blur-md p-4 rounded-3xl text-center border border-white/20 shadow-xl mx-4 my-1 z-20 transition-all duration-300">
                        <span className="text-white font-bold tracking-tight block text-sm sm:text-base font-serif">
                          {t('selfie.frame0.text')}
                        </span>
                        <span className="text-slate-400 font-extrabold tracking-widest text-[8px] block uppercase mt-0.5 font-mono">
                          {t('selfie.frame0.datePrefix')} {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {activeFrame === 1 && (
                      <div className="bg-white/85 backdrop-blur-md p-4 rounded-3xl text-center border border-white/60 shadow-xl mx-4 my-1 z-20 transition-all duration-300">
                        <span className="text-slate-900 font-black tracking-widest block text-sm sm:text-base">
                          {t('selfie.frame1.text')}
                        </span>
                        <span className="text-slate-600 font-bold italic block text-[10px] font-serif mt-0.5">
                          {t('selfie.frame1.subtext')}
                        </span>
                      </div>
                    )}

                    {activeFrame === 2 && (
                      <div className="bg-indigo-950/80 backdrop-blur-md p-4 rounded-3xl text-center border border-white/25 shadow-xl mx-4 my-1 z-20 transition-all duration-300">
                        <span className="text-white font-extrabold block text-sm sm:text-base">
                          {t('selfie.frame2.text')}
                        </span>
                        <span className="text-indigo-200 font-black tracking-widest text-[8px] block uppercase mt-0.5 font-mono">
                          {t('selfie.frame2.subtext')}
                        </span>
                      </div>
                    )}
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
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center">{t('selfie.frameLabel')}</span>
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
                    {f.name}
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
                {t('selfie.done')}
              </div>
              <h3 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight uppercase leading-none">
                {t('selfie.downloadTitle')}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                {t('selfie.downloadDesc')}
              </p>

              {/* QR Image Box */}
              {uploading ? (
                <div className="w-48 h-48 bg-white/50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 flex flex-col items-center justify-center text-xs font-bold text-indigo-500 gap-2 mt-2">
                  <IoRefreshOutline className="text-2xl animate-spin" />
                  {t('selfie.generating')}
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
                  {t('selfie.uploadError')}
                </div>
              )}

              {/* Shutter reset button */}
              <button
                onClick={handleRetake}
                className="mt-4 flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold active:scale-95 transition-all text-sm shadow-md border border-zinc-700/50"
              >
                <IoRefreshOutline className="text-lg" />
                {t('selfie.retake')}
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
