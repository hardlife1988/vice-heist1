/** Stake Engine stores money as integers with 6 decimal places. $1 = 1_000_000. */
export const MICROS = 1_000_000;

export function fromMicros(amount: number): number {
  return amount / MICROS;
}

export function toMicros(amount: number): number {
  return Math.round(amount * MICROS);
}

export function formatMoney(micros: number, currency = "USD"): string {
  const n = fromMicros(micros);
  const zeroDec = new Set(["JPY", "KRW", "VND", "IDR", "CLP"]);
  const decimals = zeroDec.has(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "XGC" ? "USD" : currency === "XSC" ? "USD" : currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n).replace("$", currency === "XGC" ? "GC " : currency === "XSC" ? "SC " : "$");
  } catch {
    return `${n.toFixed(decimals)} ${currency}`;
  }
}

export function formatMultiplier(x: number): string {
  if (!Number.isFinite(x)) return "0.00x";
  return `${x.toFixed(x >= 10 ? 1 : 2)}x`;
}

/** Book payoutMultiplier is stored as round(x * 100). Event totalWin is already in x. */
export function bookWinX(payoutMultiplier: number | undefined): number {
  const pm = Number(payoutMultiplier ?? 0);
  if (pm === 0) return 0;
  if (Number.isInteger(pm) && Math.abs(pm) >= 1) return pm / 100;
  return pm;
}
