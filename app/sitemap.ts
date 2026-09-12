import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Bump a page's date when its content actually changes. Stamping every URL with the build time
 * tells search engines everything changed on each deploy, and they learn to ignore lastmod.
 */
const PAGES: { path: string; updated: string; priority: number }[] = [
  { path: "", updated: "2026-09-11", priority: 1 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: `${site.url}${p.path}`,
    lastModified: new Date(p.updated),
    changeFrequency: "monthly",
    priority: p.priority,
  }));
}
