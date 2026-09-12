import { formatter } from "./format.ts";
import { MARKETS, type MarketSpec } from "./markets.ts";
import { buildPackages, type PackageSet } from "./packages.ts";
import {
  BUDGET_TIGHT,
  CAPACITY,
  DESIGN_TIERS,
  DISCIPLINE_LABEL,
  FEATURES,
  FLEX_DISCOUNT,
  GROWTH,
  INTEGRATIONS,
  INTEL,
  MAINTENANCE_SHARE,
  PAYMENT_SCHEDULES,
  RISK,
  RUSH,
  TIMELINE_LABEL,
  WINDOWS,
} from "./ratecard.ts";
import { runChecks } from "./checks.ts";
import { writeNotes } from "./notes.ts";
import { applyPatch, encodeScope, normalize, removalPatch } from "./scope.ts";
import type {
  Adjustment,
  Bar,
  BudgetFit,
  Confidence,
  CostedPackage,
  Discipline,
  DisciplineLine,
  Estimate,
  Milestone,
  PhasePlan,
  RunItem,
  RunningCosts,
  Scope,
  TimelinePlan,
  TimelineStatus,
  WorkPackage,
} from "./types.ts";

const BUILD_CRITICAL: Discipline[] = ["design", "engineering", "qa", "pm"];

/**
 * Weekly capacity grows with the workload as a second person joins. The ramp is shallow enough
 * that `hours / capacity` never falls as hours rise, so adding scope can't shorten a schedule.
 */
function capacity(hours: number, c: { solo: number; pair: number; from: number; to: number }): number {
  const t = Math.min(1, Math.max(0, (hours - c.from) / (c.to - c.from)));
  return c.solo + (c.pair - c.solo) * t;
}

export function packageCost(p: WorkPackage, rates: MarketSpec["rates"]): number {
  let c = 0;
  for (const [d, h] of Object.entries(p.hours)) c += (h ?? 0) * rates[d as Discipline];
  return c;
}

function costPackage(p: WorkPackage, rates: MarketSpec["rates"]): CostedPackage {
  const cost = packageCost(p, rates);
  const r = RISK[p.risk];
  const totalHours = Object.values(p.hours).reduce<number>((s, h) => s + (h ?? 0), 0);
  return { ...p, totalHours, cost, low: cost * (1 - r.low), high: cost * (1 + r.high), phase: 1 };
}

interface Schedule {
  weeks: number;
  bars: Bar[];
  designEnd: number;
  buildEnd: number;
  hasBuild: boolean;
}

/**
 * Phase-based schedule at normal team pace: discovery, then design with client review rounds,
 * build overlapping the tail of design, then QA and launch. Growth setup lands around launch;
 * intelligence runs in parallel with its own engineer.
 */
