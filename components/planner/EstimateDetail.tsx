import { formatter, type Money } from "@/lib/pricing/format";
import { RISK, TIMELINE_LABEL } from "@/lib/pricing/ratecard";
import type { CostedPackage, Estimate, RunItem, Source, TimelinePlan } from "@/lib/pricing/types";
import { TableWrap, Td, Th, numClass, tableClass, tdClass } from "../ui/Table";
import Typography from "../ui/Typography";
import { cn } from "@/lib/cn";

const hrs = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const RUN_KIND: Record<RunItem["kind"], string> = {
  thirdparty: "Paid to provider",
  service: "Our monthly plan",
  spend: "Your ad budget",
};
const PER: Record<RunItem["per"], string> = { month: "/mo", year: "/yr", once: " once" };

/** Card wrapper shared by every block of the breakdown. */
function Panel({
  id,
  title,
  lede,
  children,
  className,
}: {
  id: string;
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "min-w-0 rounded-panel border border-line bg-card p-[18px] sm:rounded-[20px] sm:p-[22px] print:break-inside-avoid",
        className
      )}
    >
      <Typography variant="h5" as="h2" id={id} className="font-sans text-lg tracking-[-0.01em]">
        {title}
      </Typography>
      {lede && (
        <Typography variant="bodySm" tone="body" className="mt-1.5 mb-3.5 max-w-[70ch]">
          {lede}
        </Typography>
      )}
      <div className={lede ? undefined : "mt-3.5"}>{children}</div>
    </section>
  );
}

