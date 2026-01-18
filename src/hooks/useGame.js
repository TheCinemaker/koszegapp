import { useState, useEffect, useCallback } from 'react';
import { getRandomRiddle } from '../data/riddles';

const GAME_STATE_KEY = 'koszeg-city-game-state-v2';
const HAS_PLAYED_KEY = 'has-played-koszeg-game';

// Helper to load initial state
const getInitialState = () => {
  try {
    const item = window.localStorage.getItem(GAME_STATE_KEY);
    if (item) {
      return JSON.parse(item);
    }
  } catch (e) { console.error("Load failed", e); }

  return {
    gameStarted: false,
    entryStation: null,
    foundGems: [], // Array of IDs
    visitedStations: [], // Array of IDs
    gateClosed: false,
    assignedRiddles: {}, // Map: gemId -> riddleId
    gameMode: 'adult' // Default mode
  };
};

export function useGame() {
  const [gameState, setGameState] = useState(getInitialState);

  // Sync to LocalStorage
  useEffect(() => {
    window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // --- ACTIONS (State Transitions) ---

  const startGame = useCallback((stationId, mode = 'adult') => {
    setGameState(prev => {
      if (prev.gameStarted) return prev; // Already started
      return {
        ...prev,
        gameStarted: true,
        entryStation: stationId,
        visitedStations: [stationId],
        gameMode: mode
      };
    });
    window.localStorage.setItem(HAS_PLAYED_KEY, 'true');
  }, []);

  const addFoundGem = useCallback((gemId) => {
    setGameState(prev => {
      // 2B: Already found check
      if (prev.foundGems.includes(gemId)) return prev;

      // 2A: New Key Found -> Assign Random Riddle (State 3)
      const usedRiddleIds = Object.values(prev.assignedRiddles);
      const newRiddle = getRandomRiddle(usedRiddleIds);

      const newAssignedRiddles = { ...prev.assignedRiddles };
      if (newRiddle) {
        newAssignedRiddles[gemId] = newRiddle.id;
      }

      const newFoundGems = [...prev.foundGems, gemId];

      return {
        ...prev,
        foundGems: newFoundGems,
        assignedRiddles: newAssignedRiddles
      };
    });
  }, []);

  const visitStation = useCallback((stationId) => {
    setGameState(prev => {
      if (prev.visitedStations.includes(stationId)) return prev;
      return {
        ...prev,
        visitedStations: [...prev.visitedStations, stationId]
      };
    });
  }, []);

  const closeGate = useCallback(() => {
    setGameState(prev => ({ ...prev, gateClosed: true }));
  }, []);

  const setGameMode = useCallback((mode) => {
    setGameState(prev => ({ ...prev, gameMode: mode }));
  }, []);


  const resetGame = useCallback(() => {
    const freshState = {
      gameStarted: false,
      entryStation: null,
      foundGems: [],
      visitedStations: [],
      gateClosed: false,
      assignedRiddles: {},
      gameMode: 'adult'
    };
    setGameState(freshState);
    window.localStorage.removeItem(HAS_PLAYED_KEY);
    window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(freshState));
  }, []);

  // --- SELECTORS ---
  const isGemFound = useCallback((id) => gameState.foundGems.includes(id), [gameState.foundGems]);
  const getAssignedRiddle = useCallback((gemId) => gameState.assignedRiddles[gemId], [gameState.assignedRiddles]);

  // Total Main Keys (Hardcoded for now based on data knowledge: 11)
  const REQUIRED_KEYS = 11;

  const checkCastleStatus = useCallback(() => {
    if (gameState.gateClosed) return 'closed'; // State 7
    if (gameState.foundGems.length >= REQUIRED_KEYS) return 'ready'; // State 5B
    return 'early'; // State 5A
  }, [gameState.gateClosed, gameState.foundGems.length]);

  return {
    // State
    gameState,
    gameMode: gameState.gameMode,
    foundGems: gameState.foundGems,
    visitedStations: gameState.visitedStations,
    gateClosed: gameState.gateClosed,

    // Actions
    startGame,
    addFoundGem,
    visitStation,
    closeGate,
    resetGame,
    setGameMode,

    // Helpers
    isGemFound,
    getAssignedRiddle,
    checkCastleStatus,
    REQUIRED_KEYS
  };
}
