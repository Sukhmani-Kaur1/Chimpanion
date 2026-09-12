import StartButton from "./StartButton";
import { Container } from "./ui/Layout";
import Typography from "./ui/Typography";

const links = [
  ["/#services", "Services"],
  ["/#team", "Team"],
  ["/#faq", "FAQ"],
  ["/#contact", "Contact"],
];

export default function Nav() {
  return (
    <nav
      className="sticky top-0 z-30 border-b border-black/[0.07] bg-bg/90 backdrop-blur-[14px] print:hidden"
      aria-label="Main"
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Typography
          as="a"
          variant="h4"
          href="/"
          aria-label="Chimpanion home"
          className="font-bold tracking-normal whitespace-nowrap"
        >
          CHIMPANION<b className="text-[#84aa10]">.</b>
        </Typography>

        {/* Below laptop width the links live in the page itself, not the bar. */}
        <div className="hidden gap-6 text-sm font-medium text-muted lg:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </div>

        <StartButton variant="dark">Start a project →</StartButton>
      </Container>
    </nav>
  );
}
