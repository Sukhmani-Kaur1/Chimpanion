import StartButton from "./StartButton";
import { site, waLink } from "@/lib/site";
import { Container, Section, SectionHead } from "./ui/Layout";
import Typography from "./ui/Typography";

export default function Contact() {
  const cards: { label: string; value: string; meta: string; href: string; external?: boolean }[] = [
    {
      label: "EMAIL",
      value: site.email,
      meta: "Detailed requirements. Reply within a working day.",
      href: `mailto:${site.email}`,
    },
    { label: "WHATSAPP", value: site.whatsappDisplay, meta: "Quick questions.", href: waLink, external: true },
    { label: "LINKEDIN", value: "/chimpanion", meta: "What we publish.", href: site.linkedin, external: true },
  ];

  return (
    <Section id="contact" aria-labelledby="contact-heading">
      <Container>
        <SectionHead
          kicker="CONTACT"
          title={<>Talk to the people who&apos;d do the work.</>}
          titleId="contact-heading"
        />

        <div className="grid gap-3 md:grid-cols-3">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex flex-col gap-1.5 rounded-chip border border-line bg-card p-[18px] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-[3px] hover:border-line-strong hover:shadow-[0_16px_34px_rgba(0,0,0,0.06)] sm:rounded-[20px] sm:p-[22px]"
            >
              <Typography variant="overline">{c.label}</Typography>
              <Typography variant="h5" as="b" className="break-words">
                {c.value}
              </Typography>
              <Typography variant="caption" as="span">
                {c.meta}
              </Typography>
            </a>
          ))}
        </div>

        <div className="mt-3.5 flex flex-col items-stretch justify-between gap-5 rounded-[20px] bg-accent p-5 text-accent-ink sm:flex-row sm:items-center sm:rounded-[24px] sm:px-[30px] sm:py-[26px]">
          <Typography variant="lead" tone="accent" className="max-w-[620px]">
            <b>Want a number first?</b> The planner asks nine questions and returns a costed range with
            the hours behind it.
          </Typography>
          <StartButton variant="dark" className="max-sm:w-full">
            Scope my project →
          </StartButton>
        </div>
      </Container>
    </Section>
  );
}
