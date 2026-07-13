// src/pages/VisitPointer/Display.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import QRCode from 'qrcode';
import { IoWalkOutline, IoQrCodeOutline, IoLocationOutline, IoPhonePortraitOutline, IoSparklesOutline } from 'react-icons/io5';
import { VisitPointerSignaling } from './Signaling';
import L from 'leaflet';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

// Haversine distance in meters (kept local so VisitPointer stays self-contained)
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters) {
  if (meters === Infinity) return '';
  if (meters < 15) return 'Itt van melletted';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const kioskIcon = L.divIcon({
  className: 'kiosk-position-icon',
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:72px">
      <div style="width:26px;height:26px;border-radius:50%;background:#4f46e5;border:2.5px solid white;box-shadow:0 4px 12px rgba(79,70,229,0.5);display:flex;align-items:center;justify-content:center;position:relative;z-index:2">
        <svg viewBox="0 0 24 24" fill="white" width="12" height="12"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
      </div>
      <div style="background:#4f46e5;color:white;font-size:7px;font-weight:900;padding:1px 5px;border-radius:10px;white-space:nowrap;margin-top:2px;box-shadow:0 2px 5px rgba(79,70,229,0.3)">START</div>
    </div>`,
  iconSize: [72, 72],
  iconAnchor: [36, 42],
});

export default function VisitPointerDisplay({ appData }) {
  const [sessionId, setSessionId] = useState('');
  const [qrCodeSrc, setQrCodeSrc] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'connecting', 'connected', 'inactive'
  
  // Tourism UI states
  const [activeCategory, setActiveCategory] = useState('attractions');
  const [selectedItem, setSelectedItem] = useState(null);

  // Connection lock references
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const signalingRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const pendingCandidatesRef = useRef([]); // ICE candidates that arrive before the PC/remote-desc is ready

  // Mouse Cursor positioning references
  const cursorCoordsRef = useRef({ x: 50, y: 50 }); // in percentages (0 to 100)
  const smoothedCoordsRef = useRef({ x: 50, y: 50 }); // low-pass filtered percentages
  const rAFRef = useRef(null);
  const statusRef = useRef('idle'); // Ref copy of status to avoid stale closure in RAF loop

  useEffect(() => {
    // Generate unique session ID on mount
    const id = 'VP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    setSessionId(id);

    // Generate pairing QR code
    const remoteUrl = `${window.location.origin}/remote?display=${id}`;
    QRCode.toDataURL(remoteUrl, { width: 220, margin: 2 })
      .then(setQrCodeSrc)
      .catch(console.error);

    // Start signaling connection
    initSignaling(id);

    // Start 60fps cursor animation loop
    rAFRef.current = requestAnimationFrame(animateCursor);

    return () => {
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
            // Display Lock: only one phone may control the display at a time.
            // Reject additional pairing attempts while a session is active.
            if (dcRef.current && dcRef.current.readyState === 'open') {
              signalingRef.current?.send({ type: 'busy' });
              return;
            }
            await initWebRTC(signal.sdp);
          } else if (signal.type === 'candidate') {
            // Buffer candidates until the peer connection + remote description exist
            if (pcRef.current && pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
              pendingCandidatesRef.current.push(signal.candidate);
            }
          }
        } catch (e) {
          console.error('Signaling handling failed:', e);
        }
      },
      (chanStatus) => {
        if (chanStatus === 'SUBSCRIBED') {
          console.log(`[Display] Subscribed to signaling channel for display ID: ${id}`);
        }
      }
    );
    signalingRef.current = signaling;
    signaling.connect();
  };

  const initWebRTC = async (offerSdp) => {
    setStatus('connecting');

    // Close any stale peer connection from a previous session before re-pairing
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && signalingRef.current) {
        signalingRef.current.send({ type: 'candidate', candidate: event.candidate });
      }
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus('connected');
        statusRef.current = 'connected';
        resetInactivityTimer();
        // Recenter cursor on start
        cursorCoordsRef.current = { x: 50, y: 50 };
        smoothedCoordsRef.current = { x: 50, y: 50 };
      };

      dc.onclose = () => {
        setStatus('idle');
        statusRef.current = 'idle';
      };

      dc.onmessage = (e) => {
        resetInactivityTimer();
        const msg = JSON.parse(e.data);

        if (msg.type === 'move') {
          // Update target coordinates
          cursorCoordsRef.current = { x: msg.x, y: msg.y };
        } else if (msg.type === 'click') {
          simulateClick();
        } else if (msg.type === 'back') {
          setSelectedItem(null);
        } else if (msg.type === 'calibrate') {
          console.log('[Display] Recalibrated by remote');
        }
      };
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

    // Flush any ICE candidates that arrived before the remote description was set
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Failed to add buffered ICE candidate:', e);
      }
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (signalingRef.current) {
      signalingRef.current.send({ type: 'answer', sdp: answer });
    }
  };

  // Reset inactivity watchdog (releases display control after 60s idle)
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      console.log('[Display] Idle timeout reached. Releasing lock.');
      setStatus('idle');
      setSelectedItem(null);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    }, 60000);
  };

  // 60fps cursor LERP interpolation loop for buttery-smooth visual motion
  const animateCursor = () => {
    const target = cursorCoordsRef.current;
    const current = smoothedCoordsRef.current;

    // Linear interpolation (LERP) easing factor
    const lerpFactor = 0.12;
    current.x = current.x + (target.x - current.x) * lerpFactor;
    current.y = current.y + (target.y - current.y) * lerpFactor;

    // Position custom cursor element in pixels
    const cursorEl = document.getElementById('visitpointer-cursor');
    if (cursorEl) {
      const px = (current.x / 100) * window.innerWidth;
      const py = (current.y / 100) * window.innerHeight;
      cursorEl.style.left = `${px}px`;
      cursorEl.style.top = `${py}px`;

      // Programmatic hover highlights using hit testing (use ref to avoid stale closure)
      if (statusRef.current === 'connected') {
        cursorEl.style.pointerEvents = 'none'; // Temporarily ignore cursor
        const hoverEl = document.elementFromPoint(px, py);
        const clickable = hoverEl?.closest('.vp-hoverable');
        
        // Remove hover styling from all elements except the active hover target
        document.querySelectorAll('.vp-hover').forEach(el => {
          if (el !== clickable) el.classList.remove('vp-hover');
        });
        
        // Apply hover styling
        if (clickable) {
          clickable.classList.add('vp-hover');
        }
      }
    }

    rAFRef.current = requestAnimationFrame(animateCursor);
  };

  // Simulate click at pixel coordinates
  const simulateClick = () => {
    const current = smoothedCoordsRef.current;
    const px = (current.x / 100) * window.innerWidth;
    const py = (current.y / 100) * window.innerHeight;

    const cursorEl = document.getElementById('visitpointer-cursor');
    if (cursorEl) cursorEl.style.pointerEvents = 'none';

    const element = document.elementFromPoint(px, py);
    if (element) {
      const clickable = element.closest('.vp-hoverable, button, a');
      if (clickable) {
        clickable.click();
      }
    }
  };

  // Filter local listings for tourism dashboard
  const displayItems = useMemo(() => {
    if (!appData) return [];
    if (activeCategory === 'attractions') return appData.attractions || [];
    if (activeCategory === 'restaurants') return appData.restaurants || [];
    return [];
  }, [appData, activeCategory]);

  const cleanup = () => {
    cancelAnimationFrame(rAFRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    pendingCandidatesRef.current = [];
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (signalingRef.current) {
      signalingRef.current.disconnect();
      signalingRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative select-none overflow-hidden font-sans">
      
      <style>{`
        #visitpointer-cursor {
          position: fixed;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 3.5px solid rgba(59, 130, 246, 0.9);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.8), 0 0 35px rgba(59, 130, 246, 0.5), inset 0 0 4px rgba(59, 130, 246, 0.5);
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
        }
        .vp-hover {
          transform: scale(1.025) translateY(-2px);
          border-color: rgba(59, 130, 246, 0.8) !important;
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.25) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .kiosk-position-icon { background: none !important; border: none !important; }
      `}</style>

      {/* Floating Air Cursor element (only rendered when connected) */}
      {status === 'connected' && <div id="visitpointer-cursor" />}

      {/* ── SCREEN 1: AUTOPLAY / STANDBY MODE ── */}
      {status === 'idle' || status === 'connecting' ? (
        <div className="flex-1 flex flex-col items-center justify-center relative p-8">
          {/* Backdrop map */}
          <div className="absolute inset-0 z-0 opacity-15 grayscale filter blur-[2px]">
            <MapContainer center={[47.389, 16.54]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} dragging={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            </MapContainer>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-10 max-w-2xl text-center bg-zinc-950/80 border border-zinc-800/50 p-12 rounded-[3rem] shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black tracking-[0.3em] text-indigo-400 uppercase flex items-center justify-center gap-1.5 animate-pulse">
                <IoSparklesOutline /> visitkőszeg digitális tájékoztatópont
              </span>
              <h1 className="text-5xl font-black tracking-tight leading-none uppercase mt-2">
                VisitPointer
              </h1>
              <p className="text-zinc-400 text-sm font-semibold max-w-sm mt-2 leading-relaxed">
                Vezéreld a kijelzőt a telefonoddal! Nincs szükség letöltésre vagy regisztrációra.
              </p>
            </div>

            {/* Dynamic pairing QR Code */}
            {qrCodeSrc ? (
              <div className="relative p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-indigo-500/20">
                <img src={qrCodeSrc} alt="Pairing QR" className="w-44 h-44" />
                <div className="absolute -bottom-3.5 bg-indigo-600 text-white font-black text-[9px] px-4 py-1.5 rounded-full tracking-widest shadow-md flex items-center gap-1 uppercase">
                  <IoPhonePortraitOutline className="text-xs" /> Szkennelj be
                </div>
              </div>
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-zinc-600">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="flex flex-col gap-1 items-center">
              <span className="text-[10px] font-black text-zinc-500 tracking-wider">KAPCSOLÓDÁSI KÓD</span>
              <span className="text-lg font-mono font-black text-indigo-300 tracking-widest">{sessionId}</span>
            </div>

            {status === 'connecting' && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-950/40 border border-indigo-900/60 rounded-2xl text-xs font-bold text-indigo-400 animate-pulse">
                <IoQrCodeOutline className="animate-spin text-sm" /> Kapcsolat felépítése...
              </div>
            )}
          </div>
        </div>
      ) : (
        
        // ── SCREEN 2: ACTIVE DOCK/TOURIST MAP DASHBOARD ──
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Pane: Interactive Wayfinding Map */}
          <div className="flex-1 relative border-r border-zinc-900">
            {/* Legend ring details overlay */}
            <div className="absolute top-6 right-6 z-[1000] p-4 bg-zinc-950/85 border border-zinc-800/80 rounded-2xl flex flex-col gap-2.5 shadow-2xl backdrop-blur-md">
              <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">séta távolság</span>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-0.5 border-b-2 border-dashed border-amber-400" />
                <span className="text-[10px] font-extrabold text-zinc-300">5 perc séta (400m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-0.5 border-b-2 border-dashed border-blue-500" />
                <span className="text-[10px] font-extrabold text-zinc-300">15 perc séta (1200m)</span>
              </div>
            </div>

            <MapContainer
              center={[KIOSK_LAT, KIOSK_LNG]}
              zoom={16}
              className="w-full h-full"
              style={{ height: '100%' }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              {/* Concentric rings */}
              <Circle center={[KIOSK_LAT, KIOSK_LNG]} radius={400} pathOptions={{ color: '#eab308', weight: 1.5, dashArray: '8, 8', fillColor: '#eab308', fillOpacity: 0.03 }} />
              <Circle center={[KIOSK_LAT, KIOSK_LNG]} radius={1200} pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '8, 8', fillColor: '#3b82f6', fillOpacity: 0.01 }} />
              
              <Marker position={[KIOSK_LAT, KIOSK_LNG]} icon={kioskIcon} />

              {/* Render dynamic markers based on chosen category */}
              {displayItems.map(item => {
                const coords = item.coords || item.coordinates || item.coordinate || null;
                if (!coords?.lat || !coords?.lng) return null;
                const distance = getDistance(KIOSK_LAT, KIOSK_LNG, coords.lat, coords.lng);
                
                const pinColor = activeCategory === 'attractions' ? '#007AFF' : '#FF9500';
                const customIcon = L.divIcon({
                  className: 'kiosk-marker-poi',
                  html: `<div style="width:24px;height:24px;border-radius:50%;background:${pinColor};border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.5)"></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                });

                return (
                  <Marker key={item.id} position={[coords.lat, coords.lng]} icon={customIcon}>
                    <Popup>
                      <div className="p-3 min-w-[170px]">
                        <span className="text-[9px] font-black tracking-wider uppercase" style={{ color: pinColor }}>
                          {activeCategory === 'attractions' ? 'Nevezetesség' : 'Éttermek'}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-950 mt-0.5">{item.name}</h4>
                        <div className="flex gap-1.5 text-[9px] font-extrabold text-zinc-500 mt-2 items-center">
                          <span className="flex items-center gap-0.5"><IoWalkOutline /> {Math.max(1, Math.round(distance / 80))} perc</span>
                          <span>·</span>
                          <span>{formatDistance(distance)}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Right Pane: Navigation and listings directory */}
          <div className="w-full md:w-[480px] shrink-0 bg-zinc-900 flex flex-col p-6 overflow-hidden">
            
            {/* Category tabs */}
            <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-2xl shrink-0 border border-zinc-800/80 mb-6">
              <button
                onClick={() => { setActiveCategory('attractions'); setSelectedItem(null); }}
                className={`vp-hoverable flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeCategory === 'attractions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Látnivalók
              </button>
              <button
                onClick={() => { setActiveCategory('restaurants'); setSelectedItem(null); }}
                className={`vp-hoverable flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeCategory === 'restaurants' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Gasztronómia
              </button>
            </div>

            {/* List or Detail Screen switcher */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
              {selectedItem ? (
                // DETAIL SCREEN VIEW
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-3 duration-300">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="vp-hoverable mr-auto px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-black text-zinc-400 hover:text-white"
                  >
                    ← VISSZA A LISTÁHOZ
                  </button>

                  <div className="rounded-3xl overflow-hidden aspect-[16/10] bg-zinc-950 relative border border-zinc-800">
                    <img
                      src={selectedItem.image ? (selectedItem.image.startsWith('http') || selectedItem.image.startsWith('/images/') ? selectedItem.image : `/images/${selectedItem.image}`) : '/images/event_default.jpg'}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-black text-white uppercase">{selectedItem.name}</h2>
                    <div className="flex gap-2 text-xs font-extrabold text-indigo-400 items-center">
                      <IoLocationOutline className="text-sm shrink-0" />
                      <span>{selectedItem.address || 'Kőszeg'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                    {selectedItem.description || 'Nincs leírás elérhető ehhez a helyszínhez.'}
                  </p>
                </div>
              ) : (
                // LIST SCREEN VIEW
                displayItems.map(item => {
                  const coords = item.coords || item.coordinates || item.coordinate || null;
                  const distance = coords?.lat && coords?.lng ? getDistance(KIOSK_LAT, KIOSK_LNG, coords.lat, coords.lng) : Infinity;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="
                        vp-hoverable p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 cursor-pointer
                        transition-all duration-300 flex items-center gap-4 relative overflow-hidden active:scale-[0.98]
                      "
                    >
                      <div
                        className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 bg-zinc-800 border border-zinc-800"
                        style={{ backgroundImage: `url(${item.image ? (item.image.startsWith('http') || item.image.startsWith('/images/') ? item.image : `/images/${item.image}`) : '/images/event_default.jpg'})` }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-sm font-black text-white leading-tight uppercase truncate">{item.name}</h4>
                        <p className="text-[11px] text-zinc-500 font-semibold truncate leading-none">
                          {item.address || item.description || 'Kőszeg'}
                        </p>
                      </div>
                      {distance !== Infinity && (
                        <div className="flex flex-col items-end shrink-0 gap-0.5 text-right font-black">
                          <span className="flex items-center gap-0.5 text-xs text-zinc-300">
                            <IoWalkOutline className="text-indigo-400 text-sm" />
                            {Math.max(1, Math.round(distance / 80))} perc
                          </span>
                          <span className="text-[9px] text-zinc-600">{formatDistance(distance)}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Release connection instructions strip */}
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-wider shrink-0">
              <span className="flex items-center gap-1.5"><IoPhonePortraitOutline className="text-xs text-indigo-400 animate-bounce" /> Telefon Csatlakoztatva</span>
              <span>1 perc inaktivitás után lezár</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