/** Gantt columns: labels, track, week count — tighter on phones. */
const ganttCols = "grid grid-cols-[84px_minmax(0,1fr)_62px] items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)_72px] sm:gap-3";

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
    <div role="group" aria-label="Delivery timeline in weeks">
      <div className="relative grid gap-2.5 py-2">
        <div className={cn(ganttCols, "absolute inset-0")} aria-hidden="true">
          <span />
          <div className="relative h-full">
            {ticks.map((t) => (
              <i key={t} className="absolute top-0 bottom-0 w-px bg-[#ecebe3]" style={{ left: pct(t) }} />
            ))}
            {deadline !== null && (
              <b
                className="absolute top-0 bottom-0 w-0.5 -translate-x-px bg-warn"
                style={{ left: pct(deadline) }}
              />
            )}
          </div>
          <span />
        </div>

        {tl.bars.map((b) => (
          <div className={cn(ganttCols, "relative")} key={b.id}>
            <Typography variant="caption" as="span" tone="body" className="text-sm">
              {b.label}
            </Typography>
            <div className="relative h-3.5">
              <span
                className="absolute top-0 h-3.5 rounded bg-dark"
                style={{ left: pct(b.start), width: `max(6px, ${(Math.max(b.end - b.start, 0) / span) * 100}%)` }}
                title={`${b.label} · ${wk(b)}`}
              />
            </div>
            <Typography variant="mono" as="span" className="text-right text-xs whitespace-nowrap text-subtle">
              {wk(b)}
            </Typography>
          </div>
        ))}
      </div>

      <div className={cn(ganttCols, "mt-1")} aria-hidden="true">
        <span />
        <div className="relative h-4">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 font-mono text-xs text-faint"
              style={{ left: pct(t) }}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-right font-mono text-xs text-faint">weeks</span>
      </div>

      {deadline !== null && (
        <Typography variant="caption" className="mt-3 flex items-center gap-2">
          <b className="inline-block h-0.5 w-3.5 bg-warn" aria-hidden="true" /> Your deadline —{" "}
          {deadlineLabel}, week {deadline}
        </Typography>
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
          <Td>
            <b className="block font-bold">{p.label}</b>
            <span className="mt-0.5 block text-xs font-medium text-subtle">{p.detail}</span>
            {p.risk !== "known" && (
              <span className="mt-1.5 inline-block rounded-full bg-warn-bg px-2 py-0.5 text-xs font-bold text-warn">
                {RISK[p.risk].label}
              </span>
            )}
          </Td>
          <Td num>{hrs(p.totalHours)}</Td>
          <Td num>{fmt.money(p.cost)}</Td>
          <Td
            className="hidden w-24 pl-3 sm:table-cell"
            aria-label={`${Math.round((p.cost / total) * 100)}% of the work`}
          >
            <span className="block h-1.5 overflow-hidden rounded-full bg-[#ecebe3]">
              <span
                className="block h-full rounded-full bg-dark"
                style={{ width: `${Math.max(2, (p.cost / total) * 100)}%` }}
              />
            </span>
          </Td>
          <Td className="w-10 pr-0 text-right print:hidden">
            {p.source && onRemove && (
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                title="Remove from scope"
                onClick={() => onRemove(p.source!)}
                className="size-[30px] rounded-full border border-line bg-card text-base leading-none text-subtle hover:border-crit hover:text-crit"
              >
                ×
              </button>
            )}
          </Td>
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

  const adjustRow = "text-muted italic";

  return (
    <div className="mt-5 grid gap-3.5 print:mt-3">
      <Panel id="pd-scope" title="What you're paying for" lede={est.phasePlan?.message}>
        <TableWrap>
          <table className={cn(tableClass, "min-w-[600px] sm:min-w-0")}>
            <thead>
              <tr>
                <Th>Package</Th>
                <Th num>Hours</Th>
                <Th num>Cost</Th>
                <Th className="hidden w-24 pl-3 sm:table-cell">Share</Th>
                <Th className="w-10 print:hidden" />
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.n}>
                {g.label && (
                  <tr>
                    <td colSpan={5} className="bg-[#f4f4ee] px-3 py-2.5">
                      <b className="mr-2.5">{g.label}</b>
                      <span className="font-mono text-sm text-muted">
                        {inr(g.price)} · {g.weeks} weeks
                      </span>
                    </td>
                  </tr>
                )}
                <PackageRows pkgs={g.pkgs} total={total} fmt={fmt} onRemove={onRemove} />
              </tbody>
            ))}
          </table>
        </TableWrap>
      </Panel>

      <Panel
        id="pd-time"
        title="Timeline"
        lede={
          est.timeline.status === "rush"
            ? `${est.timeline.naturalWeeks} weeks of work, compressed into ${est.timeline.weeks}.`
            : `${est.timeline.weeks} weeks at normal pace, ${est.timeline.weeksHigh} if the unknowns bite.`
        }
      >
        <Gantt tl={est.timeline} deadlineLabel={TIMELINE_LABEL[est.scope.timeline]} />
      </Panel>

      <Panel id="pd-math" title="How the price is built">
        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <Th>Discipline</Th>
                <Th num>Hours</Th>
                <Th num>Rate</Th>
                <Th num>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {est.disciplines.map((d) => (
                <tr key={d.discipline}>
                  <Td>{d.label}</Td>
                  <Td num>{hrs(d.hours)}</Td>
                  <Td num>{inr(d.rate)}/hr</Td>
                  <Td num>{inr(d.cost)}</Td>
                </tr>
              ))}
              {est.adjustments.map((a) => (
                <tr className={adjustRow} key={a.id}>
                  <Td colSpan={3}>
                    {a.label} <span className="text-xs font-medium text-subtle not-italic">{a.detail}</span>
                  </Td>
                  <Td num>
                    {a.cost >= 0 ? "+" : ""}
                    {inr(a.cost)}
                  </Td>
                </tr>
              ))}
              <tr className={adjustRow}>
                <Td colSpan={3}>
                  Risk buffer{" "}
                  <span className="text-xs font-medium text-subtle not-italic">
                    Covers likely overruns on the less predictable packages
                  </span>
                </Td>
                <Td num>+{inr(est.contingency)}</Td>
              </tr>
              {rounding !== 0 && (
                <tr className={adjustRow}>
                  <Td colSpan={3}>Rounded to the nearest ₹1,000</Td>
                  <Td num>
                    {rounding > 0 ? "+" : ""}
                    {inr(rounding)}
                  </Td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className={cn(tdClass, "border-b-0 border-t-2 border-t-ink pt-3 font-extrabold")}>
                  Fixed price
                </td>
                <td className={cn(tdClass, numClass, "border-b-0 border-t-2 border-t-ink pt-3 font-extrabold")}>
                  {inr(est.fixedPrice)}
                </td>
              </tr>
              {est.taxRate > 0 && (
                <>
                  <tr>
                    <Td colSpan={3}>
                      {est.taxLabel} at {Math.round(est.taxRate * 100)}%
                    </Td>
                    <Td num>{inr(est.tax)}</Td>
                  </tr>
                  <tr>
                    <td colSpan={3} className={cn(tdClass, "border-b-0 border-t-2 border-t-ink pt-3 font-extrabold")}>
                      Total
                    </td>
                    <td className={cn(tdClass, numClass, "border-b-0 border-t-2 border-t-ink pt-3 font-extrabold")}>
                      {inr(est.total)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </TableWrap>

        {est.confidence.drivers.length > 0 && (
          <Typography variant="bodySm" className="mt-3.5 leading-[1.6]">
            <b>Why the range runs to {inrShort(est.high)}:</b>{" "}
            {est.confidence.drivers.map((d) => `${d.label} (up to +${inrShort(d.upside)})`).join(", ")}. Discovery
            pins these down before you sign.
          </Typography>
        )}
      </Panel>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Panel id="pd-pay" title="Payment schedule">
          <TableWrap>
            <table className={tableClass}>
              <thead>
                <tr>
                  <Th>Milestone</Th>
                  <Th num>Week</Th>
                  <Th num>Share</Th>
                  <Th num>Amount</Th>
                </tr>
              </thead>
              <tbody>
                {est.payments.map((m) => (
                  <tr key={m.label}>
                    <Td>{m.label}</Td>
                    <Td num>{m.week}</Td>
                    <Td num>{m.pct}%</Td>
                    <Td num>{inr(m.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Typography variant="bodySm" className="mt-3.5 leading-[1.6]">
            {est.taxRate > 0 ? `${est.taxLabel} is added to each invoice.` : est.taxNote}
          </Typography>
        </Panel>

        <Panel id="pd-run" title="Running costs">
          <ul className="m-0 list-none p-0 text-sm">
            {est.running.items.map((i) => (
              <li
                key={i.label}
                className="flex justify-between gap-3 border-b border-line py-[9px] last:border-b-0"
              >
                <span className={i.kind === "spend" || i.optional ? "text-faint" : undefined}>
                  {i.label}
                  <em className="mt-px block text-xs text-faint not-italic">
                    {i.optional ? "Optional" : RUN_KIND[i.kind]}
                  </em>
                </span>
                <span className="text-right font-mono tabular-nums whitespace-nowrap">
                  {i.low === i.high ? money(i.low) : `${money(i.low)}–${money(i.high)}`}
                  {PER[i.per]}
                </span>
              </li>
            ))}
          </ul>
          <Typography variant="bodySm" className="mt-3.5 leading-[1.6]">
            <b>
              Year one, all-in: {inr(est.running.year1Low)}–{inr(est.running.year1High)}
            </b>{" "}
            — the build{est.taxRate > 0 ? ` with ${est.taxLabel}` : ""} plus twelve months of running costs.
            Excludes ad spend and optional plans.
          </Typography>
        </Panel>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Panel id="pd-assume" title="Assumptions">
          <ul className="m-0 list-disc pl-[18px] text-sm leading-[1.65] text-body">
            {est.assumptions.map((a) => (
              <li key={a} className="mb-1">
                {a}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel id="pd-excl" title="Not included">
          <ul className="m-0 list-disc pl-[18px] text-sm leading-[1.65] text-body">
            {est.exclusions.map((x) => (
              <li key={x} className="mb-1">
                {x}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
