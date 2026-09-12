/**
 * The things a good consultant raises in the meeting: contradictions, gaps, and cheaper ways
 * to get the same outcome. Every fix carries its price impact, computed by re-running the engine.
 */
import type { Core } from "./estimate.ts";
import { formatter } from "./format.ts";
import { MARKETS } from "./markets.ts";
import { TIMELINE_LABEL, WINDOWS } from "./ratecard.ts";
import { applyPatch } from "./scope.ts";
import type { Check, CheckLevel, Scope, Timeline } from "./types.ts";

const ORDER: Record<CheckLevel, number> = { crit: 0, warn: 1, tip: 2 };

export function runChecks(core: Core, priceOf: (s: Scope) => number): Check[] {
  const s = core.scope;
  const m = MARKETS[s.market];
  const money = formatter(s.market);
  const b = new Set(s.build);
  const f = new Set(s.features);
  const g = new Set(s.growth);
  const intel = new Set(s.intel);
  const goals = new Set(s.goals);
  const out: Check[] = [];

  const fix = (label: string, patch: Partial<Scope>) => ({
    label,
    patch,
    delta: priceOf(applyPatch(s, patch)) - core.fixedPrice,
  });

  if (core.set.packages.length === 0) {
    return [{ id: "empty", level: "crit", title: "Nothing to estimate yet", detail: "Pick at least one thing to build, grow or monitor." }];
  }

  const tl = core.timeline;
  if (tl.status === "rush" || tl.status === "infeasible") {
    const next: Timeline =
      (["three", "six"] as Timeline[]).find((t) => (WINDOWS[t] ?? 0) >= tl.naturalWeeks) ?? "later";
    const move = fix(`Move to ${TIMELINE_LABEL[next]}`, { timeline: next });
    if (tl.status === "infeasible") {
      out.push({
        id: "timeline-infeasible",
        level: "crit",
        title: `${tl.naturalWeeks} weeks of work won't fit in ${TIMELINE_LABEL[s.timeline]}`,
        detail:
          "Squeezing a schedule by more than 30% costs quality, not just money." +
          (core.phasePlan?.reason === "timeline" ? " The phase plan shows what can go live in time." : ""),
        fix: move,
      });
    } else {
      const rush = core.adjustments.find((a) => a.id === "rush");
      out.push({
        id: "timeline-rush",
        level: "warn",
        title: `Rush premium of ${money.delta(Math.round((rush?.cost ?? 0) / m.round) * m.round)} to go live in ${tl.weeks} weeks`,
        detail: `At normal pace this is ${tl.naturalWeeks} weeks. A later deadline removes the premium.`,
        fix: move,
      });
    }
  }

  if (goals.has("leads") && g.size === 0 && !f.has("crm")) {
    out.push({
      id: "leads-no-engine",
      level: "warn",
      title: "A website on its own won't bring leads",
      detail: "Traffic needs a channel, and leads need somewhere to land and get followed up.",
      fix: fix("Add SEO + lead capture", { growth: [...s.growth, "seo", "leads"] }),
    });
  }

  if (g.has("paid") && !g.has("analytics")) {
    out.push({
      id: "ads-blind",
      level: "warn",
      title: "Paid ads without conversion tracking",
      detail: "Without it there's no way to tell which rupee of ad spend produced an enquiry.",
      fix: fix("Add conversion tracking", { growth: [...s.growth, "analytics"] }),
    });
  }

  if ((intel.has("recurring") || intel.has("dashboard")) && !(["research", "pricing", "products", "public"] as const).some((x) => intel.has(x))) {
    out.push({
      id: "monitor-nothing",
      level: "warn",
      title: "Monitoring needs something to monitor",
      detail: "A refresh schedule or dashboard with no data source behind it has nothing to show.",
      fix: fix("Add a pricing monitor", { intel: [...s.intel, "pricing"] }),
    });
  }

  if (b.has("store") && !s.integrations.includes("shipping")) {
    out.push({
      id: "store-shipping",
      level: "tip",
      title: "Most stores need shipping connected",
      detail: `Without ${m.vendors.shipping} wired in, your team books and tracks every shipment by hand.`,
      fix: fix("Add shipping", { integrations: [...s.integrations, "shipping"] }),
    });
  }

  if (core.set.store?.approach === "hosted" && b.has("website")) {
    out.push({
      id: "shopify-is-site",
      level: "tip",
      title: "Your Shopify store can be your website",
      detail: "A separate site means two places to update. Content pages can live on Shopify.",
      fix: fix("Drop the separate website", { build: s.build.filter((p) => p !== "website") }),
    });
  }

  const otherPlatforms = (["webapp", "app", "saas", "internal"] as const).some((p) => b.has(p));
  if (
    s.storeApproach === "custom" &&
    (s.products === "s" || s.products === "m") &&
    !f.has("custom") &&
    !otherPlatforms &&
    !s.integrations.includes("other")
  ) {
    out.push({
      id: "custom-store-small",
      level: "tip",
      title: "At this size, Shopify does the job",
      detail: "Under 500 products with a standard checkout — a proven platform is faster and cheaper to run.",
      fix: fix("Switch to Shopify", { storeApproach: "hosted" }),
    });
  }

  if (b.has("app") && (b.has("webapp") || b.has("website") || b.has("store")) && !goals.has("product")) {
    out.push({
      id: "web-first",
      level: "tip",
      title: "Launch on the web first?",
      detail: "A mobile-friendly site covers most of what the app would. Add the app once usage proves people want it.",
      fix: fix("Hold the app for later", { build: s.build.filter((p) => p !== "app") }),
    });
  }

  if (core.set.featureMode.accounts === "module" && !otherPlatforms && core.set.store?.approach !== "custom" && !f.has("custom")) {
    out.push({
      id: "accounts-platform",
      level: "tip",
      title: "Customer logins turn the website into a web app",
      detail: "That's what adds the platform foundation — logins, a database, and hosting to match.",
      fix: fix("Skip customer logins", { features: s.features.filter((x) => x !== "accounts") }),
    });
  }

  if ((s.starting.includes("software") || s.starting.includes("data")) && !s.migration) {
    out.push({
      id: "migration-missing",
      level: "tip",
      title: "Moving your existing records isn't included",
      detail: "If customers, orders or products live in your current system, someone has to move and check them.",
      fix: fix("Add data migration", { migration: true }),
    });
  }

  if (goals.has("sales") && !f.has("crm")) {
    out.push({
      id: "sales-no-crm",
      level: "tip",
      title: "Easier sales usually starts with a CRM",
      detail: "One place for every enquiry, where it stands, and who follows up next.",
      fix: fix("Add a CRM", { features: [...s.features, "crm"] }),
    });
  }

  if (goals.has("operations") && !b.has("internal") && !(["admin", "automation", "dashboard", "custom"] as const).some((x) => f.has(x))) {
    out.push({
      id: "ops-no-system",
      level: "tip",
      title: "Running the business better needs a system to run it on",
      detail: "Nothing selected yet replaces the spreadsheets and WhatsApp threads.",
      fix: fix("Add an internal system", { build: [...s.build, "internal"], features: [...s.features, "admin"] }),
    });
  }

  if (goals.has("data") && intel.size === 0) {
    out.push({
      id: "data-no-intel",
      level: "tip",
      title: "You want to understand the market, but nothing tracks it",
      detail: "A one-off competitor report is the cheapest way to start.",
      fix: fix("Add competitor research", { intel: [...s.intel, "research"] }),
    });
  }

  return out.sort((a, c) => ORDER[a.level] - ORDER[c.level]);
}
