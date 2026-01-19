import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGemFlow } from '../hooks/useGemFlow';
import { useGame } from '../hooks/useGame';

import IntroFlow from '../screens/game/IntroFlow';
import LoadingScreen from '../screens/game/LoadingScreen';
import KeyScene from '../screens/game/KeyScene';
import InfoScene from '../screens/game/InfoScene';

export default function StationResolver() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Globális Game State elérése (a Gatekeeperhez)
  const { gameState, startGame } = useGame();

  // 2. A helyszín-specifikus flow (Loading -> Scene)
  const flow = useGemFlow(id);

  // DEBUG: Reset Gomb
  const handleReset = () => {
    if (window.confirm("BIZTOSAN TÖRLÖD A JÁTÉKÁLLÁST? (Intro + Módválasztás újra jön)")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- GATEKEEPER LOGIKA ---
  // Ha a felhasználó még nem kezdte el a játékot (nincs 'started' flag),
  // akkor először az INTRO + MODE SELECTION jön.
  if (!gameState.gameStarted) {
    return (
      <>
        {/* DEBUG RESET BUTTON */}
        <button
          onClick={handleReset}
          className="fixed top-2 left-2 z-[9999] bg-red-900/50 text-red-200 text-[10px] px-2 py-1 rounded border border-red-500/30 hover:bg-red-800 backdrop-blur-sm transition-colors"
        >
          RESET GAME
        </button>
        <IntroFlow onComplete={(mode) => startGame(id, mode)} />
      </>
    );
  }

  // --- NORMÁL FLOW ---
  // Ha már játszik, akkor jöhet a helyszín betöltése

  if (flow.loading) return <div className="min-h-screen bg-black" />;

  if (!flow.gem) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>Helyszín nem található.</p>
    </div>
  );

  return (
    <>
      {/* DEBUG RESET BUTTON */}
      <button
        onClick={handleReset}
        className="fixed top-2 left-2 z-[9999] bg-red-900/50 text-red-200 text-[10px] px-2 py-1 rounded border border-red-500/30 hover:bg-red-800 backdrop-blur-sm transition-colors"
      >
        RESET GAME
      </button>

      {(() => {
        switch (flow.screen) {
          case 'loading':
            // Ha már játszik, akkor jön a LoadingScreen (Időkerék)
            // DE: Ha ez egy meglévő kulcs, akkor lehet nem kéne LoadingScreen?
            // A specifikáció szerint: "Ha már szkenneltem, akkor már csak az időkerék jön fel"<- Várj, ez a látogatásra vonatkozik.
            // "Ha a naplómat nézem, akkor nem kell" -> Ez a kincsesláda oldal lesz.
            // Tehát itt, QR-nél mindig jöhet az időkerék (vagy rövidítve).
            return <LoadingScreen onComplete={flow.onLoadingDone} />;

          case 'key':
            return (
              <KeyScene
                gem={flow.gem}
                isNewKey={flow.isNewKey}
                onNext={flow.onKeyStabilized}
                onClose={flow.onClose}
                mode={gameState.gameMode}
                foundCount={flow.foundCount}
                totalCount={flow.totalCount}
              />
            );

          case 'info':
            return (
              <InfoScene
                gem={flow.gem}
                onDone={flow.onClose}
              />
            );

          default:
            // Intro és Mode már fent kezelve van, ide nem szabadna eljutniuk elvileg
            // de a useGemFlow lehet még visszadobja.
            // Ha 'resolve'-on van, akkor a hook váltani fog.
            return <div className="min-h-screen bg-black" />;
        }
      })()}
    </>
  );
}
