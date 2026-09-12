/** Assumptions and exclusions written from the actual scope — the fine print a client signs against. */
import type { Core } from "./estimate.ts";
import { formatter } from "./format.ts";
import { MARKETS } from "./markets.ts";
import { DESIGN_TIERS, PRODUCT_BANDS, STORE_CONTENT_PAGES, WARRANTY_DAYS } from "./ratecard.ts";

export function writeNotes(core: Core): { assumptions: string[]; exclusions: string[] } {
  const s = core.scope;
  const b = new Set(s.build);
  const store = core.set.store;
  const tier = DESIGN_TIERS[s.design];
  const making = b.size > 0 || s.features.length > 0;
  const m = MARKETS[s.market];
  const { money } = formatter(s.market);
  const rates = Object.values(m.rates);
  const a: string[] = [];
  const x: string[] = [];

  if (core.set.packages.length === 0) return { assumptions: [], exclusions: [] };

  a.push(
    `Priced for ${m.name} at ${money(Math.min(...rates))}–${money(Math.max(...rates))}/hr depending on discipline, with project management at 10% of delivery hours. ${m.invoicing}`
  );

  if (making) {
    a.push(`${tier.label} design, with up to ${tier.rounds} round${tier.rounds > 1 ? "s" : ""} of revisions per screen.`);
    const pages = (b.has("website") ? s.pages : 0) + (store && !b.has("website") ? STORE_CONTENT_PAGES : 0);
    if (pages > 0) {
      a.push(
        s.content === "provided"
          ? `You supply final text and images for ${pages} page${pages > 1 ? "s" : ""}.`
          : s.content === "copy"
            ? `We write copy for ${pages} page${pages > 1 ? "s" : ""}; you supply photos.`
            : `We write copy and source visuals for ${pages} page${pages > 1 ? "s" : ""}; a photo shoot is quoted separately.`
      );
    }
  }

  if (store) {
    a.push(
      store.approach === "hosted"
        ? "Store runs on Shopify, with the plan billed to you directly."
        : "Custom storefront and checkout, hosted on accounts in your name."
    );
  }
  if (store || s.features.includes("catalogue")) {
    a.push(`Up to ${PRODUCT_BANDS[s.products].label.toLowerCase()} products, loaded from a spreadsheet you provide.`);
  }
  if (store || s.features.includes("payments")) {
    a.push(`Payments through ${m.vendors.payments}; gateway fees (${m.vendors.paymentFee}) are paid by you.`);
  }
  if (b.has("app")) {
    const which = { android: "Android", ios: "iOS", both: "Android and iOS" }[s.appPlatforms];
    a.push(`${which} from one cross-platform codebase, listed under developer accounts in your name.`);
  }
  if (core.set.hasPlatform) {
    a.push(`${s.roles} kind${s.roles > 1 ? "s" : ""} of user (for example customer, staff, admin), each with its own permissions.`);
  }
  if (s.features.includes("custom")) {
    a.push(
      `${s.workflows} custom workflow${s.workflows > 1 ? "s" : ""} of up to about four screens each — exact behaviour is fixed during discovery.`
    );
  }
  if (s.integrations.length) {
    a.push("Each integration assumes the other system has a documented API and you can grant us access.");
  }
  if (s.languages > 1) {
    a.push(`${s.languages === 3 ? "Three or more" : "Two"} languages${m.rtl ? ", including Arabic with a right-to-left layout" : ""}; you supply the translated text.`);
  }
  if (s.migration) a.push("One migration of existing records, from exports you provide, plus a verification pass.");
  if (s.intel.length) a.push("Monitoring covers up to 10 competitors, using publicly available information only.");
  if (s.growth.length) a.push("Growth setup covers the first campaigns and tracking; ongoing management is a separate monthly plan.");

  a.push("Feedback within two working days at each review keeps the timeline.");
  if (making) a.push(`${WARRANTY_DAYS} days of bug fixes after launch, and every account set up in your name.`);

  x.push(m.tax.rate > 0 ? `${m.tax.label} at ${Math.round(m.tax.rate * 100)}%, shown separately.` : m.tax.note);
  x.push("Hosting, domain, app-store and subscription fees — listed under running costs, paid to the provider.");
  if (s.growth.includes("paid")) x.push("Ad spend, which you pay Google and Meta directly.");
  if (making && s.content === "provided") x.push("Copywriting and photography.");
  if (s.content === "copy") x.push("Photography.");
  x.push("Anything not listed in the scope. Changes after sign-off are quoted before we start them.");
  if (making) x.push(`Maintenance after the ${WARRANTY_DAYS}-day warranty — available as an optional monthly plan.`);

  return { assumptions: a, exclusions: x };
}
