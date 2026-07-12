<script lang="ts">
  import { Rectangle, Text } from "pixi-svelte";
  import type { SymbolId } from "../lib/gameConfig";

  interface Props {
    symbol: SymbolId;
    x: number;
    y: number;
    size: number;
    highlighted?: boolean;
  }

  let { symbol, x, y, size, highlighted = false }: Props = $props();

  // Placeholder art: a colored tile + label. No symbol art exists in this
  // repo yet (see SCOPE.md) — swap this for real sprites once it does.
  const colors: Record<SymbolId, number> = {
    W: 0xffd700,
    SC: 0xff3b3b,
    BV: 0x8b5cf6,
    H1: 0x60a5fa,
    H2: 0xfbbf24,
    H3: 0x34d399,
    H4: 0xf472b6,
    H5: 0x94a3b8,
    A: 0xe2e8f0,
    K: 0xe2e8f0,
    Q: 0xe2e8f0,
    J: 0xe2e8f0,
  };
</script>

<Rectangle
  {x}
  {y}
  width={size}
  height={size}
  backgroundColor={colors[symbol] ?? 0x333333}
  borderColor={highlighted ? 0xffffff : 0x000000}
  borderWidth={highlighted ? 4 : 1}
  borderRadius={0.08}
/>
<Text
  text={symbol}
  x={x + size / 2}
  y={y + size / 2}
  anchor={0.5}
  style={{ fill: 0x111111, fontSize: Math.floor(size * 0.32), fontWeight: "bold" }}
/>
