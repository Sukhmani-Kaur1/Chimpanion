import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { MARKET_LIST, MARKETS } from "../pricing/markets.ts";
import { CTR, FREQUENCY, INDUSTRY, MARKET_MEDIA, WEEKS_PER_MONTH } from "./benchmarks.ts";
import { buildPlan } from "./plan.ts";
import type { MediaScope } from "./types.ts";

const base: MediaScope = {
  market: "IN",
  objective: "leads",
  model: "service",
  industry: "health",
  audience: "local",
  age: [],
  gender: "all",
  languages: ["english"],
  budget: 60000,
  durationWeeks: 12,
  creative: ["photos"],
  maturity: "some",
  dealValue: 20000,
  cities: 1,
  website: true,
  tracking: true,
};
const s = (p: Partial<MediaScope> = {}): MediaScope => ({ ...base, ...p });
const ids = (scope: MediaScope) => buildPlan(scope).channels.map((c) => c.id);
const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

describe("the money adds up", () => {
  test("channel budgets sum to the brief's budget, within rounding", () => {
    for (const market of MARKET_LIST) {
      for (const budget of [MARKET_MEDIA[market].floor, MARKET_MEDIA[market].floor * 12]) {
        const plan = buildPlan(s({ market, budget }));
        const step = market === "IN" ? 500 : 10;
        const drift = Math.abs(plan.totalBudget - budget);
        assert.ok(drift <= step * plan.channels.length, `${market} ${budget}: drifted ${drift}`);
      }
    }
  });

  test("shares and funnel split each account for the whole budget", () => {
    const plan = buildPlan(s());
    const shares = plan.channels.reduce((t, c) => t + c.share, 0);
    assert.ok(Math.abs(shares - 1) < 1e-9, `shares summed to ${shares}`);
    const funnel = plan.funnelSplit.reduce((t, f) => t + f.share, 0);
    assert.ok(Math.abs(funnel - 1) < 1e-9, `funnel summed to ${funnel}`);
  });

  test("ranges are the right way round", () => {
    for (const scope of [s(), s({ objective: "sales", model: "ecommerce" }), s({ market: "US", budget: 5000 })]) {
      const p = buildPlan(scope);
      assert.ok(p.resultsLow <= p.resultsHigh);
      assert.ok(p.costPerResultLow <= p.costPerResultHigh);
      assert.ok(p.impressionsLow <= p.impressionsHigh);
      assert.ok(p.netReachLow <= p.netReachHigh);
      for (const c of p.channels) {
        assert.ok(c.cpcLow < c.cpcHigh, c.id);
        assert.ok(c.resultsLow <= c.resultsHigh, c.id);
        assert.ok(c.reachLow <= c.reachHigh, c.id);
      }
    }
  });

  test("more budget never buys fewer results", () => {
    let previous = 0;
    for (const budget of [20000, 40000, 80000, 160000, 320000]) {
      const p = buildPlan(s({ budget }));
      assert.ok(p.resultsHigh >= previous, `results fell at ${budget}`);
      previous = p.resultsHigh;
    }
  });

  test("break-even is only claimed when the client knows what a customer is worth", () => {
    assert.equal(buildPlan(s({ dealValue: 0 })).breakEvenResults, null);
    assert.equal(buildPlan(s({ budget: 60000, dealValue: 20000 })).breakEvenResults, 3);
  });
});

describe("impressions, clicks and spend tell one story", () => {
  test("impressions times click-through rate is exactly the clicks that spend buys", () => {
    for (const scope of [s(), s({ market: "US", budget: 4000, industry: "legal" }), s({ objective: "awareness" })]) {
      const p = buildPlan(scope);
      for (const c of p.channels) {
        assert.ok(close(c.impressionsLow * c.ctr, c.budget / c.cpcHigh), `${c.id} low`);
        assert.ok(close(c.impressionsHigh * c.ctr, c.budget / c.cpcLow), `${c.id} high`);
      }
    }
  });

  test("cost per thousand impressions is the click cost and click-through rate, not a second guess", () => {
    for (const c of buildPlan(s()).channels) {
      assert.ok(close(c.cpm, ((c.cpcLow + c.cpcHigh) / 2) * c.ctr * 1000), c.id);
      assert.equal(c.ctr, CTR[c.id]);
    }
  });

  test("plan-level clicks reconcile with plan-level impressions", () => {
    const p = buildPlan(s());
    const fromChannels = p.channels.reduce((t, c) => t + c.impressionsLow * c.ctr, 0);
    assert.ok(close(p.clicksLow, fromChannels));
    assert.ok(p.clicksLow <= p.clicksHigh);
    assert.ok(p.clicksHigh < p.impressionsHigh, "more clicks than impressions is impossible");
  });
});

