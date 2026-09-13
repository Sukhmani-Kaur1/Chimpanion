"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MARKET_MEDIA } from "@/lib/media/benchmarks";
import { buildPlan } from "@/lib/media/plan";
import type {
  AgeBand,
  Audience,
  BusinessModel,
  CreativeAsset,
  Gender,
  Industry,
  Maturity,
  MediaScope,
  Objective,
} from "@/lib/media/types";
import { formatter } from "@/lib/pricing/format";
import { MARKETS } from "@/lib/pricing/markets";
import type { Market } from "@/lib/pricing/types";
import { useMarket } from "@/lib/useMarket";
import PaywallCard from "./Paywall";
import { PlanDetail, PlanFree } from "./PlanView";

type Opt<T extends string> = [T, string, string];

const OBJECTIVES: Opt<Objective>[] = [
  ["leads", "Enquiries and leads", "Calls, forms and messages from people who want to buy."],
  ["sales", "Online sales", "Orders placed through your website or store."],
  ["footfall", "Visits to a shop or branch", "Directions, calls and walk-ins from nearby."],
  ["app", "App installs", "Downloads — and people who actually open it."],
  ["awareness", "Being known", "Reach and recall. The slowest of these to pay back."],
];
const MODELS: Opt<BusinessModel>[] = [
  ["local", "Local business", "A shop, clinic, salon, restaurant or trade."],
  ["service", "Services", "Agencies, consultants, contractors, professionals."],
  ["ecommerce", "Online store", "You sell products online and ship them."],
  ["b2b", "B2B", "You sell to other businesses, usually after a conversation."],
  ["saas", "SaaS / software", "A product people sign up for and pay for monthly."],
];
/** Category is the biggest single driver of what a click costs. */
const INDUSTRIES: Opt<Industry>[] = [
  ["retail", "Retail & shopping", "Shops, brands and general merchandise."],
  ["food", "Food & restaurants", "Restaurants, cafés, cloud kitchens, food brands."],
  ["health", "Health & medical", "Clinics, dentists, diagnostics, specialists."],
  ["beauty", "Beauty & wellness", "Salons, spas, skincare and wellness."],
  ["education", "Education & training", "Schools, coaching, courses and training."],
  ["realestate", "Real estate & property", "Builders, brokers, rentals and property."],
  ["legal", "Legal services", "Lawyers, compliance and legal work."],
  ["finance", "Finance & insurance", "Lending, insurance, advisory and fintech."],
  ["travel", "Travel & hospitality", "Hotels, tours, tickets and hospitality."],
  ["fitness", "Fitness & sport", "Gyms, studios, coaching and sport."],
  ["home", "Home & trades", "Interiors, repairs, trades and home services."],
  ["auto", "Automotive", "Dealers, servicing, parts and mobility."],
  ["tech", "Technology & software", "Software, IT services and electronics."],
  ["other", "Something else", "Nothing here fits — we'll use average costs."],
];
const AUDIENCES: Opt<Audience>[] = [
  ["broad", "Anyone who needs it", "No strong demographic — let the platforms find them."],
  ["local", "People nearby", "Within travelling distance of you."],
  ["professional", "Professionals, by job title", "A specific role or seniority, at specific companies."],
  ["young", "Mostly under 30", "A younger audience who live in short video."],
  ["affluent", "High spenders", "Premium buyers, where margin matters more than volume."],
];
const AGES: Opt<AgeBand>[] = [
  ["18-24", "18–24", "Students and early careers."],
  ["25-34", "25–34", "The broadest spending band online."],
  ["35-54", "35–54", "Families, decision makers, higher budgets."],
  ["55+", "55+", "Often overlooked, and cheaper to reach."],
];
const GENDERS: Opt<Gender>[] = [
  ["all", "Everyone", "No gender narrowing — usually the right answer."],
  ["female", "Mostly women", "Only if the product genuinely is."],
  ["male", "Mostly men", "Only if the product genuinely is."],
];
const MATURITY: Opt<Maturity>[] = [
  ["first", "First time running ads", "No conversion history for the platforms to learn from."],
  ["some", "Run some before", "Some history, possibly not tracked well."],
  ["running", "Running them now", "Live campaigns and real conversion data."],
];
const CREATIVE: Opt<CreativeAsset>[] = [
  ["photos", "Photos", "Product, premises or work photography."],
  ["video", "Video", "Edited video you can cut down for ads."],
  ["ugc", "Phone-shot video", "Rough and native — made for feeds, not TV."],
  ["catalogue", "Product catalogue", "A product feed for shopping and retargeting."],
  ["testimonials", "Customer testimonials", "Real customers saying it so you don't have to."],
  ["none", "Nothing yet", "Search can still run on text alone."],
];
const DURATIONS: Opt<string>[] = [
  ["4", "4 weeks", "A burst or a launch. Most of it is learning."],
  ["8", "8 weeks", "Long enough to optimise once properly."],
  ["12", "12 weeks", "A full quarter — the usual planning cycle."],
  ["26", "6 months", "Time to scale what works and cut what doesn't."],
  ["52", "Ongoing", "Always-on, reviewed every quarter."],
];
/** Language options are market-specific — this is the setting people forget, and it costs them. */
const LANGUAGES: Record<Market, Opt<string>[]> = {
  IN: [
    ["english", "English", "Default for most urban and B2B audiences."],
    ["hindi", "Hindi", "Much cheaper reach, often better engagement."],
    ["regional", "A regional language", "Tamil, Telugu, Marathi, Bengali and so on."],
  ],
  US: [
    ["english", "English", "Default."],
    ["spanish", "Spanish", "A large and often under-bid audience."],
    ["other", "Another language", "Anything else your customers actually use."],
  ],
  UK: [
    ["english", "English", "Default."],
    ["other", "Another language", "Anything else your customers actually use."],
  ],
  AE: [
    ["english", "English", "Default for much of the expat market."],
    ["arabic", "Arabic", "Essential for local and government-facing audiences."],
    ["other", "Another language", "Hindi, Urdu, Tagalog and so on."],
  ],
};

