export type Answers = Record<string, string[]>;

export type Discipline = "discovery" | "design" | "engineering" | "launch" | "growth" | "data";

export interface LineItem {
  label: string;
  discipline: Discipline;
  hrs: number;
  rate: number;
  cost: number;
}

export interface Adjustment {
  label: string;
  cost: number;
}

export interface BudgetFit {
  status: "good" | "warn" | "crit" | "info";
  message: string;
}

export interface Estimate {
  lines: LineItem[];
  adjust: Adjustment | null;
  subtotal: number;
  low: number;
  high: number;
  margin: number;
  weeks: number;
  budgetFit: BudgetFit;
  recurring: { label: string; range: string }[];
  recommendation: string;
  recoCopy: string;
}

/** Blended hourly rates per discipline, in INR. The whole model hangs off these. */
const RATE: Record<Discipline, number> = {
  discovery: 1500,
  design: 1400,
  engineering: 1800,
  launch: 1200,
  growth: 1600,
  data: 1600,
};

const PLATFORM_HRS: Record<string, number> = {
  website: 28,
  store: 85,
  webapp: 110,
  app: 150,
  saas: 200,
  internal: 75,
  growth: 0,
  data: 0,
};

const FEATURE_HRS: Record<string, number> = {
  catalogue: 18,
  accounts: 22,
  payments: 28,
  booking: 22,
  admin: 32,
  crm: 28,
  dashboard: 28,
  automation: 22,
  custom: 38,
};

const GROWTH_HRS: Record<string, number> = {
  seo: 10,
  paid: 8,
  media: 10,
  leads: 12,
  sales: 8,
  analytics: 8,
};

const DATA_HRS: Record<string, number> = {
  research: 14,
  pricing: 18,
  products: 18,
  public: 22,
  dashboard: 24,
  recurring: 10,
};

const DESIGN_BASE: Record<string, number> = { efficient: 18, custom: 36, premium: 60 };
const DESIGN_LABEL: Record<string, string> = {
  efficient: "Clean & efficient",
  custom: "Distinctive & custom",
  premium: "Premium product experience",
};

/** A small pod ships roughly this many combined hours of delivery per week. */
const WEEKLY_THROUGHPUT = 70;

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function inrShort(n: number): string {
  const v = Math.round(n);
  if (v >= 100000) {
    const l = v / 100000;
    return "₹" + (v % 100000 === 0 ? String(l) : l.toFixed(1)) + "L";
  }
  return "₹" + Math.round(v / 1000) + "K";
}

