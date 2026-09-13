/**
 * Turns a short brief into a broad media plan: which channels, how the budget splits across the
 * funnel, what it reaches, what it should return, what to make, what to search for, and what to
 * watch.
 *
 * The rules follow standard paid-media practice: answer demand before interrupting it, don't run
 * channels the client has no creative for, don't hand budget to automation before it has data to
 * learn from, and never spend without tracking.
 */
import { MARKETS } from "../pricing/markets.ts";
import type { Market } from "../pricing/types.ts";
import {
  CHANNEL_QUALITY,
  CTR,
  CVR,
  FREQUENCY,
  FUNNEL_SPLIT,
  INDUSTRY,
  MARKET_MEDIA,
  SPREAD,
  WEEKS_PER_MONTH,
  cpc,
  netReach,
} from "./benchmarks.ts";
import type {
  ChannelId,
  ChannelPlan,
  CreativeBrief,
  FunnelStage,
  MediaPlan,
  MediaScope,
  Milestone,
  Warning,
} from "./types.ts";

const CHANNEL_NAME: Record<ChannelId, string> = {
  google_search: "Google Search",
  google_pmax: "Google Performance Max",
  google_display: "Google Display",
  youtube: "YouTube",
  meta: "Meta — Facebook & Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  gbp: "Google Local & Maps",
};

const STAGE: Record<ChannelId, FunnelStage> = {
  google_search: "prospecting",
  google_pmax: "prospecting",
  google_display: "retargeting",
  youtube: "engagement",
  meta: "prospecting",
  linkedin: "prospecting",
  tiktok: "engagement",
  gbp: "prospecting",
};

const hasVideo = (s: MediaScope) => s.creative.includes("video") || s.creative.includes("ugc");

/** Weight each channel for this brief. Zero means it doesn't belong in the plan at all. */
function weigh(s: MediaScope): { id: ChannelId; weight: number; why: string }[] {
  const b2b = s.model === "b2b" || s.model === "saas";
  const out: { id: ChannelId; weight: number; why: string }[] = [];
  const add = (id: ChannelId, weight: number, why: string) => weight > 0 && out.push({ id, weight, why });

  add(
    "google_search",
    s.objective === "awareness" ? 1.2 : b2b ? 3.4 : 3.8,
    "People searching for what you sell are already in the market — this is the cheapest intent to buy."
  );

  if (s.model === "local" || s.objective === "footfall") {
    add("gbp", 2.2, "Local and Maps ads put you in front of people searching nearby, ready to walk in or call.");
  }

  if (!b2b && s.creative.length > 0 && !s.creative.includes("none")) {
    add(
      "meta",
      s.objective === "awareness" ? 3.2 : s.audience === "professional" ? 1.4 : 2.8,
      "Cheap reach and the best retargeting on the market. Needs a steady supply of creative to keep working."
    );
  }

  if (b2b || s.audience === "professional") {
    add(
      "linkedin",
      s.budget >= MARKET_MEDIA[s.market].linkedinFloor ? 2.4 : 0,
      "The only place to target by job title and company — and priced accordingly, so it needs a real budget."
    );
  }

  if (s.audience === "young" && hasVideo(s)) {
    add("tiktok", 1.8, "Where a younger audience actually spends attention, if you can feed it native video.");
  }

  if (hasVideo(s) && s.budget >= MARKET_MEDIA[s.market].floor * 2) {
    add("youtube", 1.1, "Cheap attention for demand you haven't captured yet. Only worth it once search is covered.");
  }

  if (s.maturity !== "first" && (s.model === "ecommerce" || s.objective === "sales")) {
    add("google_pmax", 2, "Once there's conversion data to learn from, this finds buyers across Google's inventory.");
  }

  add("google_display", 1, "The cheapest way to stay in front of people who already visited and didn't convert.");

  return out;
}

const round = (n: number, step: number) => Math.round(n / step) * step;

