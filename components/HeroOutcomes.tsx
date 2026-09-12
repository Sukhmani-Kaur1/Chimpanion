"use client";

import { useState } from "react";
import { outcomes } from "@/lib/outcomes";
import Typography from "./ui/Typography";
import { cn } from "@/lib/cn";

/**
 * The hero's claim, made about the visitor's own business. Pick a trade and the card rewrites
 * itself: today's version of the job struck through, and what replaces it underneath.
 *
 * It's the page's whole argument — you didn't want a website, you wanted the outcome — in a form
 * you can point at in a meeting.
 */
export default function HeroOutcomes() {
  const [active, setActive] = useState(0);
  const outcome = outcomes[active];

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* One row that scrolls, rather than wrapping — wrapping orphans whichever trade has the
          longest name, and the set reads as a single control only when it stays on one line. */}
      <div
        className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Pick a kind of business"
      >
        {outcomes.map((o, i) => {
          const on = i === active;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              className={cn(
                "flex-none snap-start rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150",
                on
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-dark-line bg-[#262622] text-dark-text hover:border-white/30"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Keyed on the trade so the rows re-mount and animate in when the selection changes. */}
      <dl key={outcome.id} className="grid gap-4" aria-live="polite">
        {outcome.pairs.map(([today, then], i) => (
          <div
            key={today}
            className="animate-rise border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <dt className="text-xs text-dark-muted line-through decoration-white/30">{today}</dt>
            <dd className="mt-1 flex gap-2 text-sm font-medium text-white">
              <span aria-hidden="true" className="flex-none text-accent">
                →
              </span>
              {then}
            </dd>
          </div>
        ))}
      </dl>

      <Typography variant="fine" tone="onDarkMuted" className="mt-auto">
        Whichever one you are, we start at the stage that&apos;s actually costing you.
      </Typography>
    </div>
  );
}
