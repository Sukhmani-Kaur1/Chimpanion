import { BENCHMARKS } from "@/lib/pricing/benchmarks";
import { estimate } from "@/lib/pricing/estimate";
import { formatter } from "@/lib/pricing/format";
import { MARKETS, MARKET_LIST } from "@/lib/pricing/markets";

const REFERENCE: [keyof typeof BENCHMARKS, string][] = [
  ["landingPage", "Landing page"],
  ["businessSite", "Business website, 6 pages"],
  ["customSite", "Custom-designed site, 8 pages"],
  ["shopifyStore", "Shopify store"],
  ["businessSystem", "Internal system"],
  ["customStore", "Custom store"],
  ["bookingApp", "Booking app"],
  ["saasMvp", "SaaS product"],
];

export default function AdminHome() {
  return (
    <div className="adminwrap">
      <div className="kicker">INTERNAL</div>
      <h1 className="ptitle">Sales tools</h1>

      <div className="admincards">
        <a className="admincard" href="/admin/planner">
          <b>Cost planner →</b>
          <span>
            Build a costed estimate live in a meeting: fixed price, timeline, phase plan, payment
            schedule and running costs, in your client&apos;s currency. Print it or share a link.
          </span>
        </a>
        <div className="admincard static">
          <b>Rate card</b>
          <span>
            Rates, hours and risk live in <code>lib/pricing/ratecard.ts</code>; currency, tax, local
            vendors and compliance in <code>lib/pricing/markets.ts</code>. Run <code>npm test</code> after
            changing either.
          </span>
        </div>
      </div>

      <section className="pcard" aria-labelledby="ref-prices">
        <h2 id="ref-prices">Reference prices</h2>
        <p className="pcard-lede">
          What the planner quotes for standard projects today, before tax. Use them as sanity checks —
          every real estimate should come from the planner.
        </p>
        <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Project</th>
                {MARKET_LIST.map((m) => (
                  <th className="num" key={m}>
                    {MARKETS[m].name}
                  </th>
                ))}
                <th className="num">Weeks</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE.map(([id, label]) => {
                const rows = MARKET_LIST.map((m) => estimate({ ...BENCHMARKS[id], market: m }));
                return (
                  <tr key={id}>
                    <td>{label}</td>
                    {rows.map((e, i) => (
                      <td className="num" key={MARKET_LIST[i]}>
                        {formatter(MARKET_LIST[i]).short(e.fixedPrice)}
                      </td>
                    ))}
                    <td className="num">{rows[0].timeline.weeks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
