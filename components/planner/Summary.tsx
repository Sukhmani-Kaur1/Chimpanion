import { formatter, weeksLabel } from "@/lib/pricing/format";
import { TIMELINE_LABEL } from "@/lib/pricing/ratecard";
import type { CheckLevel, Estimate, Scope } from "@/lib/pricing/types";
import { Chip, Tag, type ChipTone } from "../ui/Layout";
import Typography from "../ui/Typography";
import { cn } from "@/lib/cn";

const CONFIDENCE = {
  high: { tone: "good", text: "High" },
  medium: { tone: "warn", text: "Medium" },
  low: { tone: "crit", text: "Low" },
} as const satisfies Record<string, { tone: ChipTone; text: string }>;

const LEVEL = { crit: "Blocker", warn: "Worth fixing", tip: "Suggestion" } as const;

const CHECK_SURFACE: Record<CheckLevel, string> = {
  crit: "bg-crit-bg",
  warn: "bg-warn-bg",
  tip: "bg-[#f3f3ed]",
};
const CHECK_LEVEL_TONE: Record<CheckLevel, "crit" | "warn" | "muted"> = {
  crit: "crit",
  warn: "warn",
  tip: "muted",
};

export function timelineChip(est: Estimate): { tone: ChipTone; text: string } {
  const label = TIMELINE_LABEL[est.scope.timeline];
  switch (est.timeline.status) {
    case "fits":
      return { tone: "good", text: `Fits your ${label} deadline` };
    case "rush":
      return { tone: "warn", text: `Rushed to make ${label}` };
    case "infeasible":
      return { tone: "crit", text: `Can't make ${label} — see phases` };
    default:
      return { tone: "info", text: "No deadline set" };
  }
}

/** One row of the price summary list. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-[9px] text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-bold">{children}</dd>
    </div>
  );
}

export function Headline({ est }: { est: Estimate }) {
  if (est.fixedPrice === 0) {
    return (
      <div className="grid gap-1.5 py-1">
        <Typography variant="h5" as="b" className="text-base">
          Nothing to price yet.
        </Typography>
        <Typography variant="bodySm">
          Pick what you&apos;re building, growing or monitoring — or start from a preset.
        </Typography>
      </div>
    );
  }
  const conf = CONFIDENCE[est.confidence.level];
  const tl = timelineChip(est);
  const { money, short } = formatter(est.market);

  return (
    <>
      <Typography variant="overline">Fixed price</Typography>
      {/* The one number everything else supports — sans, not display, so it reads as data. */}
      <Typography variant="price" className="my-1 font-sans font-extrabold">
        {money(est.fixedPrice)}
      </Typography>
      <Typography variant="bodySm" tone="body">
        {est.taxRate > 0 ? (
          <>
            + {money(est.tax)} {est.taxLabel} = <b>{money(est.total)}</b>
          </>
        ) : (
          <>No Indian GST — exported service</>
        )}
      </Typography>

      <dl className="mt-4 mb-2.5">
        <Row label="Planning range">
          <span className="font-mono tabular-nums">
            {short(est.low)}–{short(est.high)}
          </span>
        </Row>
        <Row label="Confidence">
          <Tag tone={conf.tone}>{conf.text}</Tag>
        </Row>
        <Row label="Timeline">
          <span className="font-mono tabular-nums">
            {weeksLabel(est.timeline.weeks, est.timeline.weeksHigh)}
          </span>
        </Row>
        <Row label="Year one, all-in">
          <span className="font-mono tabular-nums">
            {short(est.running.year1Low)}–{short(est.running.year1High)}
          </span>
        </Row>
      </dl>

      <div className="grid gap-1.5">
        <Chip tone={tl.tone} className="rounded-field font-semibold">
          {tl.text}
        </Chip>
        <Chip
          tone={est.budget.status === "under" ? "good" : est.budget.status}
          className="rounded-field font-semibold"
        >
          {est.budget.message}
        </Chip>
        {est.store && (
          <Chip tone="info" className="rounded-field font-semibold">
            {est.store.reason}{" "}
            {est.store.altDelta > 0
              ? `A custom store would add ${short(est.store.altDelta)}.`
              : `Shopify would save ${short(-est.store.altDelta)}.`}
          </Chip>
        )}
      </div>
    </>
  );
}

export function Checks({
  est,
  onApply,
  className,
}: {
  est: Estimate;
  onApply?: (patch: Partial<Scope>) => void;
  className?: string;
}) {
  if (est.checks.length === 0 || est.fixedPrice === 0) return null;
  return (
    <div
      className={cn(
        "rounded-panel border border-line bg-card p-[18px] pb-2.5 sm:rounded-[20px]",
        className
      )}
    >
      <Typography variant="overline">Worth raising</Typography>
      <ul className="mt-2.5 grid list-none gap-2 p-0">
        {est.checks.map((c) => (
          <li
            key={c.id}
            className={cn("grid gap-[3px] rounded-chip px-3.5 py-3 text-sm", CHECK_SURFACE[c.level])}
          >
            <Typography
              variant="overline"
              as="em"
              tone={CHECK_LEVEL_TONE[c.level]}
              className="text-2xs not-italic"
            >
              {LEVEL[c.level]}
            </Typography>
            <Typography variant="label" as="b" className="text-sm">
              {c.title}
            </Typography>
            <Typography variant="bodySm" as="span" tone="body">
              {c.detail}
            </Typography>
            {c.fix && onApply && (
              <button
                type="button"
                onClick={() => onApply(c.fix!.patch)}
                className="mt-1.5 inline-flex min-h-[34px] items-center gap-2 justify-self-start rounded-full border border-black/10 bg-card px-3 py-1.5 text-xs font-bold hover:border-ink"
              >
                {c.fix.label}
                <span className="font-mono font-semibold text-muted">
                  {c.fix.delta === 0 ? "no price change" : formatter(est.market).delta(c.fix.delta)}
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
