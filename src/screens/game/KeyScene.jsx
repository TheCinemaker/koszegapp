import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getGemImage = (img) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    if (img.startsWith('/')) return img;
    return `/images/game/${img}`;
};

export default function KeyScene({ gem, isNewKey, onNext, onClose, mode, foundCount, totalCount }) {
    const observationText = gem.question ? gem.question[mode] : gem.description;
    const options = gem.options && gem.options[mode] ? gem.options[mode] : [];
    const correctAnswer = gem.answer ? gem.answer[mode] : null;

    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(false);
    const [shake, setShake] = useState(false);

    // Accordion State
    const [expandedDetail, setExpandedDetail] = useState(null);

    const handleOptionClick = (option) => {
        if (isCorrect) return; // Ha már eltalálta, ne lehessen variálni

        setSelectedOption(option);

        if (option === correctAnswer) {
            // Helyes válasz!
            setIsCorrect(true);
            if (navigator && navigator.vibrate) navigator.vibrate([50, 50, 50]);
        } else {
            // Helytelen
            setShake(true);
            setTimeout(() => setShake(false), 500);
            if (navigator && navigator.vibrate) navigator.vibrate(200);
        }
    };

    const year = 1532;
    const imageUrl = getGemImage(gem.image);

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 relative overflow-hidden flex flex-col items-center px-6 selection:bg-white/20">

            {/* ===== HÁTTÉRKÉP ===== */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover blur-sm opacity-50 dark:grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c] via-[#0b0b0c]/80 to-[#0b0b0c]" />
            </div>

            {/* ===== TARTALMI RÉTEG ===== */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-start pt-10 pb-10 space-y-6 text-center h-full overflow-y-auto hide-scrollbar">

                {/* ÉVSZÁM */}
                <div className="font-serif text-4xl tracking-widest text-neutral-100/30">
                    {year}
                </div>

                {/* HELYSZÍN KÉP */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl relative group shrink-0"
                >
                    <img
                        src={imageUrl}
                        alt={gem.name}
                        className="w-full h-full object-cover transition-transform duration-[10s] ease-linear group-hover:scale-110"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg pointer-events-none" />
                </motion.div>

                <div className="space-y-1">
                    <p className="text-xs text-blue-300/80 font-mono uppercase tracking-widest">
                        {isNewKey ? (isCorrect ? "■ JEL AZONOSÍTVA" : "■ JEL ELEMZÉSE...") : "■ STABILIZÁLVA"}
                    </p>
                    <h2 className="text-2xl font-serif text-white leading-tight px-4">
                        {gem.name}
                    </h2>
                    {/* Történelmi Leírás (Accordion vagy Sima) */}
                    <div className="px-4 py-2 text-left w-full">
                        {gem.details ? (
                            <div className="space-y-2">
                                {gem.details.map((detail, idx) => (
                                    <div key={idx} className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                                        <button
                                            onClick={() => setExpandedDetail(expandedDetail === idx ? null : idx)}
                                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                        >
                                            <span className="text-xs font-bold uppercase tracking-wider text-amber-100/80">
                                                {detail.title}
                                            </span>
                                            <span className="text-white/40 text-xs">
                                                {expandedDetail === idx ? '−' : '+'}
                                            </span>
                                        </button>
                                        <AnimatePresence>
                                            {expandedDetail === idx && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-0 text-sm text-neutral-300 font-light leading-relaxed border-t border-white/5 mt-1">
                                                        {detail.content}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400 italic leading-relaxed border-l-2 border-white/10 pl-3">
                                {gem.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* IS NEW KEY: KVÍZ RÉSZ */}
                {isNewKey ? (
                    <div className="w-full space-y-6">

                        {/* Kérdés Doboz */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full text-left"
                        >
                            <p className="text-white/80 leading-relaxed font-light text-sm">
                                <span className="text-blue-300 block text-xs font-bold uppercase mb-2">Feladat: {mode === 'child' ? '(Felfedező)' : '(Történész)'}</span>
                                {observationText}
                            </p>
                        </motion.div>

                        {/* Válaszlehetőségek */}
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {options.map((option, idx) => {
                                const isSelected = selectedOption === option;
                                const isTheCorrectAnswer = option === correctAnswer;

                                let buttonStyle = "border-white/20 bg-white/5 hover:bg-white/10 text-white/70";
                                if (isSelected) {
                                    if (isTheCorrectAnswer) {
                                        buttonStyle = "border-green-500/50 bg-green-900/20 text-green-100 ring-1 ring-green-500/50";
                                    } else {
                                        buttonStyle = "border-red-500/50 bg-red-900/20 text-red-100 ring-1 ring-red-500/50";
                                    }
                                }

                                return (
                                    <motion.button
                                        key={idx}
                                        whileTap={{ scale: 0.98 }}
                                        animate={isSelected && !isTheCorrectAnswer && shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                                        onClick={() => handleOptionClick(option)}
                                        className={`
                                            w-full p-4 rounded-lg border text-sm text-left transition-all relative overflow-hidden
                                            ${buttonStyle}
                                        `}
                                    >
                                        <span className="relative z-10 font-medium">
                                            {String.fromCharCode(65 + idx)}. {option}
                                        </span>
                                        {isSelected && isTheCorrectAnswer && (
                                            <motion.div
                                                layoutId="highlight"
                                                className="absolute inset-0 bg-green-500/10 z-0"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-white/60 text-sm italic font-serif bg-black/40 p-4 rounded-lg border border-white/5">
                        "Ezt a szálat már elvarrtad. Az idő itt nyugodt."
                    </div>
                )}

                {/* TOVÁBB GOMB (Csak ha helyes a válasz, vagy ha már megvan a kulcs) */}
                <AnimatePresence>
                    {(isCorrect || !isNewKey) && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={isNewKey ? onNext : onClose}
                            className={`
                                w-full py-4 mt-6
                                uppercase tracking-[0.2em] font-bold text-sm
                                rounded-lg transition-all shadow-lg
                                flex items-center justify-center gap-2
                                ${isNewKey
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 border border-blue-400/30"
                                    : "bg-white/10 text-white/60 hover:bg-white/20 border border-white/10"
                                }
                            `}
                        >
                            {isNewKey ? "■ Stabilizálás" : "Visszatérés"}
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Counter */}
                <div className="text-xs font-mono text-white/20 pt-4 pb-8">
                    Kulcsok: {foundCount} / {totalCount}
                </div>

            </div>
        </div >
    );
}
