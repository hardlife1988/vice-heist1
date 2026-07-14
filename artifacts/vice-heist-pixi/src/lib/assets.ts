/**
 * Vice Heist — pixi-svelte asset registry.
 *
 * Fed to `createApp({ assets })` in Game.svelte; pixi-svelte's built-in
 * `AssetsLoader` (inside `<App>`) preloads everything marked `preload: true`
 * before the game renders. Sprite keys here are what `SymbolTile`/`Background`
 * pass to pixi-svelte's `<Sprite key="..." />`.
 */
import type { Assets } from "pixi-svelte";
import type { SymbolId } from "./gameConfig";

export const SYMBOL_IDS: SymbolId[] = ["W", "SC", "BV", "H1", "H2", "H3", "H4", "H5", "A", "K", "Q", "J"];

export const symbolAssetKey = (symbol: SymbolId): string => `symbol_${symbol}`;

export const ASSETS: Assets = {
  background: { type: "sprite", src: "/assets/background.jpg", preload: true },
  ...Object.fromEntries(
    SYMBOL_IDS.map((id) => [
      symbolAssetKey(id),
      { type: "sprite", src: `/assets/symbols/${id}.jpg`, preload: true },
    ]),
  ),
};
