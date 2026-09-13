"use client";

import type { MediaPlan, Objective } from "@/lib/media/types";
import { formatter } from "@/lib/pricing/format";
import { MARKETS } from "@/lib/pricing/markets";
import { site } from "@/lib/site";

const RESULT_NOUN: Record<Objective, string> = {
  leads: "enquiries",
  sales: "sales",
  awareness: "engaged visits",
  footfall: "visits or calls",
  app: "installs",
};

/**
 * The paid step, shown over the blurred plan.
 *
 * PLACEHOLDER — no payment provider is wired up and there is no server-side check on who has paid.
 * `onUnlock` only reveals what the browser already holds, so treat the full plan as public until a
 * provider is in place: take the payment, verify it server-side, and move plan-building behind an
 * API route so the detail is never sent to an unpaid visitor in the first place.
 */
export default function PaywallCard({ plan, onUnlock }: { plan: MediaPlan; onUnlock: () => void }) {
  const spec = MARKETS[plan.scope.market];
  const fmt = formatter(plan.scope.market);
  const price = spec.mediaPlanPrice;
  const budget = plan.scope.budget;
  const noun = RESULT_NOUN[plan.scope.objective];
  // Anchored against what they're already planning to spend — the plan is a rounding error on it.
  const share = budget > 0 ? (price / budget) * 100 : 0;
  const shareLabel = share >= 1 ? `${share.toFixed(share < 10 ? 1 : 0)}%` : "under 1%";
  const weeks = plan.scope.durationWeeks;

  return (
    <div className="mppay">
      <div className="kicker">YOUR PLAN IS BUILT</div>
      <h3>Everything below is ready. Unlock it to read it.</h3>

      <div className="mpanchor">
        <b>{shareLabel}</b>
        <span>
          of one month&apos;s ad budget. You&apos;re planning to spend {fmt.money(plan.campaignBudget)} across this
          campaign — this is the map for it.
        </span>
      </div>

      <ul className="mplist">
        <li>What the budget should return — {noun} a month, cost per result and break-even</li>
        <li>The {plan.channels.length} channels worth your money, and why each one made the list</li>
        <li>Budget per channel, with cost per click, CPM, impressions and reach</li>
        <li>{plan.creative.length} creative briefs: the angle, the hook and the format</li>
        <li>
          {plan.searchThemes.length} search intent groups, plus {plan.negatives.length} negative keywords to start from
        </li>
        <li>A {weeks >= 52 ? "quarter-by-quarter" : `${weeks}-week`} launch schedule, week by week</li>
      </ul>

      <button type="button" className="pill lime" onClick={onUnlock}>
        Unlock my plan — {fmt.money(price)}
      </button>
      <p className="mpterms">One payment. No subscription. Yours to keep, print and hand to whoever runs the ads.</p>
      <a className="mplink" href={`mailto:${site.email}?subject=${encodeURIComponent("Media plan")}`}>
        Questions first? Email {site.email}
      </a>
    </div>
  );
}
