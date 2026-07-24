import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparkles } from 'react-icons/io5';
import { triggerHaptic } from '../utils/haptics';

export default function AIFab() {
    const navigate = useNavigate();
    const location = useLocation();

    // Do not show the FAB on the chat page itself
    const isChatPage = location.pathname === '/koszegai';

    if (isChatPage) return null;

    return (
        <AnimatePresence>
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    triggerHaptic();
                    navigate('/koszegai');
                }}
                className="
                    fixed bottom-[147px] right-[25px] z-[9998] w-12 h-12 rounded-full
                    flex items-center justify-center
                    bg-brand border border-gold/40
                    shadow-card
                "
                aria-label="KőszegAI (Dimitryj) megnyitása"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-gold-light drop-shadow-sm">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a3 3 0 0 1 3 3v2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H2a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2v-2a3 3 0 0 1 3-3h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2Zm0 7H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-5Zm-2.5 3c.83 0 1.5.67 1.5 1.5S10.33 15 9.5 15 8 14.33 8 13.5 8.67 12 9.5 12Zm5 0c.83 0 1.5.67 1.5 1.5S15.33 15 14.5 15 13 14.33 13 13.5 13.67 12 14.5 12Z" />
                </svg>
            </motion.button>
        </AnimatePresence>
    );
}
