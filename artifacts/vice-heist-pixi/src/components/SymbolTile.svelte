<script lang="ts">
  import { Sprite, Rectangle } from "pixi-svelte";
  import type { SymbolId } from "../lib/gameConfig";
  import { symbolAssetKey } from "../lib/assets";

  interface Props {
    symbol: SymbolId;
    x: number;
    y: number;
    size: number;
    highlighted?: boolean;
  }

  let { symbol, x, y, size, highlighted = false }: Props = $props();
</script>

<!-- Highlight ring drawn behind the symbol art so a winning line's tiles pop
     without needing to touch the generated sprite itself. -->
{#if highlighted}
  <Rectangle
    x={x - 4}
    y={y - 4}
    width={size + 8}
    height={size + 8}
    backgroundColor={0x000000}
    backgroundAlpha={0}
    borderColor={0xffe066}
    borderWidth={4}
    borderRadius={0.1}
  />
{/if}
<Sprite key={symbolAssetKey(symbol)} {x} {y} width={size} height={size} />
