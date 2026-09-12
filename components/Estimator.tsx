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

  return (
    <div className="est" role="dialog" aria-modal="true" aria-label="Project planner">
      <div className="estcard" ref={cardRef} tabIndex={-1}>
        <div className="estmain">
          <div className="esttop">
            <b>CHIMPANION</b>
            <span className="stepmeta">
              {showResult ? "PLAN READY" : `${String(i + 1).padStart(2, "0")} / ${steps.length}`}
            </span>
            <button className="close" onClick={onClose} aria-label="Close planner">
              ×
            </button>
          </div>

          <div className="prog">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="livestat">
            <div>
              <div className="lbl">Live range</div>
              <div className="val">{range}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lbl">Timeline</div>
              <div className="val">{weeks}</div>
            </div>
          </div>

          {showResult ? (
            <Result est={est} sent={sent} onSend={() => setSent(true)} />
          ) : (
            <div className="qwrap">
              <h2 className="q">{step.title}</h2>
              <p className="hint">{step.hint}</p>
              {error && <div className="formerr">{error}</div>}

              {step.type === "form" ? (
                <div style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingRight: 4 }}>
                  <input
                    className="field"
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Business / company"
                    value={contact.company}
                    onChange={(e) => setContact({ ...contact, company: e.target.value })}
                  />
                  <input
                    className="field"
                    type="email"
                    inputMode="email"
                    placeholder="Work email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                  <input
                    className="field"
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone / WhatsApp"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                  <textarea
                    className="field"
                    rows={3}
                    placeholder="Anything else we should know?"
                    value={contact.note}
                    onChange={(e) => setContact({ ...contact, note: e.target.value })}
                  />
                  <div className="small plain">
                    The full breakdown appears on the next screen.
                  </div>
                </div>
              ) : (
                <div className="opts">
                  {step.opts.map(([value, label, detail]) => {
                    const isOn = selected(step.key).includes(value);
                    return (
                      <button
                        key={value}
                        className={`opt${isOn ? " selected" : ""}`}
                        aria-pressed={isOn}
                        onClick={() => pick(step.key, value, step.type)}
                      >
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="estfoot">
            <button
              className="pill ghost"
              onClick={goBack}
              style={{ visibility: i === 0 && !showResult ? "hidden" : "visible" }}
            >
              ← Back
            </button>
            {!showResult && (
              <button className="pill lime" onClick={goNext}>
                {i === steps.length - 1 ? "Build my plan →" : "Continue →"}
              </button>
            )}
          </div>
        </div>

        <aside className="side">
          <div className="sidecap">Live planning range</div>
          <div className="sideprice">{range}</div>
          <div className="line" />
          <div className="sidecap">Timeline</div>
          <div className="sidetime">{weeks}</div>
          <div className="line" />
          <div className="sidecap">Scope so far</div>
          <div className="summary">
            {SUMMARY_KEYS.filter((k) => selected(k).length > 0).length === 0 ? (
              <div style={{ color: "#8a8a80" }}>Your plan builds here as you answer.</div>
            ) : (
              SUMMARY_KEYS.filter((k) => selected(k).length > 0).map((k) => {
                const v = selected(k);
                return (
                  <div className="sumrow" key={k}>
                    <span>{SUMMARY_LABELS[k]}</span>
                    <span>{v.length === 1 ? optionLabels[v[0]] ?? v[0] : `${v.length} selected`}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="footnote">
            Prices in {MARKETS[market].currency}, set from your location. Final scope is confirmed
            after a discovery call.
          </div>
        </aside>
      </div>
    </div>
  );
}

function Result({ est, sent, onSend }: { est: Estimate; sent: boolean; onSend: () => void }) {
  return (
    <div className="qwrap">
      <h2 className="q">Here&apos;s the number, and what&apos;s behind it.</h2>
      <p className="hint">A planning estimate from our rate card. The fixed price is confirmed after a discovery session.</p>
      <div className="resultscroll">
        <div className="resultbox">
          <Headline est={est} />
        </div>

        <Checks est={est} />

        {est.fixedPrice > 0 && (
          <div className="resultbox" style={{ marginTop: 12 }}>
            <div className="small">WHAT YOU&apos;D BE PAYING FOR</div>
            <ul className="recurring">
              {est.packages.map((p) => (
                <li key={p.id}>
                  <span>{p.label}</span>
                  <span>{formatter(est.market).money(p.cost)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="resultbox" style={{ marginTop: 12, marginBottom: 4 }}>
          <div className="small">GET THIS AS A DOCUMENT</div>
          {sent ? (
            <div className="success" style={{ marginTop: 10 }}>
              Saved — in production this posts to the CRM and emails you the breakdown.
            </div>
          ) : (
            <button className="pill lime" style={{ width: "100%", marginTop: 10 }} onClick={onSend}>
              Send me the breakdown →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
