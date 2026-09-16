<script lang="ts">
  import { onMount } from "svelte";
  import { createActor } from "xstate";
  import Board from "./Board.svelte";
  import Paytable from "./Paytable.svelte";
  import { gameMachine } from "../lib/gameMachine";
  import { rgsClient } from "../lib/rgsClient";
  import { extractBook, lastReveal, winInfo } from "../lib/bookEvents";
  import { BACKGROUND_SRC } from "../lib/assets";
  import { formatMoney, formatMultiplier, bookWinX, MICROS } from "../lib/money";
  import { BET_MODES, RTP, WINCAP } from "../lib/gameConfig";
  import { initAudio, unlockAndStartMusic, playSfx, setMusicMuted } from "../lib/audio";
  import { mockBook } from "../lib/mockBook";
  import type { Book } from "../lib/bookEvents";

  const actor = createActor(gameMachine);
  let snapshot = $state(actor.getSnapshot());
  actor.subscribe((s) => {
    snapshot = s;
  });
  actor.start();

  let betLevels = $state<number[]>([100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000]);
  let betIndex = $state(3);
  let currency = $state("USD");
  let localBalance = $state(0);
  let showRules = $state(false);
  let muted = $state(false);
  let bootError = $state<string | null>(null);
  let booting = $state(true);
  let demo = $state(false);
  let bg = $state("");
  let confirmBuy = $state(false);
  let demoBook = $state<Book | null>(null);
  let demoSpinning = $state(false);
  let demoWinX = $state(0);

  const status = $derived(String(snapshot.value));
  const busy = $derived(demo ? demoSpinning : status !== "idle" && status !== "error");
  const spinning = $derived(demo ? demoSpinning : status === "requesting" || status === "revealing");
  const liveBook = $derived(demo ? demoBook : snapshot.context.book);
  const reveal = $derived(lastReveal(liveBook));
  const wins = $derived(winInfo(liveBook));
  const amount = $derived(betLevels[Math.min(betIndex, betLevels.length - 1)] ?? 1_000_000);
  const winX = $derived(demo ? demoWinX : bookWinX(liveBook?.payoutMultiplier));
  const showingWin = $derived(demo ? demoWinX > 0 && !demoSpinning : status === "presentingWin" || status === "closingRound");
  const balance = $derived(demo ? localBalance : snapshot.context.balance || localBalance);
  const machineError = $derived(snapshot.context.error);

  $effect(() => {
    if (demo) return;
    if (status === "presentingWin" && liveBook) {
      if (liveBook.events.some((e) => e.type === "freeSpinTrigger" || e.type === "updateFreeSpin")) playSfx("scatter");
      else if (winX >= 15) playSfx("bigWin");
      else if (winX > 0) playSfx("win");
    }
  });

  onMount(async () => {
    bg = BACKGROUND_SRC();
    initAudio();
    if (!rgsClient.hasSession) {
      demo = true;
      localBalance = 1_000 * MICROS;
      booting = false;
      return;
    }
    try {
      const auth = await rgsClient.authenticate();
      currency = auth.balance?.currency || rgsClient.currency;
      localBalance = auth.balance?.amount ?? 0;
      if (auth.config?.betLevels?.length) {
        betLevels = [...auth.config.betLevels].sort((a, b) => a - b);
        const def = auth.config.defaultBetLevel ?? betLevels[Math.min(3, betLevels.length - 1)];
        const i = betLevels.indexOf(def);
        betIndex = i >= 0 ? i : Math.min(3, betLevels.length - 1);
      }
      actor.send({ type: "SET_BALANCE", balance: localBalance, currency });
      if (auth.round?.state === "IN_PROGRESS") {
        const resumed = extractBook(auth);
        if (resumed) actor.send({ type: "RESUME", book: resumed, balance: localBalance });
      }
    } catch (e) {
      bootError = e instanceof Error ? e.message : String(e);
    } finally {
      booting = false;
    }
  });

  function nudgeBet(dir: number) {
    const next = betIndex + dir;
    if (next >= 0 && next < betLevels.length && !busy) betIndex = next;
  }

  function toggleMute() {
    muted = !muted;
    setMusicMuted(muted);
  }

  function canAfford(mode: "BASE" | "BONUS") {
    const cost = mode === "BONUS" ? amount * BET_MODES.bonus.cost : amount;
    return balance >= cost;
  }

  function doSpin(mode: "BASE" | "BONUS") {
    unlockAndStartMusic();
    if (busy || booting) return;
    if (!canAfford(mode) && !demo) return;
    playSfx("spin");
    if (demo) {
      demoSpin(mode);
      return;
    }
    actor.send({ type: "SPIN", amount, mode });
  }

  function demoSpin(mode: "BASE" | "BONUS") {
    const cost = mode === "BONUS" ? amount * BET_MODES.bonus.cost : amount;
    localBalance = Math.max(0, localBalance - cost);
    demoSpinning = true;
    demoWinX = 0;
    demoBook = null;
    window.setTimeout(() => {
      demoBook = mockBook;
      demoWinX = bookWinX(mockBook.payoutMultiplier);
      demoSpinning = false;
      localBalance += Math.round(demoWinX * amount);
      playSfx(demoWinX >= 15 ? "bigWin" : "win");
    }, 1400);
  }
