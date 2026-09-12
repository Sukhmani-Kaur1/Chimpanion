"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { steps, optionLabels } from "@/lib/steps";
import { estimate } from "@/lib/pricing/estimate";
import { formatter, weeksLabel } from "@/lib/pricing/format";
import { MARKETS } from "@/lib/pricing/markets";
import { useMarket } from "@/lib/useMarket";
import { fromWizard } from "@/lib/pricing/scope";
import type { Estimate, Market } from "@/lib/pricing/types";
import { Checks, Headline } from "./planner/Summary";
import Button from "./ui/Button";
import { fieldClass } from "./ui/Layout";
import Typography from "./ui/Typography";
import { cn } from "@/lib/cn";

type Answers = Record<string, string[]>;

const SUMMARY_KEYS = ["timeline", "business", "type", "current", "features", "growth", "data", "design"];
const SUMMARY_LABELS: Record<string, string> = {
  timeline: "Timeline",
  business: "Business goal",
  type: "Building",
  current: "Starting point",
  features: "Features",
  growth: "Growth",
  data: "Intelligence",
  design: "Design",
};

const emptyContact = { name: "", company: "", email: "", phone: "", note: "" };

/** Card on the page background, used for each block of the result screen. */
const resultBox = "rounded-chip border border-line bg-card p-4 sm:rounded-card sm:p-5";

