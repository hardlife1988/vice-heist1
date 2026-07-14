<script lang="ts">
  import SymbolTile from "./SymbolTile.svelte";
  import { REELS, ROWS } from "../lib/gameConfig";
  import type { RevealEvent, WinInfoEvent } from "../lib/bookEvents";

  interface Props {
    reveal: RevealEvent | null;
    winInfo: WinInfoEvent | null;
    offsetX?: number;
    offsetY?: number;
  }

  let { reveal, winInfo, offsetX = 0, offsetY = 0 }: Props = $props();

  const TILE_SIZE = 100;
  const GAP = 8;

  const isHighlighted = (reel: number, row: number) =>
    (winInfo?.wins ?? []).some((w) =>
      w.positions.some((p) => p.reel === reel && p.row === row),
    );
</script>

{#if reveal}
  {#each Array(REELS) as _, reel}
    {#each Array(ROWS) as _, row}
      {@const cell = reveal.board[reel][row]}
      <SymbolTile
        symbol={cell.name as any}
        x={offsetX + reel * (TILE_SIZE + GAP)}
        y={offsetY + row * (TILE_SIZE + GAP)}
        size={TILE_SIZE}
        highlighted={isHighlighted(reel, row)}
      />
    {/each}
  {/each}
{/if}
