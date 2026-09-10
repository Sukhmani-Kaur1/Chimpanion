# Chimpanion

Marketing site for a business-building studio, with an interactive project planner that turns nine
questions into a costed range.

## Running it

```bash
npm install
npm run dev
```

## Structure

```
app/
  layout.tsx        fonts, metadata, structured data, estimator provider
  page.tsx          section composition
  globals.css       design tokens + all component styles
  sitemap.ts        generates /sitemap.xml
  robots.ts         generates /robots.txt
components/
  Nav / Hero / Services / ExampleAndTrust / Team / Faq / Contact / Footer
  StructuredData.tsx      JSON-LD: ProfessionalService, WebSite, FAQPage
  EstimatorProvider.tsx   client context so any CTA can open the planner
  StartButton.tsx         client CTA button
  Estimator.tsx           the planner (wizard + result screen)
lib/
  estimate.ts       the costing engine — pure, typed, no React
  steps.ts          the nine questions
  faq.ts            FAQ copy, shared by the section and the schema
  site.ts           contact details, domain, socials  ← REPLACE PLACEHOLDERS
```

## Before you go live

`lib/site.ts` holds placeholder contact details (`hello@chimpanion.in`, a dummy WhatsApp number, a
LinkedIn URL, and `https://chimpanion.in` as the domain). Replace all of them — they feed the
contact section, the footer, canonical URLs, Open Graph tags and the structured data.

## SEO

- Metadata, Open Graph and Twitter cards in `app/layout.tsx`; canonical set via `metadataBase`.
- JSON-LD for `ProfessionalService` (with a service catalogue), `WebSite` and `FAQPage`. The FAQ
  schema reads from `lib/faq.ts`, the same source the visible section uses, so the two can't drift.
- `sitemap.xml` and `robots.txt` are generated routes, not static files.
- One `h1`, section landmarks with `aria-labelledby`, and a skip link.

## Mobile copy length

Supplementary sentences carry `.desk-only` (block) or `.desk-only-i` (inline). They're hidden below
641px and shown above it, which trims roughly a fifth of the visible copy on phones while leaving
the full text in the DOM for crawlers.

## The costing engine

`lib/estimate.ts` is the only place pricing logic lives. It takes the answers object and returns
hours, line items, a range, a timeline and a budget-fit verdict.

It is bottom-up: each answer maps to hours, hours are multiplied by a per-discipline rate, and the
total is presented as a range rather than a single number. Everything is tunable in one place at the
top of the file — `RATE`, `PLATFORM_HRS`, `FEATURE_HRS`, `GROWTH_HRS`, `DATA_HRS`, `DESIGN_BASE`,
and `WEEKLY_THROUGHPUT`.

Two things it deliberately does *not* do:

- **The budget answer never changes the price.** It is only compared against the computed range to
  flag a mismatch. Quoting scope, then checking it against budget, is the whole positioning.
- **Recurring and third-party costs stay out of the total.** Hosting, ad spend and monitoring
  retainers are listed separately as "not included in this fee".

The `±%` range widens when the inputs that most affect scope (timeline, budget) are still undecided,
and narrows when they're pinned down.

## Notes

- The lead capture on the result screen is currently local-only — wire `onSend` in
  `components/Estimator.tsx` to a CRM or email endpoint before launch.
- Rates are set for the Indian SMB market in INR. Change `RATE` for other markets.
