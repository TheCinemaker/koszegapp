import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ onComplete }) {

    useEffect(() => {
        // Rövid "megérkezés" időzítés (kb. 2.5s)
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 2200);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <p className="text-sm font-serif italic text-white/50 mb-4">
                        Az idő itt megmozdult...
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    className="w-16 h-[1px] bg-white mx-auto"
                />
            </div>
        </div>
    );
}
