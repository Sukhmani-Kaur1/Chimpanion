"use client";

import { INDUSTRY } from "@/lib/media/benchmarks";
import type { FunnelStage, MediaPlan, Objective } from "@/lib/media/types";
import { formatter } from "@/lib/pricing/format";
import { MARKETS } from "@/lib/pricing/markets";

const STAGE_LABEL: Record<FunnelStage, string> = {
  prospecting: "Prospecting",
  engagement: "Engagement",
  retargeting: "Retargeting",
};

const STAGE_NOTE: Record<FunnelStage, string> = {
  prospecting: "Reaching people who don't know you yet.",
  engagement: "Warming up the ones who showed interest.",
  retargeting: "Finishing the job with people who already came close.",
};

/** What a "result" is called depends on what they asked the ads to do. */
const RESULT_NOUN: Record<Objective, string> = {
  leads: "enquiries",
  sales: "sales",
  awareness: "engaged visits",
  footfall: "visits or calls",
  app: "installs",
};

function flightLabel(weeks: number): string {
  if (weeks >= 52) return "ongoing";
  if (weeks === 26) return "over 6 months";
  return `over ${weeks} weeks`;
}

/**
 * The only part that stays readable before paying: who the plan is for, the brief they typed back
 * at them, and anything that would make the spend a waste. Every computed figure — what it returns,
 * which channels, what they cost — sits in PlanDetail, behind the blur.
 *
 * Blockers stay visible on purpose. Charging someone before telling them their tracking is missing
 * would take money for a plan they can't run.
 */