export function schedule(pkgs: WorkPackage[], scope: Scope): Schedule {
  if (pkgs.length === 0) return { weeks: 0, bars: [], designEnd: 0, buildEnd: 0, hasBuild: false };
  const sum = (track: WorkPackage["track"], ds: Discipline[]) =>
    pkgs
      .filter((p) => p.track === track)
      .reduce((s, p) => s + ds.reduce((a, d) => a + (p.hours[d] ?? 0), 0), 0);

  const strategy = sum("build", ["strategy"]);
  const design = sum("build", ["design"]);
  const content = sum("build", ["content"]);
  const eng = sum("build", ["engineering"]);
  const buildData = sum("build", ["data"]);
  const qaDevops = sum("build", ["qa", "devops"]);
  const growth = sum("growth", ["growth", "design", "engineering", "devops"]);
  const intel = sum("intel", ["data", "design"]);
  const C = CAPACITY;

  const discovery = strategy > 0 ? Math.max(0.5, strategy / C.strategy) : 0;
  const rounds = DESIGN_TIERS[scope.design].rounds;
  const designCap = capacity(design, C.design);
  const designW =
    design > 0
      ? Math.max(design / designCap, content / C.content) + rounds * (C.reviewWeeksPerRound + MARKETS[scope.market].reviewLag)
      : content / C.content;
  const designEnd = discovery + designW;
  const hasBuild = design + content + eng + buildData + qaDevops > 0;

  const engCap = capacity(eng, C.engineering);
  const buildStart = discovery + designW * (1 - C.designBuildOverlap);
  const buildEnd =
    eng + buildData > 0
      ? Math.max(buildStart + eng / engCap, buildStart + buildData / C.data, designEnd + 0.25)
      : designEnd;
  const launchW = hasBuild
    ? Math.max(0.25, qaDevops / C.launch) + (scope.build.includes("app") ? C.appStoreReviewWeeks : 0)
    : 0;
  const launchEnd = buildEnd + launchW;

  const growthW = growth / C.growth;
  const growthStart = hasBuild ? Math.max(discovery, launchEnd - growthW) : discovery;
  const intelW = intel / C.data;

  const bars: Bar[] = [];
  if (discovery > 0) bars.push({ id: "discovery", label: "Discovery", start: 0, end: discovery });
  if (designW > 0) bars.push({ id: "design", label: "Design", start: discovery, end: designEnd });
  if (eng + buildData > 0) bars.push({ id: "build", label: "Build", start: buildStart, end: buildEnd });
  if (launchW > 0) bars.push({ id: "launch", label: "Test & launch", start: buildEnd, end: launchEnd });
  if (growthW > 0) bars.push({ id: "growth", label: "Growth setup", start: growthStart, end: growthStart + growthW });
  if (intelW > 0) bars.push({ id: "intel", label: "Intelligence", start: discovery, end: discovery + intelW });

  const weeks = Math.ceil(
    Math.max(launchEnd, growthStart + growthW, discovery + intelW, C.minWeeks) - 1e-9
  );
  return { weeks, bars, designEnd, buildEnd, hasBuild };
}

interface Priced {
  costed: CostedPackage[];
  base: number;
  adjustments: Adjustment[];
  likely: number;
  contingency: number;
  fixedPrice: number;
  low: number;
  high: number;
  sched: Schedule;
  timeline: TimelinePlan;
}

/** Price any set of packages — the whole project, or one phase of it. */
function price(pkgs: WorkPackage[], scope: Scope): Priced {
  const m = MARKETS[scope.market];
  const costed = pkgs.map((p) => costPackage(p, m.rates));
  const base = costed.reduce((s, c) => s + c.cost, 0);
  const sched = schedule(pkgs, scope);
  const requested = WINDOWS[scope.timeline];
  const critical = pkgs
    .filter((p) => p.track === "build")
    .reduce((s, p) => s + BUILD_CRITICAL.reduce((a, d) => a + (p.hours[d] ?? 0) * m.rates[d], 0), 0);

  let status: TimelineStatus = requested === null ? "open" : "fits";
  let compression = 0;
  let weeks = sched.weeks;
  const adjustments: Adjustment[] = [];

  if (requested !== null && sched.weeks > requested) {
    compression = 1 - requested / sched.weeks;
    if (compression <= RUSH.maxCompression) {
      status = "rush";
      weeks = requested;
      const pct = Math.max(RUSH.minPremium, compression * RUSH.premiumPerCompression);
      adjustments.push({
        id: "rush",
        label: `Rush premium (+${Math.round(pct * 100)}%)`,
        detail: `Fits ${sched.weeks} weeks of work into ${requested}: a second developer and overlapping phases`,
        cost: critical * pct,
      });
    } else {
      status = "infeasible";
    }
  } else if (scope.timeline === "later" && critical > 0) {
    adjustments.push({
      id: "flex",
      label: `Flexible schedule (−${Math.round(FLEX_DISCOUNT * 100)}%)`,
      detail: "No deadline lets us schedule the work around other projects",
      cost: -critical * FLEX_DISCOUNT,
    });
  }

  const adj = adjustments.reduce((s, a) => s + a.cost, 0);
  const f = base > 0 ? adj / base : 0;
  const likely = base + adj;
  const contingency = costed.reduce((s, c) => s + c.cost * RISK[c.risk].contingency, 0) * (1 + f);
  const step = m.round;
  const fixedPrice = Math.round((likely + contingency) / step) * step;
  const low = Math.floor((costed.reduce((s, c) => s + c.low, 0) * (1 + f)) / step) * step;
  const high = Math.ceil((costed.reduce((s, c) => s + c.high, 0) * (1 + f)) / step) * step;

  const highFrac = likely > 0 ? high / likely - 1 : 0;
  const scale = status === "rush" && sched.weeks > 0 ? weeks / sched.weeks : 1;
  const timeline: TimelinePlan = {
    weeks,
    weeksHigh: Math.max(weeks, Math.ceil(weeks * (1 + 0.5 * highFrac))),
    naturalWeeks: sched.weeks,
    bars: sched.bars.map((b) => ({ ...b, start: b.start * scale, end: b.end * scale })),
    requestedWeeks: requested,
    status,
    compression,
  };

  return { costed, base, adjustments, likely, contingency, fixedPrice, low, high, sched, timeline };
}