</script>

<div class="shell" style={`--bg: url('${bg}')`}>
  <header class="top">
    <div class="brand">
      <span class="mark">VH</span>
      <div>
        <strong>VICE HEIST</strong>
        <em>RTP {(RTP * 100).toFixed(2)}% · Max {WINCAP}x</em>
      </div>
    </div>
    <div class="meters">
      <div class="meter">
        <span>Balance</span>
        <b>{formatMoney(balance, currency)}</b>
      </div>
      <div class="meter win" class:hot={showingWin && winX > 0}>
        <span>Win</span>
        <b>{showingWin && winX > 0 ? `${formatMoney(Math.round(winX * amount), currency)} · ${formatMultiplier(winX)}` : "—"}</b>
      </div>
    </div>
    <div class="tools">
      <button type="button" onclick={toggleMute} aria-label="Mute">{muted ? "Unmute" : "Mute"}</button>
      <button type="button" onclick={() => (showRules = true)}>Paytable</button>
    </div>
  </header>

  <main class="stage">
    <Board {reveal} winInfo={wins} {spinning} />
    {#if bootError}
      <p class="banner err">{bootError}</p>
    {:else if machineError}
      <p class="banner err">
        {machineError}
        <button type="button" onclick={() => actor.send({ type: "ACKNOWLEDGE_ERROR" })}>Dismiss</button>
      </p>
    {:else if demo}
      <p class="banner">Preview mode — launch from Stake Engine Developer → Start game session to play on the RGS.</p>
    {:else if booting}
      <p class="banner">Connecting…</p>
    {/if}
  </main>

  <footer class="hud">
    <div class="bet">
      <button type="button" class="step" disabled={busy || betIndex === 0} onclick={() => nudgeBet(-1)} aria-label="Decrease bet">−</button>
      <div class="bet-readout">
        <span>Bet</span>
        <b>{formatMoney(amount, currency)}</b>
      </div>
      <button type="button" class="step" disabled={busy || betIndex === betLevels.length - 1} onclick={() => nudgeBet(1)} aria-label="Increase bet">+</button>
    </div>
    <button
      type="button"
      class="spin"
      disabled={busy || booting || (!demo && !canAfford("BASE"))}
      onclick={() => doSpin("BASE")}
    >
      {busy ? "…" : "SPIN"}
    </button>
    <button
      type="button"
      class="buy"
      disabled={busy || booting || (!demo && !canAfford("BONUS"))}
      onclick={() => (confirmBuy = true)}
    >
      Buy Bonus<br /><small>{BET_MODES.bonus.cost}x · {formatMoney(amount * BET_MODES.bonus.cost, currency)}</small>
    </button>
  </footer>
</div>

{#if showRules}
  <Paytable onClose={() => (showRules = false)} />
{/if}

{#if confirmBuy}
  <div class="scrim">
    <div class="confirm">
      <h3>Buy free spins?</h3>
      <p>Starts the bonus immediately for <strong>{formatMoney(amount * BET_MODES.bonus.cost, currency)}</strong> ({BET_MODES.bonus.cost}× your bet). RTP {(RTP * 100).toFixed(2)}%. Max win {WINCAP}x.</p>
      <div class="row">
        <button type="button" onclick={() => (confirmBuy = false)}>Cancel</button>
        <button
          type="button"
          class="go"
          onclick={() => {
            confirmBuy = false;
            doSpin("BONUS");
          }}>Buy</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    color: #f6ead0;
    background:
      linear-gradient(180deg, rgba(8, 6, 4, 0.55), rgba(8, 6, 4, 0.82)),
      var(--bg) center / cover no-repeat,
      #080604;
    font-family: Georgia, "Times New Roman", serif;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.28));
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .mark {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #c9a227;
    color: #1a1208;
    font-weight: 800;
    font-size: 0.85rem;
  }
  .brand strong {
    display: block;
    letter-spacing: 0.16em;
    font-size: 0.78rem;
  }
  .brand em {
    display: block;
    font-style: normal;
    color: #c9a227;
    font-size: 0.68rem;
  }
  .meters {
    display: flex;
    gap: 8px;
    flex: 1;
    justify-content: center;
  }
  .meter {
    background: rgba(12, 8, 4, 0.7);
    border: 1px solid #5a4318;
    border-radius: 8px;
    padding: 4px 10px;
    min-width: 92px;
  }
  .meter span {
    display: block;
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a227;
  }
  .meter b {
    font-size: 0.92rem;
  }
  .meter.hot b {
    color: #ffe066;
  }
  .tools {
    display: flex;
    gap: 6px;
  }
  .tools button,
  .hud button,
  .confirm button {
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid #c9a227;
    background: #1a1208;
    color: #f6ead0;
    font: inherit;
  }
  .tools button {
    padding: 8px 10px;
    font-size: 0.75rem;
  }
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 8px 4px;
    gap: 8px;
  }
  .banner {
    margin: 0;
    font-size: 0.75rem;
    text-align: center;
    max-width: 560px;
    color: #e6d3a3;
    background: rgba(0, 0, 0, 0.45);
    padding: 6px 10px;
    border-radius: 8px;
  }
  .banner.err {
    color: #ffb4b4;
  }
  .banner button {
    margin-left: 8px;
  }
  .hud {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    align-items: center;
    padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.86), rgba(0, 0, 0, 0.4));
  }
  .bet {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .step {
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
    line-height: 1;
  }
  .bet-readout {
    min-width: 88px;
    text-align: center;
  }
  .bet-readout span,
  .bet-readout b {
    display: block;
  }
  .bet-readout span {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #c9a227;
  }
  .spin {
    width: 92px;
    height: 92px;
    border-radius: 50% !important;
    background: radial-gradient(circle at 35% 30%, #ffe08a, #c9a227 46%, #7a5a12) !important;
    color: #1a1208 !important;
    font-weight: 800;
    letter-spacing: 0.08em;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .spin:disabled,
  .buy:disabled,
  .step:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .buy {
    justify-self: start;
    padding: 10px 12px;
    min-height: 48px;
    text-align: left;
    line-height: 1.15;
  }
  .buy small {
    color: #c9a227;
  }
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: grid;
    place-items: center;
    z-index: 30;
    padding: 16px;
  }
  .confirm {
    background: #120e0a;
    border: 1px solid #c9a227;
    border-radius: 12px;
    padding: 18px;
    max-width: 360px;
  }
  .confirm h3 {
    margin: 0 0 8px;
  }
  .confirm .row {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
  }
  .confirm button {
    padding: 8px 14px;
  }
  .confirm .go {
    background: #c9a227;
    color: #1a1208;
  }
  @media (max-width: 640px) {
    .top {
      flex-wrap: wrap;
    }
    .meters {
      order: 3;
      flex-basis: 100%;
    }
    .hud {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "bet spin"
        "buy buy";
    }
    .bet {
      grid-area: bet;
      justify-content: flex-start;
    }
    .spin {
      grid-area: spin;
      width: 78px;
      height: 78px;
    }
    .buy {
      grid-area: buy;
      justify-self: stretch;
      text-align: center;
    }
  }
</style>
