<script lang="ts">
  /**
   * Vice Heist — top-level game component.
   *
   * Wires the spin state machine to the PixiJS board (real symbol art,
   * background art) and to the Howler-based audio manager, so the
   * spin/reveal/win cycle can be exercised end-to-end with real RGS calls.
   *
   * On mount, authenticates with the RGS to get balance and config.
   * Ensures every spin is followed by /wallet/end-round to prevent stalls.
   */
  import { createApp, setContextApp, App } from "pixi-svelte";
  import { useMachine } from "@xstate/svelte";
  import { onMount } from "svelte";
  import { gameMachine } from "../lib/gameMachine";
  import { ASSETS } from "../lib/assets";
  import { initAudio, unlockAndStartMusic, playSfx, setMusicMuted } from "../lib/audio";
  import { rgsClient } from "../lib/rgsClient";
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
    ($snapshot.context.book?.events.find((e) => e.type === "winInfo") as WinInfoEvent | undefined) ?? null,
  );
  const status = $derived($snapshot.value as string);
  const canSpin = $derived(status === "idle");
  const balance = $derived($snapshot.context.balance / 1000000); // Convert from micros to display value
  const errorMessage = $derived($snapshot.context.error);

  let muted = $state(false);
  let lastAnnouncedStatus = $state<string | null>(null);
  let initError = $state<string | null>(null);

  initAudio();

  onMount(async () => {
    try {
      const authResponse = await rgsClient.authenticate();
      // Initialize machine with balance from auth
      const initialBalance = authResponse.balance.amount;
      send({ type: "INIT_BALANCE" as any, balance: initialBalance });
      console.log("✅ Authenticated with RGS", authResponse);
    } catch (error) {
      initError = `Failed to authenticate: ${error}`;
      console.error(initError);
    }
  });

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

  const closeError = () => {
    send({ type: "ACKNOWLEDGE_ERROR" });
  };
</script>

<div class="vice-heist-shell">
  {#if initError}
    <div class="error-banner">
      <strong>Initialization Error:</strong> {initError}
      <p>Check console for details. Ensure all query parameters (rgs_url, sessionID) are set.</p>
    </div>
  {/if}

  {#if errorMessage}
    <div class="error-banner">
      <strong>Game Error:</strong> {errorMessage}
      <button class="error-close" onclick={closeError}>Dismiss</button>
    </div>
  {/if}

  <div class="info-bar">
    <div class="balance">Balance: ${balance.toFixed(2)}</div>
    <div class="status">{status.toUpperCase()}</div>
  </div>

  <div class="canvas-wrap" style={`width:${CANVAS_WIDTH}px;height:${CANVAS_HEIGHT}px;`}>
    <App>
      <Background width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <Board {reveal} winInfo={winInfo ?? null} offsetX={BOARD_OFFSET_X} offsetY={BOARD_OFFSET_Y} />
    </App>
  </div>

  <div class="controls">
    <button disabled={!canSpin || !!errorMessage} onclick={onSpinClick}>
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
    padding: 16px;
  }

  .error-banner {
    background: #8b0000;
    color: #fff;
    padding: 12px 16px;
    border-radius: 4px;
    width: 100%;
    max-width: 600px;
    border-left: 4px solid #ff4444;
  }

  .error-banner strong {
    display: block;
    margin-bottom: 8px;
  }

  .error-banner p {
    margin: 0;
    font-size: 0.9em;
    opacity: 0.9;
  }

  .error-close {
    margin-top: 8px;
    padding: 4px 12px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }

  .info-bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    gap: 16px;
    font-size: 14px;
    color: #aaa;
  }

  .balance {
    font-weight: bold;
    color: #4a9eff;
  }

  .status {
    text-transform: uppercase;
    letter-spacing: 1px;
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
