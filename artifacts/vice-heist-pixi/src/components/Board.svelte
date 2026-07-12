<script lang="ts">
  import SymbolTile from "./SymbolTile.svelte";
  import { REELS, ROWS } from "../lib/gameConfig";
  import type { RevealEvent, WinInfoEvent } from "../lib/bookEvents";

  interface Props {
    reveal: RevealEvent | null;
    winInfo: WinInfoEvent | null;
  }

  let { reveal, winInfo }: Props = $props();

  const TILE_SIZE = 90;
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
        x={reel * (TILE_SIZE + GAP)}
        y={row * (TILE_SIZE + GAP)}
        size={TILE_SIZE}
        highlighted={isHighlighted(reel, row)}
      />
    {/each}
  {/each}
{/if}
