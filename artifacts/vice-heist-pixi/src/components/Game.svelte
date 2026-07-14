<script lang="ts">
  /**
   * Vice Heist — top-level game component.
   *
   * Wires the spin state machine to the PixiJS board (real symbol art,
   * background art) and to the Howler-based audio manager, so the
   * spin/reveal/win cycle can be exercised end-to-end against a fixture
   * book with visuals AND sound. Real RGS wiring is still open — see
   * SCOPE.md.
   */
  import { createApp, setContextApp, App } from "pixi-svelte";
  import { useMachine } from "@xstate/svelte";
  import { gameMachine } from "../lib/gameMachine";
  import { ASSETS } from "../lib/assets";
  import { initAudio, unlockAndStartMusic, playSfx, setMusicMuted } from "../lib/audio";
  import Board from "./Board.svelte";
  import Background from "./Background.svelte";
  import type { RevealEvent, WinInfoEvent } from "../lib/bookEvents";

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 700;
  const BOARD_OFFSET_X = 310;
  const BOARD_OFFSET_Y = 306;

  const context = createApp({ assets: ASSETS });
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

  let muted = $state(false);
  let lastAnnouncedStatus = $state<string | null>(null);

  initAudio();

  // Play the right cue whenever the machine transitions into a new state --
  // spin whoosh on request, then win/bigWin/scatter (biggest applicable one)
  // once the book resolves and a win is being presented.
  $effect(() => {
    if (status === lastAnnouncedStatus) return;
    lastAnnouncedStatus = status;
    if (status === "requesting") {
      playSfx("spin");
    } else if (status === "presentingWin" && winInfo) {
      const totalWin = winInfo.totalWin ?? 0;
      const hasScatterTrigger = ($snapshot.context.book?.events ?? []).some(
        (e) => e.type === "freeSpinTrigger",
      );
      if (hasScatterTrigger) playSfx("scatter");
      else if (totalWin >= 20) playSfx("bigWin");
      else if (totalWin > 0) playSfx("win");
    }
  });

  const onSpinClick = () => {
    unlockAndStartMusic();
    send({ type: "SPIN" });
  };

  const toggleMute = () => {
    muted = !muted;
    setMusicMuted(muted);
  };
</script>

<div class="vice-heist-shell">
  <div class="canvas-wrap" style={`width:${CANVAS_WIDTH}px;height:${CANVAS_HEIGHT}px;`}>
    <App>
      <Background width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <Board {reveal} winInfo={winInfo ?? null} offsetX={BOARD_OFFSET_X} offsetY={BOARD_OFFSET_Y} />
    </App>
  </div>
  <div class="controls">
    <button disabled={!canSpin} onclick={onSpinClick}>
      {canSpin ? "Spin" : status}
    </button>
    <button class="mute" onclick={toggleMute}>{muted ? "🔇" : "🔊"}</button>
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
  .canvas-wrap {
    max-width: 100%;
    aspect-ratio: 1200 / 700;
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
  .mute {
    padding: 8px 12px;
  }
  .win {
    font-weight: bold;
    color: #ffd700;
  }
</style>
