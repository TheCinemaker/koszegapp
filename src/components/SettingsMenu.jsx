import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DarkModeContext } from '../contexts/DarkModeContext';
import { IoSettingsOutline, IoMoon, IoSunny, IoGlobeOutline, IoPersonOutline, IoLogOutOutline, IoLogInOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

export default function SettingsMenu() {
    const { t, i18n } = useTranslation();
    const { dark, toggleDark } = useContext(DarkModeContext);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [ambientEnabled, setAmbientEnabled] = useState(localStorage.getItem('ambientMode') === 'true');
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
                <IoSettingsOutline className={`text-lg sm:text-xl transition-transform duration-500 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 z-50 w-64 p-4
                       bg-white/80 dark:bg-[#1a1c2e]/90
                       backdrop-blur-xl backdrop-saturate-150
                       rounded-2xl border border-white/20 shadow-2xl
                       flex flex-col gap-4"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700/50">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Beállítások
                            </span>
                        </div>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                {dark ? <IoMoon className="text-yellow-400" /> : <IoSunny className="text-orange-500" />}
                                <span className="font-medium text-sm">Sötét Mód</span>
                            </div>
                            <button
                                onClick={toggleDark}
                                className={`
                  relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                  ${dark ? 'bg-indigo-600' : 'bg-gray-300'}
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
                                <span className="font-medium text-sm">Élő Háttér</span>
                            </div>
                            <button
                                onClick={() => {
                                    const newValue = !(localStorage.getItem('ambientMode') === 'true');
                                    localStorage.setItem('ambientMode', newValue);
                                    window.dispatchEvent(new Event('ambient-mode-change'));
                                    // Force re-render of this component to update toggle state visual if needed, 
                                    // but we can just use a local state or read from LS since we are in an onClick.
                                    // Better: use a local state for the UI, synced with LS.
                                    setAmbientEnabled(newValue);
                                }}
                                className={`
                  relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                  ${ambientEnabled ? 'bg-indigo-600' : 'bg-gray-300'}
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
                                <IoGlobeOutline className="text-blue-500" />
                                <span className="font-medium text-sm">Nyelv / Language</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={`
                      flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                      ${i18n.language === lang.code
                                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
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

                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-2 px-1 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                                            {user.user_metadata?.nickname?.charAt(0).toUpperCase() || <IoPersonOutline />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                {user.user_metadata?.nickname || 'Felhasználó'}
                                            </span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Bejelentkezve</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { navigate('/pass'); setIsOpen(false); }}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <IoPersonOutline className="text-sm" /> Profilom
                                    </button>
                                    <button
                                        onClick={() => { logout(); setIsOpen(false); }}
                                        className="w-full py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <IoLogOutOutline className="text-sm" /> Kijelentkezés
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { navigate('/pass/register'); setIsOpen(false); }}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    <IoLogInOutline className="text-lg" /> Bejelentkezés
                                </button>
                            )}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
