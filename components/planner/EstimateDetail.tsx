import { formatter, type Money } from "@/lib/pricing/format";
import { RISK, TIMELINE_LABEL } from "@/lib/pricing/ratecard";
import type { CostedPackage, Estimate, RunItem, Source, TimelinePlan } from "@/lib/pricing/types";

const hrs = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const RUN_KIND: Record<RunItem["kind"], string> = {
  thirdparty: "Paid to provider",
  service: "Our monthly plan",
  spend: "Your ad budget",
};
const PER: Record<RunItem["per"], string> = { month: "/mo", year: "/yr", once: " once" };

function Gantt({ tl, deadlineLabel }: { tl: TimelinePlan; deadlineLabel: string }) {
  const span = Math.max(tl.weeksHigh, tl.requestedWeeks ?? 0, 1);
  const step = span > 24 ? 4 : span > 12 ? 2 : 1;
  const ticks: number[] = [];
  for (let w = 0; w <= span; w += step) ticks.push(w);
  const pct = (w: number) => `${(w / span) * 100}%`;
  const deadline = tl.requestedWeeks !== null && tl.requestedWeeks <= span ? tl.requestedWeeks : null;
  const wk = (b: { start: number; end: number }) => {
    const a = Math.floor(b.start) + 1;
    const z = Math.max(a, Math.ceil(b.end));
    return a === z ? `wk ${a}` : `wk ${a}–${z}`;
  };

  return (
    <div className="gantt" role="group" aria-label="Delivery timeline in weeks">
      <div className="gantt-body">
        <div className="gantt-grid" aria-hidden="true">
          <span />
          <div>
            {ticks.map((t) => (
              <i key={t} style={{ left: pct(t) }} />
            ))}
            {deadline !== null && <b className="gdeadline" style={{ left: pct(deadline) }} />}
          </div>
          <span />
        </div>
        {tl.bars.map((b) => (
          <div className="grow" key={b.id}>
            <span className="glabel">{b.label}</span>
            <div className="gtrack">
              <span
                className="gbar"
                style={{ left: pct(b.start), width: `max(6px, ${(Math.max(b.end - b.start, 0) / span) * 100}%)` }}
                title={`${b.label} · ${wk(b)}`}
              />
            </div>
            <span className="gweeks mono">{wk(b)}</span>
          </div>
        ))}
      </div>
      <div className="gaxis" aria-hidden="true">
        <span />
        <div>
          {ticks.map((t) => (
            <span key={t} style={{ left: pct(t) }}>
              {t}
            </span>
          ))}
        </div>
        <span className="mono">weeks</span>
      </div>
      {deadline !== null && (
        <p className="gnote">
          <b className="gkey" aria-hidden="true" /> Your deadline — {deadlineLabel}, week {deadline}
        </p>
      )}
    </div>
  );
}

