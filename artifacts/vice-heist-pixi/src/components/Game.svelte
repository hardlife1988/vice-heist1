<script lang="ts">
  /**
   * Vice Heist — top-level game component.
   *
   * Wires the spin state machine to a placeholder PixiJS board so the
   * spin/reveal/win cycle can be exercised end-to-end against a fixture
   * book. Symbol art, real reel-spin animation, freegame transition UI,
   * and RGS wiring are still open — see SCOPE.md.
   */
  import { createApp, setContextApp, App } from "pixi-svelte";
  import { useMachine } from "@xstate/svelte";
  import { gameMachine } from "../lib/gameMachine";
  import Board from "./Board.svelte";
  import type { RevealEvent, WinInfoEvent } from "../lib/bookEvents";

  const context = createApp({ assets: {} });
  setContextApp(context);

  const { snapshot, send } = useMachine(gameMachine);

  const reveal = $derived(
    ($snapshot.context.book?.events.find((e) => e.type === "reveal") as RevealEvent) ?? null,
  );
  const winInfo = $derived(
    $snapshot.context.book?.events.find((e) => e.type === "winInfo") as WinInfoEvent | undefined,
  );
  const status = $derived($snapshot.value as string);
  const canSpin = $derived(status === "idle");
</script>

<div class="vice-heist-shell">
  <App>
    <Board {reveal} winInfo={winInfo ?? null} />
  </App>
  <div class="controls">
    <button disabled={!canSpin} onclick={() => send({ type: "SPIN" })}>
      {canSpin ? "Spin" : status}
    </button>
    {#if winInfo}
      <span class="win">Win: {winInfo.totalWin}x</span>
    {/if}
  </div>
</div>

<style>
  .vice-heist-shell {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #111;
    color: #eee;
    font-family: sans-serif;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  button {
    padding: 8px 20px;
    font-size: 16px;
    cursor: pointer;
  }
  button:disabled {
    cursor: default;
    opacity: 0.6;
  }
  .win {
    font-weight: bold;
    color: #ffd700;
  }
</style>
