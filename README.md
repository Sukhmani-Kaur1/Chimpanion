# Chimpanion

Marketing site for a business-building studio, plus a password-protected admin area holding the
cost planner: fixed price, range, timeline, phase plan, payment schedule and year-one running costs,
all traceable to hours × rate. The public site keeps the nine-question "Start a project" pop-up for
lead capture; the detailed planner is internal.

## Running it

```bash
npm install
npm run dev
npm test        # pricing engine — node's built-in runner, no extra dependencies
```

## Structure

```
app/
  layout.tsx        fonts, metadata, structured data, estimator provider
  page.tsx          section composition
  globals.css       design tokens + all component styles
  admin/            internal, password-protected, never indexed
    page.tsx          dashboard + reference prices
    planner/          the full cost planner (use this in meetings)
    login/            sign-in form
  api/admin/        login / logout routes
  api/geo/          the visitor's country from the hosting edge (nothing stored)
  sitemap.ts        generates /sitemap.xml
  robots.ts         generates /robots.txt
proxy.ts            guards every /admin route
components/
  Nav / Hero / Services / ExampleAndTrust / Team / Faq / Contact / Footer
  StructuredData.tsx      JSON-LD: ProfessionalService, WebSite, FAQPage
  EstimatorProvider.tsx   client context so any CTA can open the quick wizard
  StartButton.tsx         client CTA button
  Estimator.tsx           the nine-question wizard for site visitors
  planner/                the full planner: scope form, summary, proposal sections
lib/
  pricing/          the costing engine — pure TypeScript, no React
    ratecard.ts       EVERY tunable number: rates, hours, risk, capacity, policies
    scope.ts          inputs: defaults, validation, share-link encoding
    packages.ts       scope → work packages (what the client pays for)
    estimate.ts       costing, timeline, rush, phasing, budget, payments, running costs
    checks.ts         things a consultant would raise, each with its price impact
    notes.ts          assumptions and exclusions written from the scope
    benchmarks.ts     reference projects — test fixtures and the FAQ's prices
    estimate.test.ts  33 tests, including property checks over 400 random scopes
  steps.ts          the wizard's nine questions
  faq.ts            FAQ copy — prices generated from the benchmarks
  site.ts           contact details, domain, socials  ← REPLACE PLACEHOLDERS
```

## The admin area

`/admin` is internal: the cost planner, a dashboard and reference prices. It's behind a password,
excluded from the sitemap, disallowed in `robots.txt` and marked `noindex`.

Set both variables — without them the admin area stays locked:

```bash
ADMIN_PASSWORD=something-long
ADMIN_SECRET=$(openssl rand -hex 32)   # signs the session cookie
```

`.env.local` holds throwaway development values; set real ones in your host's environment settings.
The password never reaches the browser, the session cookie is HttpOnly, signed and expires after 12
hours, and wrong guesses are slowed down. It's a single shared password — fine for a small team, but
if you need per-person logins or an audit trail, that wants a real auth provider.

One caveat: the public pop-up uses the same pricing engine, so the rate card still ships in the
public JavaScript bundle. Anyone determined can read it. That was already true and is consistent
with the site's "here's the math" positioning — but if rates should be private, the pop-up has to
stop pricing client-side.

## Before you go live

`lib/site.ts` holds the contact details. The email and domain are real (`hello@chimpanion.com`,
`https://chimpanion.com`); the WhatsApp number and LinkedIn URL are still placeholders. Replace
them — they feed the contact section, the footer, canonical URLs, Open Graph tags and the
structured data.

## SEO

- Metadata, Open Graph and Twitter cards in `app/layout.tsx`; canonical set via `metadataBase`.
- JSON-LD for `ProfessionalService` (with a service catalogue), `WebSite` and `FAQPage`. The FAQ
  schema reads from `lib/faq.ts`, the same source the visible section uses, so the two can't drift.
- `sitemap.xml` and `robots.txt` are generated routes, not static files.
- One `h1`, section landmarks with `aria-labelledby`, and a skip link.
- The social share card (`app/opengraph-image.tsx`) and the favicons (`app/icon.tsx`,
  `app/apple-icon.tsx`) are drawn at build time from `lib/og.tsx` — no binary assets to keep in
  step with the brand. Edit the colours there if the palette changes.
- Title and description are kept inside what search results actually show (~60 and ~155
  characters); check both if you rewrite them.

Still to do, and it needs your accounts: verify the domain in Google Search Console, submit
`sitemap.xml`, and set up analytics. Ranking for anything competitive will also need pages beyond
this one — a page per service or per city is the usual next step.

## Mobile copy length

