import { useState, useEffect } from 'react';
import { useGame } from './useGame';
import { useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';

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
    const [gem, setGem] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Gem Data
    useEffect(() => {
        let isMounted = true;
        fetchHiddenGems().then(gems => {
            if (isMounted) {
                const found = gems.find(g => String(g.id) === String(gemId));
                setGem(found);

                // HA MÁR MEGVAN, AKKOR NE LEGYEN Loading (Időkerék), HANEM EGYBŐL KEY
                if (gameState.foundGems.includes(gemId)) {
                    setScreen('key');
                }

                setLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [gemId]);

    // Handlers
    const onLoadingDone = () => {
        if (!gameState.gameStarted) {
            // Ez elvileg nem futhat le a Gatekeeper miatt, de biztos ami biztos
        } else {
            visitStation(gemId);
            setScreen('key'); // 'resolve' helyett 'key'
        }
    };

    // ... (rest of the handlers) ...

    const onStartGame = () => {
        startGame(gemId, mode);
        // Intro után a flow folytatódik
        visitStation(gemId);
        setScreen('key'); // 'resolve' helyett 'key'
    };

    const onKeyStabilized = () => {
        addFoundGem(gemId);
        // Várunk kicsit a vizuális visszajelzésre
        setTimeout(() => {
            // Ha akarunk Riddle képernyőt, akkor ide:
            // setScreen('riddle');
            // De most egyelőre visszamegyünk a ládához vagy citybe
            navigate('/game/treasure-chest');
        }, 1500);
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

    // Calculated Props
    const isNewKey = !gameState.foundGems.includes(gemId); // Ha nincs benne, akkor ÚJ -> Kvíz kell
    const foundCount = gameState.foundGems.length;
    const totalCount = gameState.REQUIRED_KEYS || 14;

    return {
        screen,
        gameState,
        gem,      // <--- VISSZAADJUK AZ ADATOT
        loading,  // <--- ÉS A TÖLTÉS ÁLLAPOTOT
        isNewKey,     // <--- ÚJ
        foundCount,   // <--- ÚJ
        totalCount,   // <--- ÚJ

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
