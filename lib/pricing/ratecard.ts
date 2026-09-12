/**
 * The effort model: hours, risk and team capacity. These are the same in every market — money,
 * tax, vendors and compliance live in markets.ts. Calibrate against real past projects here.
 * Hours are delivery hours for a small senior team working with modern tooling.
 * Text may use vendor tokens — {payments}, {invoices}, {booking}, {crm}, {crmLite}, {whatsapp},
 * {accounting}, {shipping} — which are filled in with the client market's local providers.
 */
import type {
  DesignTier,
  Discipline,
  Feature,
  GrowthChannel,
  IntelItem,
  Integration,
  ProductBand,
  Risk,
  Timeline,
} from "./types.ts";

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  strategy: "Discovery & product strategy",
  pm: "Project management",
  design: "Design",
  engineering: "Engineering",
  qa: "QA & testing",
  devops: "Deployment & infrastructure",
  content: "Content",
  growth: "Growth marketing",
  data: "Data engineering",
};

/** Project management, as a share of every package's other hours. */
export const PM_SHARE = 0.1;

/** Testing effort as a share of the engineering it covers. */
export const QA_SHARE = { website: 0.1, module: 0.15, integration: 0.15, lite: 0.1, dataWork: 0.1 };

/**
 * Per-package spread around the likely hours. Ranges are asymmetric because software work
 * overruns far more often than it underruns. Contingency is priced to roughly the 70th
 * percentile of a PERT distribution over each range.
 */
export const RISK: Record<Risk, { low: number; high: number; contingency: number; label: string }> = {
  known: { low: 0.08, high: 0.15, contingency: 0.03, label: "Well understood" },
  some: { low: 0.1, high: 0.35, contingency: 0.08, label: "Some unknowns" },
  high: { low: 0.12, high: 0.7, contingency: 0.17, label: "Significant unknowns" },
};

export const DESIGN_TIERS: Record<
  DesignTier,
  {
    label: string;
    systemHrs: number;
    perScreen: number;
    rounds: number;
    siteSetup: number;
    sitePerPage: number;
    brandHrs: number;
    storeTheme: number;
  }
> = {
  // Proven template/CMS, adapted to the brand.
  efficient: {
    label: "Clean & efficient",
    systemHrs: 2,
    perScreen: 1.25,
    rounds: 1,
    siteSetup: 2,
    sitePerPage: 1.5,
    brandHrs: 4,
    storeTheme: 6,
  },
  // Designed from scratch, custom-coded front end.
  custom: {
    label: "Distinctive & custom",
    systemHrs: 10,
    perScreen: 3,
    rounds: 2,
    siteSetup: 8,
    sitePerPage: 3,
    brandHrs: 14,
    storeTheme: 16,
  },
  // Deep UX research, motion and custom interactions.
  premium: {
    label: "Premium product experience",
    systemHrs: 20,
    perScreen: 5,
    rounds: 3,
    siteSetup: 12,
    sitePerPage: 4.5,
    brandHrs: 28,
    storeTheme: 30,
  },
};

/** Logins, database, API, admin shell and environments. Built once, shared by every platform. */
export const FOUNDATION = {
  engineering: 32,
  devops: 6,
  qaShare: 0.1,
  rolesIncluded: 2,
  perExtraRole: { engineering: 4, qa: 1.5 },
};

export const PLATFORMS = {
  webapp: { label: "Web application", detail: "App shell, navigation, profile and settings", screens: 4, engineering: 20, risk: "some" as Risk },
  internal: { label: "Internal system", detail: "Staff-facing shell, navigation and settings", screens: 3, engineering: 14, risk: "known" as Risk },
  saasLayer: { label: "SaaS layer", detail: "Onboarding, subscriptions, teams and plan limits", screens: 6, engineering: 60, risk: "some" as Risk, strategy: 12 },
  app: { label: "Mobile app", detail: "Cross-platform app, push notifications, store submission", screens: 5, engineering: 50, risk: "some" as Risk },
  storeCustom: { label: "Online store — custom", detail: "Storefront, cart, checkout, orders, {invoices}, coupons", screens: 7, engineering: 95, risk: "some" as Risk },
  storeHosted: { label: "Online store — Shopify", detail: "Theme, checkout, payment and tax setup, essential apps", engineering: 14, risk: "known" as Risk },
};

