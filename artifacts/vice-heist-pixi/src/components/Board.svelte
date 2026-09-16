<script lang="ts">
  import { onDestroy } from "svelte";
  import { REELS, ROWS, type SymbolId } from "../lib/gameConfig";
  import { SYMBOL_IDS, symbolSrc, SYMBOL_LABEL } from "../lib/assets";
  import type { RevealEvent, WinInfoEvent } from "../lib/bookEvents";

  interface Props {
    reveal: RevealEvent | null;
    winInfo: WinInfoEvent | null;
    spinning: boolean;
  }

  let { reveal, winInfo, spinning }: Props = $props();

  const empty = (): SymbolId[][] =>
    Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => "A" as SymbolId));

  let display = $state<SymbolId[][]>(empty());
  let timers: number[] = [];

  const isHighlighted = (reel: number, row: number) =>
    !spinning &&
    (winInfo?.wins ?? []).some((w) => w.positions.some((p) => p.reel === reel && p.row === row));

  const cellName = (reel: number, row: number): SymbolId => {
    const n = reveal?.board?.[reel]?.[row]?.name;
    return (n as SymbolId) || "A";
  };

  const randomSym = (): SymbolId => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];

  const clearTimers = () => {
    for (const t of timers) clearInterval(t);
    timers = [];
  };

  const landBoard = () => {
    display = Array.from({ length: REELS }, (_, reel) =>
      Array.from({ length: ROWS }, (_, row) => cellName(reel, row)),
    );
  };

  $effect(() => {
    clearTimers();
    if (spinning) {
      for (let reel = 0; reel < REELS; reel++) {
        const id = window.setInterval(() => {
          display = display.map((col, r) =>
            r === reel ? col.map(() => randomSym()) : col,
          );
        }, 70 + reel * 15);
        timers.push(id);
      }
    } else if (reveal) {
      landBoard();
    }
    return clearTimers;
  });

  onDestroy(clearTimers);
</script>

<div class="board" role="img" aria-label="Vice Heist reel window">
  {#each Array(REELS) as _, reel}
    <div class="reel" class:spinning style={`animation-delay:${reel * 80}ms`}>
      {#each Array(ROWS) as _, row}
        {@const sym = display[reel]?.[row] ?? "A"}
        <div class="cell" class:win={isHighlighted(reel, row)}>
          <img src={symbolSrc(sym)} alt={SYMBOL_LABEL[sym]} draggable="false" />
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: clamp(4px, 1.2vw, 10px);
    width: min(92vw, 560px);
    padding: 10px;
    background: linear-gradient(180deg, #1a1208 0%, #0a0704 100%);
    border: 2px solid #c9a227;
    box-shadow:
      0 0 0 4px #3a2a10,
      0 12px 40px rgba(0, 0, 0, 0.55),
      inset 0 0 40px rgba(0, 0, 0, 0.45);
    border-radius: 12px;
  }
  .reel {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: clamp(4px, 1.2vw, 10px);
  }
  .cell {
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    background: #111;
    box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.25);
  }
  .cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .cell.win {
    box-shadow:
      0 0 0 2px #ffe066,
      0 0 18px rgba(255, 214, 80, 0.85);
    transform: scale(1.04);
    z-index: 1;
  }
  .reel.spinning .cell img {
    filter: blur(1px) brightness(1.1);
  }
  @media (max-width: 420px) {
    .board {
      width: 96vw;
      padding: 6px;
    }
  }
</style>
