import { faqs } from "@/lib/faq";
import { site } from "@/lib/site";

const services = [
  ["Product discovery & requirements", "Business discovery, requirements, market and competitor research, product roadmap"],
  ["UI/UX and brand design", "Interface design, prototyping, design systems and brand identity"],
  ["Web and software development", "Business websites, e-commerce, web applications, admin panels, CRMs and custom software"],
  ["Launch and deployment", "Cloud hosting, deployment, analytics, tracking and QA"],
  ["Growth marketing and SEO", "Search engine optimisation, paid media, landing pages and lead generation"],
  ["Market intelligence", "Competitor monitoring, pricing intelligence and custom data dashboards"],
];

export default function StructuredData() {
  const graph = [
    {
      "@type": "ProfessionalService",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      slogan: site.tagline,
      description:
        "Chimpanion is a business-building studio. One team for product discovery, design, web and software development, launch, growth marketing and market intelligence — for small and mid-sized businesses in India, the United States, the United Kingdom and the UAE.",
      email: site.email,
      telephone: `+${site.whatsapp}`,
      areaServed: ["India", "United States", "United Kingdom", "United Arab Emirates"].map((name) => ({ "@type": "Country", name })),
      address: { "@type": "PostalAddress", addressLocality: site.city, addressCountry: site.country },
      sameAs: [site.linkedin],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: services.map(([name, description]) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, description },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: "en-IN",
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      mainEntity: faqs.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
