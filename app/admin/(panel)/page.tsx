import { BENCHMARKS } from "@/lib/pricing/benchmarks";
import { estimate } from "@/lib/pricing/estimate";
import { formatter } from "@/lib/pricing/format";
import { MARKETS, MARKET_LIST } from "@/lib/pricing/markets";
import { Container } from "@/components/ui/Layout";
import { TableWrap, Td, Th, tableClass } from "@/components/ui/Table";
import Typography from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

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

const card = "grid content-start gap-1.5 rounded-panel border border-line p-[18px] sm:rounded-[20px] sm:p-[22px]";
const code = "rounded bg-[#f1f1ea] px-1.5 py-px font-mono text-xs";

export default function AdminHome() {
  return (
    <Container className="pt-8 pb-20 sm:pt-9">
      <Typography variant="kicker">INTERNAL</Typography>
      <Typography variant="h2" as="h1" className="mt-2 mb-5">
        Sales tools
      </Typography>

      <div className="mb-4 grid gap-3.5 lg:grid-cols-2">
        <a
          className={cn(
            card,
            "bg-card transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.06)]"
          )}
          href="/admin/planner"
        >
          <Typography variant="h5" as="b">
            Cost planner →
          </Typography>
          <Typography variant="bodySm">
            Build a costed estimate live in a meeting: fixed price, timeline, phase plan, payment schedule
            and running costs, in your client&apos;s currency. Print it or share a link.
          </Typography>
        </a>
        <div className={cn(card, "bg-[#f4f4ee]")}>
          <Typography variant="h5" as="b">
            Rate card
          </Typography>
          <Typography variant="bodySm">
            Rates, hours and risk live in <code className={code}>lib/pricing/ratecard.ts</code>; currency,
            tax, local vendors and compliance in <code className={code}>lib/pricing/markets.ts</code>. Run{" "}
            <code className={code}>npm test</code> after changing either.
          </Typography>
        </div>
      </div>

      <section
        aria-labelledby="ref-prices"
        className="rounded-panel border border-line bg-card p-[18px] sm:rounded-[20px] sm:p-[22px]"
      >
        <Typography variant="h5" as="h2" id="ref-prices" className="font-sans text-lg tracking-[-0.01em]">
          Reference prices
        </Typography>
        <Typography variant="bodySm" tone="body" className="mt-1.5 mb-3.5 max-w-[70ch]">
          What the planner quotes for standard projects today, before tax. Use them as sanity checks — every
          real estimate should come from the planner.
        </Typography>

        <TableWrap>
          <table className={tableClass}>
            <thead>
              <tr>
                <Th>Project</Th>
                {MARKET_LIST.map((m) => (
                  <Th num key={m}>
                    {MARKETS[m].name}
                  </Th>
                ))}
                <Th num>Weeks</Th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE.map(([id, label]) => {
                const rows = MARKET_LIST.map((m) => estimate({ ...BENCHMARKS[id], market: m }));
                return (
                  <tr key={id}>
                    <Td>{label}</Td>
                    {rows.map((e, i) => (
                      <Td num key={MARKET_LIST[i]}>
                        {formatter(MARKET_LIST[i]).short(e.fixedPrice)}
                      </Td>
                    ))}
                    <Td num>{rows[0].timeline.weeks}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </section>
    </Container>
  );
}
