import React, { useState } from 'react';
import IntroScreen from './IntroScreen';
import ModeSelection from './ModeSelection';
import PlayerNameInput from './PlayerNameInput';

export default function IntroFlow({ onComplete }) {
    const [step, setStep] = useState('intro'); // 'intro' | 'name' | 'mode'
    const [playerName, setPlayerName] = useState('');

    const handleIntroDone = () => {
        setStep('name');
    };

    const handleNameSubmit = (name) => {
        setPlayerName(name);
        setStep('mode');
    };

    const handleModeSelected = (mode) => {
        // Átadja a módot ÉS a nevet a szülőnek
        onComplete(mode, playerName);
    };

    if (step === 'intro') {
        return <IntroScreen onStart={handleIntroDone} />;
    }

    if (step === 'name') {
        return <PlayerNameInput onNameSubmit={handleNameSubmit} />;
    }

    if (step === 'mode') {
        return <ModeSelection onSelect={handleModeSelected} />;
    }

    return null;
}
