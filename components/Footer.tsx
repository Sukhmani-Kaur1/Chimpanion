import { site, waLink } from "@/lib/site";
import { Container } from "./ui/Layout";
import Typography from "./ui/Typography";

export default function Footer() {
  return (
    <footer className="border-t border-line pt-11 pb-10 text-sm text-subtle print:hidden">
      <Container className="flex flex-wrap justify-between gap-x-7 gap-y-[18px]">
        <div>
          <Typography variant="h5" as="b" className="block text-ink">
            CHIMPANION
          </Typography>
          <Typography variant="bodySm" className="mt-1.5">
            {site.tagline}
          </Typography>
        </div>
        <address className="flex flex-wrap items-center gap-5 not-italic">
          <a className="transition-colors hover:text-ink" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <a className="transition-colors hover:text-ink" href={waLink} target="_blank" rel="noopener noreferrer">
            WhatsApp {site.whatsappDisplay}
          </a>
          <a className="transition-colors hover:text-ink" href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </address>
      </Container>
      <Container className="mt-7 flex flex-wrap justify-between gap-4 border-t border-line pt-5 text-xs sm:mt-9">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>
          {site.city}, {site.areaServed}
        </span>
      </Container>
    </footer>
  );
}