export function PlanFree({
  plan,
  paid,
  business,
  today,
}: {
  plan: MediaPlan;
  paid: boolean;
  business: string;
  today: Date | null;
}) {
  const s = plan.scope;
  const spec = MARKETS[s.market];
  const fmt = formatter(s.market);
  const date = today?.toLocaleDateString(spec.locale, { day: "numeric", month: "short", year: "numeric" });
  const blockers = plan.warnings.filter((w) => w.level === "blocker");

  return (
    <>
      <div className="printhead printonly">
        <div>
          <div className="printbrand">
            CHIMPANION<span>.</span>
          </div>
          <div className="ptitle-print">{business ? `Canopy media plan for ${business}` : "Canopy media plan"}</div>
          <div className="printfor">
            {INDUSTRY[s.industry].label} · {spec.name} · {fmt.money(s.budget)} a month
          </div>
        </div>
        <div className="printmeta">
          {date && (
            <div>
              <span>Date</span>
              <b>{date}</b>
            </div>
          )}
          <div>
            <span>Flight</span>
            <b>{flightLabel(s.durationWeeks)}</b>
          </div>
          <div>
            <span>Campaign total</span>
            <b>{fmt.money(plan.campaignBudget)}</b>
          </div>
        </div>
      </div>

      <div className="mpactions noprint">
        <div>
          <div className="kicker">{paid ? "YOUR MEDIA PLAN" : "YOUR PLAN IS READY"}</div>
          <h2 className="mpdone">{business ? `Media plan for ${business}` : "Your media plan"}</h2>
          {/* Their own brief, read back. Nothing here is calculated. */}
          <p className="mpbrief">
            {fmt.money(s.budget)} a month {flightLabel(s.durationWeeks)} · {INDUSTRY[s.industry].label} · {spec.name}
          </p>
        </div>
        {paid && (
          <button type="button" className="pill dark" onClick={() => window.print()}>
            Print / save PDF
          </button>
        )}
      </div>

      {blockers.length > 0 && (
        <section className="pcard">
          <h2>Fix these before you spend anything</h2>
          <p className="pcard-lede">
            We would rather tell you now than sell you a plan you can&apos;t run properly.
          </p>
          <ul className="mpwarn">
            {blockers.map((w) => (
              <li className="pcheck crit" key={w.title}>
                <i className="lvl">FIX FIRST</i>
                <b>{w.title}</b>
                <span>{w.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** Everything the plan actually worked out — blurred until it's paid for. */
export function PlanDetail({ plan }: { plan: MediaPlan }) {
  const s = plan.scope;
  const spec = MARKETS[s.market];
  const fmt = formatter(s.market);
  const noun = RESULT_NOUN[s.objective];
  const n = (x: number) => Math.round(x).toLocaleString(spec.locale);
  const compact = (x: number) =>
    new Intl.NumberFormat(spec.locale, { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(x));
  const risks = plan.warnings.filter((w) => w.level !== "blocker");

  return (
    <div className="pdetail">
      <section className="pcard">
        <h2>What this budget should return</h2>
        <p className="pcard-lede">
          {fmt.money(s.budget)} a month across {plan.channels.length} channels, {flightLabel(s.durationWeeks)} —{" "}
          {fmt.money(plan.campaignBudget)} in total, at {INDUSTRY[s.industry].label.toLowerCase()} rates for {spec.name}.
        </p>
        <div className="mpkpi">
          <div>
            <span>{noun} a month</span>
            <b>
              {n(plan.resultsLow)}–{n(plan.resultsHigh)}
            </b>
          </div>
          <div>
            <span>Cost per result</span>
            <b>
              {fmt.short(plan.costPerResultLow)}–{fmt.short(plan.costPerResultHigh)}
            </b>
          </div>
          <div>
            <span>{plan.breakEvenResults ? "To break even" : "Break-even"}</span>
            <b>{plan.breakEvenResults ? `${n(plan.breakEvenResults)} ${noun}` : "—"}</b>
          </div>
        </div>
        <div className="mpkpi">
          <div>
            <span>Impressions a month</span>
            <b>
              {compact(plan.impressionsLow)}–{compact(plan.impressionsHigh)}
            </b>
          </div>
          <div>
            <span>People reached</span>
            <b>
              {compact(plan.netReachLow)}–{compact(plan.netReachHigh)}
            </b>
          </div>
          <div>
            <span>Times each sees it</span>
            <b>{plan.avgFrequency.toFixed(1)}×</b>
          </div>
        </div>
        <p className="pcard-foot">
          {plan.breakEvenResults
            ? `At ${fmt.money(s.dealValue)} a customer, ${n(plan.breakEvenResults)} ${noun} a month covers the ad spend. Everything above that is profit on the media, before your own costs.`
            : "Set a value per customer and this plan can tell you what it takes to break even. Without it, a cost per result is just a number."}
        </p>
      </section>

      <section className="pcard">
        <h2>The channels worth your money</h2>
        <p className="pcard-lede">
          Chosen for this brief — not a list of everything that exists. {plan.channels.length} of them, in priority
          order.
        </p>
        <div className="mpchan">
          {plan.channels.map((c) => (
            <article key={c.id}>
              <div className="mpchan-top">
                <b>{c.name}</b>
                <span className="mpstage">{STAGE_LABEL[c.stage]}</span>
              </div>
              <p>{c.why}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pcard">
        <h2>Where the money goes</h2>
        <p className="pcard-lede">Split by what each channel can realistically do at this budget, not evenly.</p>
        <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Channel</th>
                <th className="sharecell">Share</th>
                <th className="num">Monthly</th>
                <th className="num">Cost per click</th>
                <th className="num">{noun}/mo</th>
              </tr>
            </thead>
            <tbody>
              {plan.channels.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="pk-name">{c.name}</span>
                    <span className="pk-detail">{STAGE_LABEL[c.stage]}</span>
                  </td>
                  <td className="sharecell">
                    <span className="meter">
                      <span style={{ width: `${Math.round(c.share * 100)}%` }} />
                    </span>
                  </td>
                  <td className="num mono">{fmt.money(c.budget)}</td>
                  <td className="num mono">
                    {fmt.money(c.cpcLow)}–{fmt.money(c.cpcHigh)}
                  </td>
                  <td className="num mono">
                    {n(c.resultsLow)}–{n(c.resultsHigh)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pcard-foot">
          Total {fmt.money(plan.totalBudget)} a month, {fmt.money(plan.campaignBudget)} across the flight. Costs are
          benchmarks for {INDUSTRY[s.industry].label.toLowerCase()} in {spec.name} — real auctions move with your niche
          and the season.
        </p>
      </section>

      <section className="pcard">
        <h2>What that delivers</h2>
        <p className="pcard-lede">
          How many people see the ads, how often, and what it costs to put a thousand impressions in front of them.
        </p>
        <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Channel</th>
                <th className="num">CPM</th>
                <th className="num">CTR</th>
                <th className="num">Impressions/mo</th>
                <th className="num">People reached</th>
                <th className="num">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {plan.channels.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="pk-name">{c.name}</span>
                  </td>
                  <td className="num mono">{fmt.money(c.cpm)}</td>
                  <td className="num mono">{(c.ctr * 100).toFixed(2)}%</td>
                  <td className="num mono">
                    {compact(c.impressionsLow)}–{compact(c.impressionsHigh)}
                  </td>
                  <td className="num mono">
                    {compact(c.reachLow)}–{compact(c.reachHigh)}
                  </td>
                  <td className="num mono">{c.frequency.toFixed(1)}×</td>
                </tr>
              ))}
              <tr className="total">
                <td>Net, deduplicated</td>
                <td className="num mono">—</td>
                <td className="num mono">—</td>
                <td className="num mono">
                  {compact(plan.impressionsLow)}–{compact(plan.impressionsHigh)}
                </td>
                <td className="num mono">
                  {compact(plan.netReachLow)}–{compact(plan.netReachHigh)}
                </td>
                <td className="num mono">{plan.avgFrequency.toFixed(1)}×</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="pcard-foot">
          The same person sees you on more than one channel, so the net row is lower than the channels added together.
          Reach is impressions divided by how often each person sees the ads — a planning assumption, not a measurement.
        </p>
      </section>

      <section className="pcard">
        <h2>The funnel</h2>
        <p className="pcard-lede">
          {s.maturity === "first"
            ? "Starting cold, most of the money has to go to finding people."
            : "With data to work from, more can go to the people who already came close."}
        </p>
        <ul className="runlist">
          {plan.funnelSplit.map((f) => (
            <li key={f.stage}>
              <span>
                {STAGE_LABEL[f.stage]}
                <em>{STAGE_NOTE[f.stage]}</em>
              </span>
              <span className="mono">
                {fmt.money(f.budget)} · {Math.round(f.share * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="pcard">
        <h2>What to launch first</h2>
        <div className="mpchan">
          {plan.channels.map((c) => (
            <article key={c.id}>
              <div className="mpchan-top">
                <b>{c.name}</b>
                <span className="mono">{fmt.money(c.budget)}/mo</span>
              </div>
              <p className="mpfirst">
                <i>Start with</i> {c.firstCampaign}
              </p>
              <div className="mptags">
                {c.formats.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pcard">
        <h2>What to make</h2>
        <p className="pcard-lede">
          Creative is the biggest lever you control. Two or three angles per channel, so there&apos;s something to
          compare.
        </p>
        <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Angle</th>
                <th>The hook</th>
                <th>Format</th>
              </tr>
            </thead>
            <tbody>
              {plan.creative.map((c, i) => (
                <tr key={`${c.channel}-${i}`}>
                  <td>
                    <span className="pk-name">{c.channel}</span>
                  </td>
                  <td>{c.angle}</td>
                  <td>{c.hook}</td>
                  <td className="pk-detail">{c.format}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pcard">
        <h2>What to bid on</h2>
        <p className="pcard-lede">
          Group search campaigns by intent, not by product. These behave completely differently and should never share a
          budget.
        </p>
        <ul className="mpsteps">
          {plan.searchThemes.map((t) => (
            <li key={t.theme}>
              <span className="wk">{t.theme}</span>
              <span>
                <b>{t.intent}</b>
                <div className="mpneg">
                  {t.examples.map((e) => (
                    <code key={e}>{e}</code>
                  ))}
                </div>
              </span>
            </li>
          ))}
        </ul>
        <p className="pcard-foot">
          Start every search campaign with these negatives, then add to the list from the search-terms report each week.
          The list is never finished.
        </p>
        <div className="mpneg">
          {plan.negatives.map((neg) => (
            <code key={neg}>−{neg}</code>
          ))}
        </div>
      </section>

      <section className="pcard">
        <h2>The schedule</h2>
        <ul className="mpsteps">
          {plan.milestones.map((m) => (
            <li key={m.title}>
              <span className="wk">Week {m.week}</span>
              <span>
                <b>{m.title}</b>
                <span className="mpdetail">{m.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {risks.length > 0 && (
        <section className="pcard">
          <h2>What to watch</h2>
          <ul className="mpwarn">
            {risks.map((w) => (
              <li className={`pcheck ${w.level === "risk" ? "warn" : ""}`} key={w.title}>
                <i className="lvl">{w.level === "risk" ? "RISK" : "NOTE"}</i>
                <b>{w.title}</b>
                <span>{w.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="pcard">
        <h2>How to judge it</h2>
        <ul className="notes">
          {plan.measurement.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="pcard">
        <h2>What this assumes</h2>
        <ul className="notes">
          {plan.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="pcard-foot">
          A media plan is a starting position built on benchmark costs, not a guarantee. Auction prices, your offer and
          your landing page all move the numbers. Review it against real data after the first month.
        </p>
      </section>
    </div>
  );
}
