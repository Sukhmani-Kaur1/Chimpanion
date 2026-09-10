import type { Metadata, Viewport } from "next";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { EstimatorProvider } from "@/components/EstimatorProvider";
import StructuredData from "@/components/StructuredData";
import { site } from "@/lib/site";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-archivo",
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
  "One team for web development, custom software, design, SEO and market intelligence — for Indian businesses that need customers, not just a website. Get a costed range in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Chimpanion — Web development, software and growth for Indian businesses",
    template: "%s | Chimpanion",
  },
  description,
  keywords: [
    "web development India",
    "website design for small business",
    "custom software development",
    "e-commerce development",
    "CRM and admin panel development",
    "SEO services India",
    "lead generation",
    "competitor price monitoring",
    "digital product studio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: "Chimpanion — Build. Launch. Grow.",
    description,
  },
  twitter: { card: "summary_large_image", title: "Chimpanion — Build. Launch. Grow.", description },
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
    <html lang="en-IN" className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <a className="skiplink" href="#main">
          Skip to content
        </a>
        <EstimatorProvider>{children}</EstimatorProvider>
        <StructuredData />
      </body>
    </html>
  );
}
