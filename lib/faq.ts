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
 * Shared by the FAQ section and the FAQPage structured data. Prices and timelines come from the
 * planner's own reference projects, so the copy can never contradict the calculator.
 */
export const faqs: { q: string; a: string }[] = [
  {
    q: "How much does a website or custom software cost?",
    a: `A one-page site starts around ${approx(e.landingPage.fixedPrice)}, and a typical six-page business website is about ${approx(e.businessSite.fixedPrice)}. A Shopify store usually lands near ${approx(e.shopifyStore.fixedPrice)}, and a business system with an admin panel, CRM and dashboards around ${approx(e.businessSystem.fixedPrice)}. Custom stores, apps and SaaS products usually start around ${approx(Math.min(...big.map((x) => x.fixedPrice)))} and grow with scope. All before GST. Outside India, the cost planner prices in US dollars, pounds or dirhams, with the local tax treatment and providers.`,
  },
  {
    q: "How long does a project take?",
    a: `A simple business website usually takes ${weeks(e.businessSite)}. A business system is around ${weeks(e.businessSystem)}, and apps or custom platforms ${Math.min(...big.map((x) => x.timeline.weeks))}–${Math.max(...big.map((x) => x.timeline.weeksHigh))} weeks. Bigger builds go live in phases, so something useful launches early rather than everything landing at the end.`,
  },
  {
    q: "Do I own the code, domain and data?",
    a: "Yes. Your domain, hosting, analytics and ad accounts are registered in your name from day one, and the code is yours. Nothing is held on our accounts, so you are never locked in.",
  },
  {
    q: "Can you guarantee first-page Google rankings?",
    a: "No, and neither can anyone else honestly — Google itself warns against agencies promising guaranteed rankings. What we do commit to is the technical SEO, content structure and reporting that improve your chances, plus monthly visibility into exactly what changed and what it moved.",
  },
  {
    q: "Do I have to buy all six stages?",
    a: "No. Most clients start with one stage — usually a website or an internal system — see whether it works, then add design, growth or market intelligence later. We will tell you if a smaller piece of work solves the problem.",
  },
  {
    q: "Is ad spend and hosting included in your fee?",
    a: "No, and that is deliberate. Ad budget, hosting, domains, payment-gateway fees and software licences are paid by you directly at cost, with no markup from us. Our fee covers only our work, so you can always see what you are paying for.",
  },
];
