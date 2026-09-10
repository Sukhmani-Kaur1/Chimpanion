interface Service {
  num: string;
  title: string;
  body: string;
  /** Second sentence — desktop only, to keep the mobile page short. */
  more?: string;
  tags: string;
  wide?: boolean;
}

const services: Service[] = [
  {
    num: "01 / DISCOVER",
    title: "Work out what's actually worth building.",
    body: "Half the projects that come to us don't need what they asked for.",
    more: "We find the real bottleneck and scope against that.",
    tags: "Discovery · Requirements · Market & competitor research · Roadmap",
    wide: true,
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
  },
];

export default function Services() {
  return (
    <section className="section" id="services" aria-labelledby="services-heading">
      <div className="wrap">
        <div className="sectionhead">
          <div>
            <div className="kicker">WHAT WE DO</div>
            <h2 id="services-heading">Six stages. Most clients start with one.</h2>
          </div>
          <p>
            We work out which stage you&apos;re stuck at, then start there. If a small website solves
            it, we&apos;ll say so instead of selling you software.
          </p>
        </div>
        <div className="servicegrid">
          {services.map((s) => (
            <article className={`service${s.wide ? " big-service" : ""}`} key={s.num}>
              <div>
                <div className="num">{s.num}</div>
                <h3 className="service-title">{s.title}</h3>
                <p>
                  {s.body}
                  {s.more && <span className="desk-only-i"> {s.more}</span>}
                </p>
              </div>
              <div className="tags">{s.tags}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