describe("reach is deduplicated, and says so", () => {
  test("net reach sits between the biggest channel and the raw sum", () => {
    const p = buildPlan(s({ budget: 200000 }));
    const each = p.channels.map((c) => c.reachHigh);
    const raw = each.reduce((t, r) => t + r, 0);
    assert.ok(p.channels.length > 1, "need several channels for this to mean anything");
    assert.ok(p.netReachHigh >= Math.max(...each), "net reach below the largest single channel");
    assert.ok(p.netReachHigh < raw, "channels were added up without deduplication");
  });

  test("a single channel has nothing to deduplicate against", () => {
    const p = buildPlan(s({ creative: ["none"], objective: "awareness", budget: 16000 }));
    if (p.channels.length === 1) assert.ok(close(p.netReachHigh, p.channels[0].reachHigh));
  });

  test("each channel's reach is its impressions at the stage's frequency", () => {
    for (const c of buildPlan(s()).channels) {
      assert.ok(close(c.reachHigh, c.impressionsHigh / FREQUENCY[c.stage]), c.id);
      assert.equal(c.frequency, FREQUENCY[c.stage]);
    }
  });

  test("average frequency is never below the lightest stage", () => {
    const p = buildPlan(s());
    assert.ok(p.avgFrequency >= Math.min(...Object.values(FREQUENCY)) - 1e-9, `got ${p.avgFrequency}`);
  });

  test("reach is described as an estimate, never as a measurement", () => {
    const text = buildPlan(s()).assumptions.join(" · ");
    assert.match(text, /estimate, not a measurement/i);
  });
});

describe("category changes the numbers", () => {
  test("an expensive category costs more per click than a cheap one", () => {
    const legal = buildPlan(s({ industry: "legal" })).channels.find((c) => c.id === "google_search")!;
    const food = buildPlan(s({ industry: "food" })).channels.find((c) => c.id === "google_search")!;
    assert.ok(legal.cpcLow > food.cpcLow * 2, `legal ${legal.cpcLow} vs food ${food.cpcLow}`);
  });

  test("dearer clicks on the same budget mean fewer of them", () => {
    const legal = buildPlan(s({ industry: "legal" }));
    const food = buildPlan(s({ industry: "food" }));
    assert.ok(legal.clicksHigh < food.clicksHigh);
    assert.ok(legal.impressionsHigh < food.impressionsHigh);
  });

  test("every category carries a cost and a conversion multiplier, and the plan names it", () => {
    for (const key of Object.keys(INDUSTRY) as (keyof typeof INDUSTRY)[]) {
      const spec = INDUSTRY[key];
      assert.ok(spec.cpc > 0 && spec.cvr > 0, key);
      const plan = buildPlan(s({ industry: key }));
      assert.ok(plan.assumptions.join(" ").includes(spec.label.toLowerCase()), `${key} not named in assumptions`);
    }
  });
});

describe("the flight length is respected", () => {
  test("campaign spend is the monthly budget across the flight, not one month", () => {
    const quarter = buildPlan(s({ durationWeeks: 12 }));
    const month = buildPlan(s({ durationWeeks: 4 }));
    assert.ok(quarter.campaignBudget > month.campaignBudget);
    assert.equal(quarter.campaignBudget, Math.round((quarter.totalBudget * 12) / WEEKS_PER_MONTH));
    assert.equal(quarter.totalBudget, month.totalBudget, "the monthly figure shouldn't move with duration");
  });

  test("a four-week burst gets no week-twelve review", () => {
    const short = buildPlan(s({ durationWeeks: 4 }));
    assert.ok(short.milestones.every((m) => m.week <= 4), short.milestones.map((m) => m.week).join(","));
    assert.ok(short.milestones.length >= 3, "a short flight still needs a plan");
  });

  test("a short flight is flagged as a poor read, not sold as a full campaign", () => {
    const risks = buildPlan(s({ durationWeeks: 4 })).warnings.filter((w) => w.level === "risk");
    assert.ok(risks.some((w) => /short/i.test(w.title)), "no warning about the short flight");
    assert.ok(!buildPlan(s({ durationWeeks: 12 })).warnings.some((w) => /short/i.test(w.title)));
  });

  test("a long flight closes out at the end, whatever the length", () => {
    const p = buildPlan(s({ durationWeeks: 26 }));
    assert.equal(p.milestones[p.milestones.length - 1].week, 26);
  });
});

describe("demographics reach the plan", () => {
  test("narrow targeting is called out", () => {
    const narrow = buildPlan(s({ age: ["18-24"], gender: "female" }));
    assert.ok(narrow.warnings.some((w) => /narrow/i.test(w.title)));
    assert.ok(!buildPlan(s()).warnings.some((w) => /narrow/i.test(w.title)));
  });

  test("a second language earns its own creative brief and its own warning", () => {
    const two = buildPlan(s({ languages: ["english", "hindi"] }));
    assert.ok(two.warnings.some((w) => /languages/i.test(w.title)));
    assert.ok(two.creative.some((c) => /language/i.test(c.angle)));
    assert.ok(!buildPlan(s()).creative.some((c) => /language/i.test(c.angle)));
  });

  test("the age and gender chosen show up in what to launch", () => {
    const p = buildPlan(s({ age: ["25-34"], gender: "female", creative: ["photos"] }));
    const meta = p.channels.find((c) => c.id === "meta");
    if (meta) assert.match(meta.firstCampaign, /25-34.*women|women.*25-34/);
  });
});

