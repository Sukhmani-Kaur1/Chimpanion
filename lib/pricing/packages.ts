/**
 * Scope → work packages. Each package is one thing the client could point at and say
 * "that's what I'm paying for", with its own hours per discipline, risk and priority.
 */
import {
  APP_PLATFORM,
  CONTENT,
  DESIGN_TIERS,
  DISCOVERY,
  FEATURES,
  FOUNDATION,
  GROWTH,
  INTEGRATIONS,
  INTEL,
  LANGUAGES,
  LAUNCH,
  MIGRATION,
  PLATFORMS,
  PM_SHARE,
  PRODUCT_BANDS,
  QA_SHARE,
  SITE_EXTRAS,
  STORE_CONTENT_PAGES,
} from "./ratecard.ts";
import { MARKETS, type MarketSpec } from "./markets.ts";
import { FEATURE_LIST } from "./scope.ts";
import type { Discipline, Feature, Goal, Priority, Scope, WorkPackage } from "./types.ts";

export interface StoreResolution {
  approach: "hosted" | "custom";
  reason: string;
}

/** Features that directly serve each goal — these are Phase 1 when we have to phase. */
const GOAL_FEATURES: Record<Goal, Feature[]> = {
  online: ["catalogue"],
  leads: ["crm"],
  sales: ["crm", "catalogue", "payments"],
  operations: ["admin", "dashboard", "automation", "custom"],
  product: ["accounts", "payments"],
  data: ["dashboard"],
};

const CUSTOMER_FACING_APP: Feature[] = ["catalogue", "accounts", "payments", "booking"];

export function resolveStore(scope: Scope): StoreResolution | null {
  if (!scope.build.includes("store")) return null;
  if (scope.storeApproach === "hosted") return { approach: "hosted", reason: "Shopify, as chosen." };
  if (scope.storeApproach === "custom") return { approach: "custom", reason: "Custom build, as chosen." };
  if (scope.features.includes("custom"))
    return { approach: "custom", reason: "Custom — your workflow needs logic Shopify can't hold." };
  if (scope.integrations.includes("other"))
    return { approach: "custom", reason: "Custom — it has to talk to your ERP or in-house system." };
  if (scope.build.some((p) => p === "webapp" || p === "app" || p === "saas" || p === "internal"))
    return { approach: "custom", reason: "Custom — it shares the platform we're already building." };
  return {
    approach: "hosted",
    reason: "Shopify — a standard checkout with no custom workflow, so a proven platform beats building one.",
  };
}

const half = (n: number) => Math.round(n * 2) / 2;

/** Fill {payments}, {shipping}… with the client market's local providers. */
function vendorize(text: string, v: MarketSpec["vendors"]): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in v ? v[k as keyof typeof v] : `{${k}}`));
}

function finish(p: WorkPackage, m: MarketSpec): WorkPackage {
  const hours: Partial<Record<Discipline, number>> = {};
  let sum = 0;
  for (const [d, h] of Object.entries(p.hours)) {
    if (!h) continue;
    hours[d as Discipline] = half(h);
    sum += h;
  }
  hours.pm = half(sum * PM_SHARE);
  return { ...p, label: vendorize(p.label, m.vendors), detail: vendorize(p.detail, m.vendors), hours };
}

export interface PackageSet {
  packages: WorkPackage[];
  store: StoreResolution | null;
  hasPlatform: boolean;
  /** How each selected feature is delivered. */
  featureMode: Partial<Record<Feature, "included" | "module" | "lite">>;
}

