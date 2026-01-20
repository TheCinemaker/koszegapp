import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function PlayerNameInput({ onNameSubmit }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onNameSubmit(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0b0b0c] text-white flex flex-col items-center justify-center p-6 z-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-sm text-center"
            >
                <div className="mb-8">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                        Azonosítás
                    </p>
                    <h2 className="text-2xl font-serif text-white/90">
                        Ki lép át az Időkapun?
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Írd be a neved..."
                            className="
                                w-full bg-transparent border-b border-white/20 
                                py-3 text-center text-xl font-serif text-amber-500 placeholder-white/20
                                focus:outline-none focus:border-amber-500/50 transition-colors
                            "
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className={`
                            px-8 py-3 rounded-full border border-white/10
                            text-xs uppercase tracking-[0.2em] transition-all
                            ${name.trim()
                                ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                                : 'opacity-30 cursor-not-allowed text-white/50'}
                        `}
                    >
                        Tovább
                    </button>
                </form>

                <p className="mt-12 text-white/20 text-[10px] leading-relaxed max-w-xs mx-auto">
                    A neved csak a helyi eszközön tárolódik a Vitézi Oklevél kiállításához.
                </p>
            </motion.div>
        </div>
    );
}
