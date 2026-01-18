import React from 'react';
import { FullScreenContainer, ContentLayer, GestureButton } from '../../components/ui/layout';

export default function CastleCheckScreen({ status, keysFound, requiredKeys, onBack }) {
    return (
        <FullScreenContainer bgImage="/images/game/jurisics_var.jpg">
            <ContentLayer>
                <h2 className="text-2xl font-serif font-light mb-4 text-neutral-100/90">A kapu még nyitva áll.</h2>

                <div className="mb-8">
                    <div className="flex justify-between text-[10px] font-mono text-neutral-100/40 mb-2 uppercase tracking-widest">
                        <span>Integritás</span>
                        <span>{Math.round((keysFound / requiredKeys) * 100)}%</span>
                    </div>
                    <div className="h-[1px] w-full bg-neutral-100/20">
                        <div className="h-full bg-neutral-100 opacity-80" style={{ width: `${(keysFound / requiredKeys) * 100}%` }}></div>
                    </div>
                </div>

                <p className="text-sm text-neutral-100/60 italic mb-4 leading-relaxed font-serif">
                    "A város több pontján az idő még inog."
                </p>

                <GestureButton onClick={onBack}>Visszatérek</GestureButton>
            </ContentLayer>
        </FullScreenContainer>
    );
}