export function estimate(a: Answers): Estimate {
  const val = (k: string): string[] => (Array.isArray(a[k]) ? (a[k] as string[]) : []);

  const type = val("type");
  const features = val("features");
  const current = val("current");
  const business = val("business");
  const growth = val("growth").filter((x) => x !== "none");
  const data = val("data").filter((x) => x !== "none");
  const designTier = val("design")[0] || "efficient";
  const timeline = val("timeline")[0] || "three";

  const discoveryHrs =
    10 +
    4 * Math.min(business.length, 4) +
    (current.includes("nothing") ? 8 : 0) +
    3 * Math.max(0, type.length - 1);

  const designHrs =
    (DESIGN_BASE[designTier] ?? 18) + 5 * Math.max(0, type.length - 1) + 3 * features.length;

  const integrationHrs = 8 * current.filter((c) => c === "crm" || c === "software").length;

  const engineeringHrs =
    type.reduce((s, t) => s + (PLATFORM_HRS[t] ?? 0), 0) +
    features.reduce((s, f) => s + (FEATURE_HRS[f] ?? 0), 0) +
    integrationHrs;

  const launchHrs = 8 + 3 * features.length + 4 * type.length;
  const growthHrs = growth.reduce((s, g) => s + (GROWTH_HRS[g] ?? 0), 0);
  const dataHrs = data.reduce((s, d) => s + (DATA_HRS[d] ?? 0), 0);

  const raw: { label: string; discipline: Discipline; hrs: number }[] = [
    { label: "Discovery & planning", discipline: "discovery", hrs: discoveryHrs },
    {
      label: `Design (${DESIGN_LABEL[designTier] ?? designTier})`,
      discipline: "design",
      hrs: designHrs,
    },
    { label: "Engineering & build", discipline: "engineering", hrs: engineeringHrs },
    { label: "Launch, QA & tracking", discipline: "launch", hrs: launchHrs },
  ];
  if (growthHrs > 0) raw.push({ label: "Growth strategy & setup", discipline: "growth", hrs: growthHrs });
  if (dataHrs > 0) raw.push({ label: "Market intelligence setup", discipline: "data", hrs: dataHrs });

  const lines: LineItem[] = raw.map((l) => ({
    ...l,
    rate: RATE[l.discipline],
    cost: l.hrs * RATE[l.discipline],
  }));

  const buildSubtotal =
    discoveryHrs * RATE.discovery +
    designHrs * RATE.design +
    engineeringHrs * RATE.engineering +
    launchHrs * RATE.launch;

  // Only the delivery-critical path carries a rush premium — discovery and post-launch
  // work don't compress the same way.
  const rushCritical =
    designHrs * RATE.design + engineeringHrs * RATE.engineering + launchHrs * RATE.launch;

  let adjust: Adjustment | null = null;
  if (timeline === "one") {
    adjust = { label: "Compressed timeline premium (dedicated pod, +22%)", cost: rushCritical * 0.22 };
  } else if (timeline === "later") {
    adjust = { label: "Flexible-schedule efficiency (−4%)", cost: -rushCritical * 0.04 };
  }

  const subtotal =
    buildSubtotal + (adjust ? adjust.cost : 0) + growthHrs * RATE.growth + dataHrs * RATE.data;

  // Wider range when the inputs that most affect scope are still undecided.
  let margin = 0.12;
  if ((val("budget")[0] || "unknown") === "unknown") margin += 0.06;
  if (timeline === "explore") margin += 0.05;
  margin = Math.min(margin, 0.3);

  const low = Math.round((subtotal * (1 - margin)) / 1000) * 1000;
  const high = Math.round((subtotal * (1 + margin)) / 1000) * 1000;

  const buildHrs = discoveryHrs + designHrs + engineeringHrs + launchHrs;
  let weeks = Math.ceil(buildHrs / WEEKLY_THROUGHPUT) + 1;
  if (timeline === "one") weeks = Math.max(4, Math.ceil(weeks * 0.82));

  const ceilings: Record<string, number | null> = {
    "50": 50000,
    "150": 150000,
    "300": 300000,
    "500": 500000,
    "1000": 1000000,
    more: Infinity,
    unknown: null,
  };
  const budgetKey = val("budget")[0] || "unknown";
  const ceil = ceilings[budgetKey];

  let budgetFit: BudgetFit;
  if (ceil === null || ceil === undefined) {
    budgetFit = { status: "info", message: "Add a budget range and we'll flag whether this scope fits it." };
  } else if (ceil === Infinity) {
    budgetFit = { status: "good", message: "Comfortably within your stated range." };
  } else if (ceil < low * 0.7) {
    budgetFit = {
      status: "crit",
      message: "This scope runs well above your stated budget — we'd trim or phase it before quoting.",
    };
  } else if (ceil < low) {
    budgetFit = {
      status: "warn",
      message: "Tight fit. We'd phase delivery or cut a feature to land inside your range.",
    };
  } else {
    budgetFit = { status: "good", message: "Fits comfortably inside your stated budget." };
  }

  const recurring = [{ label: "Hosting & software licences", range: "₹3,000–₹15,000/mo" }];
  if (growth.includes("paid"))
    recurring.push({ label: "Ad spend (Google / Meta media budget)", range: "₹25,000–₹1,00,000/mo" });
  if (data.includes("recurring"))
    recurring.push({ label: "Data monitoring & refresh retainer", range: "₹15,000–₹35,000/mo" });

  const weighted: Record<string, number> = {
    engineering: engineeringHrs * RATE.engineering,
    design: designHrs * RATE.design,
    growth: growthHrs * RATE.growth,
    data: dataHrs * RATE.data,
  };
  let dominant = "engineering";
  let max = -1;
  for (const k of Object.keys(weighted)) {
    if (weighted[k] > max) {
      max = weighted[k];
      dominant = k;
    }
  }
  const RECO: Record<string, string> = {
    engineering: "Product build",
    design: "Brand & product design",
    growth: "Growth engine",
    data: "Market intelligence build",
  };

  let recoCopy =
    "Start with the smallest system that moves the business forward, then build from real usage.";
  if (business.includes("leads"))
    recoCopy = "Build the foundation around lead capture, conversion and follow-up first.";
  else if (business.includes("operations"))
    recoCopy = "Connect the customer-facing experience to the internal systems your team already uses.";
  else if (business.includes("product"))
    recoCopy = "Start with product discovery and a focused first release rather than building everything at once.";

  return {
    lines,
    adjust,
    subtotal,
    low,
    high,
    margin,
    weeks,
    budgetFit,
    recurring,
    recommendation: RECO[dominant] ?? "Digital foundation",
    recoCopy,
  };
}
