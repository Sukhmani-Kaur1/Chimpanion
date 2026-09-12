import { MARKETS } from "./markets.ts";
import type { Market } from "./types.ts";

export interface Money {
  /** ₹1,25,000 · $12,400 · £9,800 · AED 45,000 */
  money: (n: number) => string;
  /** ₹1.3L · $12K · £9.8K — for tight spaces where exact figures are noise. */
  short: (n: number) => string;
  /** Signed: +$1,200 / −£800. */
  delta: (n: number) => string;
}

export function formatter(market: Market): Money {
  const m = MARKETS[market];
  const nf = new Intl.NumberFormat(m.locale, { maximumFractionDigits: 0 });
  const sign = (n: number) => (n < 0 ? "−" : "");
  const money = (n: number) => sign(n) + m.prefix + nf.format(Math.abs(Math.round(n)));
  const trim = (x: number) => x.toFixed(1).replace(/\.0$/, "");

  const short = (n: number) => {
    const v = Math.abs(Math.round(n));
    if (v < 1000) return money(n);
    if (market === "IN") {
      return v >= 100000 ? `${sign(n)}₹${trim(v / 100000)}L` : `${sign(n)}₹${Math.round(v / 1000)}K`;
    }
    if (v >= 1_000_000) return `${sign(n)}${m.prefix}${trim(v / 1_000_000)}M`;
    return `${sign(n)}${m.prefix}${v >= 10000 ? Math.round(v / 1000) : trim(v / 1000)}K`;
  };

  return { money, short, delta: (n) => (n >= 0 ? "+" : "") + money(n) };
}

export function weeksLabel(lo: number, hi: number): string {
  return lo === hi ? `${lo} week${lo === 1 ? "" : "s"}` : `${lo}–${hi} weeks`;
}
