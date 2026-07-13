// src/pages/VisitPointer/Phone.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IoCompassOutline, IoWarningOutline, IoReloadOutline,
  IoPulseOutline, IoPhonePortraitOutline, IoFingerPrintOutline
} from 'react-icons/io5';
import { VisitPointerSignaling } from './Signaling';

export default function PhoneController() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('display') || 'DEMO';

  const [status, setStatus] = useState('connecting');
  const [sensitivity, setSensitivity] = useState(2.0);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [orientationData, setOrientationData] = useState({ beta: 0, gamma: 0 });
  // 'gyro' | 'mouse' | 'detecting'
  const [inputMode, setInputMode] = useState('detecting');

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const signalingRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const sensitivityRef = useRef(sensitivity);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);

  // Gyro calibration refs
  const neutralBetaRef = useRef(0);
  const neutralGammaRef = useRef(0);
  const currentBetaRef = useRef(0);
  const currentGammaRef = useRef(0);

  // Low-pass filter state
  const lastXRef = useRef(50);
  const lastYRef = useRef(50);
  const LP = 0.15;

  // Double-tap detection
  const lastTapRef = useRef(0);
  // Offer retry timer (in case phone subscribes before display)
  const offerRetryRef = useRef(null);
  // Stored offer SDP for retry
  const pendingOfferRef = useRef(null);

  // Mouse mode: track position within the pad element
  const padRef = useRef(null);
  const mouseActiveRef = useRef(false);

  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.onlevelchange = () => setBatteryLevel(Math.round(bat.level * 100));
      }).catch(() => {});
    }
    initConnection();
    return cleanup;
  }, [sessionId]);

  // ── WebRTC Connection Setup ──────────────────────────────────────────────────
  const sendOffer = async (pc, signaling) => {
    try {
      if (!pendingOfferRef.current) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        pendingOfferRef.current = offer;
      }
      signaling.send({ type: 'offer', sdp: pendingOfferRef.current });
    } catch (e) {
      console.error('Offer creation/send failed:', e);
      setStatus('error');
    }
  };

  const initConnection = async () => {
    setStatus('connecting');
    cleanup();

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // unreliable + unordered = minimum latency for 60fps position streaming
      const dc = pc.createDataChannel('pointer', { ordered: false, maxRetransmits: 0 });
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus('connected');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        detectAndStartInput();
      };

      dc.onclose = () => setStatus('disconnected');

      pc.onicecandidate = (e) => {
        if (e.candidate && signalingRef.current) {
          signalingRef.current.send({ type: 'candidate', candidate: e.candidate });
        }
      };

      const signaling = new VisitPointerSignaling(
        sessionId, 'phone',
        async (signal) => {
          try {
            if (signal.type === 'busy') {
              setStatus('busy'); cleanup(); return;
            } else if (signal.type === 'answer') {
              // Got an answer — stop retrying
              if (offerRetryRef.current) {
                clearInterval(offerRetryRef.current);
                offerRetryRef.current = null;
              }
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              for (const c of pendingCandidatesRef.current) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
              pendingCandidatesRef.current = [];
            } else if (signal.type === 'candidate') {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } else {
                pendingCandidatesRef.current.push(signal.candidate);
              }
            }
          } catch (e) { console.error('Signaling error:', e); }
        },
        async (chanStatus) => {
          if (chanStatus === 'SUBSCRIBED') {
            setStatus('signaling');
            // Send offer immediately — in case display was already waiting
            await sendOffer(pc, signaling);
            // Also retry every 3s in case our offer arrived before display subscribed
            offerRetryRef.current = setInterval(async () => {
              if (pc.connectionState !== 'connected' && dc.readyState !== 'open') {
                console.log('[VisitPointer Phone] Retrying offer...');
                await sendOffer(pc, signaling);
              } else {
                clearInterval(offerRetryRef.current);
                offerRetryRef.current = null;
              }
            }, 3000);
          }
        },
        // onDisplayReady: display came online after us — send offer immediately
        async () => {
          console.log('[VisitPointer Phone] Display ready signal received — sending offer');
          if (pc.connectionState !== 'connected') {
            await sendOffer(pc, signaling);
          }
        }
      );
      signalingRef.current = signaling;
      signaling.connect();
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  // ── Input Mode Detection ─────────────────────────────────────────────────────
  const detectAndStartInput = () => {
    // Check if device orientation events are available and produce real data
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // iOS 13+ requires explicit permission
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        setStatus('permission_required');
        return; // wait for user to press the permission button
      }

      // Listen for first real gyro event; if gamma/beta are non-null → real gyro
      const probe = (e) => {
        window.removeEventListener('deviceorientation', probe);
        if (e.gamma !== null && e.beta !== null && (e.gamma !== 0 || e.beta !== 0)) {
          setInputMode('gyro');
          startGyroListeners();
        } else {
          setInputMode('mouse');
        }
      };
      window.addEventListener('deviceorientation', probe, { once: true });

      // If no event fires within 600ms → definitely no gyro → mouse mode
      setTimeout(() => {
        window.removeEventListener('deviceorientation', probe);
        setInputMode(m => {
          if (m === 'detecting') { return 'mouse'; }
          return m;
        });
      }, 600);
    } else {
      setInputMode('mouse');
    }
  };

  const requestIOSPermission = async () => {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        setInputMode('gyro');
        startGyroListeners();
        setStatus('connected');
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  // ── Gyroscope Mode ───────────────────────────────────────────────────────────
  const startGyroListeners = () => {
    window.addEventListener('deviceorientation', handleOrientation);
  };

  const handleOrientation = (e) => {
    const beta = e.beta || 0;
    const gamma = e.gamma || 0;
    currentBetaRef.current = beta;
    currentGammaRef.current = gamma;
    setOrientationData({ beta: Math.round(beta), gamma: Math.round(gamma) });
    sendCursorFromGyro();
  };

  const sendCursorFromGyro = () => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') return;

    const sens = sensitivityRef.current;
    const deltaX = currentGammaRef.current - neutralGammaRef.current;
    const deltaY = currentBetaRef.current - neutralBetaRef.current;

    const targetX = 50 + deltaX * (sens * 2.2);
    const targetY = 50 + deltaY * (sens * 2.2);

    const smoothedX = lastXRef.current * (1 - LP) + targetX * LP;
    const smoothedY = lastYRef.current * (1 - LP) + targetY * LP;

    lastXRef.current = smoothedX;
    lastYRef.current = smoothedY;

    const finalX = Math.max(0, Math.min(100, smoothedX));
    const finalY = Math.max(0, Math.min(100, smoothedY));

    dc.send(JSON.stringify({ type: 'move', x: finalX, y: finalY }));
  };

  const calibrate = () => {
    neutralBetaRef.current = currentBetaRef.current;
    neutralGammaRef.current = currentGammaRef.current;
    lastXRef.current = 50;
    lastYRef.current = 50;
    if (navigator.vibrate) navigator.vibrate(60);
    const dc = dcRef.current;
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify({ type: 'calibrate' }));
    }
  };

  // ── Mouse Mode ───────────────────────────────────────────────────────────────
  const handleMouseMove = (e) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') return;
    if (!padRef.current) return;

    const rect = padRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const sens = sensitivityRef.current;
    // Map pad coordinates → screen % with sensitivity amplification around center
    const targetX = 50 + (rawX - 50) * (sens / 2);
    const targetY = 50 + (rawY - 50) * (sens / 2);

    // Light smoothing
    const smoothedX = lastXRef.current * (1 - LP) + targetX * LP;
    const smoothedY = lastYRef.current * (1 - LP) + targetY * LP;
    lastXRef.current = smoothedX;
    lastYRef.current = smoothedY;

    const finalX = Math.max(0, Math.min(100, smoothedX));
    const finalY = Math.max(0, Math.min(100, smoothedY));

    setOrientationData({ beta: Math.round(finalY), gamma: Math.round(finalX) });
    dc.send(JSON.stringify({ type: 'move', x: finalX, y: finalY }));
  };

  const handleMouseClick = (e) => {
    e.preventDefault();
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') return;
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      dc.send(JSON.stringify({ type: 'back' }));
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    } else {
      dc.send(JSON.stringify({ type: 'click' }));
      if (navigator.vibrate) navigator.vibrate(40);
    }
    lastTapRef.current = now;
  };

  // Touch equivalents for actual mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    const now = Date.now();
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') return;
    if (now - lastTapRef.current < 280) {
      dc.send(JSON.stringify({ type: 'back' }));
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    } else {
      dc.send(JSON.stringify({ type: 'click' }));
      if (navigator.vibrate) navigator.vibrate(40);
    }
    lastTapRef.current = now;
  };

  const cleanup = () => {
    window.removeEventListener('deviceorientation', handleOrientation);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    if (offerRetryRef.current) { clearInterval(offerRetryRef.current); offerRetryRef.current = null; }
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (signalingRef.current) { signalingRef.current.disconnect(); signalingRef.current = null; }
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  const isConnected = status === 'connected';
  const modeLabel = inputMode === 'mouse'
    ? '🖱️ Egér mód (PC szimuláció)'
    : inputMode === 'gyro'
    ? '📱 Giroszkóp mód'
    : '🔍 Bemenet érzékelése...';

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6 select-none font-sans">

      {/* Top Status Bar */}
      <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800/80 rounded-2xl px-4 py-3.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isConnected ? 'bg-emerald-500 animate-pulse'
            : status === 'signaling' ? 'bg-amber-400 animate-pulse'
            : status === 'busy' ? 'bg-orange-500'
            : 'bg-red-500'
          }`} />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            {status === 'connected' ? 'Csatlakozva' :
             status === 'signaling' ? 'Párosítás...' :
             status === 'busy' ? 'Kijelző foglalt' :
             status === 'permission_required' ? 'Engedély szükséges' :
             status === 'error' ? 'Hiba' : 'Kapcsolódás...'}
          </span>
        </div>
        <div className="flex gap-3 text-[10px] font-black text-zinc-500">
          {batteryLevel !== null && <span>🔋 {batteryLevel}%</span>}
          <span className="text-zinc-600">ID: {sessionId}</span>
        </div>
      </div>

      {/* Input mode badge */}
      {isConnected && (
        <div className="flex justify-center mt-3 shrink-0">
          <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
            {inputMode === 'mouse' ? <IoFingerPrintOutline className="text-indigo-400" /> : <IoPhonePortraitOutline className="text-emerald-400" />}
            {modeLabel}
          </div>
        </div>
      )}

      {/* Main Interaction Pad */}
      <div
        ref={padRef}
        onMouseMove={isConnected && inputMode === 'mouse' ? handleMouseMove : undefined}
        onClick={isConnected && inputMode === 'mouse' ? handleMouseClick : undefined}
        onTouchStart={isConnected ? handleTouchStart : undefined}
        className={`flex-1 my-5 rounded-[2.5rem] border flex flex-col items-center justify-center relative transition-colors
          ${isConnected && inputMode === 'mouse'
            ? 'cursor-crosshair bg-indigo-950/20 border-indigo-800/40 hover:bg-indigo-950/30'
            : 'bg-zinc-900/30 border-zinc-800/50'
          }`}
      >
        {/* iOS permission request */}
        {status === 'permission_required' && (
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <IoCompassOutline className="text-5xl text-indigo-400 animate-spin" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black uppercase">Giroszkóp hozzáférés</h2>
              <p className="text-xs text-zinc-400 font-medium max-w-[240px]">iOS eszközön engedélyezned kell a mozgásérzékelőt a vezérléshez.</p>
            </div>
            <button onClick={requestIOSPermission} className="mt-2 px-6 py-3 bg-indigo-600 rounded-full text-sm font-black shadow-lg shadow-indigo-500/20">
              ENGEDÉLYEZÉS
            </button>
          </div>
        )}

        {/* Connected + Mouse mode instructions */}
        {isConnected && inputMode === 'mouse' && (
          <div className="flex flex-col items-center gap-3 opacity-40 pointer-events-none text-center px-8">
            <IoFingerPrintOutline className="text-5xl text-indigo-400" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-black uppercase text-zinc-300">PC Szimuláció</span>
              <span className="text-[10px] font-semibold text-zinc-500 leading-relaxed">
                Mozgasd az egeret ezen a padon<br />a kurzor irányításához.<br />
                <span className="text-indigo-400">Kattintás</span> = klikk a kijelzőn
              </span>
            </div>
          </div>
        )}

        {/* Connected + Gyro mode */}
        {isConnected && inputMode === 'gyro' && (
          <div className="flex flex-col items-center gap-3 opacity-30 pointer-events-none">
            <IoPulseOutline className="text-4xl text-indigo-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Giroszkóp aktív</span>
            <span className="text-[8px] font-semibold text-zinc-500 text-center max-w-[160px]">Döntsd a telefont a kurzor mozgatásához. Koppints a klikkhez.</span>
          </div>
        )}

        {/* Busy screen */}
        {status === 'busy' && (
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <span className="text-4xl">🔒</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-black uppercase text-orange-400">Kijelző foglalt</h2>
              <p className="text-xs text-zinc-400 max-w-[220px]">Ezt a kijelzőt már valaki irányítja. Próbáld újra 60 másodperc múlva.</p>
            </div>
          </div>
        )}

        {/* Connecting state */}
        {(status === 'connecting' || status === 'signaling') && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
              {status === 'signaling' ? 'Kijelző keresése...' : 'Kapcsolat felépítése...'}
            </span>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <IoWarningOutline className="text-4xl text-rose-500" />
            <span className="text-xs font-bold text-zinc-400">Sikertelen kapcsolódás</span>
            <button onClick={initConnection} className="mt-2 px-5 py-2.5 bg-zinc-800 rounded-full text-xs font-black flex items-center gap-1 border border-zinc-700">
              <IoReloadOutline /> ÚJRAKAPCSOLÓDÁS
            </button>
          </div>
        )}

        {/* Live tilt/mouse debug readout */}
        {isConnected && (
          <div className="absolute bottom-5 left-5 right-5 flex justify-between text-[8px] font-mono text-zinc-700">
            <span>X: {Math.round(lastXRef.current)}%</span>
            <span>Y: {Math.round(lastYRef.current)}%</span>
            {inputMode === 'gyro' && <>
              <span>β:{orientationData.beta}°</span>
              <span>γ:{orientationData.gamma}°</span>
            </>}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-4 bg-zinc-900/40 border border-zinc-800/40 rounded-[2rem] p-5 shrink-0">

        {/* Sensitivity slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[9px] font-black tracking-wider text-zinc-500">
            <span>ÉRZÉKENYSÉG</span>
            <span>{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range" min="0.5" max="4.0" step="0.1"
            value={sensitivity}
            onChange={e => setSensitivity(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Calibrate button (gyro only) */}
        {inputMode === 'gyro' && (
          <button
            onClick={calibrate}
            disabled={!isConnected}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-sm tracking-widest shadow-lg shadow-indigo-600/20 transition-all uppercase flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
          >
            <IoCompassOutline className="text-lg" /> Semlegesítés (Közép)
          </button>
        )}

        {/* Mouse mode: recenter button */}
        {inputMode === 'mouse' && isConnected && (
          <button
            onClick={() => {
              lastXRef.current = 50;
              lastYRef.current = 50;
              const dc = dcRef.current;
              if (dc && dc.readyState === 'open') dc.send(JSON.stringify({ type: 'move', x: 50, y: 50 }));
            }}
            className="w-full py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-extrabold text-sm tracking-widest transition-all uppercase flex items-center justify-center gap-1.5"
          >
            <IoFingerPrintOutline className="text-lg" /> Kurzor középre
          </button>
        )}
      </div>

    </div>
  );
}
