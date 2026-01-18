import { useState, useEffect } from 'react';
import { useGame } from './useGame';
import { useNavigate } from 'react-router-dom';

export function useGemFlow(gemId, mode = 'adult') {
    const navigate = useNavigate();
    const {
        gameState,
        startGame,
        addFoundGem,
        visitStation,
        checkCastleStatus,
        closeGate,
    } = useGame();

    const [screen, setScreen] = useState('loading'); // loading, intro, resolve, riddle, finale, complete

    // Handlers
    const onLoadingDone = () => {
        if (!gameState.gameStarted) {
            setScreen('intro');
        } else {
            visitStation(gemId);
            setScreen('resolve');
        }
    };

    const onStartGame = () => {
        startGame(gemId, mode);
        setScreen('resolve');
    };

    const onKeyStabilized = () => {
        addFoundGem(gemId);
        setTimeout(() => {
            setScreen('riddle');
        }, 100);
    };

    const onRiddleConfirmed = () => {
        navigate('/game/treasure-chest');
    };

    const onClose = () => {
        navigate('/game/treasure-chest');
    };

    const onBackToCity = () => {
        navigate('/game/treasure-chest');
    };

    const onFinaleSequence = () => {
        // Transition sequence for Finale
        setTimeout(() => {
            closeGate();
            setScreen('finale');
            setTimeout(() => {
                setScreen('complete');
            }, 5000);
        }, 2000);
    };

    const onExploreEnd = () => {
        navigate('/game/treasure-chest');
    };

    return {
        screen,
        gameState,

        // Actions
        onLoadingDone,
        onStartGame,
        onKeyStabilized,
        onRiddleConfirmed,
        onClose,
        onBackToCity,
        onFinaleSequence,
        onExploreEnd,

        // Helpers exposed for Castle Logic check within component if needed, 
        // though ideally loop logic is here.
        checkCastleStatus
    };
}
