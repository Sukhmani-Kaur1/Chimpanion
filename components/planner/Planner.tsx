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
import { Chips, Choice, Stepper, Toggle, chipClass } from "./controls";
import EstimateDetail from "./EstimateDetail";
import { Checks, Headline } from "./Summary";
import Button from "../ui/Button";
import { Container, fieldClass } from "../ui/Layout";
import Typography from "../ui/Typography";
import { cn } from "@/lib/cn";

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

/** White card used for each block of the form and the summary. */
const card = "rounded-panel border border-line bg-card sm:rounded-[20px]";

function fmtDate(d: Date, market: Market) {
  return d.toLocaleDateString(MARKETS[market].locale, { day: "numeric", month: "short", year: "numeric" });
}

/** One labelled block of the form. */
function Group({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(card, "p-[18px] pb-1.5 sm:p-[22px] sm:pb-1.5")} aria-labelledby={id}>
      <Typography variant="h5" as="h2" id={id} className="mb-4 font-sans text-base tracking-[-0.01em]">
        {title}
      </Typography>
      {children}
    </section>
  );
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
    <Container className="pt-6 pb-28 sm:pt-10 lg:pb-20 print:max-w-none print:p-0">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-6 print:hidden">
        <div>
          <Typography variant="kicker">COST PLANNER</Typography>
          <Typography variant="h2" className="my-2 max-w-[720px]">
            What will it cost, and how long will it take?
          </Typography>
          <Typography variant="body" className="max-w-[600px]">
            Every number traces back to hours and a rate. Change anything and the estimate, timeline and
            payment plan update as you go.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2 max-sm:w-full">
          <input
            className={cn(fieldClass, "min-h-[42px] w-[200px] text-sm max-sm:w-auto max-sm:min-w-0 max-sm:flex-1")}
            placeholder="Prepared for (name)"
            aria-label="Prepared for"
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
          />
          <input
            className={cn(fieldClass, "min-h-[42px] w-[200px] text-sm max-sm:w-auto max-sm:min-w-0 max-sm:flex-1")}
            placeholder="Business"
            aria-label="Business name"
            value={client.company}
            onChange={(e) => setClient({ ...client, company: e.target.value })}
          />
        </div>
      </header>

      {/* Print-only letterhead — the planner doubles as the client's PDF. */}
      <div className="hidden items-baseline gap-[18px] border-b-2 border-ink pb-2.5 print:flex">
        <Typography variant="h5" as="b">
          CHIMPANION.
        </Typography>
        <div>
          <Typography variant="h4" as="div">
            Project estimate{client.company ? ` — ${client.company}` : ""}
          </Typography>
          <Typography variant="bodySm" as="div">
            {client.name && <>Prepared for {client.name} · </>}
            {est.ref}
            {today && <> · {fmtDate(today, scope.market)}</>}
            {validUntil && <> · valid until {fmtDate(validUntil, scope.market)}</>}
          </Typography>
        </div>
      </div>

      <div className={cn(card, "mb-3.5 px-[18px] pt-[18px] pb-0.5 sm:px-[22px] print:hidden")}>
        <Choice
          label="Client's market"
          hint="Set from the visitor's location. Change it when you're pricing for a client somewhere else — rates, currency, tax, local vendors and compliance all follow."
          options={MARKET_OPTIONS}
          value={scope.market}
          onChange={chooseMarket}
        />
      </div>

      <div
        className="mb-5 flex flex-wrap items-center gap-1.5 print:hidden"
        role="group"
        aria-label="Start from a reference project"
      >
        <Typography variant="overline" className="mr-1.5">
          Start from
        </Typography>
        {PRESETS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={chipClass(false)}
            onClick={() => setScope({ ...BENCHMARKS[id], market: scope.market })}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={cn(chipClass(false), "border-dashed bg-transparent text-muted")}
          onClick={() => setScope({ ...DEFAULT_SCOPE, market: scope.market })}
        >
          Clear
        </button>
      </div>

      {/* Form and summary sit side by side once there's room; stacked below that. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_380px] print:block">
        <div className="grid min-w-0 gap-3.5 print:hidden">
          <Group id="pg-goal" title="Goal, timing, budget">
            <Chips label="What has to change" options={GOALS} value={scope.goals} onChange={(goals) => set({ goals })} />
            <Choice label="Go-live deadline" options={TIMELINES} value={scope.timeline} onChange={(timeline) => set({ timeline })} />
            <Choice
              label="Budget they're planning around"
              hint="Never changes the price — it only checks whether the scope fits."
              options={budgetOptions(scope.market)}
              value={scope.budget}
              onChange={(budget) => set({ budget })}
            />
          </Group>

          <Group id="pg-build" title="What we're building">
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
          </Group>

          <Group id="pg-features" title="What it needs to do">
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
          </Group>

          <Group id="pg-look" title="Look and content">
            <Choice label="Design" options={DESIGN} value={scope.design} onChange={(design) => set({ design })} />
            <Choice label="Content" options={CONTENT} value={scope.content} onChange={(content) => set({ content })} />
            <Choice
              label="Languages"
              options={LANGUAGES}
              value={String(scope.languages)}
              onChange={(v) => set({ languages: Number(v) })}
            />
          </Group>

          <Group id="pg-after" title="After launch">
            <Chips label="Growth" options={GROWTH} value={scope.growth} onChange={(growth) => set({ growth })} />
            <Chips label="Market intelligence" options={INTEL} value={scope.intel} onChange={(intel) => set({ intel })} />
          </Group>
        </div>

        <aside
          className="grid min-w-0 gap-3 lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pb-1 print:static print:max-h-none print:overflow-visible"
          aria-label="Estimate summary"
        >
          <div id="plan-summary" className={cn(card, "scroll-mt-20 p-[18px] sm:p-[22px]")}>
            <div className="mb-3 flex items-baseline justify-between">
              <Typography variant="overline">Estimate</Typography>
              <Typography variant="overline" className="font-mono tabular-nums">
                {est.ref}
              </Typography>
            </div>
            <Headline est={est} />
            <div className="mt-4 flex gap-2 print:hidden">
              <Button
                variant="dark"
                size="sm"
                className="min-h-[42px] flex-1"
                onClick={() => window.print()}
                disabled={est.fixedPrice === 0}
              >
                Print / save PDF
              </Button>
              <Button variant="ghost" size="sm" className="min-h-[42px] flex-1" onClick={copyLink}>
                {copied ? "Link copied" : "Copy link"}
              </Button>
            </div>
          </div>
          <Checks est={est} onApply={set} className="print:hidden" />
        </aside>
      </div>

      <EstimateDetail est={est} onRemove={(src) => set(removalPatch(scope, src))} />

      <Typography variant="caption" className="mt-[18px] max-w-[70ch]">
        Estimates are planning figures from our rate card. The fixed price is confirmed in writing after a
        discovery session.
      </Typography>

      {/* Phone-only summary bar — the sidebar is far down the page there. */}
      {est.fixedPrice > 0 && (
        <button
          type="button"
          onClick={() => document.getElementById("plan-summary")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed right-3 bottom-[calc(12px+env(safe-area-inset-bottom))] left-3 z-40 flex items-center justify-between rounded-chip border-0 bg-dark px-4 py-[11px] text-left text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] lg:hidden print:hidden"
        >
          <span>
            <Typography variant="overline" tone="onDarkMuted" as="span" className="block text-2xs">
              Fixed price
            </Typography>
            <Typography variant="mono" as="span" className="mt-0.5 block text-sm font-bold">
              {fmt.short(est.fixedPrice)}
            </Typography>
          </span>
          <span className="text-right">
            <Typography variant="overline" tone="onDarkMuted" as="span" className="block text-2xs">
              Timeline
            </Typography>
            <Typography variant="mono" as="span" className="mt-0.5 block text-sm font-bold">
              {weeksLabel(est.timeline.weeks, est.timeline.weeksHigh)}
            </Typography>
          </span>
        </button>
      )}
    </Container>
  );
}
