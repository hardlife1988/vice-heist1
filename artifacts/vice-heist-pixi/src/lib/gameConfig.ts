/**
 * Keep in sync with math-sdk/games/vice_heist/game_config.py
 */

export const REELS = 5;
export const ROWS = 3;
export const NUM_PAYLINES = 20;

export type SymbolId =
  | "W"
  | "SC"
  | "BV"
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "H5"
  | "A"
  | "K"
  | "Q"
  | "J";

export const SPECIAL_SYMBOLS: Record<string, SymbolId[]> = {
  wild: ["W"],
  scatter: ["SC"],
  bonus: ["BV"],
};

export const PAYTABLE: Record<number, Partial<Record<SymbolId, number>>> = {
  5: { W: 79.5, H1: 16.0, H2: 7.4, H3: 4.8, H4: 3.2, H5: 2.1, A: 1.1, K: 0.6, Q: 0.6, J: 0.5 },
  4: { W: 4.3, H1: 1.6, H2: 0.8, H3: 0.6, H4: 0.4, H5: 0.3, A: 0.1, K: 0.1, Q: 0.1, J: 0.1 },
  3: { W: 0.6, H1: 0.3, H2: 0.1, H3: 0.1, H4: 0.1, H5: 0.1, A: 0.1, K: 0.1, Q: 0.1, J: 0.1 },
};

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

export const FREESPIN_TRIGGERS = {
  base: { 3: 10, 4: 15, 5: 20 } as Record<number, number>,
  free: { 3: 5, 4: 8, 5: 12 } as Record<number, number>,
};

export const FREEGAME_WILD_MULTIPLIERS: Record<number, number> = {
  2: 140,
  3: 90,
  4: 25,
  5: 10,
  10: 4,
};

export const BET_MODES = {
  base: { cost: 1.0, label: "Base" },
  bonus: { cost: 100.0, isBuyBonus: true, label: "Buy Bonus" },
};

export const WINCAP = 900.0;
export const RTP = 0.96;
export const GAME_NAME = "Vice Heist";
