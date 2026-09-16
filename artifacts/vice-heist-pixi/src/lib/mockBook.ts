import type { Book } from "./bookEvents";

/** Local fixture used only when sessionID/rgs_url are missing (dev preview). */
export const mockBook: Book = {
  id: 1,
  payoutMultiplier: 480,
  criteria: "basegame",
  baseGameWins: 4.8,
  freeGameWins: 0,
  events: [
    {
      index: 0,
      type: "reveal",
      gameType: "basegame",
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