describe("channels are chosen, not sprayed", () => {
  test("search is always in the plan — answering demand comes before interrupting it", () => {
    for (const objective of ["leads", "sales", "awareness", "footfall", "app"] as const) {
      assert.ok(ids(s({ objective })).includes("google_search"), objective);
    }
  });

  test("LinkedIn needs both a professional audience and a budget that can carry it", () => {
    const floor = MARKET_MEDIA.IN.linkedinFloor;
    assert.ok(ids(s({ model: "b2b", budget: floor + 10000 })).includes("linkedin"));
    assert.ok(!ids(s({ model: "b2b", budget: floor - 10000 })).includes("linkedin"), "ran LinkedIn on too small a budget");
    assert.ok(!ids(s({ model: "local" })).includes("linkedin"), "put a local business on LinkedIn");
  });

  test("TikTok needs a young audience and video to feed it", () => {
    assert.ok(ids(s({ audience: "young", creative: ["ugc"] })).includes("tiktok"));
    assert.ok(!ids(s({ audience: "young", creative: ["photos"] })).includes("tiktok"), "booked TikTok with no video");
    assert.ok(!ids(s({ audience: "local", creative: ["video"] })).includes("tiktok"));
  });

  test("automation waits until it has conversion data to learn from", () => {
    assert.ok(!ids(s({ maturity: "first", objective: "sales", model: "ecommerce" })).includes("google_pmax"));
    assert.ok(ids(s({ maturity: "running", objective: "sales", model: "ecommerce" })).includes("google_pmax"));
  });

  test("no creative means no social spend", () => {
    const none = ids(s({ creative: ["none"] }));
    assert.ok(!none.includes("meta") && !none.includes("tiktok"), `booked social with no creative: ${none}`);
    assert.ok(none.includes("google_search"), "search should still run on text alone");
  });

  test("a local business gets local placements", () => {
    assert.ok(ids(s({ model: "local", objective: "footfall" })).includes("gbp"));
  });
});

describe("it says what's wrong before taking the money", () => {
  test("a budget below the market floor is called a blocker", () => {
    for (const market of MARKET_LIST) {
      const plan = buildPlan(s({ market, budget: Math.round(MARKET_MEDIA[market].floor * 0.5) }));
      assert.equal(plan.viable, false, market);
      assert.ok(plan.warnings.some((w) => w.level === "blocker"), market);
    }
  });

  test("no tracking and no website are blockers, not footnotes", () => {
    const plan = buildPlan(s({ tracking: false, website: false }));
    const blockers = plan.warnings.filter((w) => w.level === "blocker").map((w) => w.title).join(" · ");
    assert.match(blockers, /tracking/i);
    assert.match(blockers, /traffic|website|nowhere/i);
  });

  test("a plan without tracking starts by fixing tracking", () => {
    assert.equal(buildPlan(s({ tracking: false })).milestones[0].week, 0);
  });
});

describe("every market reads as its own", () => {
  test("a plan is priced in the client's currency and never leaks another market", () => {
    for (const market of MARKET_LIST) {
      const plan = buildPlan(s({ market, budget: MARKET_MEDIA[market].floor * 6 }));
      assert.equal(plan.currency, MARKETS[market].currency);
      const text = [...plan.assumptions, ...plan.measurement, ...plan.warnings.map((w) => `${w.title} ${w.detail}`)].join(" · ");
      if (market !== "IN") assert.doesNotMatch(text, /₹|\bIndian?\b/i, `${market}: ${text.slice(0, 120)}`);
    }
  });

  test("clicks cost what that market charges for them", () => {
    const inr = buildPlan(s({ market: "IN", industry: "other" })).channels.find((c) => c.id === "google_search")!;
    const usd = buildPlan(s({ market: "US", budget: 3000, industry: "other" })).channels.find((c) => c.id === "google_search")!;
    assert.ok(inr.cpcLow > 10 && inr.cpcHigh < 80, `India search CPC out of range: ${inr.cpcLow}–${inr.cpcHigh}`);
    assert.ok(usd.cpcLow > 0.5 && usd.cpcHigh < 4, `US search CPC out of range: ${usd.cpcLow}–${usd.cpcHigh}`);
  });
});

describe("the plan is actually broad", () => {
  test("it covers channels, creative, search, measurement and a schedule", () => {
    const plan = buildPlan(s({ budget: 120000 }));
    assert.ok(plan.channels.length >= 3, "too few channels to be a plan");
    assert.ok(plan.creative.length >= 2, "no creative direction");
    assert.ok(plan.searchThemes.length >= 2 && plan.negatives.length >= 8);
    assert.ok(plan.milestones.length >= 5 && plan.measurement.length >= 4);
    assert.ok(plan.assumptions.length >= 3);
  });

  test("every channel explains itself and what to launch first", () => {
    for (const c of buildPlan(s({ budget: 120000 })).channels) {
      assert.ok(c.why.length > 30, `${c.id} has no rationale`);
      assert.ok(c.firstCampaign.length > 10, `${c.id} has no first campaign`);
      assert.ok(c.formats.length > 0, `${c.id} has no formats`);
    }
  });
});
