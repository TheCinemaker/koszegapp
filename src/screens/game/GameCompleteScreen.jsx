import React from 'react';
import { FullScreenContainer } from '../../components/ui/layout';

export default function GameCompleteScreen({ onExplore }) {
    return (
        <FullScreenContainer>
            <div className="flex flex-col items-center justify-center h-screen px-8 text-center bg-black z-20">
                <h1 className="text-3xl font-serif font-light mb-8 text-white/90">Az időkapu bezárult.</h1>
                <p className="text-base opacity-60 italic max-w-md mx-auto mb-16 leading-relaxed font-serif">
                    "Amit láttál, nem legenda.<br /><br />Hanem kitartás."
                </p>
                <button
                    onClick={onExplore}
                    className="text-xs uppercase tracking-[0.3em] opacity-30 hover:opacity-80 transition-opacity border-b border-transparent hover:border-white/20 pb-2"
                >
                    Vége
                </button>
            </div>
        </FullScreenContainer>
    );
}
