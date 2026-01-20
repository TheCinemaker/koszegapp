import React from 'react';
import { motion } from 'framer-motion';
import { FullScreenContainer } from '../../components/ui/layout';
import { useGame } from '../../hooks/useGame';

export default function GameCompleteScreen({ onExplore }) {
    const { gameState } = useGame();
    const playerName = gameState.playerName || "Ismeretlen Védő";

    const today = new Date().toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <FullScreenContainer>
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-[#0b0b0c] z-20 overflow-y-auto relative">

                {/* Background ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-black to-black pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative max-w-md w-full bg-[#1a1a1c] border border-amber-800/50 p-8 rounded-lg shadow-2xl"
                    style={{
                        boxShadow: "0 0 40px rgba(180, 83, 9, 0.1), inset 0 0 20px rgba(0,0,0,0.5)"
                    }}
                >
                    {/* Corner Ornaments */}
                    <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-amber-600/30 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-amber-600/30 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-amber-600/30 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-amber-600/30 rounded-br-lg" />

                    {/* Seal */}
                    <motion.div
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 bg-red-800 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg border-4 border-red-900/50 relative"
                    >
                        <div className="absolute inset-0 border-2 border-red-400/20 rounded-full border-dashed animate-spin-slow" />
                        <span className="text-amber-100 font-serif font-bold text-2xl">K</span>
                    </motion.div>

                    {/* Content */}
                    <h1 className="text-sm uppercase tracking-[0.3em] text-amber-500 mb-2">Hivatalos Elismerés</h1>
                    <h2 className="text-3xl font-serif text-white mb-6">Vitézi Oklevél</h2>

                    <div className="space-y-4 font-serif text-white/80 italic text-lg leading-relaxed mb-8">
                        <p>
                            Ezennel igazoljuk, hogy a mai napon,
                            <br />
                            <span className="text-amber-400 not-italic font-bold">{today}</span>
                            <br />
                            <span className="text-2xl text-amber-500 font-bold block my-2">{playerName}</span>
                            hősiesen helytállt.
                        </p>
                        <p>
                            Felismerte a múlt üzeneteit, megtalálta a rejtett kulcsokat, és segített megőrizni Kőszeg városának emlékezetét.
                        </p>
                    </div>

                    <div className="border-t border-amber-800/30 pt-6 mt-6">
                        <p className="text-xs uppercase tracking-widest text-amber-700 mb-1">Rangfokozat</p>
                        <p className="text-xl text-amber-500 font-bold">Kőszeg Védője</p>
                    </div>

                </motion.div>

                <p className="mt-8 text-white/30 text-xs uppercase tracking-widest">
                    Készíts képernyőfotót az okleveledről!
                </p>

                <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
                    <button
                        onClick={() => {
                            const shareData = {
                                title: 'Kőszeg Védője - Vitézi Oklevél',
                                text: `${playerName} hősiesen helytállt és megvédte Kőszeget az 1532-es ostrom emlékjátékában! 🛡️🏰`,
                                url: window.location.origin
                            };

                            if (navigator.share) {
                                navigator.share(shareData).catch(console.error);
                            } else {
                                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                                alert('A szöveg a vágólapra másolva!');
                            }
                        }}
                        className="
                            w-full py-3 
                            bg-amber-600 hover:bg-amber-500 
                            text-white font-bold uppercase tracking-widest text-xs
                            rounded shadow-lg transition-colors
                            flex items-center justify-center gap-2
                        "
                    >
                        <span>📤</span> Oklevél Megosztása
                    </button>

                    <button
                        onClick={onExplore}
                        className="text-neutral-500 hover:text-white transition-colors text-sm uppercase tracking-widest border-b border-transparent hover:border-white/50 pb-1"
                    >
                        Vissza a főmenübe
                    </button>
                </div>
            </div>
        </FullScreenContainer>
    );
}
