import type { Market } from "../pricing/types.ts";

export type Objective = "leads" | "sales" | "awareness" | "footfall" | "app";
export type BusinessModel = "local" | "ecommerce" | "b2b" | "saas" | "service";
export type Audience = "broad" | "local" | "professional" | "young" | "affluent";
/** What they can actually put in front of people — creative is the real constraint. */
export type CreativeAsset = "photos" | "video" | "ugc" | "none" | "catalogue" | "testimonials";
export type Maturity = "first" | "some" | "running";

/**
 * Category drives cost more than almost anything else in the brief: a click on a legal search
 * term costs several times what a click on a restaurant term does, and converts differently.
 */
export type Industry =
  | "retail"
  | "food"
  | "health"
  | "beauty"
  | "education"
  | "realestate"
  | "legal"
  | "finance"
  | "travel"
  | "fitness"
  | "home"
  | "auto"
  | "tech"
  | "other";

export type AgeBand = "18-24" | "25-34" | "35-54" | "55+";
export type Gender = "all" | "female" | "male";

export type ChannelId =
  | "google_search"
  | "google_pmax"
  | "google_display"
  | "youtube"
  | "meta"
  | "linkedin"
  | "tiktok"
  | "gbp";

export interface MediaScope {
  market: Market;
  objective: Objective;
  model: BusinessModel;
  industry: Industry;
  audience: Audience;
  /** Empty means no age narrowing — let the platforms find whoever converts. */
  age: AgeBand[];
  gender: Gender;
  /** Language ids the ads will run in. More than one means separate ad sets and creative. */
  languages: string[];
  /** Monthly ad budget in the market's currency, entered by the client. */
  budget: number;
  /** How long the campaign runs. Monthly figures stay monthly; this gives the campaign total. */
  durationWeeks: number;
  creative: CreativeAsset[];
  maturity: Maturity;
  /** Average value of one sale or qualified lead, in the market's currency. 0 = unknown. */
  dealValue: number;
  cities: number;
  website: boolean;
  tracking: boolean;
}

export type FunnelStage = "prospecting" | "engagement" | "retargeting";

export interface ChannelPlan {
  id: ChannelId;
  name: string;
  stage: FunnelStage;
  /** Share of the monthly budget, 0–1. */
  share: number;
  budget: number;
  why: string;
  /** What to actually launch first. */
  firstCampaign: string;
  formats: string[];
  /** Realistic cost per click and per result for this channel, market, industry and objective. */
  cpcLow: number;
  cpcHigh: number;
  /** Cost per thousand impressions, derived from the click cost so the two can never disagree. */
  cpm: number;
  ctr: number;
  impressionsLow: number;
  impressionsHigh: number;
  /** Distinct people reached in a month, at the frequency below. */
  reachLow: number;
  reachHigh: number;
  frequency: number;
  resultsLow: number;
  resultsHigh: number;
}

export interface CreativeBrief {
  channel: string;
  angle: string;
  hook: string;
  format: string;
}

export interface Milestone {
  week: number;
  title: string;
  detail: string;
}

export interface Warning {
  level: "blocker" | "risk" | "note";
  title: string;
  detail: string;
}

export interface MediaPlan {
  scope: MediaScope;
  currency: string;
  /** Budget floor below which paid media can't gather enough signal to optimise. */
  viable: boolean;
  channels: ChannelPlan[];
  totalBudget: number;
  /** Total spend across the whole flight, not just one month. */
  campaignBudget: number;
  /** Expected monthly results across every channel. */
  resultsLow: number;
  resultsHigh: number;
  costPerResultLow: number;
  costPerResultHigh: number;
  impressionsLow: number;
  impressionsHigh: number;
  clicksLow: number;
  clicksHigh: number;
  /** Deduplicated across channels — always at least the biggest channel, never the raw sum. */
  netReachLow: number;
  netReachHigh: number;
  avgFrequency: number;
  breakEvenResults: number | null;
  funnelSplit: { stage: FunnelStage; share: number; budget: number }[];
  creative: CreativeBrief[];
  searchThemes: { theme: string; intent: string; examples: string[] }[];
  negatives: string[];
  milestones: Milestone[];
  measurement: string[];
  warnings: Warning[];
  assumptions: string[];
}
