import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCarSport, IoPhonePortraitOutline, IoSend, IoLocate, IoCheckmarkCircle } from 'react-icons/io5';
import { fetchParkingZones } from '../api';
import { getDistance, getDistanceFromPolyline } from '../utils/parkingUtils';

export default function SMSParkingCard() {
    const { t } = useTranslation('parking');
    const [plate, setPlate] = useState('');
    const [carrier, setCarrier] = useState('30');
    const [zone, setZone] = useState('green'); // 'green' | 'red' | 'free'
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const currentZone = t(`smsCard.zones.${zone}`, { returnObjects: true });
    const isFreeZone = zone === 'free';

    const handleGPS = async () => {
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

                    // Thresholds
                    // 150m: Very close to a paid street -> Set Zone
                    // > 150m but < 3000m from city -> Free Zone
                    // > 3000m -> Too far
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

    const handleSendSMS = () => {
        if (!plate || isFreeZone) return;
        const phoneNumber = `+36${carrier}763${currentZone.code}`;
        const messageBody = plate.toUpperCase().replace(/\s/g, '');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const bodySeparator = isIOS ? '&' : '?';
        window.location.href = `sms:${phoneNumber}${bodySeparator}body=${encodeURIComponent(messageBody)}`;
    };

    return (
        <div className="relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-[40px] border border-white/60 dark:border-white/10 shadow-xl mb-8">

            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-500
                            ${isFreeZone ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'}
                        `}>
                            {isFreeZone ? <IoCheckmarkCircle className="text-3xl" /> : <IoCarSport className="text-2xl" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{t('smsCard.title')}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white transition-colors duration-300
                                    ${isFreeZone ? 'bg-emerald-500' : 'bg-gray-800 dark:bg-white/10'}
                                `}>
                                    {currentZone.code}
                                </span>
                                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                                    {currentZone.price} {isFreeZone ? '' : `(${currentZone.hours})`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zone Selection & GPS */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('smsCard.zoneLabel')}</label>
                        <button
                            onClick={handleGPS}
                            disabled={isLocating}
                            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-indigo-500 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            <IoLocate className={isLocating ? "animate-spin" : ""} size={14} />
                            {isLocating ? "Keresés..." : "GPS Zóna"}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {['green', 'red'].map((z) => {
                            const zData = t(`smsCard.zones.${z}`, { returnObjects: true });
                            const isActive = zone === z;
                            const activeColor = z === 'green' ? 'bg-emerald-600' : 'bg-rose-600';
                            const activeShadow = z === 'green' ? 'shadow-emerald-500/30' : 'shadow-rose-500/30';

                            return (
                                <button
                                    key={z}
                                    onClick={() => setZone(z)}
                                    className={`
                                        relative h-14 rounded-xl text-sm font-bold transition-all duration-300 border overflow-hidden
                                        ${isActive
                                            ? `${activeColor} text-white border-transparent shadow-lg ${activeShadow} scale-[1.02]`
                                            : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <span className="relative z-10">{zData.name}</span>
                                    {isActive && <motion.div layoutId="zoneHighlight" className="absolute inset-0 bg-white/10" />}
                                </button>
                            );
                        })}
                    </div>
                    {locationError && (
                        <p className="text-[10px] text-red-500 font-medium text-right animate-pulse">
                            {locationError}
                        </p>
                    )}
                    {isFreeZone && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
                        >
                            <IoCheckmarkCircle className="text-emerald-500 text-xl shrink-0" />
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Jelenleg ingyenes zónában vagy. Nem szükséges SMS-t küldeni!
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* License Plate Input - COMPACT FRAME */}
                <div className={`space-y-2 transition-opacity duration-300 ${isFreeZone ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Rendszám</label>
                    {/* Width restricted even further to reduce height, keeping aspect ratio */}
                    <div className="relative w-full max-w-[240px] aspect-[520/110] mx-auto shadow-2xl rounded-lg overflow-hidden group">
                        <img
                            src="/images/license_plate_frame.png"
                            alt="License Plate Frame"
                            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            placeholder="ABC-123"
                            maxLength={10}
                            className="
                                absolute inset-0 w-full h-full 
                                bg-transparent 
                                text-center text-2xl font-black 
                                uppercase tracking-[0.15em] 
                                text-gray-900 
                                placeholder-gray-300/50 
                                focus:outline-none 
                                z-10
                                pt-0
                            "
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                </div>

                {/* Carrier Selection */}
                <div className={`space-y-2 transition-opacity duration-300 ${isFreeZone ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Szolgáltató (Előhívó)</label>
                    <div className="flex gap-3">
                        {['20', '30', '70'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setCarrier(opt)}
                                className={`
                  flex-1 h-12 rounded-xl text-lg font-bold transition-all duration-300 border
                  ${carrier === opt
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-[1.02]'
                                        : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                                    }
                `}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendSMS}
                    disabled={!plate || isFreeZone}
                    className={`
            w-full h-16 mt-2 rounded-[1.5rem] flex items-center justify-center gap-3 text-lg font-bold text-white shadow-xl transition-all duration-300
            ${!plate || isFreeZone
                            ? 'bg-gray-300 dark:bg-zinc-800 cursor-not-allowed opacity-70 shadow-none'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:shadow-indigo-500/30'
                        }
          `}
                >
                    {isFreeZone ? (
                        <>
                            <IoCheckmarkCircle className="text-xl" />
                            <span>Ingyenes Parkolás</span>
                        </>
                    ) : (
                        <>
                            <IoSend className={plate ? "animate-pulse" : ""} />
                            <span>{t('smsCard.button')} ({currentZone.code})</span>
                        </>
                    )}
                </motion.button>

                {!isFreeZone && (
                    <p className="text-[10px] text-center text-gray-400 font-medium">
                        {t('smsCard.info')}
                        <br />Címzett: +36 {carrier} 763 {currentZone.code} | Üzenet: {plate || '...'}
                    </p>
                )}

            </div>
        </div>
    );
}
