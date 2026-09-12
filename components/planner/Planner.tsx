"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BENCHMARKS, type BenchmarkId } from "@/lib/pricing/benchmarks";
import { estimate } from "@/lib/pricing/estimate";
import { formatter, weeksLabel } from "@/lib/pricing/format";
import { MARKETS } from "@/lib/pricing/markets";
import { useMarket } from "@/lib/useMarket";
import { DEFAULT_SCOPE, applyPatch, decodeScope, encodeScope, removalPatch } from "@/lib/pricing/scope";
import type {
  AppPlatforms,
  BudgetBand,
  Content,
  DesignTier,
  Feature,
  Goal,
  GrowthChannel,
  IntelItem,
  Integration,
  Market,
  Platform,
  ProductBand,
  Scope,
  Starting,
  StoreApproach,
  Timeline,
} from "@/lib/pricing/types";
import { Chips, Choice, Stepper, Toggle } from "./controls";
import EstimateDetail from "./EstimateDetail";
import { Checks, Headline } from "./Summary";

const PRESETS: [BenchmarkId, string][] = [
  ["businessSite", "Business website"],
  ["shopifyStore", "Shopify store"],
  ["businessSystem", "Internal system"],
  ["customStore", "Custom store"],
  ["bookingApp", "Booking app"],
  ["saasMvp", "SaaS product"],
];

const GOALS: [Goal, string][] = [
  ["online", "Stronger online presence"],
  ["leads", "More qualified leads"],
  ["sales", "Easier selling"],
  ["operations", "Run operations better"],
  ["product", "Launch a new product"],
  ["data", "Understand the market"],
];
const TIMELINES: [Timeline, string][] = [
  ["explore", "No fixed date"],
  ["one", "1–2 months"],
  ["three", "3–4 months"],
  ["six", "4–6 months"],
  ["later", "6+ months, flexible"],
];
const MARKET_OPTIONS: [Market, string][] = [
  ["IN", "India · ₹"],
  ["US", "United States · $"],
  ["UK", "United Kingdom · £"],
  ["AE", "UAE · AED"],
];

function budgetOptions(market: Market): [BudgetBand, string][] {
  const b = MARKETS[market].budgets;
  return [
    ...(Object.keys(b) as Exclude<BudgetBand, "unknown">[]).map((k): [BudgetBand, string] => [k, b[k].label]),
    ["unknown", "Not sure"],
  ];
}
const BUILD: [Platform, string][] = [
  ["website", "Website"],
  ["store", "Online store"],
  ["webapp", "Web app"],
  ["app", "Mobile app"],
  ["saas", "SaaS product"],
  ["internal", "Internal system"],
];
const STARTING: [Starting, string][] = [
  ["nothing", "Nothing yet"],
  ["site", "A website"],
  ["software", "Software"],
  ["brand", "A brand"],
  ["crm", "A CRM"],
  ["data", "Customer / product data"],
];
const FEATURES: [Feature, string][] = [
  ["catalogue", "Catalogue"],
  ["accounts", "Customer logins"],
  ["payments", "Payments"],
  ["booking", "Bookings"],
  ["admin", "Admin panel"],
  ["crm", "CRM"],
  ["dashboard", "Dashboards"],
  ["automation", "Automations"],
  ["custom", "Custom workflow"],
];
/** Integration chips name the providers clients in that market actually use. */
function integrationOptions(market: Market): [Integration, string][] {
  const v = MARKETS[market].vendors;
  return [
    ["whatsapp", "WhatsApp API"],
    ["accounting", v.accounting.replace(/ \(.*\)$/, "")],
    ["shipping", v.shipping.replace(/ \(.*\)$/, "").replace(/ via .*$/, "")],
    ["sms", "SMS & OTP"],
    ["sheets", "Google Sheets"],
    ["crm_ext", "Their existing CRM"],
    ["maps", "Maps / store locator"],
    ["other", "ERP or in-house system"],
  ];
}
const PRODUCTS: [ProductBand, string][] = [
  ["s", "Up to 50"],
  ["m", "50–500"],
  ["l", "500–5,000"],
  ["xl", "5,000+"],
];
const STORE: [StoreApproach, string][] = [
  ["auto", "Recommend"],
  ["hosted", "Shopify"],
  ["custom", "Custom"],
];
const APP: [AppPlatforms, string][] = [
  ["android", "Android"],
  ["ios", "iOS"],
  ["both", "Both"],
];
const DESIGN: [DesignTier, string][] = [
  ["efficient", "Clean & efficient"],
  ["custom", "Distinctive & custom"],
  ["premium", "Premium"],
];
const CONTENT: [Content, string][] = [
  ["provided", "Client supplies it"],
  ["copy", "We write copy"],
  ["copy_visuals", "Copy + visuals"],
];
const LANGUAGES: [string, string][] = [
  ["1", "One"],
  ["2", "Two"],
  ["3", "Three +"],
];
const GROWTH: [GrowthChannel, string][] = [
  ["seo", "SEO"],
  ["paid", "Paid ads"],
  ["media", "Media plan"],
  ["leads", "Lead capture"],
  ["sales", "Sales kit"],
  ["analytics", "Conversion tracking"],
];
const INTEL: [IntelItem, string][] = [
  ["research", "Competitor report"],
  ["pricing", "Price monitor"],
  ["products", "Product monitor"],
  ["public", "Public-web data"],
  ["recurring", "Weekly refresh"],
  ["dashboard", "Dashboard"],
];

