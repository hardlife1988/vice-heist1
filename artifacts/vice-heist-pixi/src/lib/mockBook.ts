/**
 * A hand-authored book fixture in the same shape the RGS will return,
 * used only to exercise the renderer/state machine before real RGS
 * wiring lands. Board layout and win are illustrative, not derived from
 * an actual math-sdk simulation.
 */
import type { Book } from "./bookEvents";

export const mockBook: Book = {
  id: 1,
  payoutMultiplier: 4.8,
  criteria: "basegame_win",
  baseGameWins: 4.8,
  freeGameWins: 0,
  events: [
    {
      index: 0,
      type: "reveal",
      gameType: "basegame",
      // payline row 0 across reels 0-2 forms an H3 3-of-a-kind, matching
      // the winInfo event below (reel/row indices are 0-based, row 0 = top).
      board: [
        [{ name: "H3" }, { name: "A" }, { name: "K" }],
        [{ name: "H3" }, { name: "W" }, { name: "Q" }],
        [{ name: "H3" }, { name: "J" }, { name: "SC" }],
        [{ name: "A" }, { name: "H2" }, { name: "K" }],
        [{ name: "K" }, { name: "H1" }, { name: "Q" }],
      ],
    },
    {
      index: 1,
      type: "winInfo",
      totalWin: 4.8,
      wins: [
        {
          symbol: "H3",
          win: 4.8,
          positions: [
            { reel: 0, row: 0 },
            { reel: 1, row: 0 },
            { reel: 2, row: 0 },
          ],
        },
      ],
    },
  ],
};
