/** Vietnamese number formatting helpers (comma decimal, dot thousands). */

/** Whole number, e.g. 1450 → "1.450". */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("vi-VN");
}

/** Up to one decimal, e.g. 37.5 → "37,5", 1.5 → "1,5", 80 → "80". */
export function fmtNum(n: number): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}
