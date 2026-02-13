import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { IoCarSport, IoPhonePortraitOutline, IoSend } from 'react-icons/io5';

export default function SMSParkingCard() {
    const { t } = useTranslation('parking');
    const [plate, setPlate] = useState('');
    const [carrier, setCarrier] = useState('30');
    const [zone, setZone] = useState('green'); // 'green' | 'red'

    const currentZone = t(`smsCard.zones.${zone}`, { returnObjects: true });

    const handleSendSMS = () => {
        if (!plate) return;

        // Target number: +36 (30|20|70) + ZONE CODE (9731/9733)
        // Note: Actual parking numbers are usually +36 (20/30/70) 763 xxxx
        // Formatting based on typical Hungarian parking: +36 20 763 9731
        const phoneNumber = `+36${carrier}763${currentZone.code}`;
        const messageBody = plate.toUpperCase().replace(/\s/g, '');

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const bodySeparator = isIOS ? '&' : '?';

        window.location.href = `sms:${phoneNumber}${bodySeparator}body=${encodeURIComponent(messageBody)}`;
    };

    return (
        <div className="relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-[40px] border border-white/60 dark:border-white/10 shadow-xl mb-8">

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <IoCarSport className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{t('smsCard.title')}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                {currentZone.code}
                            </span>
                            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                                {currentZone.price} ({currentZone.hours})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Zone Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('smsCard.zoneLabel')}</label>
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
                </div>

                {/* License Plate Input with Custom Frame */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Rendszám</label>
                    <div className="relative w-full aspect-[520/110] max-w-sm mx-auto shadow-2xl rounded-lg overflow-hidden">
                        {/* Frame Image */}
                        <img
                            src="/images/license_plate_frame.png"
                            alt="License Plate Frame"
                            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                        />

                        {/* Input Field Overlay - Positioned to fit the frame's editable area */}
                        {/* Assuming the frame has standard margins. Adjust padding/position as needed. */}
                        <input
                            type="text"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            placeholder="ABC-123"
                            maxLength={10}
                            className="
                                absolute inset-0 w-full h-full 
                                bg-transparent 
                                text-center text-3xl sm:text-4xl font-black 
                                uppercase tracking-[0.2em] 
                                text-gray-900 
                                placeholder-gray-300/50 
                                focus:outline-none 
                                z-10
                                pt-2 /* Slight visual adjustment for vertical centering */
                            "
                            style={{ fontFamily: 'monospace' }} // Monospace for license plate feel
                        />
                    </div>
                </div>

                {/* Carrier Selection */}
                <div className="space-y-2">
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
                    disabled={!plate}
                    className={`
            w-full h-16 mt-2 rounded-[1.5rem] flex items-center justify-center gap-3 text-lg font-bold text-white shadow-xl transition-all duration-300
            ${plate
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:shadow-indigo-500/30'
                            : 'bg-gray-300 dark:bg-zinc-800 cursor-not-allowed opacity-70 shadow-none'
                        }
          `}
                >
                    <IoSend className={plate ? "animate-pulse" : ""} />
                    <span>{t('smsCard.button')} ({currentZone.code})</span>
                </motion.button>

                <p className="text-[10px] text-center text-gray-400 font-medium">
                    {t('smsCard.info')}
                    <br />Címzett: +36 {carrier} 763 {currentZone.code} | Üzenet: {plate || '...'}
                </p>

            </div>
        </div>
    );
}
