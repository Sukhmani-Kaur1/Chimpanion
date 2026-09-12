import { MARKET_LIST } from "./markets.ts";
import type {
  AppPlatforms,
  BudgetBand,
  Content,
  DesignTier,
  Feature,
  Goal,
  GrowthChannel,
  IntelItem,
  Integration,
  Market,
  Platform,
  ProductBand,
  Scope,
  Source,
  Starting,
  StoreApproach,
  Timeline,
} from "./types.ts";

export const GOALS: Goal[] = ["online", "leads", "sales", "operations", "product", "data"];
export const TIMELINES: Timeline[] = ["explore", "one", "three", "six", "later"];
export const PLATFORM_LIST: Platform[] = ["website", "store", "webapp", "app", "saas", "internal"];
export const STARTING: Starting[] = ["nothing", "site", "software", "brand", "crm", "data"];
export const FEATURE_LIST: Feature[] = [
  "catalogue",
  "accounts",
  "payments",
  "booking",
  "admin",
  "crm",
  "dashboard",
  "automation",
  "custom",
];
export const GROWTH_LIST: GrowthChannel[] = ["seo", "paid", "media", "leads", "sales", "analytics"];
export const INTEL_LIST: IntelItem[] = ["research", "pricing", "products", "public", "recurring", "dashboard"];
export const DESIGN_LIST: DesignTier[] = ["efficient", "custom", "premium"];
export const BUDGET_LIST: BudgetBand[] = ["b1", "b2", "b3", "b4", "b5", "b6", "unknown"];
export const PRODUCT_LIST: ProductBand[] = ["s", "m", "l", "xl"];
export const INTEGRATION_LIST: Integration[] = [
  "whatsapp",
  "accounting",
  "shipping",
  "sms",
  "sheets",
  "crm_ext",
  "maps",
  "other",
];
export const CONTENT_LIST: Content[] = ["provided", "copy", "copy_visuals"];
export const STORE_APPROACHES: StoreApproach[] = ["auto", "hosted", "custom"];
export const APP_PLATFORMS: AppPlatforms[] = ["android", "ios", "both"];

export const DEFAULT_SCOPE: Scope = {
  market: "IN",
  goals: [],
  timeline: "three",
  build: [],
  starting: [],
  features: [],
  growth: [],
  intel: [],
  design: "efficient",
  budget: "unknown",
  pages: 6,
  products: "s",
  roles: 2,
  workflows: 0,
  appPlatforms: "both",
  storeApproach: "auto",
  integrations: [],
  languages: 1,
  content: "provided",
  migration: false,
};

function pickList<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return allowed.filter((a) => value.includes(a));
}

function pickOne<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Coerce anything (URL input, old saved state) into a valid Scope. Never throws. */
export function normalize(input: unknown): Scope {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_SCOPE;
  const features = pickList(o.features, FEATURE_LIST);
  const hasCustom = features.includes("custom");
  return {
    market: pickOne<Market>(o.market, MARKET_LIST, d.market),
    goals: pickList(o.goals, GOALS),
    timeline: pickOne(o.timeline, TIMELINES, d.timeline),
    build: pickList(o.build, PLATFORM_LIST),
    starting: pickList(o.starting, STARTING),
    features,
    growth: pickList(o.growth, GROWTH_LIST),
    intel: pickList(o.intel, INTEL_LIST),
    design: pickOne(o.design, DESIGN_LIST, d.design),
    budget: pickOne(o.budget, BUDGET_LIST, d.budget),
    pages: clampInt(o.pages, 1, 60, d.pages),
    products: pickOne(o.products, PRODUCT_LIST, d.products),
    roles: clampInt(o.roles, 1, 8, d.roles),
    workflows: hasCustom ? clampInt(o.workflows, 1, 6, 1) : 0,
    appPlatforms: pickOne(o.appPlatforms, APP_PLATFORMS, d.appPlatforms),
    storeApproach: pickOne(o.storeApproach, STORE_APPROACHES, d.storeApproach),
    integrations: pickList(o.integrations, INTEGRATION_LIST),
    languages: clampInt(o.languages, 1, 3, d.languages),
    content: pickOne(o.content, CONTENT_LIST, d.content),
    migration: o.migration === true,
  };
}

export function applyPatch(scope: Scope, patch: Partial<Scope>): Scope {
  return normalize({ ...scope, ...patch });
}

/** The patch that removes whatever produced a package. */
export function removalPatch(scope: Scope, source: Source): Partial<Scope> {
  switch (source.field) {
    case "migration":
      return { migration: false };
    case "languages":
      return { languages: 1 };
    case "content":
      return { content: "provided" };
    default: {
      const list = scope[source.field] as string[];
      return { [source.field]: list.filter((v) => v !== source.value) } as Partial<Scope>;
    }
  }
}

/** Map the short public wizard's answers onto a full scope, defaults for everything it doesn't ask. */
export function fromWizard(answers: Record<string, string[]>, market: Market): Scope {
  const a = (k: string) => answers[k] ?? [];
  const starting = a("current");
  return normalize({
    market,
    goals: a("business"),
    timeline: a("timeline")[0],
    build: a("type"),
    starting,
    features: a("features"),
    growth: a("growth"),
    intel: a("data"),
    design: a("design")[0],
    budget: a("budget")[0],
    integrations: starting.includes("crm") ? ["crm_ext"] : [],
    workflows: 1,
  });
}

function toBase64Url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return atob(padded);
}

/** Only fields that differ from the defaults, so links stay short. */
export function encodeScope(scope: Scope): string {
  const diff: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(scope)) {
    if (JSON.stringify(v) !== JSON.stringify(DEFAULT_SCOPE[k as keyof Scope])) diff[k] = v;
  }
  return toBase64Url(JSON.stringify(diff));
}

export function decodeScope(encoded: string): Scope {
  try {
    return normalize(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return normalize({});
  }
}
