import { Card, Container, Section } from "./ui/Layout";
import Typography from "./ui/Typography";

const today = [
  "Directory leads that go cold in a day",
  "Quotations typed by hand into WhatsApp",
  "No idea which designs actually sell",
  "Every showroom on its own spreadsheet",
];

const withUs = [
  "A catalogue that qualifies leads before anyone calls",
  "Quotations generated from the CRM in two minutes",
  "One dashboard: what sells, by design and by branch",
  "One system every showroom logs into",
];

const promises = [
  "We scope what solves the problem — not inflated to match a budget you mentioned, not shrunk to win the deal.",
  "Your domain, hosting, ad accounts and data stay in your name, from day one.",
  "Ad spend, hosting and licences go on your card at cost. No markup.",
  "No guaranteed rankings or lead numbers. We'll tell you what's realistic before you pay.",
];

function Column({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div className="rounded-card border border-[#d9d8cd] bg-card p-[18px]">
      <Typography variant="overline" className="tracking-[0.09em]">
        {heading}
      </Typography>
      {items.map((t) => (
        <Typography variant="bodySm" key={t} className="my-2.5">
          {t}
        </Typography>
      ))}
    </div>
  );
}

export default function ExampleAndTrust() {
  return (
    <Section aria-labelledby="example-heading">
      <Container className="grid gap-4 lg:grid-cols-2">
        <div id="example" className="rounded-panel bg-[#ebeae2] p-6 sm:rounded-[28px] sm:p-8">
          <Typography variant="kicker">EXAMPLE: A MODULAR KITCHEN BUSINESS</Typography>
          <Typography variant="h2" id="example-heading" className="mt-2 text-4xl">
            Don&apos;t buy a website. Buy a faster sales cycle.
          </Typography>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Column heading="TODAY" items={today} />
            <Column heading="WITH US" items={withUs} />
          </div>
        </div>

        <Card id="trust" className="p-6 sm:p-8">
          <Typography variant="kicker">WHAT YOU PAY FOR</Typography>
          <Typography variant="h2" className="mt-2 text-4xl">
            And what you don&apos;t.
          </Typography>
          {promises.map((p) => (
            <div className="my-3.5 flex gap-3" key={p}>
              <i
                aria-hidden="true"
                className="mt-px flex size-5 flex-none items-center justify-center rounded-full bg-accent text-xs font-black text-accent-ink not-italic"
              >
                ✓
              </i>
              <Typography variant="bodySm" as="span" tone="body">
                {p}
              </Typography>
            </div>
          ))}
        </Card>
      </Container>
    </Section>
  );
}
