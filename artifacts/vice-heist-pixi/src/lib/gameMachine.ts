/**
 * Vice Heist — spin state machine.
 *
 * xstate model of the client spin cycle: idle -> requesting (the
 * RGS `play/` call) -> revealing (board animates in) -> presentingWin (win
 * lines / freegame transition shown) -> closingRound (/wallet/end-round) -> idle.
 *
 * Respects active/in-progress rounds from the RGS and ensures /wallet/end-round
 * is called to close every round, preventing mid-spin stalls.
 */
import { assign, fromPromise, setup } from "xstate";
import type { Book } from "./bookEvents";
import type { PlayResponse } from "./rgsClient";
import { rgsClient } from "./rgsClient";

export interface GameMachineContext {
  book: Book | null;
  error: string | null;
  balance: number;
}

export type GameMachineEvent = { type: "SPIN" } | { type: "ACKNOWLEDGE_ERROR" };

const requestSpin = fromPromise<PlayResponse>(async () => {
  try {
    return await rgsClient.play(1000000, "BASE");
  } catch (error) {
    throw new Error(`Failed to request spin: ${error}`);
  }
});

const endRound = fromPromise<void>(async () => {
  try {
    await rgsClient.endRound();
  } catch (error) {
    throw new Error(`Failed to end round: ${error}`);
  }
});

export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvent,
  },
  actors: { requestSpin, endRound },
}).createMachine({
  id: "viceHeistSpin",
  initial: "idle",
  context: { book: null, error: null, balance: 0 },
  states: {
    idle: {
      on: { SPIN: "requesting" },
    },
    requesting: {
      invoke: {
        src: "requestSpin",
        onDone: {
          target: "revealing",
          actions: assign({
            book: ({ event }) => event.output.round.book || null,
            balance: ({ event }) => event.output.balance.amount,
            error: null,
          }),
        },
        onError: {
          target: "error",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    revealing: {
      after: { 900: "presentingWin" },
    },
    presentingWin: {
      after: { 1500: "closingRound" },
    },
    closingRound: {
      invoke: {
        src: "endRound",
        onDone: {
          target: "idle",
          actions: assign({ error: null }),
        },
        onError: {
          target: "error",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    error: {
      on: { ACKNOWLEDGE_ERROR: "idle" },
    },
  },
});
