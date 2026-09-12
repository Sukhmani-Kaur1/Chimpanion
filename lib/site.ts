/**
 * Single source of truth for contact details, domain and social profiles.
 * PLACEHOLDERS — replace these with the real ones before the site goes live.
 * They appear in the contact section, the footer, metadata and structured data.
 */
export const site = {
  name: "Chimpanion",
  tagline: "Build. Launch. Grow.",
  url: "https://chimpanion.com",
  email: "hello@chimpanion.com",
  /** International format, digits only — used to build the wa.me link. */
  whatsapp: "919000000000",
  whatsappDisplay: "+91 90000 00000",
  linkedin: "https://www.linkedin.com/company/chimpanion",
  city: "Bengaluru",
  country: "IN",
  areaServed: "India",
};

export const waLink = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
  "Hi Chimpanion — I'd like to talk about a project."
)}`;