export function buildPackages(scope: Scope): PackageSet {
  const m = MARKETS[scope.market];
  const tier = DESIGN_TIERS[scope.design];
  const b = new Set(scope.build);
  const goals = new Set(scope.goals);
  const store = resolveStore(scope);

  const included = new Set<Feature>();
  if (store) {
    included.add("catalogue");
    included.add("payments");
    if (store.approach === "hosted") {
      included.add("accounts");
      included.add("admin");
    }
  }

  const selected = scope.features.filter((f) => !included.has(f));
  const hasPlatform =
    (["webapp", "app", "saas", "internal"] as const).some((p) => b.has(p)) ||
    store?.approach === "custom" ||
    selected.some((f) => FEATURES[f].needsPlatform);

  const makingThings = b.size > 0 || scope.features.length > 0;
  // Where customers use features in a browser; a marketing website doesn't count.
  const webCustomerSurface = b.has("webapp") || b.has("saas") || store?.approach === "custom";
  const goalFeatures = new Set(scope.goals.flatMap((g) => GOAL_FEATURES[g]));
  const pk: WorkPackage[] = [];

  const featureMode: PackageSet["featureMode"] = {};
  for (const f of scope.features) {
    featureMode[f] = included.has(f) ? "included" : hasPlatform ? "module" : "lite";
  }

  if (makingThings) {
    pk.push({
      id: "design-system",
      label: "Design system",
      detail: `${tier.label} — type, colour, components, ${tier.rounds} revision round${tier.rounds > 1 ? "s" : ""}`,
      hours: { design: tier.systemHrs },
      risk: "known",
      priority: 1,
      track: "build",
    });
    if (b.size > 0 && !scope.starting.includes("brand")) {
      pk.push({
        id: "brand",
        label: "Brand basics",
        detail: "Logo refresh, palette and typography — there's no brand to work from yet",
        hours: { design: tier.brandHrs },
        risk: "known",
        priority: 1,
        track: "build",
      });
    }
  }

  if (b.has("website")) {
    const n = scope.pages;
    const eng = tier.siteSetup + n * tier.sitePerPage + SITE_EXTRAS;
    pk.push({
      id: "website",
      label: `Website — ${n} page${n > 1 ? "s" : ""}`,
      detail: `${scope.design === "efficient" ? "Template-based" : "Custom-coded"}, responsive, enquiry forms, WhatsApp button, technical SEO`,
      hours: { design: n * tier.perScreen, engineering: eng, qa: eng * QA_SHARE.website },
      risk: "known",
      priority: 1,
      track: "build",
      source: { field: "build", value: "website" },
    });
  }

  if (store) {
    const pages = b.has("website") ? 0 : STORE_CONTENT_PAGES;
    if (store.approach === "hosted") {
      const spec = PLATFORMS.storeHosted;
      pk.push({
        id: "store",
        label: spec.label,
        detail: `${spec.detail}${pages ? `, ${pages} content pages` : ""}`,
        hours: {
          design: tier.storeTheme + pages * tier.perScreen,
          engineering: spec.engineering + pages * tier.sitePerPage,
          qa: 3,
        },
        risk: spec.risk,
        priority: 1,
        track: "build",
        source: { field: "build", value: "store" },
      });
    } else {
      const spec = PLATFORMS.storeCustom;
      const eng = spec.engineering + pages * tier.sitePerPage;
      pk.push({
        id: "store",
        label: spec.label,
        detail: `${spec.detail}${pages ? `, ${pages} content pages` : ""}`,
        hours: {
          design: (spec.screens + pages) * tier.perScreen,
          engineering: eng,
          qa: eng * QA_SHARE.module,
        },
        risk: spec.risk,
        priority: 1,
        track: "build",
        source: { field: "build", value: "store" },
      });
    }
  }

  if (hasPlatform) {
    const extra = Math.max(0, scope.roles - FOUNDATION.rolesIncluded);
    const eng = FOUNDATION.engineering + extra * FOUNDATION.perExtraRole.engineering;
    pk.push({
      id: "foundation",
      label: "Platform foundation",
      detail: `Logins, database, API, admin shell and environments for ${scope.roles} kind${scope.roles > 1 ? "s" : ""} of user`,
      hours: {
        engineering: eng,
        qa: eng * FOUNDATION.qaShare + extra * FOUNDATION.perExtraRole.qa,
        devops: FOUNDATION.devops,
      },
      risk: "known",
      priority: 1,
      track: "build",
    });
  }

  const shell = (id: "webapp" | "internal", spec: { label: string; detail: string; screens: number; engineering: number }, risk: WorkPackage["risk"]) => {
    pk.push({
      id,
      label: spec.label,
      detail: spec.detail,
      hours: {
        design: spec.screens * tier.perScreen,
        engineering: spec.engineering,
        qa: spec.engineering * QA_SHARE.module,
      },
      risk,
      priority: 1,
      track: "build",
      source: { field: "build", value: id },
    });
  };
  if (b.has("webapp")) shell("webapp", PLATFORMS.webapp, PLATFORMS.webapp.risk);
  if (b.has("internal")) shell("internal", PLATFORMS.internal, PLATFORMS.internal.risk);

  if (b.has("saas")) {
    const layer = PLATFORMS.saasLayer;
    const base = b.has("webapp") ? { screens: 0, engineering: 0 } : PLATFORMS.webapp;
    const eng = layer.engineering + base.engineering;
    pk.push({
      id: "saas",
      label: "SaaS product layer",
      detail: `${layer.detail}${base.engineering ? ", plus the app shell" : ""}`,
      hours: {
        strategy: layer.strategy,
        design: (layer.screens + base.screens) * tier.perScreen,
        engineering: eng,
        qa: eng * QA_SHARE.module,
      },
      risk: layer.risk,
      priority: 1,
      track: "build",
      source: { field: "build", value: "saas" },
    });
  }

  for (const f of FEATURE_LIST) {
    if (!scope.features.includes(f) || included.has(f)) continue;
    const spec = FEATURES[f];
    let priority: Priority = goalFeatures.has(f) ? 2 : 3;
    if (f === "accounts" && (b.has("app") || b.has("saas"))) priority = 1;
    const source = { field: "features" as const, value: f };

    if (hasPlatform) {
      const count = f === "custom" ? scope.workflows : 1;
      const appOnly = b.has("app") && spec.customerFacing && !webCustomerSurface;
      const eng = spec.engineering * count * (appOnly ? APP_PLATFORM.backendShare : 1);
      pk.push({
        id: `feature-${f}`,
        label: f === "custom" && count > 1 ? `Custom workflows ×${count}` : spec.label,
        detail: appOnly ? `${spec.detail} — back end here, screens in the mobile app` : spec.detail,
        hours: {
          design: appOnly ? 0 : spec.screens * count * tier.perScreen,
          engineering: eng,
          qa: eng * QA_SHARE.module,
        },
        risk: spec.risk,
        priority,
        track: "build",
        source,
      });
    } else if (spec.lite) {
      const lite = spec.lite;
      pk.push({
        id: `feature-${f}`,
        label: lite.label,
        detail: lite.detail,
        hours: {
          design: (lite.screens ?? 0) * tier.perScreen,
          engineering: lite.engineering,
          qa: lite.engineering * QA_SHARE.lite,
        },
        risk: "known",
        priority,
        track: "build",
        source,
      });
    }
  }

  if (b.has("app")) {
    const mobile = CUSTOMER_FACING_APP.filter((f) => scope.features.includes(f) || included.has(f));
    const screens = PLATFORMS.app.screens + mobile.reduce((s, f) => s + FEATURES[f].screens, 0);
    let eng =
      PLATFORMS.app.engineering +
      mobile.reduce((s, f) => s + FEATURES[f].engineering * APP_PLATFORM.featureShare, 0);
    if (scope.appPlatforms === "both") eng *= 1 + APP_PLATFORM.bothUplift;
    const others = scope.build.some((p) => p !== "app");
    const which = { android: "Android", ios: "iOS", both: "Android + iOS" }[scope.appPlatforms];
    pk.push({
      id: "app",
      label: `Mobile app — ${which}`,
      detail: `${screens} screens${mobile.length ? ` incl. ${mobile.map((f) => FEATURES[f].label.toLowerCase()).join(", ")}` : ""}, push notifications, store submission`,
      hours: {
        design: screens * tier.perScreen,
        engineering: eng,
        qa: eng * APP_PLATFORM.qaShare,
        devops: APP_PLATFORM.submissionHrs[scope.appPlatforms],
      },
      risk: PLATFORMS.app.risk,
      priority: others ? (goals.has("product") ? 2 : 3) : 1,
      track: "build",
      source: { field: "build", value: "app" },
    });
  }

  if (store || scope.features.includes("catalogue")) {
    const band = PRODUCT_BANDS[scope.products];
    const work = band.data + band.engineering;
    pk.push({
      id: "catalogue-import",
      label: `Product data — ${band.label} items`,
      detail:
        scope.products === "s"
          ? "Loaded by hand from a spreadsheet you provide"
          : "Import pipeline, image handling and clean-up from your spreadsheet or old system",
      hours: {
        content: band.content,
        data: band.data,
        engineering: band.engineering,
        qa: work * QA_SHARE.dataWork,
      },
      risk: band.risk,
      priority: 1,
      track: "build",
    });
  }

  for (const i of scope.integrations) {
    const spec = INTEGRATIONS[i];
    const eng = hasPlatform ? spec.engineering : spec.lite;
    let priority: Priority = 3;
    if (i === "shipping" && store) priority = 2;
    if (i === "sms" && scope.features.includes("accounts")) priority = 2;
    if (i === "whatsapp" && (goals.has("leads") || goals.has("sales"))) priority = 2;
    if (i === "accounting" && goals.has("operations")) priority = 2;
    if (i === "crm_ext" && scope.starting.includes("crm")) priority = 2;
    pk.push({
      id: `integration-${i}`,
      label: spec.label,
      detail: hasPlatform ? spec.detail : `${spec.detail} — via off-the-shelf connectors`,
      hours: { engineering: eng, qa: eng * QA_SHARE.integration },
      risk: hasPlatform || spec.risk === "known" ? spec.risk : "some",
      priority,
      track: "build",
      source: { field: "integrations", value: i },
    });
  }

  const extraLanguages = scope.languages - 1;
  if (extraLanguages > 0 && makingThings) {
    const frontIds = new Set(["website", "store", "app", ...CUSTOMER_FACING_APP.map((f) => `feature-${f}`)]);
    const front = pk.filter((p) => frontIds.has(p.id));
    const frontEng = front.reduce((s, p) => s + (p.hours.engineering ?? 0), 0);
    const frontDesign = front.reduce((s, p) => s + (p.hours.design ?? 0), 0);
    const n = scope.languages === 3 ? "3+" : String(scope.languages);
    pk.push({
      id: "languages",
      label: m.rtl ? `${n} languages, incl. Arabic` : `${n} languages`,
      detail: m.rtl
        ? "Arabic with a mirrored right-to-left layout, language switcher, localised dates and numbers"
        : "Language switcher, translation-ready content, localised dates and numbers",
      hours: {
        engineering:
          LANGUAGES.setupEngineering +
          extraLanguages * frontEng * LANGUAGES.perLanguageShare +
          (m.rtl ? frontEng * LANGUAGES.rtlEngineeringShare : 0),
        design: m.rtl ? frontDesign * LANGUAGES.rtlDesignShare : 0,
        qa: extraLanguages * LANGUAGES.perLanguageQa,
      },
      risk: "known",
      priority: 3,
      track: "build",
      source: { field: "languages" },
    });
  }

  if (scope.content !== "provided" && makingThings) {
    const pages = (b.has("website") ? scope.pages : 0) + (store && !b.has("website") ? STORE_CONTENT_PAGES : 0);
    const visuals = scope.content === "copy_visuals";
    const words = pages * CONTENT.copyPerPage + (store ? CONTENT.copyStore : 0);
    const art = visuals ? pages * CONTENT.visualsPerPage + (store ? CONTENT.visualsStore : 0) : 0;
    if (words + art > 0) {
      pk.push({
        id: "content",
        label: visuals ? "Copywriting & visuals" : "Copywriting",
        detail: `Copy for ${pages} page${pages === 1 ? "" : "s"}${store ? " and product collections" : ""}${visuals ? ", plus sourced and edited visuals" : ""}`,
        hours: { content: words, design: art },
        risk: "known",
        priority: 1,
        track: "build",
        source: { field: "content" },
      });
    }
  }

  if (scope.migration) {
    pk.push({
      id: "migration",
      label: "Data migration",
      detail: "Move records from your current system, with a verification pass",
      hours: { data: MIGRATION.data, engineering: MIGRATION.engineering, qa: MIGRATION.qa },
      risk: "high",
      priority: scope.starting.includes("software") ? 1 : 2,
      track: "build",
      source: { field: "migration" },
    });
  }

  for (const g of scope.growth) {
    const spec = GROWTH[g];
    const priority: Priority =
      (g === "analytics" && scope.growth.includes("paid")) || goals.has("leads") || goals.has("online") || goals.has("sales")
        ? 2
        : 3;
    pk.push({
      id: `growth-${g}`,
      label: spec.label,
      detail: spec.detail,
      hours: { growth: spec.growth, design: spec.design, engineering: spec.engineering, devops: spec.devops },
      risk: "known",
      priority,
      track: "growth",
      source: { field: "growth", value: g },
    });
  }

  for (const x of scope.intel) {
    const spec = INTEL[x];
    pk.push({
      id: `intel-${x}`,
      label: spec.label,
      detail: spec.detail,
      hours: { data: spec.data, design: spec.design },
      risk: spec.risk,
      priority: goals.has("data") ? 2 : 3,
      track: "intel",
      source: { field: "intel", value: x },
    });
  }

  if (makingThings) {
    pk.push({
      id: "compliance",
      label: m.compliance.label,
      detail: m.compliance.detail,
      hours: m.compliance.hours,
      risk: "known",
      priority: 1,
      track: "build",
    });
    pk.push({
      id: "launch",
      label: "Launch",
      detail: "Hosting, domain, SSL, analytics and go-live checks, set up in your name",
      hours: { devops: (hasPlatform ? LAUNCH.devopsPlatform : LAUNCH.devopsSimple) + LAUNCH.analytics },
      risk: "known",
      priority: 1,
      track: "build",
    });
  }

  if (pk.length === 0) return { packages: [], store, hasPlatform, featureMode };

  const delivery = pk.reduce((s, p) => s + Object.values(p.hours).reduce((a, h) => a + (h ?? 0), 0), 0);
  const product = goals.has("product") && (b.has("saas") || b.has("webapp") || b.has("app"));
  const strategy =
    Math.min(DISCOVERY.max, Math.max(DISCOVERY.min, Math.round(delivery * DISCOVERY.share))) +
    (product ? DISCOVERY.productDiscovery : 0) +
    (scope.starting.includes("software") ? DISCOVERY.softwareAudit : 0) +
    (scope.migration ? DISCOVERY.migrationPlanning : 0);

  pk.unshift({
    id: "discovery",
    label: "Discovery & scoping",
    detail: `Workshop, requirements and user journeys${product ? ", product definition" : ""}${scope.starting.includes("software") ? ", audit of your current system" : ""} — ending in a signed-off scope`,
    hours: { strategy },
    risk: "known",
    priority: 1,
    track: "build",
  });

  return { packages: pk.map((p) => finish(p, m)), store, hasPlatform, featureMode };
}