/** Content pages a store gets without a separate website. */
export const STORE_CONTENT_PAGES = 4;

export const APP_PLATFORM = {
  /** Extra engineering for shipping to both stores from one codebase. */
  bothUplift: 0.15,
  submissionHrs: { android: 3, ios: 4, both: 6 },
  qaShare: 0.2,
  /** Mobile UI for a feature reuses its API, so costs a share of the web engineering. */
  featureShare: 0.6,
  /** Share of a feature's engineering that is back end — all that's left when the app is its only screen. */
  backendShare: 0.5,
};

/** Keys into each market's `monthly` price table. */
export type MonthlyKey = "seo" | "paid" | "intel" | "whatsapp" | "sms" | "maps" | "booking" | "crm" | "automation";

interface FeatureSpec {
  label: string;
  detail: string;
  screens: number;
  engineering: number;
  customerFacing: boolean;
  risk: Risk;
  /** True when there's no off-the-shelf way to do it — forces the platform foundation. */
  needsPlatform?: boolean;
  /** The off-the-shelf version, used when there's no custom platform to build it on. */
  lite?: { label: string; detail: string; engineering: number; screens?: number; monthly?: MonthlyKey };
}

export const FEATURES: Record<Feature, FeatureSpec> = {
  catalogue: {
    label: "Catalogue",
    detail: "Listing, filters and detail pages",
    screens: 2,
    engineering: 14,
    customerFacing: true,
    risk: "known",
    lite: { label: "Catalogue pages", detail: "Editable product/service collection in the CMS", engineering: 6, screens: 2 },
  },
  accounts: {
    label: "Customer accounts",
    detail: "Sign-up, OTP login, profile, password reset",
    screens: 3,
    engineering: 12,
    customerFacing: true,
    risk: "known",
    needsPlatform: true,
  },
  payments: {
    label: "Payments",
    detail: "Gateway ({payments}), webhooks, receipts, refunds, {invoices}",
    screens: 2,
    engineering: 18,
    customerFacing: true,
    risk: "some",
    lite: { label: "Payment links", detail: "{payments} payment page or button", engineering: 3 },
  },
  booking: {
    label: "Bookings",
    detail: "Slots, availability rules, reminders, rescheduling",
    screens: 3,
    engineering: 24,
    customerFacing: true,
    risk: "some",
    lite: { label: "Online booking", detail: "{booking}, embedded and branded", engineering: 3, monthly: "booking" },
  },
  admin: {
    label: "Admin panel",
    detail: "Manage records, users, orders and settings",
    screens: 4,
    engineering: 22,
    customerFacing: false,
    risk: "known",
    lite: { label: "Content editing", detail: "CMS set up for your team, plus a training session", engineering: 4 },
  },
  crm: {
    label: "CRM & lead pipeline",
    detail: "Pipeline, lead detail, follow-ups, import/export, source tracking",
    screens: 4,
    engineering: 26,
    customerFacing: false,
    risk: "some",
    lite: { label: "Lead capture into CRM", detail: "Forms routed into {crmLite}", engineering: 6, monthly: "crm" },
  },
  dashboard: {
    label: "Dashboards & reports",
    detail: "Overview and reports on your own data",
    screens: 2,
    engineering: 16,
    customerFacing: false,
    risk: "some",
    lite: { label: "Reporting dashboard", detail: "Looker Studio on your analytics and form data", engineering: 6 },
  },
  automation: {
    label: "Automations",
    detail: "Rules that send emails, WhatsApp messages and task reminders",
    screens: 1,
    engineering: 16,
    customerFacing: false,
    risk: "some",
    lite: { label: "Automations", detail: "Notifications via Zapier or Make", engineering: 5, monthly: "automation" },
  },
  custom: {
    label: "Custom workflow",
    detail: "Your own process — quotations, approvals, job tracking",
    screens: 4,
    engineering: 40,
    customerFacing: false,
    risk: "high",
    needsPlatform: true,
  },
};