function budgetRange(scope: Scope): [number, number] | null {
  return scope.budget === "unknown" ? null : MARKETS[scope.market].budgets[scope.budget].range;
}

function planPhases(scope: Scope, pkgs: WorkPackage[], full: Priced): PhasePlan | null {
  const m = MARKETS[scope.market];
  const f = formatter(scope.market);
  const band = budgetRange(scope);
  const max = band ? band[1] : Infinity;
  const window = WINDOWS[scope.timeline];
  const overBudget = full.fixedPrice > max * (1 + BUDGET_TIGHT);
  const infeasible = full.timeline.status === "infeasible";
  const big = full.fixedPrice > m.phaseAbove;
  if (!overBudget && !infeasible && !big) return null;

  const reason: PhasePlan["reason"] = overBudget ? "budget" : infeasible ? "timeline" : "size";
  let phase1: WorkPackage[];

  if (reason === "size") {
    phase1 = pkgs.filter((p) => p.priority <= 2);
  } else {
    const fits = (set: WorkPackage[]) => {
      const r = price(set, scope);
      if (overBudget && r.fixedPrice > max) return false;
      if (window !== null && r.timeline.status === "infeasible") return false;
      return true;
    };
    phase1 = pkgs.filter((p) => p.priority === 1);
    const optional = pkgs
      .filter((p) => p.priority !== 1)
      .sort((a, b) => a.priority - b.priority || packageCost(a, m.rates) - packageCost(b, m.rates));
    for (const o of optional) if (fits([...phase1, o])) phase1.push(o);
  }

  const phase2 = pkgs.filter((p) => !phase1.includes(p));
  if (phase2.length === 0) return null;

  const p1 = price(phase1, scope);
  // Phase 2 is a follow-on engagement with no launch deadline of its own.
  const p2 = price(phase2, scope.timeline === "later" ? scope : { ...scope, timeline: "explore" });
  const coreExceedsBudget = overBudget && p1.fixedPrice > max;

  let message: string;
  if (reason === "budget") {
    message = coreExceedsBudget
      ? `Even the essentials come to ${f.money(p1.fixedPrice)} — ${f.money(p1.fixedPrice - max)} over your budget. This is the smallest version that does the job.`
      : `Phase 1 fits your budget at ${f.money(p1.fixedPrice)} and goes live in ${p1.timeline.weeks} weeks. Phase 2 adds the rest when you're ready.`;
  } else if (reason === "timeline") {
    message = `Everything takes ${full.timeline.naturalWeeks} weeks. Phase 1 can go live in ${p1.timeline.weeks} — inside your ${TIMELINE_LABEL[scope.timeline]} window — with Phase 2 straight after.`;
  } else {
    message = "At this size we'd launch the essentials first, then build the rest once real usage shows what matters.";
  }

  return {
    reason,
    message,
    coreExceedsBudget,
    phases: [
      { n: 1, label: "Phase 1 — launch", packageIds: phase1.map((p) => p.id), price: p1.fixedPrice, weeks: p1.timeline.weeks },
      { n: 2, label: "Phase 2 — expand", packageIds: phase2.map((p) => p.id), price: p2.fixedPrice, weeks: p2.timeline.weeks },
    ],
  };
}

