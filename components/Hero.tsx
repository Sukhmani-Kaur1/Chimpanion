import StartButton from "./StartButton";
import { pillClass } from "./ui/Button";
import Bubble from "./ui/Bubble";
import HeroOutcomes from "./HeroOutcomes";
import { Container } from "./ui/Layout";
import Typography from "./ui/Typography";

export default function Hero() {
  return (
    <Container
      as="section"
      className="grid items-stretch gap-8 pt-10 pb-14 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-16 lg:pb-20"
      aria-labelledby="hero-heading"
    >
      <div>
        <Typography variant="kicker" className="mb-4">
          DISCOVER → DESIGN → BUILD → LAUNCH → GROW
        </Typography>
        <Typography variant="display" id="hero-heading" className="mb-5">
          You paid for a website. What you wanted was{" "}
          {/* Playfair's italic is the one flourish in the whole page — spend it on the payoff word. */}
          <em className="italic">customers</em>.
        </Typography>
        <Typography variant="lead" className="max-w-[640px]">
          One team for the whole chain — web development, custom software, design, SEO and market
          intelligence.
          {/* Second sentence is trimmed on phones to keep the fold short. */}
          <span className="hidden sm:inline"> Most agencies do one link and hand you the rest.</span>
        </Typography>
        <div className="mt-6 flex flex-wrap gap-[9px] sm:gap-[11px]">
          <StartButton className="max-sm:flex-[1_1_100%]">Start a project →</StartButton>
          <a className={pillClass("ghost", "md", "max-sm:flex-[1_1_100%]")} href="#services">
            See what we build ↓
          </a>
        </div>
      </div>

      <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[24px] bg-dark p-6 text-white sm:rounded-hero sm:p-[30px] lg:min-h-[400px]">
        <Bubble className="-top-16 -right-16 size-[150px] sm:-top-24 sm:-right-24 sm:size-[200px]" />
        <div className="relative z-1 flex flex-1 flex-col gap-6">
          <div>
            <Typography variant="kicker" tone="onDarkMuted">
              WHAT CHANGES
            </Typography>
            <Typography variant="h2" as="p" className="mt-3 max-w-[420px] text-3xl">
              This is what you&apos;re actually buying.
            </Typography>
          </div>

          <HeroOutcomes />
        </div>
      </div>
    </Container>
  );
}
