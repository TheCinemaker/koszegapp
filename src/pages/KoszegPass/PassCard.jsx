import React from 'react';
import { motion } from 'framer-motion';

/**
 * PassCard – a fizetős KőszegPass bankkártya-stílusú megjelenítése.
 *
 * Előlap: mélykék gradiens, arany akcent, KŐSZEGPASS felirat, sorszám,
 *         kártyatulajdonos neve és érvényesség (mint egy bankkártyán).
 * Hátlap: csak a QR-kód.
 * Koppintásra 3D flip.
 *
 * Props:
 *   holderName  – a névjegyen megjelenő név
 *   passType    – 'individual' | 'family'
 *   serial      – sorszám (szám); ha nincs, a sor elrejtve
 *   expiresAt   – ISO dátum string
 *   qrCodeUrl   – dataURL a QR-hoz
 *   isExpired   – bool
 *   isFlipped   – bool (vezérelt)
 *   onToggle    – flip callback
 */
export default function PassCard({
    holderName,
    passType,
    serial,
    expiresAt,
    qrCodeUrl,
    isExpired = false,
    isFlipped = false,
    onToggle
}) {
    const typeLabel = passType === 'family' ? 'Családi' : 'Egyéni';

    const expiryShort = expiresAt
        ? new Date(expiresAt).toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit' }).replace(/\s/g, '')
        : '—';

    const serialText =
        serial != null && serial !== ''
            ? `№ ${String(serial).padStart(6, '0')}`
            : null;

    return (
        <div
            className="relative w-full aspect-[1.586/1] group cursor-pointer"
            style={{ perspective: '1200px' }}
            onClick={onToggle}
        >
            <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* ---- ELŐLAP ---- */}
                <div
                    className="absolute inset-0 rounded-2xl p-5 shadow-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#0d47a1] to-[#311b92] flex flex-col justify-between"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="absolute inset-0 opacity-[0.15] bg-[url('/noise.svg')] mix-blend-overlay pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    {/* holografikus csillanás hoverre */}
                    <div className="absolute top-[-60%] left-[-20%] w-[55%] h-[220%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none transition-[left] duration-[900ms] ease-out group-hover:left-[130%]" />

                    {/* felső sor: wordmark + típus */}
                    <div className="relative z-10 flex justify-between items-start">
                        <span className="text-[11px] font-extrabold tracking-[0.16em] uppercase text-[#e6cf8a]">
                            KŐSZEGPASS
                        </span>
                        <span
                            className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg ${
                                isExpired ? 'bg-red-500 text-white' : 'bg-[#C8AF64] text-[#0C234B]'
                            }`}
                        >
                            {isExpired ? 'Lejárt' : typeLabel}
                        </span>
                    </div>

                    {/* közép: sorszám */}
                    {serialText && (
                        <div className="relative z-10">
                            <p className="text-[7px] uppercase tracking-[0.2em] text-blue-200/55 font-bold mb-0.5">
                                Sorszám
                            </p>
                            <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-white/90 tabular-nums">
                                {serialText}
                            </p>
                        </div>
                    )}

                    {/* alsó sor: tulajdonos + érvényesség */}
                    <div className="relative z-10 flex justify-between items-end">
                        <div className="min-w-0">
                            <p className="text-[7px] uppercase tracking-[0.18em] text-blue-200/55 font-bold">
                                Kártyatulajdonos
                            </p>
                            <p className="text-sm font-semibold tracking-[0.06em] uppercase text-white truncate max-w-[180px] mt-0.5">
                                {holderName}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[7px] uppercase tracking-[0.14em] text-blue-200/50 font-bold">
                                Érvényes
                            </p>
                            <p className="font-mono text-xs font-bold text-[#e6cf8a] mt-0.5">{expiryShort}</p>
                        </div>
                    </div>
                </div>

                {/* ---- HÁTLAP: csak QR ---- */}
                <div
                    className="absolute inset-0 rounded-2xl p-5 shadow-2xl overflow-hidden bg-white flex items-center justify-center"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    {!isExpired && qrCodeUrl ? (
                        <div className="bg-white p-1.5 rounded-xl">
                            <img src={qrCodeUrl} alt="KőszegPass QR" className="w-32 h-32 object-contain" />
                        </div>
                    ) : (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 font-bold text-[10px] text-center">
                            ⚠️ A kártya érvényessége lejárt, a QR-kód letiltva.
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
