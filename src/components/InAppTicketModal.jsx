import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoOpenOutline, IoArrowBack, IoTicketOutline } from 'react-icons/io5';
import LoadingSpinner from './LoadingSpinner';

/**
 * In-App Webview Modal for Ticket Purchasing (e.g. Bass Piknik 2026).
 * Allows users to complete ticket purchase inside the app without leaving.
 */
export default function InAppTicketModal({ isOpen, onClose, url, title = 'Jegyvásárlás' }) {
    const [loading, setLoading] = useState(true);

    if (!isOpen || !url) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="relative z-10 w-full max-w-2xl h-[92vh] sm:h-[88vh] bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="shrink-0 px-4 py-3 bg-brand/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                onClick={onClose}
                                className="p-2 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Bezárás"
                            >
                                <IoArrowBack size={20} />
                            </button>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                    <IoTicketOutline className="text-gold-light text-base flex-shrink-0" />
                                    {title}
                                </h3>
                                <p className="text-[11px] text-white/60 truncate">basspiknik.com</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Megnyitás külső böngészőben"
                            >
                                <IoOpenOutline size={16} />
                                <span className="hidden sm:inline">Megnyitás böngészőben</span>
                            </a>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Bezárás"
                            >
                                <IoCloseOutline size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Iframe & Loading state */}
                    <div className="relative flex-1 bg-white w-full h-full overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white">
                                <LoadingSpinner />
                                <p className="text-xs text-slate-400 mt-3 font-medium">Jegyvásárlási felület betöltése...</p>
                            </div>
                        )}
                        <iframe
                            src={url}
                            title={title}
                            onLoad={() => setLoading(false)}
                            className="w-full h-full border-none"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation"
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
