import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';

export default function ResidentCheckModal({ onClose }) {
    const navigate = useNavigate();

    const handleYes = () => {
        navigate('/koszegieknek');
        onClose();
    };

    const handleNo = () => {
        onClose();
        toast.custom((t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white dark:bg-[#1e1e1e] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <IoAlertCircleOutline className="h-10 w-10 text-blue-500" />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Semmi gond!
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Az oldal látogatása nem tilos, csak turistaként ezek az információk (pl. hulladékszállítás) valószínűleg nem relevánsak számodra. Jó nézelődést! 😊
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Rendben
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="
            relative w-full max-w-sm
            bg-white/80 dark:bg-[#1a1c2e]/80
            backdrop-blur-xl backdrop-saturate-150
            rounded-3xl
            p-6
            border border-white/20 dark:border-white/10
            shadow-2xl
            text-center
          "
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <IoCloseCircleOutline className="text-2xl" />
                    </button>

                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-3xl">🏠</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Kőszegi vagy?
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm leading-relaxed">
                        Ez a felület kifejezetten a helyi lakosoknak szól (pl. hulladékszállítási naptár, közérdekű infók).
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleYes}
                            className="
                w-full py-3.5 px-6 rounded-xl
                bg-gradient-to-r from-blue-600 to-indigo-600
                text-white font-bold text-sm tracking-wide uppercase
                shadow-lg shadow-blue-500/30
                hover:shadow-blue-500/50 hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-300
                flex items-center justify-center gap-2
              "
                        >
                            <IoCheckmarkCircleOutline className="text-xl" />
                            Igen, itt élek
                        </button>

                        <button
                            onClick={handleNo}
                            className="
                w-full py-3.5 px-6 rounded-xl
                bg-gray-100 dark:bg-white/5
                text-gray-700 dark:text-gray-300 font-bold text-sm tracking-wide uppercase
                hover:bg-gray-200 dark:hover:bg-white/10
                active:scale-[0.98]
                transition-all duration-300
              "
                        >
                            Nem, csak nézelődöm
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
