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

// Pays are x-bet multipliers, keyed by [count][symbol]. Rounded to the
// nearest 0.10x (min 0.10x) to match the RGS lookup-table's required payout
// granularity -- kept in sync with math-sdk/games/vice_heist/game_config.py.
export const PAYTABLE: Record<number, Partial<Record<SymbolId, number>>> = {
  5: { W: 79.5, H1: 16.0, H2: 7.4, H3: 4.8, H4: 3.2, H5: 2.1, A: 1.1, K: 0.6, Q: 0.6, J: 0.5 },
  4: { W: 4.3, H1: 1.6, H2: 0.8, H3: 0.6, H4: 0.4, H5: 0.3, A: 0.1, K: 0.1, Q: 0.1, J: 0.1 },
  3: { W: 0.6, H1: 0.3, H2: 0.1, H3: 0.1, H4: 0.1, H5: 0.1, A: 0.1, K: 0.1, Q: 0.1, J: 0.1 },
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

// scatter count -> free spins awarded (basegame trigger / freegame retrigger).
// Retrigger floor is 3+ scatters (raised from 2) -- see math-sdk fix notes:
// 2+ combined with the old reel density made free-spin sessions run forever.
export const FREESPIN_TRIGGERS = {
  base: { 3: 10, 4: 15, 5: 20 } as Record<number, number>,
  free: { 3: 5, 4: 8, 5: 12 } as Record<number, number>,
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
