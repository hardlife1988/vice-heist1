/**
 * Vice Heist — svelte-context wiring.
 *
 * Per math-sdk/docs/fe_docs/context.md, an entry-level component must set
 * up shared context before descendants read it. pixi-svelte's own App
 * context (createApp/setContextApp) is created directly inside
 * components/Game.svelte, next to the <App> it renders (matching
 * pixi-svelte's documented pattern) — this function is a placeholder for
 * the *other* cross-cutting context this game will eventually need
 * (a message-bus event emitter for RGS/book-event plumbing, a layout
 * store for responsive sizing) once those are built out.
 */

export interface GameContext {
  gameId: "vice_heist";
}

export const setContext = (): GameContext => {
  // TODO: set up an event-emitter context once RGS wiring lands
  // TODO: set up a layout context once responsive sizing is implemented
  return { gameId: "vice_heist" };
};