export default function Estimator({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState(emptyContact);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { market } = useMarket();
  const scope = useMemo(() => fromWizard(answers, market), [answers, market]);
  const est = useMemo(() => estimate(scope), [scope]);
  const fmt = formatter(market);
  const base = steps[i];
  // Budget tiers are shown in the visitor's own currency.
  const step =
    base.key === "budget"
      ? {
          ...base,
          opts: base.opts.map(([v, l, d]): [string, string, string] =>
            v === "unknown" ? [v, l, d] : [v, MARKETS[market].budgets[v as keyof (typeof MARKETS)[Market]["budgets"]].label, d]
          ),
        }
      : base;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selected = (key: string): string[] => answers[key] ?? [];

  function pick(key: string, value: string, type: string) {
    setError(null);
    setAnswers((prev) => {
      const cur = prev[key] ?? [];
      if (type === "single") return { ...prev, [key]: [value] };
      let next: string[];
      if (value === "none") {
        next = cur.includes("none") ? [] : ["none"];
      } else if (cur.includes(value)) {
        next = cur.filter((v) => v !== value);
      } else {
        next = [...cur.filter((v) => v !== "none"), value];
      }
      return { ...prev, [key]: next };
    });
  }

  function goNext() {
    if (step.type === "form") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
      if (!contact.name.trim() || !contact.company.trim() || !emailOk) {
        setError("Add your name, company and a valid work email so we know where to send this.");
        return;
      }
      setError(null);
      setShowResult(true);
      return;
    }
    if (selected(step.key).length === 0) {
      setError("Choose at least one option to continue.");
      return;
    }
    setError(null);
    setI((n) => n + 1);
  }

  function goBack() {
    setError(null);
    if (showResult) {
      setShowResult(false);
      return;
    }
    if (i > 0) setI((n) => n - 1);
  }

  const progress = showResult ? 100 : ((i + 1) / steps.length) * 100;
  const range = est.fixedPrice ? `${fmt.short(est.low)}–${fmt.short(est.high)}` : "—";
  const weeks = est.fixedPrice ? weeksLabel(est.timeline.weeks, est.timeline.weeksHigh) : "—";
  const scopeSoFar = SUMMARY_KEYS.filter((k) => selected(k).length > 0);

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/55 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Project planner"
    >
      {/* Full screen on phones, a centred card once there's room for the sidebar. */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="grid h-dvh max-h-dvh w-full grid-cols-1 overflow-hidden bg-bg lg:h-[min(820px,94dvh)] lg:w-[min(1180px,100%)] lg:grid-cols-[1fr_350px] lg:rounded-surface"
      >
        <div className="relative flex min-h-0 flex-col p-4 pb-[calc(84px+env(safe-area-inset-bottom))] lg:p-[26px_30px] lg:pb-[26px]">
          <div className="mb-3.5 flex items-center justify-between gap-2.5">
            <Typography variant="h5" as="b" className="text-base">
              CHIMPANION
            </Typography>
            <Typography variant="mono" className="text-xs font-bold text-faint">
              {showResult ? "PLAN READY" : `${String(i + 1).padStart(2, "0")} / ${steps.length}`}
            </Typography>
            <button
              onClick={onClose}
              aria-label="Close planner"
              className="flex size-[46px] flex-none items-center justify-center rounded-full border border-line bg-card text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="mb-5 h-1.5 flex-none overflow-hidden rounded-full bg-line">
            <span
              className="block h-full bg-dark transition-[width] duration-250"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Compact live estimate — stands in for the sidebar on small screens. */}
          <div className="mb-4 flex flex-none items-center justify-between gap-3 rounded-chip bg-dark px-3.5 py-[11px] text-white lg:hidden">
            <div>
              <Typography variant="overline" tone="onDarkMuted" className="text-2xs">
                Live range
              </Typography>
              <Typography variant="mono" as="div" className="mt-0.5 text-sm font-bold">
                {range}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="overline" tone="onDarkMuted" className="text-2xs">
                Timeline
              </Typography>
              <Typography variant="mono" as="div" className="mt-0.5 text-sm font-bold">
                {weeks}
              </Typography>
            </div>
          </div>

          {showResult ? (
            <Result est={est} sent={sent} onSend={() => setSent(true)} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <Typography variant="h2" className="flex-none text-3xl">
                {step.title}
              </Typography>
              <Typography variant="bodySm" className="mt-2 mb-3.5 flex-none sm:mb-[18px]">
                {step.hint}
              </Typography>
              {error && (
                <Typography
                  variant="bodySm"
                  tone="warn"
                  className="mb-2.5 rounded-[10px] bg-warn-bg px-3 py-2.5 font-semibold"
                >
                  {error}
                </Typography>
              )}

              {step.type === "form" ? (
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <input
                    className={cn(fieldClass, "mb-2.5")}
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                  <input
                    className={cn(fieldClass, "mb-2.5")}
                    placeholder="Business / company"
                    value={contact.company}
                    onChange={(e) => setContact({ ...contact, company: e.target.value })}
                  />
                  <input
                    className={cn(fieldClass, "mb-2.5")}
                    type="email"
                    inputMode="email"
                    placeholder="Work email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                  <input
                    className={cn(fieldClass, "mb-2.5")}
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone / WhatsApp"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                  <textarea
                    className={cn(fieldClass, "mb-2.5")}
                    rows={3}
                    placeholder="Anything else we should know?"
                    value={contact.note}
                    onChange={(e) => setContact({ ...contact, note: e.target.value })}
                  />
                  <Typography variant="caption">The full breakdown appears on the next screen.</Typography>
                </div>
              ) : (
                <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 sm:gap-2.5">
                  {step.opts.map(([value, label, detail]) => {
                    const isOn = selected(step.key).includes(value);
                    return (
                      <button
                        key={value}
                        aria-pressed={isOn}
                        onClick={() => pick(step.key, value, step.type)}
                        className={cn(
                          "min-h-[58px] rounded-chip border border-line bg-card p-3.5 text-left transition-[border-color,background-color] duration-100 hover:border-line-strong sm:min-h-[46px] sm:rounded-[15px] sm:p-[15px]",
                          isOn && "border-2 border-ink bg-soft p-[13px] sm:p-3.5"
                        )}
                      >
                        <Typography variant="bodySm" as="strong" tone="ink" className="block font-bold">
                          {label}
                        </Typography>
                        <Typography
                          variant="caption"
                          as="small"
                          className={cn("mt-1 block", isOn && "text-[#3c4a1e]")}
                        >
                          {detail}
                        </Typography>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fixed action bar on phones; part of the column on desktop. */}
          <div className="absolute right-0 bottom-0 left-0 z-5 flex flex-none justify-between gap-2.5 border-t border-line bg-bg px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:static lg:mt-3.5 lg:px-0 lg:pt-3.5 lg:pb-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="max-lg:flex-1"
              style={{ visibility: i === 0 && !showResult ? "hidden" : "visible" }}
            >
              ← Back
            </Button>
            {!showResult && (
              <Button variant="lime" onClick={goNext} className="max-lg:flex-1">
                {i === steps.length - 1 ? "Build my plan →" : "Continue →"}
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden flex-col overflow-y-auto bg-dark p-7 text-white lg:flex">
          <Typography variant="overline" tone="onDarkMuted" className="text-2xs tracking-[0.1em]">
            Live planning range
          </Typography>
          <Typography variant="priceSm" className="mt-[7px]">
            {range}
          </Typography>
          <div className="my-5 h-px bg-[#333330]" />
          <Typography variant="overline" tone="onDarkMuted" className="text-2xs tracking-[0.1em]">
            Timeline
          </Typography>
          <Typography variant="priceSm" className="mt-1.5">
            {weeks}
          </Typography>
          <div className="my-5 h-px bg-[#333330]" />
          <Typography variant="overline" tone="onDarkMuted" className="text-2xs tracking-[0.1em]">
            Scope so far
          </Typography>
          <div className="text-sm">
            {scopeSoFar.length === 0 ? (
              <Typography variant="bodySm" tone="faint" className="mt-2">
                Your plan builds here as you answer.
              </Typography>
            ) : (
              scopeSoFar.map((k) => {
                const v = selected(k);
                return (
                  <div key={k} className="flex justify-between gap-2.5 py-[7px] text-dark-text">
                    <span>{SUMMARY_LABELS[k]}</span>
                    <span className="text-right text-dark-muted">
                      {v.length === 1 ? optionLabels[v[0]] ?? v[0] : `${v.length} selected`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <Typography variant="fine" tone="onDarkMuted" className="mt-auto pt-4 leading-[1.6]">
            Prices in {MARKETS[market].currency}, set from your location. Final scope is confirmed after a
            discovery call.
          </Typography>
        </aside>
      </div>
    </div>
  );
}

function Result({ est, sent, onSend }: { est: Estimate; sent: boolean; onSend: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Typography variant="h2" className="flex-none text-3xl">
        Here&apos;s the number, and what&apos;s behind it.
      </Typography>
      <Typography variant="bodySm" className="mt-2 mb-3.5 flex-none sm:mb-[18px]">
        A planning estimate from our rate card. The fixed price is confirmed after a discovery session.
      </Typography>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className={resultBox}>
          <Headline est={est} />
        </div>

        <Checks est={est} className="mt-3" />

        {est.fixedPrice > 0 && (
          <div className={cn(resultBox, "mt-3")}>
            <Typography variant="overline">WHAT YOU&apos;D BE PAYING FOR</Typography>
            <ul className="mt-2 list-none p-0 text-sm">
              {est.packages.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between gap-2.5 border-b border-dashed border-line py-2 last:border-b-0"
                >
                  <span>{p.label}</span>
                  <span className="text-right font-mono tabular-nums text-muted">
                    {formatter(est.market).money(p.cost)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={cn(resultBox, "mt-3 mb-1")}>
          <Typography variant="overline">GET THIS AS A DOCUMENT</Typography>
          {sent ? (
            <Typography
              variant="bodySm"
              tone="good"
              className="mt-2.5 rounded-field bg-good-bg p-3 font-semibold"
            >
              Saved — in production this posts to the CRM and emails you the breakdown.
            </Typography>
          ) : (
            <Button variant="lime" className="mt-2.5 w-full" onClick={onSend}>
              Send me the breakdown →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