/** Age and gender narrowing, written the way you'd set it up in an ad account. */
function audienceLine(s: MediaScope): string {
  const age = s.age.length === 0 ? "all ages" : s.age.join(", ");
  const gender = s.gender === "all" ? "all genders" : s.gender === "female" ? "women" : "men";
  return `${age}, ${gender}`;
}

function creativeBriefs(s: MediaScope, channels: ChannelPlan[]): CreativeBrief[] {
  const ids = new Set(channels.map((c) => c.id));
  const out: CreativeBrief[] = [];
  if (ids.has("google_search")) {
    out.push({
      channel: "Google Search",
      angle: "Answer the exact request",
      hook: "Repeat the search back in the headline, then the one thing that makes you the obvious choice.",
      format: "Responsive search ads: 15 headlines across brand, benefit, proof and offer, so any combination still reads properly.",
    });
  }
  if (ids.has("meta") || ids.has("tiktok")) {
    out.push({
      channel: ids.has("tiktok") ? "Meta & TikTok" : "Meta",
      angle: "Problem, in their words",
      hook: "Open on the frustration they'd describe to a friend — the first three seconds decide everything.",
      format: hasVideo(s) ? "15–20s vertical video, captions burned in, one idea per cut." : "Single image with a short, specific line of text. Photos of real work beat stock.",
    });
    out.push({
      channel: ids.has("tiktok") ? "Meta & TikTok" : "Meta",
      angle: "Proof",
      hook: s.creative.includes("testimonials") ? "A customer saying the thing you'd otherwise have to claim yourself." : "Before and after, or the work in progress. Show, don't assert.",
      format: "Carousel or UGC-style video. Refresh every 3–4 weeks before fatigue sets in.",
    });
  }
  if (ids.has("linkedin")) {
    out.push({
      channel: "LinkedIn",
      angle: "The cost of the status quo",
      hook: "Name what the job title you're targeting is judged on, and what's currently getting in the way.",
      format: "Single image or document ad, lead gen form attached. No jargon, no stock handshakes.",
    });
  }
  if (ids.has("google_display") || ids.has("google_pmax")) {
    out.push({
      channel: "Retargeting",
      angle: "Unfinished business",
      hook: "Reference the exact thing they looked at, and remove the reason they hesitated.",
      format: "Responsive display: a few sizes, one clear offer, frequency capped so it doesn't become wallpaper.",
    });
  }
  if (s.languages.length > 1) {
    out.push({
      channel: "Every channel",
      angle: "One language per ad set",
      hook: "Write each language natively. A translated ad reads like a translated ad, and performs like one.",
      format: `Separate ad sets per language (${s.languages.length} of them), so budget and results can be read apart.`,
    });
  }
  return out;
}

function searchThemes(s: MediaScope) {
  const commercial = {
    theme: "Ready to buy",
    intent: "Transactional — highest intent, highest cost, best return",
    examples:
      s.model === "ecommerce"
        ? ["buy [product] online", "[product] price", "[brand] [product] offer"]
        : ["[service] near me", "[service] in [city]", "best [service] [city]"],
  };
  const comparison = {
    theme: "Comparing options",
    intent: "Commercial — still deciding, wants reassurance",
    examples: ["best [category]", "[competitor] alternative", "[service] cost", "[category] reviews"],
  };
  const research = {
    theme: "Working out what they need",
    intent: "Informational — cheap clicks, slow payback, good for retargeting pools",
    examples: ["how much does [service] cost", "how to choose [category]", "[problem] solutions"],
  };
  return s.maturity === "first" ? [commercial, comparison] : [commercial, comparison, research];
}

const BASE_NEGATIVES = ["free", "cheap", "jobs", "salary", "vacancy", "course", "training", "diy", "how to make", "internship", "wikipedia", "pdf"];