const STEPS = [
  { q: "What should the ads actually bring in?", hint: "Everything follows from this — the channels, the creative, and how you judge the result." },
  { q: "What kind of business is it?", hint: "This decides which platforms can reach your buyers at a sensible price." },
  { q: "What category are you in?", hint: "The biggest single driver of what a click costs. Legal clicks cost many times what food clicks do." },
  { q: "Who are you trying to reach?", hint: "Targeting options differ enormously between platforms. This narrows the list." },
  { q: "What can you put in front of people?", hint: "Creative is the real constraint on paid social. Search runs on text alone." },
  { q: "What's the budget, and for how long?", hint: "This is spend paid to the platforms, not to us. The whole plan is built around these two numbers." },
  { q: "Last thing — what's already set up?", hint: "These two decide whether the money works or quietly leaks." },
];

const digits = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

function Options<T extends string>({
  options,
  selected,
  onPick,
}: {
  options: Opt<T>[];
  selected: T[];
  onPick: (v: T) => void;
}) {
  return (
    <div className="opts">
      {options.map(([value, label, detail]) => {
        const on = selected.includes(value);
        return (
          <button
            type="button"
            key={value}
            className={`opt${on ? " selected" : ""}`}
            aria-label={label}
            aria-pressed={on}
            onClick={() => onPick(value)}
          >
            <strong>{label}</strong>
            <small>{detail}</small>
          </button>
        );
      })}
    </div>
  );
}