function budgetFit(scope: Scope, pkgs: WorkPackage[], full: Priced, phases: PhasePlan | null): BudgetFit {
  const m = MARKETS[scope.market];
  const f = formatter(scope.market);
  const band = budgetRange(scope);
  if (!band || full.fixedPrice === 0) {
    return { status: "info", message: "Add a budget and we'll check the scope against it.", gap: null };
  }
  const [min, max] = band;
  const p = full.fixedPrice;
  const gap = Number.isFinite(max) ? p - max : null;

  if (p <= max) {
    if (min > 0 && p < min * 0.6) {
      return {
        status: "under",
        message: "This needs well under your budget. We won't pad it to fill the gap — the headroom could fund growth, or stay with you.",
        gap,
      };
    }
    return {
      status: "good",
      message: Number.isFinite(max) ? `Fits your budget, with ${f.short(max - p)} to spare.` : "Fits your budget.",
      gap,
    };
  }

  if (p <= max * (1 + BUDGET_TIGHT)) {
    const removable = pkgs
      .filter((x) => x.priority !== 1 && x.source)
      .sort((a, b) => b.priority - a.priority || packageCost(a, m.rates) - packageCost(b, m.rates));
    for (const c of removable) {
      const trimmed = applyPatch(scope, removalPatch(scope, c.source!));
      const r = price(buildPackages(trimmed).packages, trimmed);
      if (r.fixedPrice <= max) {
        return {
          status: "warn",
          message: `${f.money(p - max)} over your budget. Dropping ${c.label.toLowerCase()} (${f.delta(r.fixedPrice - p)}) brings it inside.`,
          gap,
        };
      }
    }
    return { status: "warn", message: `${f.money(p - max)} over your budget — we'd trim a feature or phase it to land inside.`, gap };
  }

  const p1 = phases?.phases[0];
  let message = `${f.money(p - max)} over your budget, and the essentials alone don't fit. Worth revisiting the budget or the goal.`;
  if (p1 && phases && !phases.coreExceedsBudget) {
    message = `${f.money(p - max)} over your budget. Phase 1 fits at ${f.money(p1.price)}.`;
  } else if (p1 && p1.price <= max * (1 + BUDGET_TIGHT)) {
    message = `${f.money(p - max)} over your budget. Phase 1 is ${f.money(p1.price - max)} over — close enough to trim during discovery.`;
  }
  return { status: "crit", message, gap };
}

function paymentSchedule(full: Priced, m: MarketSpec): Milestone[] {
  if (full.fixedPrice === 0) return [];
  const [small, medium] = m.paymentBands;
  const plan = !full.sched.hasBuild || full.fixedPrice <= small
    ? PAYMENT_SCHEDULES[0]
    : full.fixedPrice <= medium
      ? PAYMENT_SCHEDULES[1]
      : PAYMENT_SCHEDULES[2];
  const scale = full.timeline.status === "rush" && full.sched.weeks > 0 ? full.timeline.weeks / full.sched.weeks : 1;
  const at = {
    start: 0,
    design: Math.max(1, Math.ceil(full.sched.designEnd * scale)),
    build: Math.ceil(full.sched.buildEnd * scale),
    launch: full.timeline.weeks,
  };
  let paid = 0;
  const step = m.round / 10;
  return plan.map(([label, pct, when], i, all) => {
    const amount = i === all.length - 1 ? full.fixedPrice - paid : Math.round((full.fixedPrice * pct) / 100 / step) * step;
    paid += amount;
    return { label, week: at[when], pct, amount };
  });
}

