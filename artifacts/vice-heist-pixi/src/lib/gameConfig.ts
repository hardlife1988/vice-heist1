/**
 * Vice Heist — frontend game config.
 *
 * Ported 1:1 from math-sdk/games/vice_heist/game_config.py so the frontend
 * never has to re-derive paytable/payline/symbol data by hand. Keep this
 * file in sync with that file when the math changes.
 */

export const REELS = 5;
export const ROWS = 3;
export const NUM_PAYLINES = 20;

export type SymbolId =
  | "W" // Wild
  | "SC" // Scatter
  | "BV" // Bonus Vault (decorative / buy-bonus icon)
  | "H1" // Diamond
  | "H2" // Gold Bar
  | "H3" // Cash Stack
  | "H4" // Heist Bag
  | "H5" // Vault
  | "A"
  | "K"
  | "Q"
  | "J";

export const SPECIAL_SYMBOLS: Record<string, SymbolId[]> = {
  wild: ["W"],
  scatter: ["SC"],
  bonus: ["BV"],
};

// Pays are x-bet multipliers, keyed by [count][symbol].
export const PAYTABLE: Record<number, Partial<Record<SymbolId, number>>> = {
  5: { W: 79.5, H1: 16.0, H2: 7.43, H3: 4.79, H4: 3.19, H5: 2.13, A: 1.06, K: 0.638, Q: 0.638, J: 0.5 },
  4: { W: 4.28, H1: 1.6, H2: 0.795, H3: 0.58, H4: 0.428, H5: 0.295, A: 0.149, K: 0.106, Q: 0.106, J: 0.085 },
  3: { W: 0.64, H1: 0.265, H2: 0.127, H3: 0.107, H4: 0.086, H5: 0.064, A: 0.043, K: 0.027, Q: 0.027, J: 0.021 },
};

// row indices per reel, top(0)/mid(1)/bottom(2) — mirrors game_config.py's self.paylines
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 1, 2, 2, 2],
  [2, 1, 0, 0, 0],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 2, 0, 2, 0],
];

// scatter count -> free spins awarded (basegame trigger / freegame retrigger)
export const FREESPIN_TRIGGERS = {
  base: { 3: 10, 4: 15, 5: 20 } as Record<number, number>,
  free: { 2: 3, 3: 5, 4: 8, 5: 12 } as Record<number, number>,
};

// Wild multiplier weights during freegame only (basegame wilds never carry a multiplier).
export const FREEGAME_WILD_MULTIPLIERS: Record<number, number> = {
  2: 60,
  3: 80,
  4: 50,
  5: 20,
  10: 15,
  20: 10,
  50: 5,
};

export const BET_MODES = {
  base: { cost: 1.0 },
  bonus: { cost: 100.0, isBuyBonus: true },
};

export const WINCAP = 10000.0;
export const RTP = 0.96;
