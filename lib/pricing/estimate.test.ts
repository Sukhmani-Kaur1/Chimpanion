import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BENCHMARKS } from "./benchmarks.ts";
import { estimate } from "./estimate.ts";
import { MARKETS, MARKET_LIST } from "./markets.ts";
import {
  APP_PLATFORMS,
  BUDGET_LIST,
  CONTENT_LIST,
  DESIGN_LIST,
  FEATURE_LIST,
  GOALS,
  GROWTH_LIST,
  INTEGRATION_LIST,
  INTEL_LIST,
  PLATFORM_LIST,
  PRODUCT_LIST,
  STARTING,
  STORE_APPROACHES,
  TIMELINES,
  applyPatch,
  decodeScope,
  encodeScope,
  fromWizard,
  normalize,
} from "./scope.ts";
import type { Scope } from "./types.ts";

/** Deterministic PRNG so failures reproduce. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomScopes(n: number): Scope[] {
  const r = rng(42);
  const some = <T>(list: readonly T[], p = 0.3) => list.filter(() => r() < p);
  const one = <T>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  return Array.from({ length: n }, () =>
    normalize({
      market: one(MARKET_LIST),
      goals: some(GOALS),
      timeline: one(TIMELINES),
      build: some(PLATFORM_LIST, 0.35),
      starting: some(STARTING, 0.2),
      features: some(FEATURE_LIST),
      growth: some(GROWTH_LIST, 0.2),
      intel: some(INTEL_LIST, 0.15),
      design: one(DESIGN_LIST),
      budget: one(BUDGET_LIST),
      pages: 1 + Math.floor(r() * 30),
      products: one(PRODUCT_LIST),
      roles: 1 + Math.floor(r() * 6),
      workflows: 1 + Math.floor(r() * 3),
      appPlatforms: one(APP_PLATFORMS),
      storeApproach: one(STORE_APPROACHES),
      integrations: some(INTEGRATION_LIST, 0.2),
      languages: 1 + Math.floor(r() * 3),
      content: one(CONTENT_LIST),
      migration: r() < 0.2,
    })
  );
}

const SCOPES = randomScopes(400);

describe("reference projects land in market-sane bands", () => {
  const bands: Record<keyof typeof BENCHMARKS, [number, number]> = {
    landingPage: [18000, 45000],
    businessSite: [40000, 100000],
    customSite: [110000, 250000],
    businessSystem: [200000, 450000],
    shopifyStore: [60000, 160000],
    customStore: [400000, 900000],
    bookingApp: [400000, 1000000],
    saasMvp: [450000, 1200000],
  };
  for (const [id, [lo, hi]] of Object.entries(bands)) {
    test(id, () => {
      const e = estimate(BENCHMARKS[id as keyof typeof BENCHMARKS]);
      assert.ok(e.fixedPrice >= lo && e.fixedPrice <= hi, `${id}: ${e.fixedPrice} not in ${lo}–${hi}`);
    });
  }
});

describe("invariants hold for any scope", () => {
  test("range brackets the fixed price, and every figure is well-formed", () => {
    for (const s of SCOPES) {
      const e = estimate(s);
      if (e.fixedPrice === 0) continue;
      assert.ok(e.low <= e.fixedPrice && e.fixedPrice <= e.high, `range ${e.low}–${e.high} vs ${e.fixedPrice}`);
      assert.equal(e.fixedPrice % MARKETS[e.market].round, 0);
      assert.equal(e.tax, Math.round(e.fixedPrice * MARKETS[e.market].tax.rate));
      assert.equal(e.total, e.fixedPrice + e.tax);
      assert.ok(e.timeline.weeks >= 1 && e.timeline.weeksHigh >= e.timeline.weeks);
      for (const p of e.packages) assert.ok(p.cost >= 0 && p.low <= p.cost && p.cost <= p.high, p.id);
    }
  });

  test("payments always add up to exactly the fixed price", () => {
    for (const s of SCOPES) {
      const e = estimate(s);
      const sum = e.payments.reduce((t, m) => t + m.amount, 0);
      assert.equal(sum, e.fixedPrice);
      if (e.payments.length) assert.equal(e.payments.reduce((t, m) => t + m.pct, 0), 100);
      for (let i = 1; i < e.payments.length; i++) assert.ok(e.payments[i].week >= e.payments[i - 1].week);
    }
  });

  test("discipline ledger reconciles with the package costs", () => {
    for (const s of SCOPES) {
      const e = estimate(s);
      const byPkg = e.packages.reduce((t, p) => t + p.cost, 0);
      const byDisc = e.disciplines.reduce((t, d) => t + d.cost, 0);
      assert.ok(Math.abs(byPkg - byDisc) < 1, `${byPkg} vs ${byDisc}`);
    }
  });

  test("the budget answer never changes the price", () => {
    for (const s of SCOPES.slice(0, 80)) {
      const prices = new Set(BUDGET_LIST.map((b) => estimate({ ...s, budget: b }).fixedPrice));
      assert.equal(prices.size, 1);
    }
  });

  test("adding scope never lowers the cost of the work, or shortens the schedule", () => {
    const work = (s: Scope) => {
      const e = estimate(s);
      return { cost: e.packages.reduce((t, p) => t + p.cost, 0), weeks: e.timeline.naturalWeeks, status: e.timeline.status };
    };
    const severity = { open: 0, fits: 0, rush: 1, infeasible: 2 };
    for (const s of SCOPES.slice(0, 120)) {
      const base = work(s);
      const additions: Partial<Scope>[] = [
        ...FEATURE_LIST.filter((x) => !s.features.includes(x)).map((f) => ({ features: [...s.features, f] })),
        ...INTEGRATION_LIST.filter((x) => !s.integrations.includes(x)).map((i) => ({ integrations: [...s.integrations, i] })),
        ...GROWTH_LIST.filter((x) => !s.growth.includes(x)).map((g) => ({ growth: [...s.growth, g] })),
        { pages: s.pages + 5 },
      ];
      for (const patch of additions) {
        const after = work(applyPatch(s, patch));
        const what = JSON.stringify(patch);
        assert.ok(after.cost >= base.cost - 1, `cost fell: ${what}`);
        assert.ok(after.weeks >= base.weeks, `schedule shrank: ${what}`);
        assert.ok(severity[after.status] >= severity[base.status], `timeline improved: ${what}`);
      }
    }
  });

  test("every suggested fix reports the real price change", () => {
    for (const s of SCOPES.slice(0, 150)) {
      const e = estimate(s);
      for (const c of e.checks) {
        if (!c.fix) continue;
        const after = estimate(applyPatch(e.scope, c.fix.patch)).fixedPrice;
        assert.equal(c.fix.delta, after - e.fixedPrice, c.id);
      }
    }
  });
});

describe("no double counting", () => {
  test("a store already includes its catalogue and payments", () => {
    const store = normalize({ build: ["store"] });
    const same = normalize({ build: ["store"], features: ["catalogue", "payments"] });
    assert.equal(estimate(same).fixedPrice, estimate(store).fixedPrice);
  });

  test("Shopify includes customer accounts and admin", () => {
    const store = normalize({ build: ["store"], storeApproach: "hosted" });
    const same = normalize({ build: ["store"], storeApproach: "hosted", features: ["accounts", "admin"] });
    assert.equal(estimate(same).fixedPrice, estimate(store).fixedPrice);
  });

  test("the platform foundation is built once, however many platforms share it", () => {
    const e = estimate(normalize({ build: ["webapp", "internal", "app"], features: ["accounts"] }));
    assert.equal(e.packages.filter((p) => p.id === "foundation").length, 1);
  });

  test("app-only products don't pay for web screens they won't have", () => {
    const e = estimate(BENCHMARKS.bookingApp);
    const booking = e.packages.find((p) => p.id === "feature-booking")!;
    assert.equal(booking.hours.design ?? 0, 0);
    const withWeb = estimate(applyPatch(BENCHMARKS.bookingApp, { build: ["app", "webapp"] }));
    assert.ok((withWeb.packages.find((p) => p.id === "feature-booking")!.hours.design ?? 0) > 0);
  });
});

describe("simplest thing that works", () => {
  test("bookings on a plain website use an embedded tool, not a custom platform", () => {
    const e = estimate(normalize({ build: ["website"], features: ["booking", "crm"] }));
    assert.ok(!e.packages.some((p) => p.id === "foundation"));
    assert.match(e.packages.find((p) => p.id === "feature-booking")!.label, /Online booking/);
  });

  test("the same features on an internal system are real modules", () => {
    const e = estimate(normalize({ build: ["internal"], features: ["booking"] }));
    assert.ok(e.packages.some((p) => p.id === "foundation"));
    assert.equal(e.packages.find((p) => p.id === "feature-booking")!.label, "Bookings");
  });

  test("small standard stores default to Shopify; custom workflows force a custom build", () => {
    const small = estimate(normalize({ build: ["store"], products: "m" }));
    assert.equal(small.store?.resolved, "hosted");
    assert.ok(small.store!.altDelta > 0, "custom should cost more than Shopify");
    const custom = estimate(normalize({ build: ["store"], features: ["custom"] }));
    assert.equal(custom.store?.resolved, "custom");
  });
});

describe("timeline", () => {
  test("no rush premium when the work already fits the deadline", () => {
    const e = estimate(applyPatch(BENCHMARKS.landingPage, { timeline: "one" }));
    assert.equal(e.timeline.status, "fits");
    assert.ok(!e.adjustments.some((a) => a.id === "rush"));
  });

  test("moderate compression is rushed, and costs more", () => {
    const relaxed = estimate(applyPatch(BENCHMARKS.customStore, { timeline: "three" }));
    assert.ok(relaxed.timeline.naturalWeeks > 8 && relaxed.timeline.naturalWeeks <= 8 / 0.7, "fixture needs 9–11 weeks");
    const e = estimate(applyPatch(BENCHMARKS.customStore, { timeline: "one" }));
    assert.equal(e.timeline.status, "rush");
    assert.equal(e.timeline.weeks, 8);
    assert.ok(e.adjustments.some((a) => a.id === "rush"));
    assert.ok(e.fixedPrice > relaxed.fixedPrice);
  });

  test("impossible deadlines are flagged and phased, not silently rushed", () => {
    const e = estimate(applyPatch(BENCHMARKS.saasMvp, { build: ["saas", "app"], timeline: "one" }));
    assert.equal(e.timeline.status, "infeasible");
    assert.ok(!e.adjustments.some((a) => a.id === "rush"));
    assert.ok(e.checks.some((c) => c.id === "timeline-infeasible"));
    assert.equal(e.phasePlan?.reason, "timeline");
  });

  test("no deadline earns the flexible-schedule discount", () => {
    const e = estimate(applyPatch(BENCHMARKS.businessSite, { timeline: "later" }));
    const flex = e.adjustments.find((a) => a.id === "flex");
    assert.ok(flex && flex.cost < 0);
  });
});

describe("budget", () => {
  test("well over budget produces a phase plan whose Phase 1 fits, or says honestly that it can't", () => {
    const e = estimate(applyPatch(BENCHMARKS.businessSystem, { budget: "b2", features: ["admin", "crm", "dashboard", "automation"] }));
    assert.equal(e.budget.status, "crit");
    assert.equal(e.phasePlan?.reason, "budget");
    const [p1] = e.phasePlan!.phases;
    assert.ok(p1.price <= 150000 || e.phasePlan!.coreExceedsBudget);
  });

  test("comfortably under budget says so, and doesn't inflate", () => {
    const e = estimate(applyPatch(BENCHMARKS.landingPage, { budget: "b3" }));
    assert.equal(e.budget.status, "under");
    assert.equal(e.fixedPrice, estimate(BENCHMARKS.landingPage).fixedPrice);
  });
});

describe("running costs", () => {
  test("year one covers the build and running costs, but never ad spend or optional plans", () => {
    const e = estimate(applyPatch(BENCHMARKS.shopifyStore, { growth: ["paid", "analytics"] }));
    assert.ok(e.running.year1Low >= e.total);
    const spend = e.running.items.find((i) => i.kind === "spend")!;
    assert.ok(spend);
    const without = estimate(applyPatch(BENCHMARKS.shopifyStore, { growth: ["analytics"] }));
    const mgmt = e.running.items.find((i) => i.label.startsWith("Growth management"))!;
    // The only monthly difference is the management fee (plus GST) — spend is excluded.
    const diff = e.running.monthlyLow - without.running.monthlyLow;
    assert.equal(diff, Math.round(mgmt.low * (1 + MARKETS.IN.tax.rate)));
  });
});

describe("scope handling", () => {
  test("share links round-trip", () => {
    for (const s of SCOPES.slice(0, 50)) assert.deepEqual(decodeScope(encodeScope(s)), s);
  });

  test("garbage in the URL degrades to defaults instead of crashing", () => {
    assert.doesNotThrow(() => decodeScope("%%%not-base64"));
    const s = normalize({ pages: 9999, roles: -3, build: ["website", "spaceship"], timeline: "yesterday" });
    assert.equal(s.pages, 60);
    assert.equal(s.roles, 1);
    assert.deepEqual(s.build, ["website"]);
    assert.equal(s.timeline, "three");
  });

  test("the public wizard's answers map onto a scope, dropping 'none'", () => {
    const s = fromWizard({ type: ["none"], growth: ["none"], data: ["none"], business: ["leads"], current: ["crm"] }, "UK");
    assert.equal(s.market, "UK");
    assert.deepEqual(s.build, []);
    assert.deepEqual(s.growth, []);
    assert.deepEqual(s.integrations, ["crm_ext"]);
  });

  test("an empty scope is a clean zero with a clear message", () => {
    const e = estimate({});
    assert.equal(e.fixedPrice, 0);
    assert.equal(e.payments.length, 0);
    assert.equal(e.checks[0]?.id, "empty");
  });

  test("the reference is stable for a scope and changes with it", () => {
    const a = estimate(BENCHMARKS.businessSite).ref;
    assert.equal(estimate(BENCHMARKS.businessSite).ref, a);
    assert.notEqual(estimate(BENCHMARKS.customSite).ref, a);
  });
});

describe("markets", () => {
  const inMarket = (scope: Scope, market: Scope["market"]) => estimate({ ...scope, market });
  const effort = (e: ReturnType<typeof estimate>) =>
    Object.fromEntries(
      e.packages
        .filter((p) => !["discovery", "compliance", "languages"].includes(p.id))
        .map((p) => [p.id, p.totalHours])
    );

  test("the work itself takes the same hours in every market", () => {
    for (const s of SCOPES.slice(0, 60)) {
      const base = effort(inMarket(s, "IN"));
      for (const m of MARKET_LIST) assert.deepEqual(effort(inMarket(s, m)), base, m);
    }
  });

  test("prices are in each market's currency and rounding", () => {
    const f = (m: Scope["market"]) => inMarket(BENCHMARKS.businessSite, m).fixedPrice;
    assert.ok(f("IN") > 30000 && f("IN") % 1000 === 0);
    for (const m of ["US", "UK"] as const) assert.ok(f(m) > 800 && f(m) < 6000 && f(m) % 100 === 0, `${m} ${f(m)}`);
    assert.ok(f("AE") > 4000 && f("AE") < 25000, `AE ${f("AE")}`);
  });

  test("GST applies in India; exports carry no Indian GST and explain the local treatment", () => {
    const india = inMarket(BENCHMARKS.businessSite, "IN");
    assert.equal(india.tax, Math.round(india.fixedPrice * 0.18));
    for (const m of ["US", "UK", "AE"] as const) {
      const e = inMarket(BENCHMARKS.businessSite, m);
      assert.equal(e.tax, 0);
      assert.equal(e.total, e.fixedPrice);
      assert.match(e.taxNote, /GST|VAT|export/i);
    }
  });

  test("every label names that market's local providers, with no unfilled tokens", () => {
    for (const s of SCOPES) {
      for (const p of estimate(s).packages) assert.doesNotMatch(`${p.label} ${p.detail}`, /\{\w+\}/, p.id);
    }
    const store = normalize({ build: ["store"], storeApproach: "custom", integrations: ["accounting", "shipping"] });
    const text = (m: Scope["market"]) => inMarket(store, m).packages.map((p) => `${p.label} ${p.detail}`).join(" ");
    assert.match(text("IN"), /Tally/);
    assert.match(text("US"), /QuickBooks/);
    assert.match(text("UK"), /Royal Mail/);
    assert.match(text("AE"), /Aramex/);
    assert.match(inMarket(store, "US").assumptions.join(" "), /Stripe/);
    assert.match(inMarket(store, "IN").assumptions.join(" "), /Razorpay/);
  });

  test("each market carries its own compliance work", () => {
    const labels = MARKET_LIST.map((m) => inMarket(BENCHMARKS.businessSite, m).packages.find((p) => p.id === "compliance")!.label);
    assert.equal(new Set(labels).size, MARKET_LIST.length);
  });

  test("a bilingual UAE build pays for Arabic right-to-left layout", () => {
    const s = applyPatch(BENCHMARKS.customSite, { languages: 2 });
    const hrs = (m: Scope["market"]) => inMarket(s, m).packages.find((p) => p.id === "languages")!.totalHours;
    assert.ok(hrs("AE") > hrs("IN"));
    assert.match(inMarket(s, "AE").packages.find((p) => p.id === "languages")!.label, /Arabic/);
  });

  test("US projects allow for time-zone lag on review rounds", () => {
    const weeks = (m: Scope["market"]) => inMarket(BENCHMARKS.customStore, m).timeline.naturalWeeks;
    assert.ok(weeks("US") >= weeks("IN"));
  });

  test("budget tiers are read in the client's currency", () => {
    const e = estimate({ ...BENCHMARKS.businessSite, market: "US", budget: "b2" });
    assert.ok(["good", "under"].includes(e.budget.status), e.budget.message);
    assert.match(e.budget.message, /\$/);
  });
});

describe("market detection", () => {
  test("edge country wins, then time zone, then language, else US dollars", async () => {
    const { detectMarket } = await import("./detect.ts");
    assert.equal(detectMarket({ country: "AE", timeZone: "Asia/Kolkata" }), "AE");
    assert.equal(detectMarket({ country: "GB" }), "UK");
    assert.equal(detectMarket({ timeZone: "Asia/Kolkata" }), "IN");
    assert.equal(detectMarket({ timeZone: "Asia/Calcutta" }), "IN");
    assert.equal(detectMarket({ timeZone: "Europe/London" }), "UK");
    assert.equal(detectMarket({ timeZone: "America/Chicago" }), "US");
    assert.equal(detectMarket({ timeZone: "Asia/Dubai" }), "AE");
    assert.equal(detectMarket({ timeZone: "Europe/Berlin", languages: ["en-GB"] }), "UK");
    assert.equal(detectMarket({ timeZone: "Europe/Berlin", languages: ["de-DE"] }), "US");
    assert.equal(detectMarket({}), "US");
  });
});
