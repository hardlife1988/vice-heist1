/**
 * Types for the RGS play response (book + events).
 * Event shapes match the SDK Lines engine + generic freespin/reveal events.
 */

export interface BookEvent {
  index: number;
  type: string;
  [field: string]: unknown;
}

export interface RevealEvent extends BookEvent {
  type: "reveal";
  board: SymbolId2D;
  paddingPosition?: number[];
  gameType: "basegame" | "freegame";
  anticipation?: number[];
}

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

export interface FreeSpinTriggerEvent extends BookEvent {
  type: "freeSpinTrigger";
  totalFs: number;
  scatterCount: number;
}

export interface UpdateFreeSpinEvent extends BookEvent {
  type: "updateFreeSpin";
  amount: number;
  total: number;
}

export interface FreeSpinRetriggerEvent extends BookEvent {
  type: "retriggerFreeSpin";
  addedSpins: number;
  scatterCount: number;
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

export function extractBook(payload: unknown): Book | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const round = (root.round ?? root) as Record<string, unknown>;
  const candidate = (round.book ?? round) as Record<string, unknown>;
  const events = (candidate.events ?? round.events) as unknown;
  if (!Array.isArray(events) || events.length === 0) return null;
  return {
    id: Number(candidate.id ?? round.roundID ?? 0),
    payoutMultiplier: Number(candidate.payoutMultiplier ?? round.payoutMultiplier ?? 0),
    events: events as BookEvent[],
    criteria: String(candidate.criteria ?? ""),
    baseGameWins: Number(candidate.baseGameWins ?? 0),
    freeGameWins: Number(candidate.freeGameWins ?? 0),
  };
}

export function lastReveal(book: Book | null): RevealEvent | null {
  if (!book) return null;
  const reveals = book.events.filter((e) => e.type === "reveal") as RevealEvent[];
  return reveals.at(-1) ?? null;
}

export function allReveals(book: Book | null): RevealEvent[] {
  if (!book) return [];
  return book.events.filter((e) => e.type === "reveal") as RevealEvent[];
}

export function winInfo(book: Book | null): WinInfoEvent | null {
  if (!book) return null;
  const wins = book.events.filter((e) => e.type === "winInfo") as WinInfoEvent[];
  return wins.at(-1) ?? null;
}
