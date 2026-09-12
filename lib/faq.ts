import { BENCHMARKS } from "./pricing/benchmarks";
import { estimate } from "./pricing/estimate";
import { formatter, weeksLabel } from "./pricing/format";

const inrShort = formatter("IN").short;

/** Round for prose: nearest ₹5K under a lakh, ₹10K above. */
const approx = (n: number) => inrShort(Math.round(n / (n < 100000 ? 5000 : 10000)) * (n < 100000 ? 5000 : 10000));

const e = Object.fromEntries(Object.entries(BENCHMARKS).map(([k, s]) => [k, estimate(s)])) as Record<
  keyof typeof BENCHMARKS,
  ReturnType<typeof estimate>
>;
const big = [e.customStore, e.bookingApp, e.saasMvp];
const weeks = (x: ReturnType<typeof estimate>) => weeksLabel(x.timeline.weeks, x.timeline.weeksHigh);

/**
 * Every answer carries an exhibit: the prose claim, and the evidence beside it. The measured ones
 * are computed from the same engine that prices real projects, so the FAQ can't drift from the
 * planner — change a rate and these move with it.
 */
export type Exhibit =
  | { kind: "bars"; caption: string; unit: string; rows: { label: string; value: string; weight: number }[] }
  | { kind: "list"; caption: string; items: string[] }
  | { kind: "figure"; value: string; caption: string; note: string };

export interface Faq {
  q: string;
  a: string;
  exhibit: Exhibit;
}

/** Prices and week counts, scaled against the biggest row so the bars read as a ladder. */
function bars(
  caption: string,
  unit: string,
  rows: [label: string, value: string, size: number][]
): Exhibit {
  const max = Math.max(...rows.map(([, , size]) => size));
  return {
    kind: "bars",
    caption,
    unit,
    rows: rows.map(([label, value, size]) => ({ label, value, weight: size / max })),
  };
}

const appWeeksLow = Math.min(...big.map((x) => x.timeline.weeks));
const appWeeksHigh = Math.max(...big.map((x) => x.timeline.weeksHigh));
const smallestBig = Math.min(...big.map((x) => x.fixedPrice));

/**
 * Shared by the FAQ section and the FAQPage structured data. Prices and timelines come from the
 * planner's own reference projects, so the copy can never contradict the calculator.
 */
export const faqs: Faq[] = [
  {
    q: "How much does a website or custom software cost?",
    exhibit: bars("Today's reference prices", "before GST", [
      ["One-page site", approx(e.landingPage.fixedPrice), e.landingPage.fixedPrice],
      ["Business website", approx(e.businessSite.fixedPrice), e.businessSite.fixedPrice],
      ["Shopify store", approx(e.shopifyStore.fixedPrice), e.shopifyStore.fixedPrice],
      ["Business system", approx(e.businessSystem.fixedPrice), e.businessSystem.fixedPrice],
      ["App or SaaS, from", approx(smallestBig), smallestBig],
    ]),
    a: `A one-page site starts around ${approx(e.landingPage.fixedPrice)}, and a typical six-page business website is about ${approx(e.businessSite.fixedPrice)}. A Shopify store usually lands near ${approx(e.shopifyStore.fixedPrice)}, and a business system with an admin panel, CRM and dashboards around ${approx(e.businessSystem.fixedPrice)}. Custom stores, apps and SaaS products usually start around ${approx(Math.min(...big.map((x) => x.fixedPrice)))} and grow with scope. All before GST. Outside India, the cost planner prices in US dollars, pounds or dirhams, with the local tax treatment and providers.`,
  },
  {
    q: "How long does a project take?",
    exhibit: bars("Typical delivery", "weeks, start to live", [
      ["Business website", weeks(e.businessSite), e.businessSite.timeline.weeksHigh],
      ["Shopify store", weeks(e.shopifyStore), e.shopifyStore.timeline.weeksHigh],
      ["Business system", weeks(e.businessSystem), e.businessSystem.timeline.weeksHigh],
      ["App or platform", `${appWeeksLow}–${appWeeksHigh} weeks`, appWeeksHigh],
    ]),
    a: `A simple business website usually takes ${weeks(e.businessSite)}. A business system is around ${weeks(e.businessSystem)}, and apps or custom platforms ${Math.min(...big.map((x) => x.timeline.weeks))}–${Math.max(...big.map((x) => x.timeline.weeksHigh))} weeks. Bigger builds go live in phases, so something useful launches early rather than everything landing at the end.`,
  },
  {
    q: "Do I own the code, domain and data?",
    exhibit: {
      kind: "list",
      caption: "Registered in your name, day one",
      items: ["Domain", "Hosting", "Analytics", "Ad accounts", "Customer data", "Source code"],
    },
    a: "Yes. Your domain, hosting, analytics and ad accounts are registered in your name from day one, and the code is yours. Nothing is held on our accounts, so you are never locked in.",
  },
  {
    q: "Can you guarantee first-page Google rankings?",
    exhibit: {
      kind: "figure",
      value: "0",
      caption: "rankings we will guarantee",
      note: "What we do commit to: technical SEO, content structure, and a monthly report of exactly what changed and what it moved.",
    },
    a: "No, and neither can anyone else honestly — Google itself warns against agencies promising guaranteed rankings. What we do commit to is the technical SEO, content structure and reporting that improve your chances, plus monthly visibility into exactly what changed and what it moved.",
  },
  {
    q: "Do I have to buy all six stages?",
    exhibit: {
      kind: "figure",
      value: "1",
      caption: "stage most clients start with",
      note: "Usually a website or an internal system. Design, growth and market intelligence get added once the first one earns its keep.",
    },
    a: "No. Most clients start with one stage — usually a website or an internal system — see whether it works, then add design, growth or market intelligence later. We will tell you if a smaller piece of work solves the problem.",
  },
  {
    q: "Is ad spend and hosting included in your fee?",
    exhibit: {
      kind: "figure",
      value: "0%",
      caption: "markup on pass-through costs",
      note: "Ad budget, hosting, domains, gateway fees and licences are paid by you at cost. Our fee covers our work, and nothing else.",
    },
    a: "No, and that is deliberate. Ad budget, hosting, domains, payment-gateway fees and software licences are paid by you directly at cost, with no markup from us. Our fee covers only our work, so you can always see what you are paying for.",
  },
];
