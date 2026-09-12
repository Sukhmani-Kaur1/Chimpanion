import { Container, Section, SectionHead } from "./ui/Layout";
import Typography from "./ui/Typography";

const caps: [string, string][] = [
  ["Product", "Discovery · Requirements · Roadmaps"],
  ["Engineering", "Full-stack · Backend · APIs · Infrastructure"],
  ["Design", "UI/UX · Branding · Product design"],
  ["Data", "Pipelines · Market intelligence · Analytics"],
  ["Growth", "Media planning · Lead generation · SEO"],
  ["Sales", "Enablement · Qualification · Conversion"],
];

export default function Team() {
  return (
    <Section id="team" aria-labelledby="team-heading">
      <Container>
        <SectionHead kicker="THE TEAM" title="A full team, without six salaries." titleId="team-heading">
          On the stages you need, for the months you need them.
        </SectionHead>

        {/* Two up on phones, three on tablets, all six across on desktop. */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-6">
          {caps.map(([name, detail]) => (
            <div key={name} className="rounded-chip border border-line bg-card p-3.5 sm:rounded-card sm:p-[18px]">
              <Typography variant="h5" as="b" className="block text-base tracking-[-0.01em]">
                {name}
              </Typography>
              <Typography variant="caption" as="span" className="mt-1.5 block">
                {detail}
              </Typography>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
