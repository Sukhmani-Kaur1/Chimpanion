export type Market = "IN" | "US" | "UK" | "AE";
export type Goal = "online" | "leads" | "sales" | "operations" | "product" | "data";
export type Timeline = "explore" | "one" | "three" | "six" | "later";
export type Platform = "website" | "store" | "webapp" | "app" | "saas" | "internal";
export type Starting = "nothing" | "site" | "software" | "brand" | "crm" | "data";
export type Feature =
  | "catalogue"
  | "accounts"
  | "payments"
  | "booking"
  | "admin"
  | "crm"
  | "dashboard"
  | "automation"
  | "custom";
export type GrowthChannel = "seo" | "paid" | "media" | "leads" | "sales" | "analytics";
export type IntelItem = "research" | "pricing" | "products" | "public" | "recurring" | "dashboard";
export type DesignTier = "efficient" | "custom" | "premium";
/** Budget tiers; their amounts depend on the market (see markets.ts). */
export type BudgetBand = "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "unknown";
export type ProductBand = "s" | "m" | "l" | "xl";
export type Integration =
  | "whatsapp"
  | "accounting"
  | "shipping"
  | "sms"
  | "sheets"
  | "crm_ext"
  | "maps"
  | "other";
export type Content = "provided" | "copy" | "copy_visuals";
export type StoreApproach = "auto" | "hosted" | "custom";
export type AppPlatforms = "android" | "ios" | "both";

/** Everything the client tells us. The engine is a pure function of this. */
export interface Scope {
  /** The client's market — sets currency, rates, tax, vendors and compliance. */
  market: Market;
  goals: Goal[];
  timeline: Timeline;
  build: Platform[];
  starting: Starting[];
  features: Feature[];
  growth: GrowthChannel[];
  intel: IntelItem[];
  design: DesignTier;
  budget: BudgetBand;
  /** Marketing / content pages on the website. */
  pages: number;
  products: ProductBand;
  /** Distinct kinds of user: customer, staff, admin, branch manager… */
  roles: number;
  /** Number of custom business workflows (only counted when `features` has "custom"). */
  workflows: number;
  appPlatforms: AppPlatforms;
  storeApproach: StoreApproach;
  integrations: Integration[];
  languages: number;
  content: Content;
  migration: boolean;
}

export type Discipline =
  | "strategy"
  | "pm"
  | "design"
  | "engineering"
  | "qa"
  | "devops"
  | "content"
  | "growth"
  | "data";

/** How well-understood a package is before discovery. Drives its range and contingency. */
export type Risk = "known" | "some" | "high";

/** 1 = can't launch without it · 2 = serves a goal the client named · 3 = valuable, can follow later. */
export type Priority = 1 | 2 | 3;

export type Track = "build" | "growth" | "intel";

export type ArrayField = "build" | "features" | "integrations" | "growth" | "intel";

/** Which answer produced a package, so the UI can offer to remove it. */
export type Source =
  | { field: ArrayField; value: string }
  | { field: "migration" | "languages" | "content" };

export interface WorkPackage {
  id: string;
  label: string;
  detail: string;
  hours: Partial<Record<Discipline, number>>;
  risk: Risk;
  priority: Priority;
  track: Track;
  source?: Source;
}

export interface CostedPackage extends WorkPackage {
  totalHours: number;
  cost: number;
  low: number;
  high: number;
  phase: 1 | 2;
}

export interface DisciplineLine {
  discipline: Discipline;
  label: string;
  hours: number;
  rate: number;
  cost: number;
}

export interface Adjustment {
  id: "rush" | "flex";
  label: string;
  detail: string;
  cost: number;
}

export interface Bar {
  id: string;
  label: string;
  start: number;
  end: number;
}

export type TimelineStatus = "open" | "fits" | "rush" | "infeasible";

export interface TimelinePlan {
  /** Weeks if nothing surprising happens. */
  weeks: number;
  /** Weeks at the pessimistic end of the range. */
  weeksHigh: number;
  /** Weeks the work needs at normal team pace, before any compression. */
  naturalWeeks: number;
  bars: Bar[];
  requestedWeeks: number | null;
  status: TimelineStatus;
  compression: number;
}

export interface PhasePlanEntry {
  n: 1 | 2;
  label: string;
  packageIds: string[];
  price: number;
  weeks: number;
}

export interface PhasePlan {
  reason: "budget" | "timeline" | "size";
  message: string;
  coreExceedsBudget: boolean;
  phases: [PhasePlanEntry, PhasePlanEntry];
}

export type BudgetStatus = "good" | "under" | "warn" | "crit" | "info";

export interface BudgetFit {
  status: BudgetStatus;
  message: string;
  /** Fixed price minus the top of the client's band; negative means headroom. */
  gap: number | null;
}

export interface Milestone {
  label: string;
  week: number;
  pct: number;
  amount: number;
}

export type RunKind = "thirdparty" | "service" | "spend";

export interface RunItem {
  label: string;
  low: number;
  high: number;
  per: "month" | "year" | "once";
  kind: RunKind;
  optional?: boolean;
}

export interface RunningCosts {
  items: RunItem[];
  /** Monthly third-party + selected services, excluding ad spend and optional plans. */
  monthlyLow: number;
  monthlyHigh: number;
  /** Build (incl. tax) + one-time third-party + 12 months of running costs. */
  year1Low: number;
  year1High: number;
}

export type CheckLevel = "crit" | "warn" | "tip";

export interface Check {
  id: string;
  level: CheckLevel;
  title: string;
  detail: string;
  fix?: { label: string; patch: Partial<Scope>; delta: number };
}

export interface StoreDecision {
  resolved: "hosted" | "custom";
  reason: string;
  /** Change in fixed price if we switched to the other approach. */
  altDelta: number;
}

export interface Confidence {
  level: "high" | "medium" | "low";
  spread: number;
  drivers: { label: string; upside: number }[];
}

export interface Estimate {
  scope: Scope;
  market: Market;
  packages: CostedPackage[];
  disciplines: DisciplineLine[];
  adjustments: Adjustment[];
  /** Σ package cost + adjustments — the price if everything goes to plan. */
  likely: number;
  contingency: number;
  fixedPrice: number;
  tax: number;
  taxRate: number;
  taxLabel: string;
  taxNote: string;
  total: number;
  low: number;
  high: number;
  confidence: Confidence;
  timeline: TimelinePlan;
  budget: BudgetFit;
  phasePlan: PhasePlan | null;
  payments: Milestone[];
  running: RunningCosts;
  store: StoreDecision | null;
  drivers: { label: string; share: number }[];
  assumptions: string[];
  exclusions: string[];
  checks: Check[];
  ref: string;
}
