# Vice Heist — PixiJS/Svelte frontend: scope & migration plan

## Why this exists

Stake Engine's Frontend Framework (the thing the RGS and ACP actually expect
a game's client to be) is a PixiJS + Svelte(Kit) toolkit — a TurboRepo monorepo
of `apps/<game>` + shared `packages/*` (see `math-sdk/docs/fe_docs/`), driven
directly by the book events the math SDK emits. `artifacts/vice-heist/` is a
React + Vite + Radix(shadcn) app — a different stack that doesn't consume
book events and isn't a base the ACP-compatible framework can build on.

This package is the starting scaffold for the real migration. It is **not**
a working game yet — see "What's left" below.

## Target architecture (per Stake Engine's fe_docs)

```
artifacts/vice-heist-pixi/
  src/
    routes/+page.svelte      — entry point, calls setContext() then renders <Game/>
    game/context.ts          — wires ContextEventEmitter / ContextXstate / ContextLayout / ContextApp
    components/Game.svelte   — top-level game component tree
    lib/
      gameConfig.ts           — symbol map + paylines mirrored from math-sdk/games/vice_heist/game_config.py
      bookEvents.ts           — TS types for the RGS play/ response (book + events)
      symbols.ts              — W / SC / BV / H1-H5 / A / K / Q / J → sprite asset keys
  static/                     — symbol art, reel-spin/win animations, sound (howler)
```

Core dependencies: `pixi.js`, `pixi-svelte` (Stake's in-house pixi+svelte
integration, published to npm), `svelte`/`@sveltejs/kit`, `xstate` (bet/
autobet/resume-bet state machine), `howler` (audio).

## What's scaffolded now

- `package.json` wired into the pnpm workspace (`artifacts/*` glob — no
  workspace.yaml change needed) with the correct dependency set.
- `tsconfig.json` extending the repo's shared `tsconfig.base.json`.
- `src/lib/gameConfig.ts` — the real paytable/paylines/symbol map, ported
  1:1 from `math-sdk/games/vice_heist/game_config.py`, so downstream
  components have a single accurate source instead of re-deriving it.
- `src/lib/bookEvents.ts` — typed shapes for the book/event payloads this
  game's math actually emits (line wins via the SDK's `Lines` engine, free
  spin start/end, wild-multiplier assignment), based on
  `math-sdk/src/events/events.py` and `game_override.py`'s special-symbol
  logic.
- `src/game/context.ts` + `src/routes/+page.svelte` — minimal entry point
  wiring, unstyled, no rendering yet.

## What's left (real effort, not done here)

1. Pull in Stake's actual shared packages (`pixi-svelte`, `utils-layout`,
   `utils-xstate`, `utils-event-emitter`, `components-ui-pixi`) or vendor
   equivalents — these provide the context/state-machine/layout plumbing
   fe_docs assumes exists.
2. Reel/board rendering, spin animation, win-line highlight, free-spin
   transition — the actual PixiJS scene graph.
3. Symbol art + audio assets (currently none exist anywhere in this repo
   for the heist theme — `artifacts/vice-heist`'s React UI has some visual
   direction worth reusing as reference, but no exportable game-art assets).
4. Storybook setup (`ModeBook.stories.svelte`, `ModeBookEvent.stories.svelte`)
   for isolated dev per fe_docs' documented workflow.
5. Wiring to the actual RGS `/play` endpoint once Vice Heist is uploaded via
   the SDK's publish files (see `math/NOTICE.md`).

Rough sizing: (1)-(4) is a multi-week frontend build, not a same-session
task — this scaffold exists so that work has a correct starting structure
and an accurate data contract (gameConfig/bookEvents) to build against,
instead of starting from the React app's assumptions.
