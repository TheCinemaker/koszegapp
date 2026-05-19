import React, { useState } from 'react';
import { FaBackspace, FaTimes, FaGlobe, FaSmile, FaKeyboard } from 'react-icons/fa';

/**
 * KioskKeyboard - Reptéri tisztaságú, prémium virtuális billentyűzet érintőképernyős terminálhoz.
 * 
 * Használata:
 * <KioskKeyboard 
 *   value={text} 
 *   onChange={(val) => setText(val)} 
 *   onClose={() => setShowKeyboard(false)} 
 *   onEnter={() => handleSubmit()} 
 * />
 */
export default function KioskKeyboard({ value, onChange, onClose, onEnter }) {
    const [layout, setLayout] = useState('lowercase'); // 'lowercase', 'uppercase', 'symbols', 'emojis'

    // Billentyűzet sorok kisbetűvel
    const lowercaseKeys = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
        ['á', 'é', 'í', 'ó', 'ö', 'ő', 'ú', 'ü', 'ű'] // Magyar ékezetes sor
    ];

    // Billentyűzet sorok nagybetűvel
    const uppercaseKeys = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
        ['Á', 'É', 'Í', 'Ó', 'Ö', 'Ő', 'Ú', 'Ü', 'Ű'] // Magyar ékezetes sor
    ];

    // Számok és szimbólumok
    const symbolKeys = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
        ['.', ',', '?', '!', "'", '_', '+', '=', '*', '#'],
        ['%', '<', '>', '[', ']', '{', '}', '\\', '|']
    ];

    // Kvázi kurátorált prémium emojik utazáshoz és szelfi üzenetekhez
    const emojis = [
        '❤️', '😊', '😍', '👍', '🔥', '✨', '🎉', '🌟', '☀️', '🏰', 
        '🎭', '📸', '🍷', '🍺', '☕', '🍦', '🍕', '🚗', '✈️', '🌍', 
        '🇭🇺', '🇮🇹', '🇩🇪', '🇦🇹', '🇸🇰', '🇷🇴', '🇺🇦', '🇬🇧', '🇺🇸', '🇪🇺'
    ];

    // Billentyű leütés kezelése
    const handleKeyPress = (key) => {
        if (onChange) {
            onChange(value + key);
        }
    };

    // Törlés (Backspace) kezelése
    const handleBackspace = () => {
        if (onChange && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    // Összes törlése (Clear)
    const handleClear = () => {
        if (onChange) {
            onChange('');
        }
    };

    const currentRows = layout === 'lowercase' 
        ? lowercaseKeys 
        : layout === 'uppercase' 
        ? uppercaseKeys 
        : symbolKeys;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border-t border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Input preview bar */}
            <div className="max-w-5xl mx-auto mb-4 px-2">
              <div className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white text-base font-semibold min-h-[48px] flex items-center">
                {value
                  ? <span>{value}<span className="animate-pulse ml-0.5 opacity-70">|</span></span>
                  : <span className="text-white/30 font-normal text-sm">…</span>
                }
              </div>
            </div>

            {/* Top Toolbar */}
            <div className="max-w-5xl mx-auto flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                    <FaKeyboard className="text-indigo-400" /> Érintő Billentyűzet
                </span>
                
                <div className="flex gap-4">
                    {value.length > 0 && (
                        <button 
                            onClick={handleClear}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-red-400 border border-red-500/20 active:scale-95 transition-all"
                        >
                            Összes törlése
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-95 transition-all"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>
            </div>

            {/* Billentyűk konténere */}
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
                
                {layout !== 'emojis' ? (
                    // NORMÁL ÉS SZIMBÓLUM LAYOUT
                    currentRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 w-full">
                            {/* Harmadik sornál beillesztjük a Shift gombot bal oldalt */}
                            {rowIndex === 2 && layout !== 'symbols' && (
                                <button
                                    onClick={() => setLayout(layout === 'lowercase' ? 'uppercase' : 'lowercase')}
                                    className={`flex-1 max-w-[90px] py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95 border ${
                                        layout === 'uppercase'
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                    }`}
                                >
                                    ↑
                                </button>
                            )}

                            {/* Normál gombok kirajzolása */}
                            {row.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleKeyPress(key)}
                                    className="flex-1 py-4 bg-white/10 hover:bg-white/15 active:bg-indigo-600/30 text-white border border-white/5 font-medium rounded-xl text-lg transition-all active:scale-90 flex items-center justify-center select-none"
                                >
                                    {key}
                                </button>
                            ))}

                            {/* Harmadik sornál beillesztjük a Backspace gombot jobb oldalt */}
                            {rowIndex === 2 && (
                                <button
                                    onClick={handleBackspace}
                                    className="flex-1 max-w-[90px] py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 active:scale-95 rounded-xl flex items-center justify-center transition-all"
                                >
                                    <FaBackspace size={18} />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    // EMOJI LAYOUT (Gyönyörű nagy érintős rács)
                    <div className="grid grid-cols-10 gap-3 py-2 justify-center max-w-3xl mx-auto">
                        {emojis.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleKeyPress(emoji)}
                                className="aspect-square bg-white/10 hover:bg-white/15 active:scale-90 text-3xl rounded-2xl flex items-center justify-center transition-all shadow-md select-none"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {/* ALSÓ FUNKCIÓS SOR */}
                <div className="flex gap-3 justify-center w-full mt-2">
                    {/* Váltó gomb a szimbólumokhoz */}
                    <button
                        onClick={() => setLayout(layout === 'symbols' ? 'lowercase' : 'symbols')}
                        className={`flex-1 max-w-[120px] py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95 border ${
                            layout === 'symbols'
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                        {layout === 'symbols' ? 'ABC' : '123=?'}
                    </button>

                    {/* Váltó gomb az emojikhoz */}
                    <button
                        onClick={() => setLayout(layout === 'emojis' ? 'lowercase' : 'emojis')}
                        className={`flex-1 max-w-[120px] py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95 border flex items-center justify-center gap-2 ${
                            layout === 'emojis'
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                        {layout === 'emojis' ? <FaKeyboard size={16} /> : <FaSmile size={18} className="text-amber-400" />}
                    </button>

                    {/* Szóköz (Space) */}
                    <button
                        onClick={() => handleKeyPress(' ')}
                        className="flex-[4] py-4 bg-white/10 hover:bg-white/15 border border-white/5 active:bg-indigo-600/20 text-slate-300 rounded-xl font-semibold tracking-widest text-xs uppercase transition-all active:scale-95 flex items-center justify-center select-none"
                    >
                        Szóköz
                    </button>

                    {/* Kész / Enter gomb */}
                    <button
                        onClick={onEnter || onClose}
                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-500 transition-all flex items-center justify-center"
                    >
                        Kész
                    </button>
                </div>
            </div>
        </div>
    );
}
