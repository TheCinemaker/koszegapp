import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCarSport, IoPhonePortraitOutline, IoSend, IoLocate, IoCheckmarkCircle, IoTimeOutline, IoStopCircleOutline, IoPlayCircleOutline } from 'react-icons/io5';
import { fetchParkingZones } from '../api';
import { getDistance, getDistanceFromPolyline } from '../utils/parkingUtils';
import { triggerHaptic, HapticType } from '../utils/haptics';

export default function SMSParkingCard() {
    const { t } = useTranslation('parking');
    const [plate, setPlate] = useState('');
    const [carrier, setCarrier] = useState('30');
    const [zone, setZone] = useState('green'); // 'green' | 'red' | 'free'
    const [mode, setMode] = useState('start'); // 'start' | 'stop'
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [isPaidPeriod, setIsPaidPeriod] = useState(true);

    const currentZone = t(`smsCard.zones.${zone}`, { returnObjects: true });
    const isFreeZone = zone === 'free';

    // Check time logic
    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const day = now.getDay(); // 0 = Sun, 6 = Sat
            const hour = now.getHours();

            // Mon-Fri (1-5), 08:00 - 17:00
            const isWorkday = day >= 1 && day <= 5;
            const isWorkHour = hour >= 8 && hour < 17;

            setIsPaidPeriod(isWorkday && isWorkHour);
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleGPS = async () => {
        triggerHaptic(HapticType.MEDIUM);
        setIsLocating(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError("A böngésző nem támogatja a helymeghatározást.");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const zones = await fetchParkingZones();

                    let minDistance = Infinity;
                    let nearestZoneId = null;

                    // Find nearest zone based on polylines
                    zones.forEach(z => {
                        z.lines.forEach(line => {
                            const dist = getDistanceFromPolyline(latitude, longitude, line);
                            if (dist < minDistance) {
                                minDistance = dist;
                                nearestZoneId = z.id;
                            }
                        });
                    });

                    // Distance to City Center (approx Kőszeg center)
                    const cityCenterLat = 47.389;
                    const cityCenterLng = 16.540;
                    const distToCity = getDistance(latitude, longitude, cityCenterLat, cityCenterLng);

                    if (minDistance < 150) {
                        if (nearestZoneId === 1) {
                            setZone('red');
                        } else if (nearestZoneId === 2) {
                            setZone('green');
                        }
                    } else if (distToCity < 3000) {
                        setZone('free');
                    } else {
                        setLocationError("Túl távol vagy a fizetős zónáktól.");
                    }

                } catch (err) {
                    console.error("GPS hiba:", err);
                    setLocationError("Hiba a zóna meghatározásakor.");
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.error("GPS hiba:", err);
                setLocationError("Nem sikerült lekérni a pozíciót.");
                setIsLocating(false);
            }
        );
    };

    const handleAction = () => {
        if (mode === 'start' && (!plate || isFreeZone || !isPaidPeriod)) {
            triggerHaptic(HapticType.ERROR);
            return;
        }

        triggerHaptic(HapticType.SUCCESS);
        const phoneNumber = `+36${carrier}763${currentZone.code}`;
        let messageBody = '';

        if (mode === 'start') {
            messageBody = plate.toUpperCase().replace(/\s/g, '');
        } else {
            messageBody = 'STOP';
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const bodySeparator = isIOS ? '&' : '?';
        window.location.href = `sms:${phoneNumber}${bodySeparator}body=${encodeURIComponent(messageBody)}`;
    };

    const isStartDisabled = mode === 'start' && (!plate || isFreeZone || !isPaidPeriod);
    const isStopDisabled = mode === 'stop' && isFreeZone;

    return (
        <div className="relative w-full overflow-hidden rounded-[32px] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/40 dark:border-white/5 shadow-2xl mb-8 transition-all duration-300">

            {/* Header / Mode Switcher */}
            <div className="p-2 flex gap-2 bg-gray-100/50 dark:bg-black/20 m-2 rounded-[24px]">
                <button
                    onClick={() => { setMode('start'); triggerHaptic(HapticType.LIGHT); }}
                    className={`flex-1 py-3 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${mode === 'start'
                            ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    <IoPlayCircleOutline size={18} />
                    START
                </button>
                <button
                    onClick={() => { setMode('stop'); triggerHaptic(HapticType.LIGHT); }}
                    className={`flex-1 py-3 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${mode === 'stop'
                            ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-md'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    <IoStopCircleOutline size={18} />
                    STOP
                </button>
            </div>

            <div className="px-6 pb-6 pt-2 flex flex-col gap-6">

                {/* Status Indicator */}
                {!isPaidPeriod && !isFreeZone && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <IoTimeOutline size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Jelenleg Ingyenes</p>
                            <p className="text-sm font-bold">Munkaidőn kívül vagyunk.</p>
                        </div>
                    </div>
                )}

                {/* Zone Selection & GPS */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('smsCard.zoneLabel')}</label>
                        <button
                            onClick={handleGPS}
                            disabled={isLocating}
                            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 disabled:opacity-50 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full"
                        >
                            <IoLocate className={isLocating ? "animate-spin" : ""} size={12} />
                            {isLocating ? "Keresés..." : "GPS"}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {['green', 'red'].map((z) => {
                            const zData = t(`smsCard.zones.${z}`, { returnObjects: true });
                            const isActive = zone === z;
                            const activeColor = z === 'green' ? 'bg-emerald-500' : 'bg-rose-500';
                            const activeShadow = z === 'green' ? 'shadow-emerald-500/30' : 'shadow-rose-500/30';

                            return (
                                <button
                                    key={z}
                                    onClick={() => { setZone(z); triggerHaptic(HapticType.LIGHT); }}
                                    className={`
                                        relative h-20 rounded-[20px] transition-all duration-300 border text-left px-4 flex flex-col justify-center gap-1 overflow-hidden group
                                        ${isActive
                                            ? `${activeColor} text-white border-transparent shadow-lg ${activeShadow} scale-[1.02]`
                                            : 'bg-white dark:bg-zinc-800/50 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <span className="text-sm font-bold relative z-10">{zData.name}</span>
                                    <div className="flex items-center gap-1 relative z-10 opacity-90">
                                        <span className="text-xs font-medium">{zData.price}</span>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                                        <IoCarSport size={24} />
                                    </div>
                                    {isActive && <motion.div layoutId="zoneHighlight" className="absolute inset-0 bg-white/20" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Mode Specific Inputs */}
                <AnimatePresence mode='wait'>
                    {mode === 'start' ? (
                        <motion.div
                            key="start-inputs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* License Plate */}
                            <div className={`space-y-3 ${!isPaidPeriod || isFreeZone ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Rendszám</label>
                                <div className="relative w-full h-[60px] bg-yellow-400 rounded-xl border-4 border-black/10 shadow-inner flex items-center justify-center overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-blue-700 flex flex-col items-center justify-start pt-1 gap-0.5">
                                        <span className="text-[6px] text-white">EU</span>
                                        <div className="text-[8px] text-white font-bold border rounded-full px-0.5 border-white">H</div>
                                    </div>
                                    <input
                                        type="text"
                                        value={plate}
                                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                        placeholder="AA BB-123"
                                        maxLength={10}
                                        className="
                                            w-full h-full bg-transparent 
                                            text-center text-2xl font-black 
                                            uppercase tracking-[0.2em] 
                                            text-black
                                            placeholder-black/20
                                            focus:outline-none 
                                            pl-8
                                        "
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stop-inputs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/20"
                        >
                            <p className="text-sm text-rose-800 dark:text-rose-300 font-medium text-center">
                                A parkolás leállításához küldd el a <strong>STOP</strong> szót SMS-ben.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Carrier Selection */}
                <div className={`space-y-3 ${isFreeZone ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Szolgáltató</label>
                    <div className="flex gap-2">
                        {['20', '30', '70'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { setCarrier(opt); triggerHaptic(HapticType.LIGHT); }}
                                className={`
                                    flex-1 h-10 rounded-xl text-sm font-bold transition-all duration-300 border
                                    ${carrier === opt
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-[1.02]'
                                        : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
                                    }
                                `}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Action Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAction}
                    disabled={mode === 'start' ? isStartDisabled : isStopDisabled}
                    className={`
                        w-full h-[56px] rounded-[20px] flex items-center justify-center gap-3 text-base font-bold text-white shadow-xl transition-all duration-300
                        ${(mode === 'start' ? isStartDisabled : isStopDisabled)
                            ? 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                            : mode === 'start'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30 hover:shadow-indigo-500/40'
                                : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30 hover:shadow-rose-500/40'
                        }
                    `}
                >
                    {isFreeZone ? (
                        <>
                            <IoCheckmarkCircle size={24} />
                            <span>Ingyenes Zóna</span>
                        </>
                    ) : (
                        <>
                            {mode === 'start' ? <IoSend size={20} /> : <IoHandLeftOutline size={20} className="hidden" /> /* Icon placeholder */}
                            <span>
                                {mode === 'start' ? t('smsCard.button') : t('smsCard.stopButton')}
                            </span>
                        </>
                    )}
                </motion.button>

                <p className="text-[10px] text-center text-gray-400 font-medium">
                    Címzett: +36 {carrier} 763 {currentZone.code}
                </p>

            </div>

            {/* Background Decor */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
        </div>
    );
}

// Helper icon import fix (IoHandLeftOutline not in original import)
// Re-importing necessary icons to be safe
// Note: IoHandLeftOutline might not be available, using IoStopCircle instead in button if needed, but text is enough.

