import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import MediaPlanner from "@/components/media/MediaPlanner";
import { MARKETS } from "@/lib/pricing/markets";
import { site } from "@/lib/site";

const description =
  "Canopy is a one-off paid media plan for your business: which channels deserve your ad budget, how it splits across them, expected reach and cost per result, creative briefs, search themes and a launch schedule.";

export const metadata: Metadata = {
  // The name earns recognition; the descriptive half earns the search traffic.
  title: "Canopy — paid media plan",
  description,
  keywords: [
    "paid media plan",
    "media planning",
    "Google Ads budget allocation",
    "Meta ads strategy",
    "ad budget planner",
    "cost per lead benchmarks",
    "PPC plan for small business",
  ],
  alternates: { canonical: "/media-plan" },
  openGraph: {
    type: "website",
    url: `${site.url}/media-plan`,
    siteName: site.name,
    title: "Canopy — paid media plan by Chimpanion",
    description,
  },
  twitter: { card: "summary_large_image", title: "Canopy — paid media plan by Chimpanion", description },
};

/**
 * Priced in the home market. Visitors elsewhere see their own currency on the page itself, from
 * the detected market — structured data can only carry one figure, so it carries this one.
 */
const offer = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Canopy — paid media plan",
  serviceType: "Media planning",
  provider: { "@type": "Organization", name: site.name, url: site.url },
  description,
  offers: {
    "@type": "Offer",
    price: MARKETS.IN.mediaPlanPrice,
    priceCurrency: MARKETS.IN.currency,
    url: `${site.url}/media-plan`,
    availability: "https://schema.org/InStock",
  },
};

export default function MediaPlanPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <MediaPlanner />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offer) }} />
    </>
  );
}
