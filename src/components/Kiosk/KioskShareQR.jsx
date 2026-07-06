import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { IoQrCodeOutline, IoCloseOutline } from 'react-icons/io5';
import QRCode from 'qrcode';

const PROD_BASE = 'https://visitkoszeg.hu';
const AUTO_CLOSE_S = 10;

const LABELS = {
  hu: { button: 'Vidd magaddal!', title: 'Vidd magaddal!', desc: 'Szkenneld be ezt a QR-kódot a telefonoddal, és nyisd meg ezt az oldalt mobilon is!' },
  en: { button: 'Take it with you!', title: 'Take it with you!', desc: 'Scan this QR code with your phone to open this page on your mobile device!' },
  de: { button: 'Mitnehmen!', title: 'Mitnehmen!', desc: 'Scannen Sie diesen QR-Code mit Ihrem Telefon, um diese Seite auf Ihrem Mobilgerät zu öffnen!' },
};

export default function KioskShareQR() {
  const location = useLocation();
  const lang = localStorage.getItem('kiosk-lang') || 'hu';
  const lbl = LABELS[lang] || LABELS.hu;
  const [showModal, setShowModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [countdown, setCountdown] = useState(AUTO_CLOSE_S);
  const timerRef = useRef(null);
  const tickRef = useRef(null);

  // Strip /kiosk prefix → production URL
  const path = location.pathname.replace(/^\/kiosk/, '') || '/';
  const shareUrl = `${PROD_BASE}${path}`;

  // Generate QR whenever the target URL changes
  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl).catch(console.error);
  }, [shareUrl]);

  // Auto-close + countdown when modal is open
  useEffect(() => {
    if (!showModal) return;
    setCountdown(AUTO_CLOSE_S);
    timerRef.current = setTimeout(() => setShowModal(false), AUTO_CLOSE_S * 1000);
    tickRef.current = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(tickRef.current);
    };
  }, [showModal]);

  // Don't show on screensaver or on pages without a matching public URL
  const isScreensaver =
    (location.pathname === '/kiosk' || location.pathname === '/kiosk/') &&
    sessionStorage.getItem('kiosk-started') !== 'true';
  const noSharePages = ['/kiosk/services', '/kiosk/draw', '/kiosk/draw-gallery', '/kiosk/draw-admin'];
  if (isScreensaver || noSharePages.includes(location.pathname)) return null;

  return (
    <>
      {/* Floating button — bottom-right, always visible */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm shadow-2xl border border-indigo-400/30 transition-all duration-200"
      >
        <IoQrCodeOutline className="text-xl shrink-0" />
        <span className="hidden sm:inline">{lbl.button}</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center gap-5 max-w-xs w-full mx-4 border border-zinc-200/50 dark:border-zinc-800/50"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <IoCloseOutline className="text-xl" />
            </button>

            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight text-center pr-6">
              {lbl.title}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-center leading-relaxed">
              {lbl.desc}
            </p>

            {/* QR code */}
            {qrDataUrl && (
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-zinc-100">
                <img src={qrDataUrl} alt="QR kód" className="w-48 h-48 block" />
              </div>
            )}

            {/* Production URL */}
            <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate max-w-full px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/15">
              {shareUrl}
            </div>

            {/* Auto-close countdown ring */}
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold tabular-nums">
              {countdown}s
            </div>
          </div>
        </div>
      )}
    </>
  );
}