export const PRODUCT_BANDS: Record<
  ProductBand,
  { label: string; content: number; data: number; engineering: number; risk: Risk }
> = {
  s: { label: "Up to 50", content: 3, data: 0, engineering: 0, risk: "known" },
  m: { label: "50–500", content: 1, data: 5, engineering: 0, risk: "known" },
  l: { label: "500–5,000", content: 0, data: 18, engineering: 8, risk: "some" },
  xl: { label: "5,000+", content: 0, data: 32, engineering: 20, risk: "high" },
};

export const INTEGRATIONS: Record<
  Integration,
  { label: string; detail: string; engineering: number; lite: number; risk: Risk; monthly?: MonthlyKey }
> = {
  whatsapp: {
    label: "WhatsApp Business API",
    detail: "Lead alerts, order updates and templates {whatsapp}",
    engineering: 14,
    lite: 4,
    risk: "some",
    monthly: "whatsapp",
  },
  accounting: {
    label: "Accounting — {accounting}",
    detail: "Invoices and payments synced to your books",
    engineering: 20,
    lite: 8,
    risk: "high",
  },
  shipping: {
    label: "Shipping — {shipping}",
    detail: "Rates, labels and tracking",
    engineering: 10,
    lite: 3,
    risk: "some",
  },
  sms: { label: "SMS & OTP", detail: "Login codes and transactional SMS", engineering: 6, lite: 2, risk: "known", monthly: "sms" },
  sheets: { label: "Google Sheets sync", detail: "Two-way sync with a sheet your team already uses", engineering: 6, lite: 3, risk: "known" },
  crm_ext: {
    label: "Your existing CRM",
    detail: "{crm} kept in sync",
    engineering: 14,
    lite: 6,
    risk: "some",
  },
  maps: { label: "Maps & store locator", detail: "Branch locator and directions", engineering: 8, lite: 3, risk: "known", monthly: "maps" },
  other: {
    label: "Another system",
    detail: "ERP, inventory or in-house software",
    engineering: 24,
    lite: 24,
    risk: "high",
  },
};

export const LANGUAGES = {
  setupEngineering: 6,
  /** Per extra language, as a share of customer-facing front-end engineering. */
  perLanguageShare: 0.12,
  perLanguageQa: 3,
  /** Arabic: mirrored layouts, bidirectional text, Arabic type — on top of translation. */
  rtlEngineeringShare: 0.15,
  rtlDesignShare: 0.1,
};

export const CONTENT = {
  copyPerPage: 1.5,
  copyStore: 6,
  visualsPerPage: 1,
  visualsStore: 4,
};

export const MIGRATION = { data: 16, engineering: 8, qa: 2 };

export const DISCOVERY = {
  share: 0.06,
  min: 2,
  max: 60,
  productDiscovery: 10,
  softwareAudit: 6,
  migrationPlanning: 3,
};

export const LAUNCH = { devopsSimple: 2, devopsPlatform: 8, analytics: 1 };

/** Enquiry forms, WhatsApp button and technical SEO on every website. */
export const SITE_EXTRAS = 3;

export const GROWTH: Record<
  GrowthChannel,
  { label: string; detail: string; growth: number; design?: number; engineering?: number; devops?: number; monthly?: MonthlyKey }
