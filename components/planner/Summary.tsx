import { formatter, weeksLabel } from "@/lib/pricing/format";
import { TIMELINE_LABEL } from "@/lib/pricing/ratecard";
import type { Estimate, Scope } from "@/lib/pricing/types";

const CONFIDENCE = {
  high: { cls: "good", text: "High" },
  medium: { cls: "warn", text: "Medium" },
  low: { cls: "crit", text: "Low" },
} as const;

const LEVEL = { crit: "Blocker", warn: "Worth fixing", tip: "Suggestion" } as const;

export function timelineChip(est: Estimate): { cls: string; text: string } {
  const label = TIMELINE_LABEL[est.scope.timeline];
  switch (est.timeline.status) {
    case "fits":
      return { cls: "good", text: `Fits your ${label} deadline` };
    case "rush":
      return { cls: "warn", text: `Rushed to make ${label}` };
    case "infeasible":
      return { cls: "crit", text: `Can't make ${label} — see phases` };
    default:
      return { cls: "info", text: "No deadline set" };
  }
}

export function Headline({ est }: { est: Estimate }) {
  if (est.fixedPrice === 0) {
    return (
      <div className="pempty">
        <b>Nothing to price yet.</b>
        <span>Pick what you&apos;re building, growing or monitoring — or start from a preset.</span>
      </div>
    );
  }
  const conf = CONFIDENCE[est.confidence.level];
  const tl = timelineChip(est);
  const { money, short } = formatter(est.market);
  return (
    <>
      <div className="small">Fixed price</div>
      <div className="phero">{money(est.fixedPrice)}</div>
      <div className="plain">
        {est.taxRate > 0 ? (
          <>
            + {money(est.tax)} {est.taxLabel} = <b>{money(est.total)}</b>
          </>
        ) : (
          <>No Indian GST — exported service</>
        )}
      </div>
      <dl className="psum-rows">
        <div>
          <dt>Planning range</dt>
          <dd className="mono">
            {short(est.low)}–{short(est.high)}
          </dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>
            <span className={`tag ${conf.cls}`}>{conf.text}</span>
          </dd>
        </div>
        <div>
          <dt>Timeline</dt>
          <dd className="mono">{weeksLabel(est.timeline.weeks, est.timeline.weeksHigh)}</dd>
        </div>
        <div>
          <dt>Year one, all-in</dt>
          <dd className="mono">
            {short(est.running.year1Low)}–{short(est.running.year1High)}
          </dd>
        </div>
      </dl>
      <div className="pstatus">
        <span className={`chip ${tl.cls}`}>{tl.text}</span>
        <span className={`chip ${est.budget.status === "under" ? "good" : est.budget.status}`}>{est.budget.message}</span>
        {est.store && (
          <span className="chip info">
            {est.store.reason} {est.store.altDelta > 0 ? `A custom store would add ${short(est.store.altDelta)}.` : `Shopify would save ${short(-est.store.altDelta)}.`}
          </span>
        )}
      </div>
    </>
  );
}

export function Checks({ est, onApply }: { est: Estimate; onApply?: (patch: Partial<Scope>) => void }) {
  if (est.checks.length === 0 || est.fixedPrice === 0) return null;
  return (
    <div className="pchecks">
      <div className="small">Worth raising</div>
      <ul>
        {est.checks.map((c) => (
          <li key={c.id} className={`pcheck ${c.level}`}>
            <em className="lvl">{LEVEL[c.level]}</em>
            <b>{c.title}</b>
            <span>{c.detail}</span>
            {c.fix && onApply && (
              <button type="button" className="pcheck-fix" onClick={() => onApply(c.fix!.patch)}>
                {c.fix.label}
                <span className="mono">{c.fix.delta === 0 ? "no price change" : formatter(est.market).delta(c.fix.delta)}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
