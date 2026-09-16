import { assign, fromPromise, setup } from "xstate";
import type { Book } from "./bookEvents";
import { extractBook } from "./bookEvents";
import { rgsClient } from "./rgsClient";

export interface GameMachineContext {
  book: Book | null;
  error: string | null;
  balance: number;
  currency: string;
  amount: number;
  mode: "BASE" | "BONUS";
}

export type GameMachineEvent =
  | { type: "SPIN"; amount: number; mode: "BASE" | "BONUS" }
  | { type: "SET_BALANCE"; balance: number; currency?: string }
  | { type: "RESUME"; book: Book; balance: number }
  | { type: "ACKNOWLEDGE_ERROR" };

const requestSpin = fromPromise<
  { book: Book | null; balance: number },
  { amount: number; mode: "BASE" | "BONUS" }
>(async ({ input }) => {
  const play = await rgsClient.play(input.amount, input.mode);
  const book = extractBook(play);
  if (!book) throw new Error("Play response had no book events");
  return { book, balance: play.balance?.amount ?? 0 };
});

const endRound = fromPromise<{ balance: number }>(async () => {
  const res = await rgsClient.endRound();
  return { balance: res.balance?.amount ?? 0 };
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
  context: {
    book: null,
    error: null,
    balance: 0,
    currency: "USD",
    amount: 1_000_000,
    mode: "BASE",
  },
  states: {
    idle: {
      on: {
        SET_BALANCE: {
          actions: assign({
            balance: ({ event }) => event.balance,
            currency: ({ event }) => event.currency ?? "USD",
          }),
        },
        RESUME: {
          target: "presentingWin",
          actions: assign({
            book: ({ event }) => event.book,
            balance: ({ event }) => event.balance,
            error: null,
          }),
        },
        SPIN: {
          target: "requesting",
          actions: assign({
            amount: ({ event }) => event.amount,
            mode: ({ event }) => event.mode,
            error: null,
          }),
        },
      },
    },
    requesting: {
      invoke: {
        src: "requestSpin",
        input: ({ context }) => ({ amount: context.amount, mode: context.mode }),
        onDone: {
          target: "revealing",
          actions: assign({
            book: ({ event }) => event.output.book,
            balance: ({ event }) => event.output.balance,
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
      after: { 1400: "presentingWin" },
    },
    presentingWin: {
      after: { 1600: "closingRound" },
    },
    closingRound: {
      invoke: {
        src: "endRound",
        onDone: {
          target: "idle",
          actions: assign({
            balance: ({ event }) => event.output.balance,
            error: null,
          }),
        },
        onError: {
          target: "error",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    error: {
      on: {
        ACKNOWLEDGE_ERROR: "idle",
        SPIN: {
          target: "requesting",
          actions: assign({
            amount: ({ event }) => event.amount,
            mode: ({ event }) => event.mode,
            error: null,
          }),
        },
      },
    },
  },
});