function runningCosts(scope: Scope, set: PackageSet, fixedPrice: number, totalWithTax: number): RunningCosts {
  const mk = MARKETS[scope.market];
  const R = mk.running;
  const items: RunItem[] = [];
  const b = new Set(scope.build);
  const making = b.size > 0 || scope.features.length > 0;
  const month = (label: string, [low, high]: [number, number], kind: RunItem["kind"] = "thirdparty"): RunItem => ({
    label,
    low,
    high,
    per: "month",
    kind,
  });

  if (making) {
    if (set.hasPlatform) {
      items.push(month("Cloud hosting & database", b.has("saas") ? R.hostingSaas : R.hostingPlatform));
    } else if (!(set.store?.approach === "hosted" && !b.has("website"))) {
      items.push(month("Website hosting", R.hostingSite));
    }
    if (set.store?.approach === "hosted") items.push(month("Shopify plan", R.shopify));
    items.push({ label: "Domain", low: R.domainYear[0], high: R.domainYear[1], per: "year", kind: "thirdparty" });
  }
  for (const f of scope.features) {
    const lite = FEATURES[f].lite;
    if (set.featureMode[f] === "lite" && lite?.monthly && mk.monthly[lite.monthly][1] > 0) {
      items.push(month(`${lite.label} tool`, mk.monthly[lite.monthly]));
    }
  }
  for (const i of scope.integrations) {
    const key = INTEGRATIONS[i].monthly;
    const label = INTEGRATIONS[i].label.replace(/\{(\w+)\}/g, (_, k: string) => mk.vendors[k as keyof MarketSpec["vendors"]] ?? k);
    if (key) items.push(month(label, mk.monthly[key]));
  }
  if (b.has("app")) {
    if (scope.appPlatforms !== "android") {
      items.push({ label: "Apple Developer Program", low: R.appleYear, high: R.appleYear, per: "year", kind: "thirdparty" });
    }
    if (scope.appPlatforms !== "ios") {
      items.push({ label: "Google Play registration", low: R.googleOnce, high: R.googleOnce, per: "once", kind: "thirdparty" });
    }
  }
  const managed = scope.growth.filter((g) => GROWTH[g].monthly);
  if (managed.length) {
    const names = managed.map((g) => (g === "seo" ? "SEO" : "paid media"));
    items.push(
      month(
        `Growth management — ${names.join(" + ")}`,
        [managed.reduce((s, g) => s + mk.monthly[GROWTH[g].monthly!][0], 0), managed.reduce((s, g) => s + mk.monthly[GROWTH[g].monthly!][1], 0)],
        "service"
      )
    );
  }
  if (scope.growth.includes("paid")) items.push(month("Ad spend — paid to Google / Meta", mk.adSpend, "spend"));
  if (scope.intel.includes("recurring")) items.push(month("Intelligence refresh", mk.monthly[INTEL.recurring.monthly!], "service"));
  if (making && fixedPrice > 0) {
    const step = mk.round / 2;
    const plan = Math.round((fixedPrice * MAINTENANCE_SHARE) / 12 / step) * step;
    items.push({ label: "Maintenance plan", low: plan, high: plan, per: "month", kind: "service", optional: true });
  }

  const counted = items.filter((i) => i.kind !== "spend" && !i.optional);
  const perMonth = (i: RunItem, v: number) =>
    (i.per === "month" ? v : i.per === "year" ? v / 12 : 0) * (i.kind === "service" ? 1 + mk.tax.rate : 1);
  const monthlyLow = counted.reduce((s, i) => s + perMonth(i, i.low), 0);
  const monthlyHigh = counted.reduce((s, i) => s + perMonth(i, i.high), 0);
  const once = (k: "low" | "high") => counted.filter((i) => i.per === "once").reduce((s, i) => s + i[k], 0);

  return {
    items,
    monthlyLow: Math.round(monthlyLow),
    monthlyHigh: Math.round(monthlyHigh),
    year1Low: Math.round(totalWithTax + once("low") + 12 * monthlyLow),
    year1High: Math.round(totalWithTax + once("high") + 12 * monthlyHigh),
  };
}

