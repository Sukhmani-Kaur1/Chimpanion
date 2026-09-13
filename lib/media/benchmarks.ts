/**
 * What paid media actually costs, and what it returns. Every number here is a planning benchmark,
 * not a promise — calibrate against your own accounts as you run campaigns.
 *
 * Costs are held as a base US dollar CPC per channel, then adjusted by category and by market, so
 * a rate change is one number rather than dozens. Cost per thousand impressions is *derived* from
 * the click cost and the click-through rate rather than held separately, which guarantees that
 * impressions × CTR always equals clicks — independent benchmarks drift apart and produce plans
 * whose own numbers contradict each other.
 */
import type { Market } from "../pricing/types.ts";
import type { BusinessModel, ChannelId, FunnelStage, Industry, Maturity, Objective } from "./types.ts";

/** Typical cost per click in US dollars, at the middle of the range, for an average category. */
export const BASE_CPC_USD: Record<ChannelId, number> = {
  google_search: 1.6,
  google_pmax: 0.9,
  google_display: 0.35,
  youtube: 0.25,
  meta: 0.7,
  linkedin: 5.5,
  tiktok: 0.5,
  gbp: 1.2,
};

/** Share of impressions that become clicks. With the CPC above, this also sets the CPM. */
export const CTR: Record<ChannelId, number> = {
  google_search: 0.035,
  google_pmax: 0.012,
  google_display: 0.0045,
  youtube: 0.02,
  meta: 0.011,
  linkedin: 0.005,
  tiktok: 0.012,
  gbp: 0.042,
};

/**
 * How much dearer or cheaper a category's clicks are, and how much better or worse they convert.
 * Legal and finance are famously expensive; food and retail are cheap but need volume.
 */
export const INDUSTRY: Record<Industry, { label: string; cpc: number; cvr: number }> = {
  retail: { label: "Retail & shopping", cpc: 0.8, cvr: 1 },
  food: { label: "Food & restaurants", cpc: 0.6, cvr: 1.3 },
  health: { label: "Health & medical", cpc: 1.5, cvr: 1.2 },
  beauty: { label: "Beauty & wellness", cpc: 0.9, cvr: 1 },
  education: { label: "Education & training", cpc: 1.4, cvr: 1 },
  realestate: { label: "Real estate & property", cpc: 1.3, cvr: 0.7 },
  legal: { label: "Legal services", cpc: 3, cvr: 1.1 },
  finance: { label: "Finance & insurance", cpc: 2.6, cvr: 0.8 },
  travel: { label: "Travel & hospitality", cpc: 0.9, cvr: 0.8 },
  fitness: { label: "Fitness & sport", cpc: 1, cvr: 1.1 },
  home: { label: "Home & trades", cpc: 1.5, cvr: 1.3 },
  auto: { label: "Automotive", cpc: 1.2, cvr: 0.8 },
  tech: { label: "Technology & software", cpc: 1.8, cvr: 0.7 },
  other: { label: "Something else", cpc: 1, cvr: 1 },
};

/** How much cheaper or dearer clicks are locally, and the currency they're bought in. */
export const MARKET_MEDIA: Record<Market, { factor: number; fx: number; floor: number; linkedinFloor: number }> = {
  IN: { factor: 0.18, fx: 88, floor: 15000, linkedinFloor: 60000 },
  US: { factor: 1, fx: 1, floor: 500, linkedinFloor: 2000 },
  UK: { factor: 0.85, fx: 0.78, floor: 400, linkedinFloor: 1600 },
  AE: { factor: 0.75, fx: 3.67, floor: 1800, linkedinFloor: 7000 },
};

/** Clicks that turn into an enquiry or sale, before channel quality and category are applied. */
export const CVR: Record<Objective, Partial<Record<BusinessModel, [number, number]>> & { default: [number, number] }> = {
  leads: { default: [0.04, 0.09], b2b: [0.02, 0.05], saas: [0.02, 0.05] },
  sales: { default: [0.012, 0.03], ecommerce: [0.012, 0.03], local: [0.02, 0.045] },
  awareness: { default: [0.004, 0.012] },
  footfall: { default: [0.03, 0.07] },
  app: { default: [0.05, 0.12] },
};

/** Some channels answer demand, others interrupt it. This scales the conversion rate. */
export const CHANNEL_QUALITY: Record<ChannelId, number> = {
  google_search: 1,
  google_pmax: 0.85,
  google_display: 0.25,
  youtube: 0.3,
  meta: 0.7,
  linkedin: 0.6,
  tiktok: 0.5,
  gbp: 0.9,
};

/**
 * How often one person sees the ads in a month, by funnel stage. Reach is impressions divided by
 * this — a planning assumption, not a measurement, and the number to revisit once real data lands.
 */
export const FREQUENCY: Record<FunnelStage, number> = {
  prospecting: 2.5,
  engagement: 3.5,
  retargeting: 6,
};

/** Prospecting / engagement / retargeting, by how much data the account already has. */
export const FUNNEL_SPLIT: Record<Maturity, [number, number, number]> = {
  first: [0.7, 0.1, 0.2],
  some: [0.6, 0.15, 0.25],
  running: [0.55, 0.15, 0.3],
};

/** Planning ranges are ± this much around the midpoint. */
export const SPREAD = 0.35;

/** Weeks in a month, for turning a monthly budget into a campaign total. */
export const WEEKS_PER_MONTH = 4.345;

export function cpc(channel: ChannelId, market: Market, industry: Industry): [number, number] {
  const m = MARKET_MEDIA[market];
  const mid = BASE_CPC_USD[channel] * INDUSTRY[industry].cpc * m.factor * m.fx;
  return [mid * (1 - SPREAD), mid * (1 + SPREAD)];
}

/**
 * Audiences overlap: the same person sees you on Search and on Meta, so adding per-channel reach
 * together overstates how many distinct people you touched. Each additional channel is discounted,
 * largest first — a rough deduplication, and honest about being one. Always at least as large as
 * the biggest single channel, and never the raw sum.
 */
export const OVERLAP = 0.72;

export function netReach(reaches: number[]): number {
  return [...reaches].sort((a, b) => b - a).reduce((total, r, i) => total + r * Math.pow(OVERLAP, i), 0);
}
