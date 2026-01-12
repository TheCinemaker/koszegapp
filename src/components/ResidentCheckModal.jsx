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
                borderRadius: '20px',
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
                        bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(30,30,30,0.85)]
                        backdrop-blur-3xl saturate-150
                        rounded-[2rem]
                        p-6 pt-8
                        shadow-2xl ring-1 ring-black/5
                        text-center
                        overflow-hidden
                    "
                >
                    {/* Decorative blurred blob behind */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                    >
                        <IoCloseCircleOutline className="text-xl" />
                    </button>

                    {/* Icon - Squircle Shape */}
                    <div className="relative mx-auto mb-6 w-20 h-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[1.2rem] shadow-lg shadow-blue-500/30"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <IoHome className="text-3xl" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
                        Kőszegi vagy?
                    </h2>

                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-[15px] leading-relaxed font-medium">
                        Ez a felület kifejezetten a helyi lakosoknak készült (hulladéknaptár, hírek).
                    </p>

                    <div className="flex flex-col gap-3">
                        {/* Primary Action - Apple Blue */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleYes}
                            className="
                                w-full h-12 rounded-xl
                                bg-[#007AFF] hover:bg-[#006ee6]
                                text-white font-semibold text-[17px]
                                shadow-lg shadow-blue-500/25
                                transition-colors
                            "
                        >
                            Igen, itt élek
                        </motion.button>

                        {/* Secondary Action - Ghost/Gray */}
                        <motion.button
                            whileHover={{ backgroundColor: 'rgba(128,128,128,0.1)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNo}
                            className="
                                w-full h-12 rounded-xl
                                text-[#007AFF] dark:text-[#3B9DFF]
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