function fmtDate(d: Date, market: Market) {
  return d.toLocaleDateString(MARKETS[market].locale, { day: "numeric", month: "short", year: "numeric" });
}

export default function Planner() {
  const [scope, setScope] = useState<Scope>(DEFAULT_SCOPE);
  const [client, setClient] = useState({ name: "", company: "" });
  const [today, setToday] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const { market: detected, setMarket, ready: marketReady } = useMarket({ remember: true });
  // A shared link carries its own market; only a fresh visit takes the detected one.
  const fromLink = useRef(false);

  useEffect(() => {
    const load = () => {
      const m = window.location.hash.match(/s=([A-Za-z0-9_-]+)/);
      if (m) {
        fromLink.current = true;
        setScope(decodeScope(m[1]));
      }
    };
    load();
    setToday(new Date());
    setReady(true);
    // A pasted share link only changes the hash, which doesn't remount the page.
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  useEffect(() => {
    if (marketReady && !fromLink.current) setScope((s) => ({ ...s, market: detected }));
  }, [marketReady, detected]);

  useEffect(() => {
    if (!ready) return;
    const empty = JSON.stringify({ ...scope, market: DEFAULT_SCOPE.market }) === JSON.stringify(DEFAULT_SCOPE);
    const url = `${window.location.pathname}${empty ? "" : `#s=${encodeScope(scope)}`}`;
    window.history.replaceState(null, "", url);
  }, [scope, ready]);

  const est = useMemo(() => estimate(scope), [scope]);
  const set = useCallback((patch: Partial<Scope>) => setScope((s) => applyPatch(s, patch)), []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  }

  const b = new Set(scope.build);
  const fmt = formatter(scope.market);
  const chooseMarket = (market: Market) => {
    setMarket(market);
    set({ market });
  };
  const hasPlatform = est.packages.some((p) => p.id === "foundation");
  const validUntil = today ? new Date(today.getTime() + 30 * 86400000) : null;

  return (
    <div className="planner wrap">
      <header className="phead">
        <div>
          <div className="kicker">COST PLANNER</div>
          <h1 className="ptitle">What will it cost, and how long will it take?</h1>
          <p className="plead">
            Every number traces back to hours and a rate. Change anything and the estimate, timeline and payment plan
            update as you go.
          </p>
        </div>
        <div className="pclient noprint">
          <input
            className="field"
            placeholder="Prepared for (name)"
            aria-label="Prepared for"
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
          />
          <input
            className="field"
            placeholder="Business"
            aria-label="Business name"
            value={client.company}
            onChange={(e) => setClient({ ...client, company: e.target.value })}
          />
        </div>
      </header>

      <div className="printhead printonly">
        <b>CHIMPANION.</b>
        <div>
          <div className="ptitle-print">Project estimate{client.company ? ` — ${client.company}` : ""}</div>
          <div className="plain">
            {client.name && <>Prepared for {client.name} · </>}
            {est.ref}
            {today && <> · {fmtDate(today, scope.market)}</>}
            {validUntil && <> · valid until {fmtDate(validUntil, scope.market)}</>}
          </div>
        </div>
      </div>

      <div className="pmarket noprint">
        <Choice
          label="Client's market"
          hint="Set from the visitor's location. Change it when you're pricing for a client somewhere else — rates, currency, tax, local vendors and compliance all follow."
          options={MARKET_OPTIONS}
          value={scope.market}
          onChange={chooseMarket}
        />
      </div>

      <div className="presets noprint" role="group" aria-label="Start from a reference project">
        <span className="small">Start from</span>
        {PRESETS.map(([id, label]) => (
          <button type="button" key={id} className="pchip" onClick={() => setScope({ ...BENCHMARKS[id], market: scope.market })}>
            {label}
          </button>
        ))}
        <button type="button" className="pchip ghostchip" onClick={() => setScope({ ...DEFAULT_SCOPE, market: scope.market })}>
          Clear
        </button>
      </div>

      <div className="pgrid">
        <div className="pform noprint">
          <section className="pgroup" aria-labelledby="pg-goal">
            <h2 id="pg-goal">Goal, timing, budget</h2>
            <Chips label="What has to change" options={GOALS} value={scope.goals} onChange={(goals) => set({ goals })} />
            <Choice label="Go-live deadline" options={TIMELINES} value={scope.timeline} onChange={(timeline) => set({ timeline })} />
            <Choice
              label="Budget they're planning around"
              hint="Never changes the price — it only checks whether the scope fits."
              options={budgetOptions(scope.market)}
              value={scope.budget}
              onChange={(budget) => set({ budget })}
            />
          </section>

          <section className="pgroup" aria-labelledby="pg-build">
            <h2 id="pg-build">What we&apos;re building</h2>
            <Chips
              label="Build"
              hint="Leave empty for growth or intelligence work on what already exists."
              options={BUILD}
              value={scope.build}
              onChange={(build) => set({ build })}
            />
            {b.has("website") && (
              <Stepper label="Website pages" hint="Home, about, services, contact…" value={scope.pages} min={1} max={60} onChange={(pages) => set({ pages })} />
            )}
            {b.has("store") && (
              <Choice
                label="Store platform"
                hint="Recommend picks Shopify unless a custom build is genuinely needed."
                options={STORE}
                value={scope.storeApproach}
                onChange={(storeApproach) => set({ storeApproach })}
              />
            )}
            {b.has("app") && <Choice label="App platforms" options={APP} value={scope.appPlatforms} onChange={(appPlatforms) => set({ appPlatforms })} />}
            <Chips label="What already exists" options={STARTING} value={scope.starting} onChange={(starting) => set({ starting })} />
            {(scope.starting.includes("software") || scope.starting.includes("data")) && (
              <Toggle
                label="Move existing records across"
                hint="Customers, orders or products from the current system."
                checked={scope.migration}
                onChange={(migration) => set({ migration })}
              />
            )}
          </section>

          <section className="pgroup" aria-labelledby="pg-features">
            <h2 id="pg-features">What it needs to do</h2>
            <Chips
              label="Features on day one"
              hint="On a plain website, most of these use off-the-shelf tools instead of custom builds."
              options={FEATURES}
              value={scope.features}
              onChange={(features) => set({ features })}
            />
            {scope.features.includes("custom") && (
              <Stepper
                label="Custom workflows"
                hint="Quotations, approvals, job tracking — each one separately."
                value={scope.workflows}
                min={1}
                max={6}
                onChange={(workflows) => set({ workflows })}
              />
            )}
            {hasPlatform && (
              <Stepper
                label="Kinds of user"
                hint="Customer, staff, admin, branch manager… Two are included."
                value={scope.roles}
                min={1}
                max={8}
                onChange={(roles) => set({ roles })}
              />
            )}
            {(b.has("store") || scope.features.includes("catalogue")) && (
              <Choice label="Products or listings" options={PRODUCTS} value={scope.products} onChange={(products) => set({ products })} />
            )}
            <Chips label="Connects to" options={integrationOptions(scope.market)} value={scope.integrations} onChange={(integrations) => set({ integrations })} />
          </section>

          <section className="pgroup" aria-labelledby="pg-look">
            <h2 id="pg-look">Look and content</h2>
            <Choice label="Design" options={DESIGN} value={scope.design} onChange={(design) => set({ design })} />
            <Choice label="Content" options={CONTENT} value={scope.content} onChange={(content) => set({ content })} />
            <Choice
              label="Languages"
              options={LANGUAGES}
              value={String(scope.languages)}
              onChange={(v) => set({ languages: Number(v) })}
            />
          </section>

          <section className="pgroup" aria-labelledby="pg-after">
            <h2 id="pg-after">After launch</h2>
            <Chips label="Growth" options={GROWTH} value={scope.growth} onChange={(growth) => set({ growth })} />
            <Chips label="Market intelligence" options={INTEL} value={scope.intel} onChange={(intel) => set({ intel })} />
          </section>
        </div>

        <aside className="pside" aria-label="Estimate summary">
          <div className="psum">
            <div className="psum-top">
              <span className="small">Estimate</span>
              <span className="mono small">{est.ref}</span>
            </div>
            <Headline est={est} />
            <div className="psum-actions noprint">
              <button type="button" className="pill dark" onClick={() => window.print()} disabled={est.fixedPrice === 0}>
                Print / save PDF
              </button>
              <button type="button" className="pill ghost" onClick={copyLink}>
                {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
          </div>
          <div className="noprint">
            <Checks est={est} onApply={set} />
          </div>
        </aside>
      </div>

      <EstimateDetail est={est} onRemove={(src) => set(removalPatch(scope, src))} />

      <p className="pfine">
        Estimates are planning figures from our rate card. The fixed price is confirmed in writing after a discovery
        session.
      </p>

      {est.fixedPrice > 0 && (
        <button
          type="button"
          className="pbar noprint"
          onClick={() => document.querySelector(".psum")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <span>
            <span className="lbl">Fixed price</span>
            <span className="val">{fmt.short(est.fixedPrice)}</span>
          </span>
          <span style={{ textAlign: "right" }}>
            <span className="lbl">Timeline</span>
            <span className="val">{weeksLabel(est.timeline.weeks, est.timeline.weeksHigh)}</span>
          </span>
        </button>
      )}
    </div>
  );
}
