import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { IoAlertCircleOutline, IoCloseCircleOutline, IoHome } from 'react-icons/io5';

export default function ResidentCheckModal({ onClose }) {
    const navigate = useNavigate();

    const handleYes = () => {
        navigate('/koszegieknek');
        onClose();
    };

    const handleNo = () => {
        onClose();
        // Subtle toast for non-residents
        toast('Jó nézelődést! 😊', {
            icon: '👋',
            style: {
                borderRadius: '16px',
                background: '#333',
                color: '#fff',
            },
        });
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 10 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        transition: { type: "spring", damping: 25, stiffness: 300 }
                    }}
                    exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.15 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="
                        relative w-full max-w-[340px]
                        bg-white/90 dark:bg-zinc-900/90
                        backdrop-blur-3xl saturate-150
                        rounded-3xl
                        p-6 pt-8
                        shadow-2xl ring-1 ring-black/5
                        text-center
                        overflow-hidden
                    "
                >
                    {/* Decorative blurred blob behind */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                        <IoCloseCircleOutline className="text-xl" />
                    </button>

                    {/* Icon - Solid Indigo-500 Squircle */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <IoHome className="text-3xl" />
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
                        Kőszegi vagy?
                    </h2>

                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-[15px] leading-relaxed font-medium">
                        Ez a felület kifejezetten a helyi lakosoknak készült (hulladéknaptár, helyi szolgáltatások).
                    </p>

                    <div className="flex flex-col gap-3">
                        {/* Primary Action - Solid Indigo-500 (Hover: opacity-90) */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleYes}
                            className="
                                w-full h-12 rounded-xl
                                bg-indigo-500 hover:opacity-90
                                text-white font-semibold text-[17px]
                                shadow-lg shadow-indigo-500/25
                                transition-all duration-200
                            "
                        >
                            Igen, itt élek
                        </motion.button>

                        {/* Secondary Action - Solid Indigo-500 Text */}
                        <motion.button
                            whileHover={{ backgroundColor: 'rgba(99,102,241,0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNo}
                            className="
                                w-full h-12 rounded-xl
                                text-indigo-500 dark:text-indigo-400
                                font-medium text-[17px]
                                transition-colors
                            "
                        >
                            Nem, csak nézelődöm
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