export interface Core extends Priced {
  scope: Scope;
  set: PackageSet;
  phasePlan: PhasePlan | null;
  budget: BudgetFit;
  tax: number;
  total: number;
  payments: Milestone[];
  running: RunningCosts;
}

export function computeCore(scope: Scope): Core {
  const set = buildPackages(scope);
  const full = price(set.packages, scope);
  const phasePlan = planPhases(scope, set.packages, full);
  if (phasePlan) {
    const later = new Set(phasePlan.phases[1].packageIds);
    for (const c of full.costed) c.phase = later.has(c.id) ? 2 : 1;
  }
  const budget = budgetFit(scope, set.packages, full, phasePlan);
  const m = MARKETS[scope.market];
  const tax = Math.round(full.fixedPrice * m.tax.rate);
  const total = full.fixedPrice + tax;
  return {
    ...full,
    scope,
    set,
    phasePlan,
    budget,
    tax,
    total,
    payments: paymentSchedule(full, m),
    running: runningCosts(scope, set, full.fixedPrice, total),
  };
}

function disciplineLedger(costed: CostedPackage[], rates: MarketSpec["rates"]): DisciplineLine[] {
  const hours = new Map<Discipline, number>();
  for (const c of costed) {
    for (const [d, h] of Object.entries(c.hours)) {
      hours.set(d as Discipline, (hours.get(d as Discipline) ?? 0) + (h ?? 0));
    }
  }
  return (Object.keys(rates) as Discipline[])
    .filter((d) => (hours.get(d) ?? 0) > 0)
    .map((d) => {
      const h = hours.get(d)!;
      return { discipline: d, label: DISCIPLINE_LABEL[d], hours: h, rate: rates[d], cost: h * rates[d] };
    });
}

function confidence(core: Core): Confidence {
  const spread = core.fixedPrice > 0 ? (core.high - core.low) / core.fixedPrice : 0;
  const drivers = core.costed
    .filter((c) => c.risk !== "known")
    .map((c) => ({ label: c.label, upside: Math.round((c.high - c.cost) / MARKETS[core.scope.market].round) * MARKETS[core.scope.market].round }))
    .sort((a, b) => b.upside - a.upside)
    .slice(0, 3);
  return { level: spread <= 0.3 ? "high" : spread <= 0.55 ? "medium" : "low", spread, drivers };
}

/** FNV-1a — a stable, short reference so the same scope always gets the same ref. */
function reference(scope: Scope): string {
  let h = 0x811c9dc5;
  for (const ch of encodeScope(scope)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "CHM-" + h.toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

export function estimate(input: unknown): Estimate {
  const scope = normalize(input);
  const core = computeCore(scope);
  const priceOf = (s: Scope) => computeCore(s).fixedPrice;

  const store = core.set.store
    ? {
        resolved: core.set.store.approach,
        reason: core.set.store.reason,
        altDelta:
          priceOf(applyPatch(scope, { storeApproach: core.set.store.approach === "hosted" ? "custom" : "hosted" })) -
          core.fixedPrice,
      }
    : null;

  const drivers = [...core.costed]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .map((c) => ({ label: c.label, share: core.base > 0 ? c.cost / core.base : 0 }));

  const { assumptions, exclusions } = writeNotes(core);

  const m = MARKETS[scope.market];
  return {
    scope,
    market: scope.market,
    packages: core.costed,
    disciplines: disciplineLedger(core.costed, m.rates),
    adjustments: core.adjustments,
    likely: Math.round(core.likely),
    contingency: Math.round(core.contingency),
    fixedPrice: core.fixedPrice,
    tax: core.tax,
    taxRate: m.tax.rate,
    taxLabel: m.tax.label,
    taxNote: m.tax.note,
    total: core.total,
    low: core.low,
    high: core.high,
    confidence: confidence(core),
    timeline: core.timeline,
    budget: core.budget,
    phasePlan: core.phasePlan,
    payments: core.payments,
    running: core.running,
    store,
    drivers,
    assumptions,
    exclusions,
    checks: runChecks(core, priceOf),
    ref: reference(scope),
  };
}
