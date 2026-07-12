# Vice Heist — PixiJS/Svelte frontend: scope & migration plan

## Why this exists

Stake Engine's Frontend Framework (the thing the RGS and ACP actually expect
a game's client to be) is a PixiJS + Svelte(Kit) toolkit — a TurboRepo monorepo
of `apps/<game>` + shared `packages/*` (see `math-sdk/docs/fe_docs/`), driven
directly by the book events the math SDK emits. `artifacts/vice-heist/` is a
React + Vite + Radix(shadcn) app — a different stack that doesn't consume
book events and isn't a base the ACP-compatible framework can build on.

This package is a working scaffold for that migration — it installs,
typechecks, and builds (verified with `pnpm install` / `pnpm typecheck` /
`pnpm build` / `pnpm preview` in-repo), and renders an interactive placeholder
spin cycle end-to-end against a fixture book. It is **not** a finished game
client — see "What's left" below.

## Layout

```
artifacts/vice-heist-pixi/
  src/
    routes/+page.svelte           — entry point, calls setContext() then renders <Game/>
    routes/+layout.ts             — ssr = false (required: pixi-svelte needs `window`)
    game/context.ts                — placeholder for future event-emitter/layout context
    components/
      Game.svelte                 — top-level component: creates the pixi-svelte App
                                     context, wires the spin state machine, renders
                                     <Board> + spin button
      Board.svelte                — lays out SymbolTile grid from a reveal event,
                                     highlights winning positions from a winInfo event
      SymbolTile.svelte           — one board cell (pixi-svelte <Rectangle> + <Text>)
    lib/
      gameConfig.ts                — paytable/paylines/symbol map, ported from
                                      math-sdk/games/vice_heist/game_config.py
      bookEvents.ts                — TS types for the RGS play/ response (book + events)
      gameMachine.ts                — xstate spin cycle: idle → requesting → revealing →
                                      presentingWin → idle
      mockBook.ts                  — a hand-authored fixture book (matches bookEvents.ts
                                      shapes) used to drive the machine/renderer until
                                      real RGS wiring lands
  svelte.config.js, vite.config.ts, src/app.html, src/app.d.ts  — SvelteKit plumbing
```

Dependencies: `pixi.js`, `pixi-svelte` (Stake's in-house pixi+svelte
integration, published to npm as `pixi-svelte`), `svelte`/`@sveltejs/kit`,
`xstate` + `@xstate/svelte` (spin state machine), `howler` (audio, not yet
wired to anything).

## Verified (2026-07-12)

- `pnpm install --filter ./artifacts/vice-heist-pixi` — clean install, no
  peer-dep conflicts.
- `pnpm run typecheck` (`svelte-kit sync && svelte-check`) — 0 errors, 0
  warnings.
- `pnpm run build` — production SvelteKit + static-adapter build succeeds.
- `pnpm run preview` — serves the built app; the HTML shell loads and boots
  correctly.
- Spin cycle: clicking Spin drives `gameMachine` through
  `requesting → revealing → presentingWin → idle`, rendering the fixture
  board (5×3 placeholder-colored tiles with symbol-code text) and
  highlighting the winning H3 3-of-a-kind from `mockBook`'s `winInfo` event.

## What's left (real effort, not done here)

1. **Real RGS wiring.** `gameMachine.ts`'s `requestSpin` actor currently
   resolves a local fixture (`mockBook.ts`) instead of calling the RGS
   `play/` endpoint. Swap it once Vice Heist is uploaded via the SDK's
   publish files (see `math/NOTICE.md`).
2. **Symbol art + audio.** `SymbolTile.svelte` renders colored
   rectangles + text labels, not real sprites — no heist-themed game art or
   sound exists anywhere in this repo yet. `artifacts/vice-heist`'s React UI
   has some visual direction worth reusing as reference, but no exportable
   game-art assets. `howler` is installed but unused.
3. **Real reel-spin animation.** The board currently snaps straight to the
   revealed result — no spinning-reel motion, no anticipation effects, no
   free-spin transition screen.
4. **Stake's actual shared UI packages** (`utils-layout` for responsive
   sizing, `components-ui-pixi` for buttons/meters, `utils-event-emitter`
   for cross-component messaging) or vendored equivalents — not pulled in
   yet; `context.ts` is a placeholder for this.
5. **Storybook setup** (`ModeBook.stories.svelte`, `ModeBookEvent.stories.svelte`)
   for isolated dev per fe_docs' documented workflow.

Rough sizing: (1)-(4) is still a multi-week frontend build — this scaffold
gets a verified-working SvelteKit + PixiJS foundation and an accurate data
contract (gameConfig/bookEvents/gameMachine) in place, so that work builds on
solid ground instead of starting from the React app's assumptions.
