import { faqs, type Exhibit } from "@/lib/faq";
import StartButton from "./StartButton";
import { Container, Section } from "./ui/Layout";
import Typography from "./ui/Typography";

/**
 * The one thing this studio has that an agency site doesn't is a working pricing engine, so the
 * FAQ shows its workings: every answer sits beside an exhibit, and the measured ones are computed
 * from the same rate card that prices real projects. Change a rate and this section moves.
 *
 * Native <details name> gives an exclusive accordion with no JavaScript, so the whole section is a
 * server component and every answer stays in the DOM for crawlers.
 */

/** Number, question and marker share one grid so the answer lines up under the question. */
const row =
  "grid grid-cols-[1.75rem_minmax(0,1fr)_1.5rem] gap-x-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_1.75rem] sm:gap-x-5";

/** Evidence is always on the lime tint — it reads as a different kind of thing from the prose. */
function Evidence({ exhibit }: { exhibit: Exhibit }) {
  return (
    <aside className="rounded-card border border-accent/70 bg-soft p-5">
      {exhibit.kind === "bars" && (
        <>
          <Typography variant="overline" className="text-accent-ink/70">
            {exhibit.caption}
          </Typography>
          <div className="mt-3 grid gap-2.5">
            {exhibit.rows.map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <Typography variant="caption" as="span" className="text-xs text-accent-ink/80">
                    {r.label}
                  </Typography>
                  <Typography variant="mono" as="span" className="text-xs font-bold text-accent-ink">
                    {r.value}
                  </Typography>
                </div>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/80">
                  <span
                    className="block h-full rounded-full bg-dark"
                    style={{ width: `${Math.max(6, r.weight * 100)}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
          <Typography variant="fine" className="mt-3 text-accent-ink/60">
            {exhibit.unit} · straight from the planner&apos;s rate card
          </Typography>
        </>
      )}

      {exhibit.kind === "list" && (
        <>
          <Typography variant="overline" className="text-accent-ink/70">
            {exhibit.caption}
          </Typography>
          <ul className="mt-3 grid gap-2">
            {exhibit.items.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <i
                  aria-hidden="true"
                  className="flex size-4 flex-none items-center justify-center rounded-full bg-dark text-2xs font-black text-accent not-italic"
                >
                  ✓
                </i>
                <Typography variant="caption" as="span" className="text-xs text-accent-ink/80">
                  {item}
                </Typography>
              </li>
            ))}
          </ul>
        </>
      )}

      {exhibit.kind === "figure" && (
        <>
          {/* The number does the talking — the honest zeros are the point. */}
          <Typography variant="display" as="div" className="text-6xl text-accent-ink">
            {exhibit.value}
          </Typography>
          <Typography variant="overline" className="mt-1 text-accent-ink/70">
            {exhibit.caption}
          </Typography>
          <Typography variant="caption" className="mt-3 text-xs text-accent-ink/80">
            {exhibit.note}
          </Typography>
        </>
      )}
    </aside>
  );
}

export default function Faq() {
  return (
    <Section id="faq" aria-labelledby="faq-heading">
      <Container>
        <div className="relative overflow-hidden rounded-[24px] border border-line bg-card px-5 py-10 sm:rounded-hero sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          {/* No decorative shape here: both corners of this panel carry content — supporting copy
             top-right, the CTA bottom-left — so anything in them lands under the type. */}
          <div className="relative z-1">
            {/* Same head layout as the rest of the page: title left, supporting copy right. */}
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
              <div className="max-w-[520px]">
                <Typography variant="kicker">COMMON QUESTIONS</Typography>
                {/* One step below the page's section heads — this one sits inside a panel. */}
                <Typography variant="h2" id="faq-heading" className="mt-2 text-4xl">
                  Every answer, with its receipt.
                </Typography>
              </div>
              <div className="max-w-[420px]">
                <Typography variant="bodySm">
                  Most agencies answer &ldquo;it depends&rdquo;. These come out of the same engine that
                  prices our real projects — so what you read here is what the planner will quote you.
                </Typography>
                {/* True, and worth saying out loud: the numbers below are generated, not typed. */}
                <div className="mt-3 inline-flex items-center gap-2.5 rounded-full border border-line bg-bg px-3.5 py-1.5">
                  <span className="size-1.5 flex-none animate-pulse rounded-full bg-accent ring-1 ring-accent-ink/25" />
                  <Typography
                    variant="mono"
                    as="span"
                    className="text-2xs font-bold tracking-label text-subtle uppercase"
                  >
                    Recalculated on every build
                  </Typography>
                </div>
              </div>
            </div>

            {/* Capped, so the question, its marker and its evidence stay one visual unit even
                when the panel runs the full container width. */}
            <div className="mt-8 max-w-[1040px] sm:mt-10">
              {faqs.map(({ q, a, exhibit }, i) => (
                <details
                  key={q}
                  name="faq"
                  open={i === 0}
                  className="group -mx-4 border-t border-line px-4 transition-colors duration-150 first:border-t-0 hover:bg-bg/60 open:rounded-panel open:border-transparent open:bg-bg open:hover:bg-bg sm:-mx-5 sm:px-5"
                >
                  <summary className={`${row} no-marker cursor-pointer items-start py-5`}>
                    {/* The numbered chip is the thing that says "a question starts here". */}
                    <span
                      className="mt-0.5 flex size-7 flex-none items-center justify-center rounded-full border border-line font-mono text-2xs font-bold text-faint transition-colors duration-150 group-open:border-accent group-open:bg-accent group-open:text-accent-ink"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Typography variant="h3" as="h3" className="text-balance">
                      {q}
                    </Typography>
                    <span
                      aria-hidden="true"
                      className="mt-1 text-xl leading-none font-semibold text-muted transition-colors duration-150 group-open:text-accent-ink"
                    >
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">×</span>
                    </span>
                  </summary>

                  <div className={`${row} pb-8`}>
                    {/* Claim on the left, evidence on the right. */}
                    <div className="col-start-1 col-end-4 grid items-start gap-5 sm:col-start-2 sm:col-end-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
                      <Typography variant="body" className="max-w-[62ch] leading-[1.7]">
                        {a}
                      </Typography>
                      <Evidence exhibit={exhibit} />
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-7">
              <Typography variant="bodySm" className="max-w-[46ch]">
                Your project isn&apos;t a reference project. The planner prices the real one in about two
                minutes.
              </Typography>
              <StartButton className="max-sm:w-full">Scope my project →</StartButton>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
