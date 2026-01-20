import React, { useState } from 'react';
import IntroScreen from './IntroScreen';
import ModeSelection from './ModeSelection';
import PlayerNameInput from './PlayerNameInput';

export default function IntroFlow({ onComplete }) {
    const [step, setStep] = useState('intro'); // 'intro' | 'mode' | 'name'
    const [playerName, setPlayerName] = useState('');
    const [selectedMode, setSelectedMode] = useState(null);

    const handleIntroDone = () => {
        setStep('mode');
    };

    const handleModeSelected = (mode) => {
        setSelectedMode(mode);
        setStep('name');
    };

    const handleNameSubmit = (name) => {
        setPlayerName(name);
        // Átadja a módot ÉS a nevet a szülőnek
        onComplete(selectedMode, name);
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