Supplementary sentences carry `.desk-only` (block) or `.desk-only-i` (inline). They're hidden below
641px and shown above it, which trims roughly a fifth of the visible copy on phones while leaving
the full text in the DOM for crawlers.

## The cost planner

Two front ends, one engine. The public "Start a project" pop-up asks nine questions and fills in
sensible defaults — it's lead capture, and it stays on the landing page. `/admin/planner` exposes
every cost driver for a meeting and is internal.

In a meeting: start from the closest preset, adjust as the client talks, apply or dismiss the
"Worth raising" checks, then **Print / save PDF** for a proposal handout (name, reference, date and
30-day validity in the header) or **Copy link** to send the exact estimate. Share links encode the
scope in the URL hash; client name and business are never put in the link.

### How a number is built

1. **Scope → work packages.** Each package is something the client can point at — "Website — 6
   pages", "WhatsApp Business API" — with hours per discipline, a risk class and a priority.
   Shared work is built once: the platform foundation (logins, database, admin shell) is one
   package however many platforms use it, and a store already includes its catalogue and payments.
2. **Simplest thing that works.** Without a custom platform, bookings become an embedded Calendly,
   CRM becomes forms into Zoho, a small standard store defaults to Shopify. The planner shows what
   the alternative would cost either way.
3. **Hours × rate**, plus 10% project management, per package.
4. **Risk.** Each package has an asymmetric range (overruns are likelier than underruns). The fixed
   price adds a risk buffer priced to roughly the 70th percentile, visible as its own line.
5. **Timeline** is phased — discovery, design with review rounds, build overlapping design, test and
   launch — with team capacity ramping smoothly as the work grows, so more scope never means less time.
6. **Deadlines.** A rush premium applies only when the work genuinely needs compressing, and scales
   with how much. Past 30% compression we don't sell a rush — we flag it and phase the work.
7. **Budget** never changes the price. It's checked against the fixed price: under it, tight (with
   the one removal that fixes it), or over (with a Phase 1 that fits).

### Markets — India, US, UK, UAE

The hours for a piece of work are the same wherever the client is. Everything priced in money lives
in `lib/pricing/markets.ts`, one entry per market:

| | India | United States | United Kingdom | UAE |
|---|---|---|---|---|
| Currency, rounding | ₹, nearest ₹1,000 | $, nearest $100 | £, nearest £100 | AED, nearest 100 |
| Tax on our invoice | GST 18% | none — export of services | none — client reverse-charges VAT | none — client reverse-charges 5% VAT |
| Payments / accounting / shipping | Razorpay · Tally · Shiprocket | Stripe · QuickBooks · ShipStation | Stripe · Xero · Royal Mail | Telr/Stripe · Zoho Books · Aramex |
| Compliance package | DPDP consent | ADA accessibility + CCPA | UK GDPR + cookie consent | UAE PDPL |
| Market-specific effort | — | +¼ week per review round (time zones) | small review lag | Arabic right-to-left layout for a second language |

Budget tiers, payment-schedule thresholds, the size at which we suggest phasing, third-party prices
and ad-spend norms are all per market too. US, UK and UAE rates position an India-based studio
below local agencies and above freelance marketplaces — they are commercial choices, so set them.
The tax notes assume an Indian entity exporting services under LUT; confirm with your CA.

**Detection.** The visitor's market is guessed without a location prompt: the country the hosting
edge reports for their IP (`/api/geo` reads Vercel, Cloudflare or CloudFront headers — nothing is
stored), then their device time zone, then browser language. Anywhere else sees US dollars.

The public pop-up has no currency control — it detects and shows the result, so visitors are never
asked. The admin planner does have a switcher, because pricing a client abroad is a deliberate act;
that choice is remembered for the admin only and never affects what visitors see. A shared link
keeps the market it was created in.

### Calibrating it

Every number lives in `lib/pricing/ratecard.ts`. To calibrate against reality, take three or four
finished projects, enter their scope in the planner, and compare hours to what you actually logged.
Adjust the hour tables, not the rates, unless your rates themselves changed. Then run `npm test`: the
reference-project bands in `estimate.test.ts` will tell you if a change pushed anything out of a
sensible range, and the FAQ's prices update themselves on the next build.

Deliberately not in the planner: internal cost rates or margin. Anything in the page's JavaScript is
public, so margin analysis belongs in a private spreadsheet.

## Notes

- The lead capture on the result screen is currently local-only — wire `onSend` in
  `components/Estimator.tsx` to a CRM or email endpoint before launch.
- Rates are set for the Indian SMB market in INR. Change `RATES` in `lib/pricing/ratecard.ts` for
  other markets.
- Third-party prices (Shopify plans, WhatsApp API, app-store fees) are estimates — check them
  against current vendor pricing before quoting.