/** The schedule stops at the end of the flight — a four-week burst has no week-twelve review. */
function milestones(s: MediaScope): Milestone[] {
  const all: Milestone[] = [];
  if (!s.tracking) {
    all.push({ week: 0, title: "Set up conversion tracking", detail: "Nothing else starts until enquiries and sales are being recorded. Without it you can't tell which half of the budget works." });
  }
  all.push({ week: 1, title: "Launch the intent campaigns", detail: "Search first, tightly themed, with the starting negative list applied. One campaign per thing you sell." });
  all.push({ week: 2, title: "First creative in market", detail: "Two or three angles per channel so there's something to compare, not one ad hoping to be right." });
  all.push({ week: 4, title: "First real optimisation", detail: "Read the search terms, add negatives, pause what's clearly not converting, and shift budget to what is." });
  all.push({ week: 6, title: "Turn retargeting on", detail: "You now have enough traffic for retargeting to be worth the money. Cap frequency so it doesn't irritate." });
  all.push({ week: 8, title: "Scale what's working", detail: "Raise budget only on what has proven cost per result, 20–30% at a time so learning isn't reset." });
  all.push({ week: 12, title: "Review the whole quarter", detail: "Cost per result by channel, what creative fatigued, and whether the money is better spent elsewhere next quarter." });

  const within = all.filter((m) => m.week <= s.durationWeeks);
  const last = within[within.length - 1];
  if (last && last.week < s.durationWeeks) {
    within.push({
      week: s.durationWeeks,
      title: "Close the campaign out",
      detail: "Final cost per result by channel, what to keep for next time, and what the retargeting pool is now worth.",
    });
  }
  return within;
}

function warnings(s: MediaScope, viable: boolean, channels: ChannelPlan[]): Warning[] {
  const w: Warning[] = [];
  const floor = MARKET_MEDIA[s.market].floor;
  const f = (n: number) => fmtMoney(n, s.market);

  if (!viable) {
    w.push({
      level: "blocker",
      title: `Below a workable budget for ${MARKETS[s.market].name}`,
      detail: `Under about ${f(floor)} a month, spend is spread too thin for any platform to learn, and you pay to find out nothing. Either raise the budget or put it into one channel only.`,
    });
  }
  if (!s.website) {
    w.push({ level: "blocker", title: "There's nowhere to send the traffic", detail: "Ads to a weak page waste most of the budget. A single focused landing page usually beats a homepage." });
  }
  if (!s.tracking) {
    w.push({ level: "blocker", title: "No conversion tracking", detail: "Without it, every optimisation is guesswork and the platforms can't optimise at all. This is week zero work." });
  }
  if (s.creative.includes("none") || s.creative.length === 0) {
    w.push({ level: "risk", title: "No creative to run", detail: "Search can run on text alone, but social can't. Budget there is parked until there are photos or video." });
  }
  if (s.durationWeeks < 6) {
    w.push({
      level: "risk",
      title: "The flight is short for a cold start",
      detail: `Campaigns spend their first two to three weeks learning. At ${s.durationWeeks} weeks you are paying for most of the learning and collecting little of the payback. Six weeks or more gets a fairer read.`,
    });
  }
  if (s.maturity === "first" && s.objective === "sales") {
    w.push({ level: "note", title: "Automation comes later", detail: "Performance Max and broad targeting need conversion history to work. Start where intent is explicit, then hand the algorithm data." });
  }
  if (s.age.length > 0 && s.age.length < 2 && s.gender !== "all") {
    w.push({
      level: "note",
      title: "Targeting is narrow",
      detail: `Restricting to ${audienceLine(s)} cuts the pool the platforms can optimise against. Worth loosening once you know who actually converts.`,
    });
  }
  if (s.languages.length > 1) {
    w.push({
      level: "note",
      title: `Running in ${s.languages.length} languages`,
      detail: "Each language needs its own ad sets and its own creative, and each splits the budget further. Read results per language, not in aggregate.",
    });
  }
  if (channels.some((c) => c.id === "linkedin")) {
    w.push({ level: "note", title: "LinkedIn is expensive by design", detail: "Clicks cost several times what they do elsewhere. It earns its place only when one customer is worth a lot." });
  }
  if (s.dealValue === 0) {
    w.push({ level: "risk", title: "Value per customer not set", detail: "Without it there's no way to say whether a cost per lead is good or ruinous. It's the number the whole plan should be judged on." });
  }
  return w;
}

