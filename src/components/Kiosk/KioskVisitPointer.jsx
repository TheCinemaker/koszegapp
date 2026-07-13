// src/components/Kiosk/KioskVisitPointer.jsx
//
// VisitPointer integration layer for the Kiosk display.
// This component:
//   1. Generates a unique session ID and QR code for the remote controller.
//   2. Listens for WebRTC offers from the phone via Supabase Realtime signaling.
//   3. Renders a floating cursor that follows the phone's gyroscope/mouse input.
//   4. Simulates click/back events on the DOM element under the cursor.
//   5. Shows a small pairing badge on the screensaver and a lock indicator when active.
//
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { VisitPointerSignaling } from '../../pages/VisitPointer/Signaling';
import { IoPhonePortraitOutline } from 'react-icons/io5';

export default function KioskVisitPointer() {
  const [sessionId, setSessionId] = useState('');
  const [qrCodeSrc, setQrCodeSrc] = useState('');
  const [connected, setConnected] = useState(false);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const signalingRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const inactivityTimerRef = useRef(null);
  const rAFRef = useRef(null);
  const connectedRef = useRef(false); // stale-closure-safe copy

  // Cursor position state — kept in refs for 60fps RAF loop
  const targetCoordsRef = useRef({ x: 50, y: 50 });
  const smoothedCoordsRef = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const id = 'VP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    setSessionId(id);

    const remoteUrl = `${window.location.origin}/remote?display=${id}`;
    QRCode.toDataURL(remoteUrl, { width: 200, margin: 1 })
      .then(setQrCodeSrc)
      .catch(console.error);

    initSignaling(id);
    rAFRef.current = requestAnimationFrame(animateCursor);

    return () => {
      cancelAnimationFrame(rAFRef.current);
      cleanup();
    };
  }, []);

  const initSignaling = (id) => {
    const signaling = new VisitPointerSignaling(
      id,
      'display',
      async (signal) => {
        try {
          if (signal.type === 'offer') {
            if (dcRef.current && dcRef.current.readyState === 'open') {
              signalingRef.current?.send({ type: 'busy' });
              return;
            }
            await handleOffer(signal.sdp);
          } else if (signal.type === 'candidate') {
            if (pcRef.current && pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
              pendingCandidatesRef.current.push(signal.candidate);
            }
          }
        } catch (e) {
          console.error('[VisitPointer Display] Signal error:', e);
        }
      },
      (chanStatus) => {
        if (chanStatus === 'SUBSCRIBED') {
          console.log(`[VisitPointer] Display ready on channel: visitpointer:${id}`);
          // Announce to any waiting phone that we are ready to receive an offer
          signaling.announceReady();
        }
      },
      null // display does not use onDisplayReady
    );
    signalingRef.current = signaling;
    signaling.connect();
  };

  const handleOffer = async (offerSdp) => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && signalingRef.current) {
        signalingRef.current.send({ type: 'candidate', candidate: e.candidate });
      }
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dcRef.current = dc;

      dc.onopen = () => {
        setConnected(true);
        connectedRef.current = true;
        // Center cursor on fresh connection
        targetCoordsRef.current = { x: 50, y: 50 };
        smoothedCoordsRef.current = { x: 50, y: 50 };
        resetInactivityTimer();
      };

      dc.onclose = () => {
        setConnected(false);
        connectedRef.current = false;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };

      dc.onmessage = (e) => {
        resetInactivityTimer();
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'move') {
            targetCoordsRef.current = { x: msg.x, y: msg.y };
          } else if (msg.type === 'click') {
            simulateClick();
          } else if (msg.type === 'back') {
            window.history.back();
          }
        } catch {}
      };
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

    for (const c of pendingCandidatesRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    signalingRef.current?.send({ type: 'answer', sdp: answer });
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setConnected(false);
      connectedRef.current = false;
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    }, 60000);
  };

  // 60fps LERP cursor animation loop
  const animateCursor = () => {
    const target = targetCoordsRef.current;
    const current = smoothedCoordsRef.current;
    const lerpFactor = 0.12;

    current.x += (target.x - current.x) * lerpFactor;
    current.y += (target.y - current.y) * lerpFactor;

    const cursorEl = document.getElementById('vp-kiosk-cursor');
    if (cursorEl && connectedRef.current) {
      const px = (current.x / 100) * window.innerWidth;
      const py = (current.y / 100) * window.innerHeight;
      cursorEl.style.left = `${px}px`;
      cursorEl.style.top = `${py}px`;

      // Hover highlight on .vp-hoverable elements under the cursor
      cursorEl.style.pointerEvents = 'none';
      const elUnder = document.elementFromPoint(px, py);
      const hoverable = elUnder?.closest('.vp-hoverable');
      document.querySelectorAll('.vp-kiosk-hover').forEach(el => {
        if (el !== hoverable) el.classList.remove('vp-kiosk-hover');
      });
      if (hoverable) hoverable.classList.add('vp-kiosk-hover');
    }

    rAFRef.current = requestAnimationFrame(animateCursor);
  };

  const simulateClick = () => {
    const current = smoothedCoordsRef.current;
    const px = (current.x / 100) * window.innerWidth;
    const py = (current.y / 100) * window.innerHeight;

    const cursorEl = document.getElementById('vp-kiosk-cursor');
    if (cursorEl) cursorEl.style.pointerEvents = 'none';

    const el = document.elementFromPoint(px, py);
    if (el) {
      const clickable = el.closest('button, a, [role="button"], .cursor-pointer, .vp-hoverable');
      if (clickable) clickable.click();
    }
  };

  const cleanup = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (signalingRef.current) { signalingRef.current.disconnect(); signalingRef.current = null; }
  };

  return (
    <>
      <style>{`
        #vp-kiosk-cursor {
          position: fixed;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: 3px solid rgba(59,130,246,0.95);
          box-shadow: 0 0 18px rgba(59,130,246,0.85), 0 0 40px rgba(59,130,246,0.45), inset 0 0 6px rgba(59,130,246,0.4);
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width 0.1s, height 0.1s;
        }
        .vp-kiosk-hover {
          outline: 2px solid rgba(59,130,246,0.7) !important;
          outline-offset: 2px;
          background: rgba(59,130,246,0.07) !important;
          transform: scale(1.02) !important;
          transition: transform 0.15s, outline 0.1s !important;
        }
      `}</style>

      {/* Floating cursor — only rendered while phone is connected */}
      {connected && <div id="vp-kiosk-cursor" />}

      {/* QR pairing badge — always visible in bottom-right corner */}
      {!connected && qrCodeSrc && (
        <div
          className="fixed bottom-6 right-6 z-[9000] flex flex-col items-center gap-2 p-3 bg-white/95 dark:bg-zinc-900/95 rounded-3xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur-xl"
          style={{ width: 120 }}
        >
          <img src={qrCodeSrc} alt="VisitPointer QR" className="w-20 h-20 rounded-xl" />
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[8px] font-black tracking-widest text-indigo-500 uppercase">Air Mouse</span>
            <span className="text-[9px] font-mono font-black text-zinc-600 dark:text-zinc-400 tracking-wider">{sessionId}</span>
          </div>
        </div>
      )}

      {/* Connected indicator badge */}
      {connected && (
        <div className="fixed bottom-6 right-6 z-[9000] flex items-center gap-2 px-3 py-2 bg-emerald-600/90 text-white rounded-2xl shadow-xl border border-emerald-500/50 backdrop-blur-md">
          <IoPhonePortraitOutline className="text-sm animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-wider">Vezérlő aktív</span>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      )}
    </>
  );
}
