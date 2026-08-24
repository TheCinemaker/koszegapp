import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { DarkModeContext } from '../contexts/DarkModeContext';
import { IoSettingsOutline, IoMoon, IoSunny, IoGlobeOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

export default function SettingsMenu() {
    const { t, i18n } = useTranslation();
    const { dark, toggleDark } = useContext(DarkModeContext);
    const [isOpen, setIsOpen] = useState(false);
    // Default ON — only off if the user explicitly disabled it.
    const [ambientEnabled, setAmbientEnabled] = useState(localStorage.getItem('ambientMode') !== 'false');
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full
                  bg-white/20 dark:bg-black/20
                  backdrop-blur-md
                  border border-white/20
                  text-gray-700 dark:text-gray-200
                  hover:bg-white/40 dark:hover:bg-black/40
                  transition-all duration-300 hover:scale-105 active:scale-95
                  ${isOpen ? 'bg-white/40 dark:bg-black/40 ring-2 ring-indigo-500/50' : ''}
                `}
                aria-label="Beállítások"
            >
                <IoSettingsOutline className={`text-lg sm:text-xl transition-transform duration-500 ${isOpen ? 'rotate-90 text-indigo-500 dark:text-indigo-400' : ''}`} />
            </button>

            {/* Dropdown Menu - Solid high-contrast popover with rounded-3xl (Dialog Radius) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 z-50 w-72 p-5
                       bg-white dark:bg-[#18181b]
                       rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]
                       flex flex-col gap-4"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Beállítások
                            </span>
                        </div>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                {dark ? <IoMoon className="text-amber-400" /> : <IoSunny className="text-amber-500" />}
                                <span className="font-semibold text-sm">Sötét Mód</span>
                            </div>
                            <button
                                onClick={toggleDark}
                                className={`
                                  relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                                  ${dark ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-zinc-700'}
                                `}
                            >
                                <motion.div
                                    layout
                                    className={`
                                      absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm
                                      ${dark ? 'translate-x-6' : 'translate-x-0'}
                                    `}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>

                        {/* Ambient Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                <span className="text-lg">✨</span>
                                <span className="font-semibold text-sm">Élő Háttér</span>
                            </div>
                            <button
                                onClick={() => {
                                    const newValue = !ambientEnabled;
                                    localStorage.setItem('ambientMode', newValue);
                                    window.dispatchEvent(new Event('ambient-mode-change'));
                                    setAmbientEnabled(newValue);
                                }}
                                className={`
                                  relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                                  ${ambientEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-zinc-700'}
                                `}
                            >
                                <motion.div
                                    layout
                                    className={`
                                      absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm
                                      ${ambientEnabled ? 'translate-x-6' : 'translate-x-0'}
                                    `}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>


                        {/* Language Selector */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 mb-1">
                                <IoGlobeOutline className="text-indigo-500 dark:text-indigo-400" />
                                <span className="font-semibold text-sm">Nyelv / Language</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={`
                                          flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all
                                          ${i18n.language === lang.code
                                                ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold'
                                                : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'}
                                        `}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="text-lg">{lang.flag}</span>
                                            {lang.label}
                                        </span>
                                        {i18n.language === lang.code && (
                                            <motion.div layoutId="activeLang" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Profile & Auth actions */}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