function fmtMoney(n: number, market: Market): string {
  const m = MARKETS[market];
  return m.prefix + Math.round(n).toLocaleString(m.locale);
}

export function buildPlan(scope: MediaScope): MediaPlan {
  const s = scope;
  const market = MARKET_MEDIA[s.market];
  const viable = s.budget >= market.floor;
  const weighted = weigh(s);
  const totalWeight = weighted.reduce((t, c) => t + c.weight, 0) || 1;
  const step = s.market === "IN" ? 500 : 10;
  const industry = INDUSTRY[s.industry];

  const cvrBase = CVR[s.objective][s.model] ?? CVR[s.objective].default;
  const cvrBand: [number, number] = [cvrBase[0] * industry.cvr, cvrBase[1] * industry.cvr];

  let channels: ChannelPlan[] = weighted.map(({ id, weight, why }) => {
    const share = weight / totalWeight;
    const budget = round(s.budget * share, step);
    const [cLow, cHigh] = cpc(id, s.market, s.industry);
    const ctr = CTR[id];
    const quality = CHANNEL_QUALITY[id];
    const frequency = FREQUENCY[STAGE[id]];
    const clicksLow = budget / cHigh;
    const clicksHigh = budget / cLow;
    // Impressions follow from clicks and CTR, so the two can never tell different stories.
    const impressionsLow = clicksLow / ctr;
    const impressionsHigh = clicksHigh / ctr;
    return {
      id,
      name: CHANNEL_NAME[id],
      stage: STAGE[id],
      share,
      budget,
      why,
      firstCampaign: firstCampaign(id, s),
      formats: formats(id, s),
      cpcLow: cLow,
      cpcHigh: cHigh,
      cpm: ((cLow + cHigh) / 2) * ctr * 1000,
      ctr,
      impressionsLow,
      impressionsHigh,
      reachLow: impressionsLow / frequency,
      reachHigh: impressionsHigh / frequency,
      frequency,
      resultsLow: clicksLow * cvrBand[0] * quality,
      resultsHigh: clicksHigh * cvrBand[1] * quality,
    };
  });
  channels = channels.sort((a, b) => b.budget - a.budget);

  const sum = (pick: (c: ChannelPlan) => number) => channels.reduce((t, c) => t + pick(c), 0);
  const totalBudget = sum((c) => c.budget);
  const resultsLow = sum((c) => c.resultsLow);
  const resultsHigh = sum((c) => c.resultsHigh);
  const impressionsLow = sum((c) => c.impressionsLow);
  const impressionsHigh = sum((c) => c.impressionsHigh);
  const clicksLow = sum((c) => c.impressionsLow * c.ctr);
  const clicksHigh = sum((c) => c.impressionsHigh * c.ctr);
  const netReachLow = netReach(channels.map((c) => c.reachLow));
  const netReachHigh = netReach(channels.map((c) => c.reachHigh));
  const avgFrequency = netReachHigh > 0 ? impressionsHigh / netReachHigh : 0;

  const [p, e, r] = FUNNEL_SPLIT[s.maturity];
  const funnelSplit: MediaPlan["funnelSplit"] = (
    [
      ["prospecting", p],
      ["engagement", e],
      ["retargeting", r],
    ] as [FunnelStage, number][]
  ).map(([stage, share]) => ({ stage, share, budget: round(s.budget * share, step) }));

  return {
    scope: s,
    currency: MARKETS[s.market].currency,
    viable,
    channels,
    totalBudget,
    campaignBudget: Math.round((totalBudget * s.durationWeeks) / WEEKS_PER_MONTH),
    resultsLow,
    resultsHigh,
    costPerResultLow: resultsHigh > 0 ? totalBudget / resultsHigh : 0,
    costPerResultHigh: resultsLow > 0 ? totalBudget / resultsLow : 0,
    impressionsLow,
    impressionsHigh,
    clicksLow,
    clicksHigh,
    netReachLow,
    netReachHigh,
    avgFrequency,
    breakEvenResults: s.dealValue > 0 ? Math.ceil(totalBudget / s.dealValue) : null,
    funnelSplit,
    creative: creativeBriefs(s, channels),
    searchThemes: searchThemes(s),
    negatives: BASE_NEGATIVES,
    milestones: milestones(s),
    measurement: [
      "Conversion tracking on every enquiry, call and sale — server-side where the platform supports it.",
      "One agreed definition of a qualified lead, so the platforms optimise for the right thing.",
      "Weekly search-term review in the first month, then fortnightly. Negatives are never finished.",
      "Frequency capped at 2–3 a week for prospecting and 5 for retargeting, so you don't wear people out.",
      s.dealValue > 0 ? "Cost per result judged against the value of a customer, not against a platform average." : "Set a value per customer — it's the only way to judge whether a cost per result is good.",
    ],
    warnings: warnings(s, viable, channels),
    assumptions: [
      `Costs are planning benchmarks for ${industry.label.toLowerCase()} in ${MARKETS[s.market].name}, not quotes — real auctions vary by season and by how crowded your niche is.`,
      "Budget figures are ad spend paid to the platforms. Management of the campaigns is separate.",
      "Cost per thousand impressions is derived from the click cost and click-through rate, so impressions, clicks and spend always agree.",
      "Reach assumes each person sees the ads 2–6 times a month depending on the stage, and is deduplicated across channels — it is an estimate, not a measurement.",
      "Results assume the landing page converts at a normal rate for the industry; a weak page changes everything.",
      `Ranges are ±${Math.round(SPREAD * 100)}% around the midpoint, which is roughly what a first quarter looks like.`,
    ],
  };
}