> = {
  seo: {
    label: "SEO foundation",
    detail: "Keyword research, on-page fixes, Google Business Profile, Search Console",
    growth: 12,
    monthly: "seo",
  },
  paid: {
    label: "Paid campaigns setup",
    detail: "Google / Meta account structure, first campaigns, conversion goals",
    growth: 10,
    monthly: "paid",
  },
  media: { label: "Media plan", detail: "Channel mix, budget split, 90-day calendar", growth: 10 },
  leads: {
    label: "Lead capture & qualification",
    detail: "Landing page, forms and routing rules",
    growth: 10,
    design: 4,
    engineering: 4,
  },
  sales: {
    label: "Sales enablement kit",
    detail: "Call scripts, WhatsApp templates, one-page collateral",
    growth: 10,
    design: 6,
  },
  analytics: {
    label: "Analytics & conversion tracking",
    detail: "GA4, Tag Manager, ad pixels and conversion events",
    growth: 6,
    devops: 2,
  },
};

export const INTEL: Record<
  IntelItem,
  { label: string; detail: string; data: number; design?: number; risk: Risk; monthly?: MonthlyKey }
> = {
  research: {
    label: "Competitor research report",
    detail: "Up to 10 competitors: pricing, positioning, offers",
    data: 16,
    risk: "known",
  },
  pricing: { label: "Pricing monitor", detail: "Scheduled capture of public competitor prices", data: 20, risk: "some" },
  products: {
    label: "Product & catalogue monitor",
    detail: "New launches, discontinued lines, range changes",
    data: 20,
    risk: "some",
  },
  public: {
    label: "Public-web dataset",
    detail: "Structured collection from public sources you name",
    data: 24,
    risk: "high",
  },
  dashboard: {
    label: "Intelligence dashboard",
    detail: "Prices, changes and alerts on one screen",
    data: 14,
    design: 4,
    risk: "some",
  },
  recurring: {
    label: "Scheduled refresh & alerts",
    detail: "Weekly refresh with change alerts",
    data: 8,
    risk: "known",
    monthly: "intel",
  },
};

/** Productive hours a week per role on one project, and team-size thresholds. */
export const CAPACITY = {
  strategy: 16,
  /** One designer up to `from` hours; ramps to a pair by `to`. */
  design: { solo: 24, pair: 44, from: 80, to: 160 },
  engineering: { solo: 28, pair: 52, from: 110, to: 220 },
  launch: 24,
  growth: 18,
  data: 20,
  content: 20,
  reviewWeeksPerRound: 0.5,
  designBuildOverlap: 0.4,
  appStoreReviewWeeks: 1,
  minWeeks: 2,
};

/** Latest go-live week each timeline answer allows. `null` = no deadline. */
export const WINDOWS: Record<Timeline, number | null> = {
  explore: null,
  one: 8,
  three: 16,
  six: 26,
  later: null,
};

export const TIMELINE_LABEL: Record<Timeline, string> = {
  explore: "No fixed date",
  one: "1–2 months",
  three: "3–4 months",
  six: "4–6 months",
  later: "6+ months",
};

export const RUSH = {
  /** Beyond this, adding people makes things slower — we phase instead. */
  maxCompression: 0.3,
  premiumPerCompression: 1.25,
  minPremium: 0.1,
};

/** No deadline lets us schedule around other work. */
export const FLEX_DISCOUNT = 0.04;

/** Over the top of the budget band by up to this much is "tight", beyond it we phase. */
export const BUDGET_TIGHT = 0.15;

/** Optional maintenance plan, per year, as a share of the build fee. */
export const MAINTENANCE_SHARE = 0.15;

export type MilestoneAt = "start" | "design" | "build" | "launch";

/** Two, three and four milestones; which one applies depends on the market's `paymentBands`. */
export const PAYMENT_SCHEDULES: [string, number, MilestoneAt][][] = [
  [["On signing", 50, "start"], ["On launch", 50, "launch"]],
  [["On signing", 40, "start"], ["Design approved", 30, "design"], ["On launch", 30, "launch"]],
  [
    ["On signing", 30, "start"],
    ["Design approved", 25, "design"],
    ["Build complete — testing starts", 25, "build"],
    ["On launch", 20, "launch"],
  ],
];

export const WARRANTY_DAYS = 30;
