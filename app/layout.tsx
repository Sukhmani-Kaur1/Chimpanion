import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { EstimatorProvider } from "@/components/EstimatorProvider";
import StructuredData from "@/components/StructuredData";
import { site } from "@/lib/site";

/**
 * The display face: a high-contrast editorial serif against Inter's plain running copy. Variable
 * on weight, so one file covers the 96px hero and a 16px card title.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  // The italic is loaded for one job: the accented word in the hero headline.
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

const description =
  "One team for web development, custom software, design, SEO and market intelligence — for businesses that need customers, not just a website.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Web development, custom software & growth — Chimpanion",
    template: "%s | Chimpanion",
  },
  description,
  keywords: [
    "web development",
    "website design for small business",
    "custom software development",
    "e-commerce development",
    "CRM and admin panel development",
    "SEO services",
    "lead generation",
    "competitor price monitoring",
    "digital product studio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    // One English page serving four markets.
    locale: "en_US",
    alternateLocale: ["en_IN", "en_GB", "en_AE"],
    url: site.url,
    siteName: site.name,
    title: "Chimpanion — Build. Launch. Grow.",
    description,
  },
  twitter: { card: "summary_large_image", title: "Chimpanion — Build. Launch. Grow.", description },
  // Social cards and icons come from app/opengraph-image.tsx, twitter-image.tsx and icon.tsx.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <a
          className="absolute top-0 -left-[9999px] z-100 rounded-br-lg bg-ink px-4 py-3 text-white focus:left-0 print:hidden"
          href="#main"
        >
          Skip to content
        </a>
        <EstimatorProvider>{children}</EstimatorProvider>
        <StructuredData />
      </body>
    </html>
  );
}
