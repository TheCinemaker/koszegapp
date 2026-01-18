import React from 'react';
import { FullScreenContainer } from '../../components/ui/layout';

export default function FinalScreen() {
    return (
        <FullScreenContainer>
            <div className="flex flex-col items-center justify-center h-screen animate-pulse bg-black z-20">
                <h1 className="text-2xl font-serif tracking-widest opacity-80 text-white/90">Kőszeg megmaradt.</h1>
            </div>
        </FullScreenContainer>
    );
}
