import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchHiddenGems } from '../api';
import { useGame } from '../hooks/useGame';
import { useGemFlow } from '../hooks/useGemFlow';
import { RIDDLES } from '../data/riddles';

import {
  LoadingScreen,
  IntroScreen,
  KeyScene,
  RiddleScreen,
  InfoScene,
  CastleCheckScreen,
  FinalScreen,
  GameCompleteScreen
} from '../screens/game';

// --- MAIN ORCHESTRATOR COMPONENT ---

export default function StationResolver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { gameMode, REQUIRED_KEYS } = useGame();

  // Custom Flow Hook manages state machine
  const flow = useGemFlow(id, gameMode || 'adult');

  const [gem, setGem] = useState(null);

  // Data Fetching Logic (kept here for now, could be moved to hook too)
  useEffect(() => {
    let isMounted = true;
    fetchHiddenGems().then(data => {
      if (!isMounted) return;
      const found = data.find(g => g.id === id);
      if (found) {
        setGem(found);
      } else {
        navigate('/game/treasure-chest');
      }
    });
    return () => { isMounted = false; };
  }, [id, navigate]);


  // --- ROUTING LOGIC ---

  if (!gem) return <div className="min-h-screen bg-black" />; // Fallback / Loading Data

  // 1. Loading
  if (flow.screen === 'loading') {
    return <LoadingScreen onComplete={flow.onLoadingDone} />;
  }

  // 2. Intro (First time visit)
  if (flow.screen === 'intro') {
    return <IntroScreen onStart={flow.onStartGame} />;
  }

  // 3. Finale (The End)
  if (flow.screen === 'finale') {
    return <FinalScreen />;
  }

  // 4. Complete (Post-Finale)
  if (flow.screen === 'complete') {
    return <GameCompleteScreen onExplore={flow.onExploreEnd} />;
  }

  // 5. Riddle (After finding a key)
  if (flow.screen === 'riddle') {
    const assignedId = flow.gameState?.assignedRiddles?.[gem.id] || null; // Use safe access
    // If logic in useGame/addFoundGem assigns immediately, it should be there.
    // If not, we might need a direct helper from useGame hooks.
    // For now, let's use the helper from useGame linked to flow:
    const assignedIdFromHook = flow.gameState.assignedRiddles[gem.id];

    const riddleObj = assignedIdFromHook ? RIDDLES.find(r => r.id === assignedIdFromHook) : null;
    const text = riddleObj ? riddleObj.text[gameMode || 'adult'] : "Még egy titok maradt...";
    return <RiddleScreen riddleText={text} onConfirm={flow.onRiddleConfirmed} />;
  }

  // 6. MAIN RESOLVER (The Station Logic)
  if (flow.screen === 'resolve') {

    // CASTLE LOGIC
    if (gem.id === 'jurisics-var') {
      const status = flow.checkCastleStatus(); // early, ready, closed

      if (status === 'closed') {
        return <GameCompleteScreen onExplore={flow.onExploreEnd} />;
      }

      if (status === 'ready') {
        // Auto trigger effect handled in Effect below usually, or we can just render a placeholder
        // The hook handles the timeout transition to 'finale'.
        return <div className="bg-black h-screen w-full"></div>;
      }

      return (
        <CastleCheckScreen
          status="early"
          keysFound={flow.gameState.foundGems.length}
          requiredKeys={REQUIRED_KEYS}
          onBack={flow.onBackToCity}
        />
      );
    }

    // EXTRA LOCATION
    if (gem.type === 'extra') {
      return <InfoScene gem={gem} onClose={flow.onClose} />;
    }

    // KEY LOCATION
    const isFound = flow.gameState.foundGems.includes(gem.id);
    return (
      <KeyScene
        gem={gem}
        isNewKey={!isFound}
        mode={gameMode || 'adult'}
        onNext={flow.onKeyStabilized}
        onClose={flow.onClose}
        foundCount={flow.gameState.foundGems.length}
        totalCount={REQUIRED_KEYS}
      />
    );
  }

  // Effect specifically for triggering the Castle Finale Sequence if 'ready'
  useEffect(() => {
    if (gem?.id === 'jurisics-var' && flow.screen === 'resolve') {
      const status = flow.checkCastleStatus();
      if (status === 'ready') {
        flow.onFinaleSequence();
      }
    }
  }, [gem, flow.screen, flow]); // Added flow dependency

  return <div className="min-h-screen bg-black"></div>;
}
