export const SYMBOLS = ['W', 'SC', 'BV', 'H1', 'H2', 'H3', 'H4', 'H5', 'A', 'K', 'Q', 'J'] as const;
export type SymbolType = typeof SYMBOLS[number];

export const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  W: 2, SC: 2, BV: 2, H1: 3, H2: 3, H3: 4, H4: 4, H5: 4, A: 4, K: 4, Q: 5, J: 7
};

export const PAYTABLE: Record<SymbolType, Record<number, number>> = {
  W: { 5: 79.5, 4: 4.28, 3: 0.64 },
  H1: { 5: 16, 4: 1.6, 3: 0.265 },
  H2: { 5: 12, 4: 1.2, 3: 0.2 },
  H3: { 5: 8, 4: 0.8, 3: 0.15 },
  H4: { 5: 6, 4: 0.6, 3: 0.1 },
  H5: { 5: 4, 4: 0.4, 3: 0.08 },
  A: { 5: 3, 4: 0.3, 3: 0.06 },
  K: { 5: 2.5, 4: 0.25, 3: 0.05 },
  Q: { 5: 2, 4: 0.2, 3: 0.04 },
  J: { 5: 1.5, 4: 0.15, 3: 0.03 },
  SC: { 5: 20, 4: 5, 3: 2 }, // Scatter multipliers
  BV: { 5: 0, 4: 0, 3: 0 } // Bonus Vault triggers feature, no direct line pay
};

// 5x3 grid paylines (0=top, 1=mid, 2=bot)
export const PAYLINES = [
  [1, 1, 1, 1, 1], // Line 1
  [0, 0, 0, 0, 0], // Line 2
  [2, 2, 2, 2, 2], // Line 3
  [0, 1, 2, 1, 0], // Line 4
  [2, 1, 0, 1, 2], // Line 5
  [1, 0, 0, 0, 1], // Line 6
  [1, 2, 2, 2, 1], // Line 7
  [0, 0, 1, 2, 2], // Line 8
  [2, 2, 1, 0, 0], // Line 9
  [1, 2, 1, 0, 1], // Line 10
  [1, 0, 1, 2, 1], // Line 11
  [0, 1, 1, 1, 0], // Line 12
  [2, 1, 1, 1, 2], // Line 13
  [0, 1, 0, 1, 0], // Line 14
  [2, 1, 2, 1, 2], // Line 15
  [1, 1, 0, 1, 1], // Line 16
  [1, 1, 2, 1, 1], // Line 17
  [0, 0, 2, 0, 0], // Line 18
  [2, 2, 0, 2, 2], // Line 19
  [0, 2, 2, 2, 0], // Line 20
];

export function getRandomSymbol(): SymbolType {
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (const [symbol, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    if (random < weight) return symbol as SymbolType;
    random -= weight;
  }
  return 'J';
}

export function generateReelResults(): SymbolType[][] {
  // Returns [reelIndex][rowIndex] where reelIndex is 0..4, rowIndex is 0..2
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => getRandomSymbol())
  );
}

export interface WinLine {
  lineIndex: number;
  symbol: SymbolType;
  count: number;
  amount: number;
  positions: { reel: number, row: number }[]; // Coordinates of winning symbols
}

export interface SpinResult {
  grid: SymbolType[][];
  winLines: WinLine[];
  totalWin: number;
  scatters: number;
  freeSpinsTriggered: boolean;
}

export function evaluateGrid(grid: SymbolType[][], betAmount: number): SpinResult {
  const winLines: WinLine[] = [];
  let totalWin = 0;

  // Check normal paylines
  PAYLINES.forEach((line, lineIndex) => {
    let firstSymbol: SymbolType | null = null;
    let count = 0;
    const positions: { reel: number, row: number }[] = [];

    for (let reel = 0; reel < 5; reel++) {
      const row = line[reel];
      const symbol = grid[reel][row];

      if (symbol === 'SC' || symbol === 'BV') {
        // Scatters and Bonus symbols don't participate in normal paylines
        break;
      }

      if (reel === 0) {
        firstSymbol = symbol;
        if (symbol === 'W') {
          // It's a wild, it might act as wild for the next symbol
          firstSymbol = 'W'; 
        }
        count++;
        positions.push({ reel, row });
      } else {
        if (firstSymbol === 'W' && symbol !== 'W') {
          firstSymbol = symbol; // Wild converts to the first non-wild symbol
        }
        
        if (symbol === firstSymbol || symbol === 'W') {
          count++;
          positions.push({ reel, row });
        } else {
          break;
        }
      }
    }

    if (count >= 3 && firstSymbol && PAYTABLE[firstSymbol]) {
      const multiplier = PAYTABLE[firstSymbol][count];
      if (multiplier) {
        const amount = multiplier * betAmount;
        winLines.push({
          lineIndex,
          symbol: firstSymbol,
          count,
          amount,
          positions
        });
        totalWin += amount;
      }
    }
  });

  // Check Scatters
  let scatterCount = 0;
  const scatterPositions: { reel: number, row: number }[] = [];
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === 'SC') {
        scatterCount++;
        scatterPositions.push({ reel, row });
      }
    }
  }

  if (scatterCount >= 3) {
    const scatterMultiplier = PAYTABLE['SC'][Math.min(scatterCount, 5) as 3|4|5] || 0;
    const scatterWin = scatterMultiplier * betAmount;
    if (scatterWin > 0) {
      winLines.push({
        lineIndex: -1, // -1 means scatter
        symbol: 'SC',
        count: scatterCount,
        amount: scatterWin,
        positions: scatterPositions
      });
      totalWin += scatterWin;
    }
  }

  // Max win cap 10,000x
  if (totalWin > betAmount * 10000) {
    totalWin = betAmount * 10000;
  }

  return {
    grid,
    winLines,
    totalWin,
    scatters: scatterCount,
    freeSpinsTriggered: scatterCount >= 3
  };
}