function PackageRows({
  pkgs,
  total,
  fmt,
  onRemove,
}: {
  pkgs: CostedPackage[];
  total: number;
  fmt: Money;
  onRemove?: (s: Source) => void;
}) {
  return (
    <>
      {pkgs.map((p) => (
        <tr key={p.id}>
          <td>
            <b className="pk-name">{p.label}</b>
            <span className="pk-detail">{p.detail}</span>
            {p.risk !== "known" && <span className="pk-risk">{RISK[p.risk].label}</span>}
          </td>
          <td className="num">{hrs(p.totalHours)}</td>
          <td className="num">{fmt.money(p.cost)}</td>
          <td className="sharecell" aria-label={`${Math.round((p.cost / total) * 100)}% of the work`}>
            <span className="meter">
              <span style={{ width: `${Math.max(2, (p.cost / total) * 100)}%` }} />
            </span>
          </td>
          <td className="rm noprint">
            {p.source && onRemove && (
              <button type="button" aria-label={`Remove ${p.label}`} title="Remove from scope" onClick={() => onRemove(p.source!)}>
                ×
              </button>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

export default function EstimateDetail({ est, onRemove }: { est: Estimate; onRemove?: (s: Source) => void }) {
  if (est.fixedPrice === 0) return null;
  const fmt = formatter(est.market);
  const inr = fmt.money;
  const inrShort = fmt.short;
  /** Small sums in full; abbreviations only where they save real space. */
  const money = (v: number) => (v < 10000 ? fmt.money(v) : fmt.short(v));
  const total = est.packages.reduce((s, p) => s + p.cost, 0);
  // Every row is shown rounded to the rupee, so the column must add up exactly as displayed.
  const shown =
    est.disciplines.reduce((s, d) => s + Math.round(d.cost), 0) +
    est.adjustments.reduce((s, a) => s + Math.round(a.cost), 0) +
    est.contingency;
  const rounding = est.fixedPrice - shown;
  const groups = est.phasePlan
    ? est.phasePlan.phases.map((ph) => ({ ...ph, pkgs: est.packages.filter((p) => ph.packageIds.includes(p.id)) }))
    : [{ n: 1 as const, label: "", price: est.fixedPrice, weeks: est.timeline.weeks, pkgs: est.packages }];

  return (
    <div className="pdetail">
      <section className="pcard" aria-labelledby="pd-scope">
        <h2 id="pd-scope">What you&apos;re paying for</h2>
        {est.phasePlan && <p className="pcard-lede">{est.phasePlan.message}</p>}
        <div className="tablewrap">
          <table className="ledger pk-table">
            <thead>
              <tr>
                <th>Package</th>
                <th className="num">Hours</th>
                <th className="num">Cost</th>
                <th className="sharecell">Share</th>
                <th className="rm noprint" />
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.n}>
                {g.label && (
                  <tr className="phase-row">
                    <td colSpan={5}>
                      <b>{g.label}</b>
                      <span className="mono">
                        {inr(g.price)} · {g.weeks} weeks
                      </span>
                    </td>
                  </tr>
                )}
                <PackageRows pkgs={g.pkgs} total={total} fmt={fmt} onRemove={onRemove} />
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <section className="pcard" aria-labelledby="pd-time">
        <h2 id="pd-time">Timeline</h2>
        <p className="pcard-lede">
          {est.timeline.status === "rush"
            ? `${est.timeline.naturalWeeks} weeks of work, compressed into ${est.timeline.weeks}.`
            : `${est.timeline.weeks} weeks at normal pace, ${est.timeline.weeksHigh} if the unknowns bite.`}
        </p>
        <Gantt tl={est.timeline} deadlineLabel={TIMELINE_LABEL[est.scope.timeline]} />
      </section>

      <section className="pcard" aria-labelledby="pd-math">
        <h2 id="pd-math">How the price is built</h2>
        <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Discipline</th>
                <th className="num">Hours</th>
                <th className="num">Rate</th>
                <th className="num">Cost</th>
              </tr>
            </thead>
            <tbody>
              {est.disciplines.map((d) => (
                <tr key={d.discipline}>
                  <td>{d.label}</td>
                  <td className="num">{hrs(d.hours)}</td>
                  <td className="num">{inr(d.rate)}/hr</td>
                  <td className="num">{inr(d.cost)}</td>
                </tr>
              ))}
              {est.adjustments.map((a) => (
                <tr className="adjust" key={a.id}>
                  <td colSpan={3}>
                    {a.label} <span className="pk-detail">{a.detail}</span>
                  </td>
                  <td className="num">
                    {a.cost >= 0 ? "+" : ""}
                    {inr(a.cost)}
                  </td>
                </tr>
              ))}
              <tr className="adjust">
                <td colSpan={3}>
                  Risk buffer <span className="pk-detail">Covers likely overruns on the less predictable packages</span>
                </td>
                <td className="num">+{inr(est.contingency)}</td>
              </tr>
              {rounding !== 0 && (
                <tr className="adjust">
                  <td colSpan={3}>Rounded to the nearest ₹1,000</td>
                  <td className="num">
                    {rounding > 0 ? "+" : ""}
                    {inr(rounding)}
                  </td>
                </tr>
              )}
              <tr className="total">
                <td colSpan={3}>Fixed price</td>
                <td className="num">{inr(est.fixedPrice)}</td>
              </tr>
              {est.taxRate > 0 && (
                <>
                  <tr>
                    <td colSpan={3}>
                      {est.taxLabel} at {Math.round(est.taxRate * 100)}%
                    </td>
                    <td className="num">{inr(est.tax)}</td>
                  </tr>
                  <tr className="total">
                    <td colSpan={3}>Total</td>
                    <td className="num">{inr(est.total)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {est.confidence.drivers.length > 0 && (
          <p className="pcard-foot">
            <b>Why the range runs to {inrShort(est.high)}:</b>{" "}
            {est.confidence.drivers.map((d) => `${d.label} (up to +${inrShort(d.upside)})`).join(", ")}. Discovery pins
            these down before you sign.
          </p>
        )}
      </section>

      <div className="pcols">
        <section className="pcard" aria-labelledby="pd-pay">
          <h2 id="pd-pay">Payment schedule</h2>
          <div className="tablewrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th className="num">Week</th>
                  <th className="num">Share</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {est.payments.map((m) => (
                  <tr key={m.label}>
                    <td>{m.label}</td>
                    <td className="num">{m.week}</td>
                    <td className="num">{m.pct}%</td>
                    <td className="num">{inr(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pcard-foot">{est.taxRate > 0 ? `${est.taxLabel} is added to each invoice.` : est.taxNote}</p>
        </section>

        <section className="pcard" aria-labelledby="pd-run">
          <h2 id="pd-run">Running costs</h2>
          <ul className="runlist">
            {est.running.items.map((i) => (
              <li key={i.label} className={i.kind === "spend" || i.optional ? "muted" : ""}>
                <span>
                  {i.label}
                  <em>{i.optional ? "Optional" : RUN_KIND[i.kind]}</em>
                </span>
                <span className="mono">
                  {i.low === i.high ? money(i.low) : `${money(i.low)}–${money(i.high)}`}
                  {PER[i.per]}
                </span>
              </li>
            ))}
          </ul>
          <p className="pcard-foot">
            <b>
              Year one, all-in: {inr(est.running.year1Low)}–{inr(est.running.year1High)}
            </b>{" "}
            — the build{est.taxRate > 0 ? ` with ${est.taxLabel}` : ""} plus twelve months of running costs. Excludes ad spend and optional plans.
          </p>
        </section>
      </div>

      <div className="pcols">
        <section className="pcard" aria-labelledby="pd-assume">
          <h2 id="pd-assume">Assumptions</h2>
          <ul className="notes">
            {est.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        <section className="pcard" aria-labelledby="pd-excl">
          <h2 id="pd-excl">Not included</h2>
          <ul className="notes">
            {est.exclusions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