export default function MediaPlanner() {
  const { market } = useMarket();
  const spec = MARKETS[market];
  const fmt = formatter(market);
  const floor = MARKET_MEDIA[market].floor;

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"brief" | "building" | "locked" | "paid">("brief");
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  const [form, setForm] = useState({
    objective: null as Objective | null,
    model: null as BusinessModel | null,
    industry: null as Industry | null,
    audience: null as Audience | null,
    age: [] as AgeBand[],
    gender: "all" as Gender,
    languages: ["english"] as string[],
    maturity: null as Maturity | null,
    creative: [] as CreativeAsset[],
    budget: "",
    durationWeeks: 12,
    dealValue: "",
    cities: 1,
    website: null as boolean | null,
    tracking: null as boolean | null,
    business: "",
  });

  useEffect(() => setToday(new Date()), []);

  const set = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setError(null);
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const scope: MediaScope = useMemo(
    () => ({
      market,
      objective: form.objective ?? "leads",
      model: form.model ?? "service",
      industry: form.industry ?? "other",
      audience: form.audience ?? "broad",
      age: form.age,
      gender: form.gender,
      languages: form.languages,
      budget: digits(form.budget),
      durationWeeks: form.durationWeeks,
      creative: form.creative.length ? form.creative : ["none"],
      maturity: form.maturity ?? "first",
      dealValue: digits(form.dealValue),
      cities: form.cities,
      website: form.website ?? true,
      tracking: form.tracking ?? false,
    }),
    [market, form]
  );

  const plan = useMemo(() => buildPlan(scope), [scope]);

  function validate(i: number): string | null {
    if (i === 0 && !form.objective) return "Pick what the ads should bring in.";
    if (i === 1 && !form.model) return "Pick the kind of business this is.";
    if (i === 2 && !form.industry) return "Pick the category you trade in.";
    if (i === 3 && !form.audience) return "Pick who you're trying to reach.";
    if (i === 3 && form.languages.length === 0) return "Pick at least one language to run the ads in.";
    if (i === 4 && (!form.maturity || form.creative.length === 0)) return "Tell us your experience and what creative you have.";
    if (i === 5 && digits(form.budget) <= 0) return "Enter a monthly ad budget to build the plan around.";
    if (i === 6 && (form.website === null || form.tracking === null)) return "Answer both, so the plan knows what to fix first.";
    return null;
  }

  function next() {
    const problem = validate(step);
    if (problem) return setError(problem);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setPhase("building");
    window.setTimeout(() => {
      setPhase("locked");
      requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }, 1100);
  }

  const localArea = form.model === "local" || form.objective === "footfall";
  const progress = phase === "brief" ? ((step + 1) / STEPS.length) * 100 : 100;

  return (
    <div className="mp wrap">
      <header className="mphead">
        <div className="kicker">CANOPY · PAID MEDIA PLAN</div>
        <h1>Where your ad budget should go, and what it should bring back.</h1>
        <p className="mplead">
          Seven questions about your business. You get a media plan built on the same benchmarks we use for our own
          clients — the channels worth your money, what they reach, what to expect back, and what to do in week one.
        </p>
      </header>

      {phase === "brief" && (
        <div className="mpwiz noprint">
          <div className="mptop">
            <b>YOUR BRIEF</b>
            <span className="stepmeta">
              {String(step + 1).padStart(2, "0")} / {STEPS.length}
            </span>
          </div>
          <div className="prog">
            <span style={{ width: `${progress}%` }} />
          </div>

          <h2 className="q">{STEPS[step].q}</h2>
          <p className="hint">{STEPS[step].hint}</p>
          {error && <div className="formerr">{error}</div>}

          {step === 0 && <Options options={OBJECTIVES} selected={form.objective ? [form.objective] : []} onPick={(v) => set("objective", v)} />}

          {step === 1 && (
            <>
              <Options options={MODELS} selected={form.model ? [form.model] : []} onPick={(v) => set("model", v)} />
              {localArea && (
                <>
                  <h3 className="mpsub">How many cities or areas do you serve?</h3>
                  <div className="mpstep-inline">
                    <button type="button" className="opt" onClick={() => set("cities", Math.max(1, form.cities - 1))} aria-label="Fewer areas">
                      −
                    </button>
                    <output>{form.cities}</output>
                    <button type="button" className="opt" onClick={() => set("cities", Math.min(20, form.cities + 1))} aria-label="More areas">
                      +
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 2 && <Options options={INDUSTRIES} selected={form.industry ? [form.industry] : []} onPick={(v) => set("industry", v)} />}

          {step === 3 && (
            <>
              <Options options={AUDIENCES} selected={form.audience ? [form.audience] : []} onPick={(v) => set("audience", v)} />

              <h3 className="mpsub">Any age bands to focus on? Leave empty for all ages.</h3>
              <Options
                options={AGES}
                selected={form.age}
                onPick={(v) => set("age", form.age.includes(v) ? form.age.filter((a) => a !== v) : [...form.age, v])}
              />

              <h3 className="mpsub">And gender?</h3>
              <Options options={GENDERS} selected={[form.gender]} onPick={(v) => set("gender", v)} />

              <h3 className="mpsub">Which languages will the ads run in?</h3>
              <Options
                options={LANGUAGES[market]}
                selected={form.languages}
                onPick={(v) =>
                  set("languages", form.languages.includes(v) ? form.languages.filter((l) => l !== v) : [...form.languages, v])
                }
              />
            </>
          )}

          {step === 4 && (
            <>
              <Options options={MATURITY} selected={form.maturity ? [form.maturity] : []} onPick={(v) => set("maturity", v)} />
              <h3 className="mpsub">And what creative do you have? Pick everything that applies.</h3>
              <Options
                options={CREATIVE}
                selected={form.creative}
                onPick={(v) => {
                  const has = form.creative.includes(v);
                  if (v === "none") return set("creative", has ? [] : ["none"]);
                  const kept = form.creative.filter((c) => c !== "none" && c !== v);
                  set("creative", has ? kept : [...kept, v]);
                }}
              />
            </>
          )}

          {step === 5 && (
            <>
              <div className="mpmoney">
                <span aria-hidden="true">{spec.prefix.trim()}</span>
                <input
                  className="field"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  placeholder="0"
                  aria-label="Monthly ad budget"
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value.replace(/[^\d,]/g, ""))}
                />
                <em>per month</em>
              </div>
              <p className="mpfieldnote">
                Below about {fmt.money(floor)} a month there isn&apos;t enough signal for any platform to learn from — the
                plan will say so rather than pretend otherwise.
              </p>

              <h3 className="mpsub">How long will it run?</h3>
              <Options
                options={DURATIONS}
                selected={[String(form.durationWeeks)]}
                onPick={(v) => set("durationWeeks", Number(v))}
              />

              <h3 className="mpsub">What is one customer worth to you?</h3>
              <div className="mpmoney">
                <span aria-hidden="true">{spec.prefix.trim()}</span>
                <input
                  className="field"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  aria-label="Value of one customer"
                  value={form.dealValue}
                  onChange={(e) => set("dealValue", e.target.value.replace(/[^\d,]/g, ""))}
                />
                <em>average</em>
              </div>
              <p className="mpfieldnote">
                Average order or first contract value. It&apos;s the number the whole plan gets judged on — leave it at
                zero if you genuinely don&apos;t know yet.
              </p>
            </>
          )}

          {step === 6 && (
            <>
              <h3 className="mpsub">Do you have a website or landing page to send traffic to?</h3>
              <div className="opts">
                <button
                  type="button"
                  className={`opt${form.website === true ? " selected" : ""}`}
                  aria-label="Yes, there is a website or landing page"
                  aria-pressed={form.website === true}
                  onClick={() => set("website", true)}
                >
                  <strong>Yes</strong>
                  <small>There&apos;s somewhere for the clicks to land.</small>
                </button>
                <button
                  type="button"
                  className={`opt${form.website === false ? " selected" : ""}`}
                  aria-label="No website or landing page yet"
                  aria-pressed={form.website === false}
                  onClick={() => set("website", false)}
                >
                  <strong>Not yet</strong>
                  <small>Nothing built, or nothing worth sending traffic to.</small>
                </button>
              </div>

              <h3 className="mpsub">Is conversion tracking set up?</h3>
              <div className="opts">
                <button
                  type="button"
                  className={`opt${form.tracking === true ? " selected" : ""}`}
                  aria-label="Yes, conversion tracking is set up"
                  aria-pressed={form.tracking === true}
                  onClick={() => set("tracking", true)}
                >
                  <strong>Yes</strong>
                  <small>Enquiries, calls and sales are recorded — not just visits.</small>
                </button>
                <button
                  type="button"
                  className={`opt${form.tracking === false ? " selected" : ""}`}
                  aria-label="No conversion tracking, or not sure"
                  aria-pressed={form.tracking === false}
                  onClick={() => set("tracking", false)}
                >
                  <strong>No, or not sure</strong>
                  <small>Most accounts we see are in this category.</small>
                </button>
              </div>

              <h3 className="mpsub">Business name — it goes at the top of your plan.</h3>
              <input
                className="field"
                autoComplete="organization"
                placeholder="Your business"
                aria-label="Business name"
                value={form.business}
                onChange={(e) => set("business", e.target.value)}
              />
            </>
          )}

          <div className="mpfoot">
            <button
              type="button"
              className="pill ghost"
              onClick={() => setStep((n) => Math.max(0, n - 1))}
              style={{ visibility: step === 0 ? "hidden" : "visible" }}
            >
              ← Back
            </button>
            <button type="button" className="pill lime" onClick={next}>
              {step === STEPS.length - 1 ? "Build my plan →" : "Continue →"}
            </button>
          </div>
        </div>
      )}

      {phase === "building" && (
        <div className="mpwiz mpbuilding noprint" role="status" aria-live="polite">
          <div className="mpdots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <b>Building your Canopy plan…</b>
          <p className="hint">Pricing {spec.name} auctions for your category, splitting the budget and checking what could go wrong.</p>
        </div>
      )}

      {(phase === "locked" || phase === "paid") && (
        <div id="plan" className="mpplan">
          <PlanFree plan={plan} paid={phase === "paid"} business={form.business} today={today} />

          {phase === "locked" ? (
            <div className="mplockwrap">
              <div className="mplocked" aria-hidden="true">
                <PlanDetail plan={plan} />
              </div>
              <div className="mpveil">
                <PaywallCard plan={plan} onUnlock={() => setPhase("paid")} />
              </div>
            </div>
          ) : (
            <PlanDetail plan={plan} />
          )}
        </div>
      )}
    </div>
  );
}
