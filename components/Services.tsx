import { Container, Section, SectionHead } from "./ui/Layout";
import Typography from "./ui/Typography";
import { cn } from "@/lib/cn";

interface Service {
  num: string;
  title: string;
  body: string;
  /** Second sentence — wider screens only, to keep the mobile page short. */
  more?: string;
  tags: string;
  /**
   * How many columns the card takes. The six cards have to fill whole rows, so the spans are
   * chosen to add up: 2 + 1 + 1 + 1 + 1 + 3 = 9, which is three full rows of three.
   */
  span?: "wide" | "full";
}

const services: Service[] = [
  {
    num: "01 / DISCOVER",
    title: "Work out what's actually worth building.",
    body: "Half the projects that come to us don't need what they asked for.",
    more: "We find the real bottleneck and scope against that.",
    tags: "Discovery · Requirements · Market & competitor research · Roadmap",
    span: "wide",
  },
  {
    num: "02 / DESIGN",
    title: "Design people can actually use.",
    body: "Built for real customers — including the ones on an old Android with two bars of signal.",
    tags: "UI/UX · Prototyping · Design systems · Brand",
  },
  {
    num: "03 / BUILD",
    title: "Software that does the boring jobs.",
    body: "Websites, e-commerce, admin panels, payments, integrations.",
    more: "The machinery that gets your team out of WhatsApp and Excel.",
    tags: "Frontend · Backend · APIs · Payments · Automation",
  },
  {
    num: "04 / LAUNCH",
    title: "Live, tracked, and not fragile.",
    body: "Hosting, deployment and analytics, so you can see what works from week one.",
    tags: "Cloud & hosting · Analytics · Tracking · QA",
  },
  {
    num: "05 / GROW",
    title: "Traffic is not the same as customers.",
    body: "SEO, ads and landing pages — plus the follow-up, so leads don't die in an inbox.",
    tags: "SEO · Paid media · Lead gen · CRM · Sales enablement",
  },
  {
    num: "06 / INTELLIGENCE",
    title: "See what your competitors are doing.",
    body: "Their prices, products and offers — from public sources, on one screen.",
    tags: "Competitor monitoring · Pricing intel · Research · Dashboards",
    span: "full",
  },
];

export default function Services() {
  return (
    <Section id="services" aria-labelledby="services-heading">
      <Container>
        <SectionHead kicker="WHAT WE DO" title="Six stages. Most clients start with one." titleId="services-heading">
          We work out which stage you&apos;re stuck at, then start there. If a small website solves it,
          we&apos;ll say so instead of selling you software.
        </SectionHead>

        {/* One column on phones, two on tablets, three once there's room. */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const dark = s.span === "wide";
            const full = s.span === "full";
            return (
              <article
                key={s.num}
                className={cn(
                  "flex flex-col justify-between rounded-panel border p-[22px] transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.06)] sm:rounded-surface sm:p-[26px] lg:min-h-[270px]",
                  dark && "border-dark-2 bg-dark text-white md:col-span-2",
                  // The closing card runs the full row, so it lays out sideways instead of stacking.
                  full && "border-line bg-card md:col-span-2 lg:col-span-3 lg:min-h-0 lg:flex-row lg:items-end lg:gap-10",
                  !dark && !full && "border-line bg-card"
                )}
              >
                <div className={cn(full && "lg:max-w-[560px]")}>
                  <Typography variant="mono" as="div" className="text-xs font-bold tracking-label" tone={dark ? "onDarkMuted" : "faint"}>
                    {s.num}
                  </Typography>
                  <Typography
                    variant="h2"
                    as="h3"
                    className={cn("mt-7 text-3xl lg:mt-11", dark && "text-4xl", full && "lg:mt-7")}
                  >
                    {s.title}
                  </Typography>
                  <Typography variant="bodySm" tone={dark ? "onDarkBody" : "muted"} className={cn("my-2.5", dark ? "max-w-[420px]" : "max-w-[300px]")}>
                    {s.body}
                    {s.more && <span className="hidden sm:inline"> {s.more}</span>}
                  </Typography>
                </div>
                <Typography
                  variant="caption"
                  tone={dark ? "onDarkMuted" : "subtle"}
                  as="div"
                  className={cn("leading-[1.8]", full && "lg:max-w-[260px] lg:text-right")}
                >
                  {s.tags}
                </Typography>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
