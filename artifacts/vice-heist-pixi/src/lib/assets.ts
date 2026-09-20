import type { SymbolId } from "./gameConfig";
import { assetUrl } from "./assetUrl";

export const SYMBOL_IDS: SymbolId[] = ["W", "SC", "BV", "H1", "H2", "H3", "H4", "H5", "A", "K", "Q", "J"];

export const symbolAssetKey = (symbol: SymbolId): string => `symbol_${symbol}`;

export const symbolSrc = (symbol: SymbolId): string => assetUrl(`assets/symbols/${symbol}.webp`);

export const BACKGROUND_SRC = () => assetUrl("assets/background.jpg");

// Portrait 9:16 plate for phones. Not yet selected by any component —
// the renderer still uses BACKGROUND_SRC unconditionally.
export const BACKGROUND_MOBILE_SRC = () => assetUrl("assets/background-mobile.webp");

export const SYMBOL_LABEL: Record<SymbolId, string> = {
  W: "Wild",
  SC: "Scatter",
  BV: "Bonus Vault",
  H1: "Diamond",
  H2: "Gold Bar",
  H3: "Cash Stack",
  H4: "Heist Bag",
  H5: "Vault",
  A: "Ace",
  K: "King",
  Q: "Queen",
  J: "Jack",
};
