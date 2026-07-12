/**
 * Vice Heist — spin state machine.
 *
 * Minimal xstate model of the client spin cycle: idle -> requesting (the
 * RGS `play/` call) -> revealing (board animates in) -> presentingWin (win
 * lines / freegame transition shown) -> idle. This does not yet call the
 * real RGS — `requestSpin`'s implementation is a stub that resolves with a
 * fixture book (see mockBook.ts) so the machine and renderer can be
 * exercised end-to-end before RGS wiring lands.
 */
import { assign, fromPromise, setup } from "xstate";
import type { Book } from "./bookEvents";
import { mockBook } from "./mockBook";

export interface GameMachineContext {
  book: Book | null;
  error: string | null;
}

export type GameMachineEvent = { type: "SPIN" };

const requestSpin = fromPromise<Book>(async () => {
  // TODO: replace with the real RGS `play/` call once Vice Heist is
  // uploaded via math-sdk's publish files (see math/NOTICE.md).
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockBook;
});

export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvent,
  },
  actors: { requestSpin },
}).createMachine({
  id: "viceHeistSpin",
  initial: "idle",
  context: { book: null, error: null },
  states: {
    idle: {
      on: { SPIN: "requesting" },
    },
    requesting: {
      invoke: {
        src: "requestSpin",
        onDone: {
          target: "revealing",
          actions: assign({ book: ({ event }) => event.output, error: null }),
        },
        onError: {
          target: "idle",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    revealing: {
      after: { 900: "presentingWin" },
    },
    presentingWin: {
      after: { 1500: "idle" },
    },
  },
});
