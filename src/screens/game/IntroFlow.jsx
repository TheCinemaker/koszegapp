import React, { useState } from 'react';
import IntroScreen from './IntroScreen';
import ModeSelection from './ModeSelection';

export default function IntroFlow({ onComplete }) {
    const [step, setStep] = useState('intro'); // 'intro' | 'mode'

    const handleIntroDone = () => {
        setStep('mode');
    };

    const handleModeSelected = (mode) => {
        // Átadja a kiválasztott módot a szülőnek (aki majd elmenti a játékállást)
        onComplete(mode);
    };

    if (step === 'intro') {
        return <IntroScreen onStart={handleIntroDone} />;
    }

    if (step === 'mode') {
        return <ModeSelection onSelect={handleModeSelected} />;
    }

    return null;
}
