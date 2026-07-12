/**
 * Vice Heist — svelte-context wiring.
 *
 * Per math-sdk/docs/fe_docs/context.md, an entry-level component
 * (+page.svelte or a storybook story) must call setContext() before any
 * descendant component reads getContext(). This is a placeholder wiring
 * point — the actual eventEmitter/xstate/layout/app state creators come
 * from Stake's shared packages (pixi-svelte, utils-event-emitter,
 * utils-xstate, utils-layout), which are not yet vendored here.
 *
 * TODO: once those packages are available, replace the stubs below with
 * their real setContextEventEmitter / setContextXstate / setContextLayout /
 * setContextApp calls.
 */

export interface GameContext {
  gameId: "vice_heist";
}

export const setContext = (): GameContext => {
  // TODO: setContextEventEmitter({ eventEmitter })
  // TODO: setContextXstate({ stateXstate, stateXstateDerived })
  // TODO: setContextLayout({ stateLayout, stateLayoutDerived })
  // TODO: setContextApp({ stateApp })
  return { gameId: "vice_heist" };
};
