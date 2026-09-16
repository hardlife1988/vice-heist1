import type { SymbolId } from "./gameConfig";
import { assetUrl } from "./assetUrl";

export const SYMBOL_IDS: SymbolId[] = ["W", "SC", "BV", "H1", "H2", "H3", "H4", "H5", "A", "K", "Q", "J"];

export const symbolAssetKey = (symbol: SymbolId): string => `symbol_${symbol}`;

export const symbolSrc = (symbol: SymbolId): string => assetUrl(`assets/symbols/${symbol}.png`);

export const BACKGROUND_SRC = () => assetUrl("assets/background.jpg");

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