function firstCampaign(id: ChannelId, s: MediaScope): string {
  const who = audienceLine(s);
  switch (id) {
    case "google_search":
      return s.model === "ecommerce" ? "Brand + top category terms, exact and phrase match" : "One campaign per service, tightly themed ad groups, phrase match";
    case "gbp":
      return `Local campaign across ${s.cities > 1 ? `${s.cities} cities` : "your service area"}, call and directions as the conversion`;
    case "meta":
      return s.objective === "leads"
        ? `Lead campaign with an instant form, ${who}, creative doing the rest of the targeting`
        : `Conversion campaign, ${who}, three creative angles`;
    case "linkedin":
      return "Single image ads to a job-title audience with a lead gen form attached";
    case "tiktok":
      return `In-feed video, ${who}, three hooks tested against each other`;
    case "youtube":
      return `Short in-stream video against in-market audiences, ${who}`;
    case "google_pmax":
      return "One asset group per product theme, with audience signals from your customer list";
    case "google_display":
      return "Retargeting site visitors from the last 30 days, frequency capped";
  }
}

function formats(id: ChannelId, s: MediaScope): string[] {
  switch (id) {
    case "google_search":
      return ["Responsive search ads", "Sitelinks and callouts", "Call extensions"];
    case "gbp":
      return ["Local ads", "Call-only ads", "Location extensions"];
    case "meta":
      return hasVideo(s) ? ["Vertical video", "Carousel", "Instant forms"] : ["Single image", "Carousel", "Instant forms"];
    case "linkedin":
      return ["Single image", "Document ads", "Lead gen forms"];
    case "tiktok":
      return ["In-feed video", "Spark ads"];
    case "youtube":
      return ["Skippable in-stream", "Shorts"];
    case "google_pmax":
      return ["Asset groups", "Product feed", "Audience signals"];
    case "google_display":
      return ["Responsive display", "Retargeting lists"];
  }
}
