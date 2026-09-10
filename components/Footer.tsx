import { site, waLink } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footin">
        <div className="footbrand">
          <b>CHIMPANION</b>
          <div className="footline">{site.tagline}</div>
        </div>
        <address className="footnav">
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            WhatsApp {site.whatsappDisplay}
          </a>
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </address>
      </div>
      <div className="wrap footbase">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>
          {site.city}, {site.areaServed}
        </span>
      </div>
    </footer>
  );
}
