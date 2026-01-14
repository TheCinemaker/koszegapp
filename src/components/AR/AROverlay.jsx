import React from 'react';
import { Scan, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const AROverlay = ({ scanning, targetFound, onBack }) => {
    return (
        <>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-start pointer-events-none">
                <Link
                    to="/"
                    className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-xs font-bold text-yellow-400 tracking-wider flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                        KRONOSZKÓP ÉLŐ
                    </span>
                </div>
            </div>

            {/* Scanning UI (Only when target not found) */}
            {!targetFound && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40">
                    {/* Scanner Frame */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-64 h-64 border border-white/30 rounded-3xl overflow-hidden"
                    >
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>

                        {/* Scanning Beam */}
                        <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute left-0 right-0 h-0.5 bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]"
                        />

                        <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                    </motion.div>

                    <p className="mt-8 text-white font-medium text-center bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                        Irányítsd a kamerát a <span className="text-yellow-400 font-bold">Jurisics Szoborra</span>!
                    </p>
                </div>
            )}
        </>
    );
};

export default AROverlay;
