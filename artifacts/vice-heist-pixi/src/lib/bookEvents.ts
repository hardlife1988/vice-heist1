/**
 * Vice Heist — types for the RGS `play/` response ("book" + events).
 *
 * Modeled on math-sdk/docs/math_docs/gamestate_section/events_info.md and
 * this game's actual event sources: the SDK's built-in Lines engine
 * (Lines.emit_linewin_events, called from game_executables.py) plus the
 * generic freespin/reveal events every math-sdk game emits from
 * src/events/events.py. Vice Heist does not define any custom
 * game_events.py overrides — it relies entirely on these SDK-provided
 * event types.
 */

export interface BookEvent {
  index: number;
  type: string;
  [field: string]: unknown;
}

/** Emitted once per spin when the board is (re)drawn. */
export interface RevealEvent extends BookEvent {
  type: "reveal";
  board: SymbolId2D;
  paddingPosition?: number[];
  gameType: "basegame" | "freegame";
  anticipation?: number[];
}

/** Emitted by the SDK's Lines engine after line-win evaluation. */
export interface WinInfoEvent extends BookEvent {
  type: "winInfo";
  totalWin: number;
  wins: Array<{
    symbol: string;
    win: number;
    positions: Array<{ reel: number; row: number }>;
    meta?: { multiplier?: number };
  }>;
}

/** Emitted when free spins are triggered from the basegame. */
export interface FreeSpinTriggerEvent extends BookEvent {
  type: "freeSpinTrigger";
  totalFs: number;
  scatterCount: number;
}

/** Emitted at the start of every freegame spin. */
export interface UpdateFreeSpinEvent extends BookEvent {
  type: "updateFreeSpin";
  amount: number;
  total: number;
}

/** Emitted when a freegame's extra-spin retrigger condition is met. */
export interface FreeSpinRetriggerEvent extends BookEvent {
  type: "retriggerFreeSpin";
  addedSpins: number;
  scatterCount: number;
}

/** Emitted when a Wild is assigned its random multiplier (freegame only). */
export interface SetWinEvent extends BookEvent {
  type: "setWin";
  amount: number;
}

export type SymbolId2D = Array<Array<{ name: string; multiplier?: number }>>;

export interface Book {
  id: number;
  payoutMultiplier: number;
  events: BookEvent[];
  criteria: string;
  baseGameWins: number;
  freeGameWins: number;
}

export interface PlayResponse {
  round: { mode: "base" | "bonus"; state: "COMPLETE" | "IN_PROGRESS" };
  book: Book;
  balance: { amount: number; currency: string };
}
