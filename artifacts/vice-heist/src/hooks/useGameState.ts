import { create } from 'zustand';
import { SymbolType, generateReelResults, evaluateGrid, WinLine, SpinResult } from '../game/GameLogic';
import { audio } from '../audio/AudioEngine';

interface GameState {
  balance: number;
  bet: number;
  isSpinning: boolean;
  /** The result grid reels should animate toward. Set atomically with isSpinning. */
  targetGrid: SymbolType[][];
  /** The grid currently shown (updated when reels stop). */
  grid: SymbolType[][];
  winLines: WinLine[];
  currentWin: number;
  freeSpins: number;
  isAutoSpin: boolean;
  /** Versioned per spin — Reels reads this to avoid stale stop events. */
  spinId: number;
  /** Pending evaluation stored safely in Zustand, never on window. */
  _pendingResult: SpinResult | null;

  spin: () => void;
  setBet: (amount: number) => void;
  toggleAutoSpin: () => void;
  /** Called by Reels when all 5 reels have landed. */
  onReelsStopped: (spinId: number) => void;
  initAudio: () => void;
}

const INITIAL_GRID: SymbolType[][] = [
  ['H1', 'A',  'K' ],
  ['H2', 'W',  'Q' ],
  ['H3', 'J',  'H1'],
  ['A',  'K',  'Q' ],
  ['J',  'H4', 'H5'],
];

export const useGameStore = create<GameState>()((set, get) => ({
  balance: 1000,
  bet: 1,
  isSpinning: false,
  targetGrid: INITIAL_GRID,
  grid: INITIAL_GRID,
  winLines: [],
  currentWin: 0,
  freeSpins: 0,
  isAutoSpin: false,
  spinId: 0,
  _pendingResult: null,

  initAudio: () => {
    audio.init();
  },

  setBet: (amount: number) => {
    if (get().isSpinning) return;
    audio.playButtonClick();
    set({ bet: amount });
  },

  toggleAutoSpin: () => {
    audio.playButtonClick();
    const state = get();
    const next = !state.isAutoSpin;
    set({ isAutoSpin: next });
    if (next && !state.isSpinning) {
      get().spin();
    }
  },

  spin: () => {
    const state = get();
    if (state.isSpinning) return;
    if (state.freeSpins === 0 && state.balance < state.bet) {
      set({ isAutoSpin: false });
      return;
    }

    audio.init();
    audio.playSpinStart();

    // Compute result synchronously BEFORE setting isSpinning so the Reels
    // component sees targetGrid and isSpinning in the same flush — no race.
    const newGrid = generateReelResults();
    const result = evaluateGrid(newGrid, state.bet);
    const nextSpinId = state.spinId + 1;

    set((s) => ({
      isSpinning: true,
      spinId: nextSpinId,
      balance: s.freeSpins > 0 ? s.balance : s.balance - s.bet,
      freeSpins: s.freeSpins > 0 ? s.freeSpins - 1 : 0,
      targetGrid: newGrid,
      _pendingResult: result,
      winLines: [],
      currentWin: 0,
    }));
  },

  onReelsStopped: (spinId: number) => {
    const state = get();
    // Ignore stale stop events from previous spins
    if (spinId !== state.spinId) return;

    const result = state._pendingResult;

    // Always clear spinning state — no stuck games
    if (!result) {
      set({ isSpinning: false, _pendingResult: null });
      return;
    }

    if (result.totalWin > 0) {
      if (result.totalWin > state.bet * 10) {
        audio.playWinBig();
      } else {
        audio.playWinSmall();
      }
    }

    set((s) => ({
      isSpinning: false,
      grid: s.targetGrid,          // lock in the final visible grid
      winLines: result.winLines,
      currentWin: result.totalWin,
      balance: s.balance + result.totalWin,
      freeSpins: s.freeSpins + (result.freeSpinsTriggered ? 10 : 0),
      _pendingResult: null,
    }));

    const next = get();
    if (next.isAutoSpin) {
      setTimeout(() => {
        if (get().isAutoSpin) get().spin();
      }, 2000);
    }
  },
}));
