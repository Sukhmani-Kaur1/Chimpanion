/**
 * Everything that changes by client market. Hours don't — a website takes the same effort to build
 * for Mumbai or Manchester. What changes is the money: rates, currency, tax treatment, the local
 * vendors we integrate, their prices, budget norms and the compliance work each market requires.
 *
 * Rates for US, UK and UAE position an India-based studio against local agencies: well below
 * their rates, well above freelance marketplaces. These are commercial decisions — set them here.
 * Third-party prices are estimates; check current vendor pricing before quoting.
 */
import type { BudgetBand, Discipline, Market } from "./types.ts";

type Range = [number, number];

export interface MarketSpec {
  id: Market;
  name: string;
  currency: string;
  /** Printed before amounts: "₹", "$", "£", "AED ". */
  prefix: string;
  locale: string;
  rates: Record<Discipline, number>;
  /** Fixed prices and ranges round to this step. */
  round: number;
  tax: { rate: number; label: string; note: string };
  invoicing: string;
  budgets: Record<Exclude<BudgetBand, "unknown">, { label: string; range: Range }>;
  /** Fixed-price thresholds for 2-, 3- and 4-milestone payment schedules. */
  paymentBands: [number, number];
  /** Above this, we propose phases even when budget and deadline allow everything. */
  phaseAbove: number;
  /** Extra weeks per design review round, from limited working-hours overlap with the team. */
  reviewLag: number;
  /** A second language here means Arabic, which needs a right-to-left layout. */
  rtl: boolean;
  compliance: { label: string; detail: string; hours: Partial<Record<Discipline, number>> };
  vendors: {
    payments: string;
    paymentFee: string;
    invoices: string;
    booking: string;
    crm: string;
    crmLite: string;
    whatsapp: string;
    accounting: string;
    shipping: string;
  };
  running: {
    hostingSite: Range;
    hostingPlatform: Range;
    hostingSaas: Range;
    shopify: Range;
    domainYear: Range;
    appleYear: number;
    googleOnce: number;
  };
  adSpend: Range;
  monthly: {
    seo: Range;
    paid: Range;
    intel: Range;
    whatsapp: Range;
    sms: Range;
    maps: Range;
    booking: Range;
    crm: Range;
    automation: Range;
  };
}

export const MARKETS: Record<Market, MarketSpec> = {
  IN: {
    id: "IN",
    name: "India",
    currency: "INR",
    prefix: "₹",
    locale: "en-IN",
    rates: { strategy: 1600, pm: 1400, design: 1400, engineering: 1800, qa: 1100, devops: 1600, content: 1000, growth: 1500, data: 1600 },
    round: 1000,
    tax: { rate: 0.18, label: "GST", note: "GST at 18% is added to each invoice." },
    invoicing: "Invoiced in INR.",
    budgets: {
      b1: { label: "Under ₹50K", range: [0, 50000] },
      b2: { label: "₹50K–1.5L", range: [50000, 150000] },
      b3: { label: "₹1.5–3L", range: [150000, 300000] },
      b4: { label: "₹3–5L", range: [300000, 500000] },
      b5: { label: "₹5–10L", range: [500000, 1000000] },
      b6: { label: "₹10L+", range: [1000000, Infinity] },
    },
    paymentBands: [100000, 500000],
    phaseAbove: 800000,
    reviewLag: 0,
    rtl: false,
    compliance: {
      label: "Privacy & consent — DPDP",
      detail: "Consent notice, privacy policy and data-request handling under India's DPDP rules",
      hours: { engineering: 2, content: 2 },
    },
    vendors: {
      payments: "Razorpay",
      paymentFee: "around 2% per transaction",
      invoices: "GST invoices",
      booking: "Calendly or Zoho Bookings",
      crm: "Zoho, HubSpot or Salesforce",
      crmLite: "Zoho or HubSpot CRM",
      whatsapp: "via a Meta partner (Interakt, WATI, AiSensy)",
      accounting: "Tally / Zoho Books",
      shipping: "Shiprocket / Delhivery",
    },
    running: {
      hostingSite: [300, 1500],
      hostingPlatform: [2500, 8000],
      hostingSaas: [6000, 20000],
      shopify: [2000, 6000],
      domainYear: [800, 1500],
      appleYear: 8500,
      googleOnce: 2100,
    },
    adSpend: [25000, 100000],
    monthly: {
      seo: [15000, 30000],
      paid: [15000, 30000],
      intel: [15000, 35000],
      whatsapp: [2500, 8000],
      sms: [500, 2000],
      maps: [0, 2000],
      booking: [0, 1200],
      crm: [0, 2500],
      automation: [0, 2000],
    },
  },

  US: {
    id: "US",
    name: "United States",
    currency: "USD",
    prefix: "$",
    locale: "en-US",
    rates: { strategy: 55, pm: 45, design: 48, engineering: 60, qa: 35, devops: 55, content: 45, growth: 50, data: 55 },
    round: 100,
    tax: {
      rate: 0,
      label: "Sales tax",
      note: "No Indian GST — this is an export of services. Confirm any local tax treatment with your accountant.",
    },
    invoicing: "Invoiced in USD; international transfer fees are paid by the sender.",
    budgets: {
      b1: { label: "Under $3K", range: [0, 3000] },
      b2: { label: "$3–8K", range: [3000, 8000] },
      b3: { label: "$8–15K", range: [8000, 15000] },
      b4: { label: "$15–30K", range: [15000, 30000] },
      b5: { label: "$30–60K", range: [30000, 60000] },
      b6: { label: "$60K+", range: [60000, Infinity] },
    },
    paymentBands: [4000, 20000],
    phaseAbove: 35000,
    reviewLag: 0.25,
    rtl: false,
    compliance: {
      label: "Accessibility & privacy — ADA / CCPA",
      detail: "WCAG 2.1 AA accessibility pass, privacy policy and opt-out handling",
      hours: { engineering: 3, qa: 4, content: 1 },
    },
    vendors: {
      payments: "Stripe",
      paymentFee: "about 2.9% + 30¢ per transaction",
      invoices: "invoices",
      booking: "Calendly or Acuity",
      crm: "HubSpot, Salesforce or Pipedrive",
      crmLite: "HubSpot or Pipedrive",
      whatsapp: "via Twilio or a Meta partner",
      accounting: "QuickBooks / Xero",
      shipping: "ShipStation / Shippo (USPS, UPS, FedEx)",
    },
    running: {
      hostingSite: [10, 30],
      hostingPlatform: [40, 150],
      hostingSaas: [100, 400],
      shopify: [39, 105],
      domainYear: [12, 25],
      appleYear: 99,
      googleOnce: 25,
    },
    adSpend: [1500, 5000],
    monthly: {
      seo: [800, 2000],
      paid: [800, 2000],
      intel: [800, 1800],
      whatsapp: [50, 200],
      sms: [20, 100],
      maps: [0, 100],
      booking: [0, 20],
      crm: [0, 50],
      automation: [0, 30],
    },
  },

  UK: {
    id: "UK",
    name: "United Kingdom",
    currency: "GBP",
    prefix: "£",
    locale: "en-GB",
    rates: { strategy: 44, pm: 36, design: 38, engineering: 48, qa: 28, devops: 44, content: 36, growth: 40, data: 44 },
    round: 100,
    tax: {
      rate: 0,
      label: "VAT",
      note: "No VAT charged — as an overseas supplier, VAT-registered clients account for it under the reverse charge.",
    },
    invoicing: "Invoiced in GBP.",
    budgets: {
      b1: { label: "Under £2.5K", range: [0, 2500] },
      b2: { label: "£2.5–6K", range: [2500, 6000] },
      b3: { label: "£6–12K", range: [6000, 12000] },
      b4: { label: "£12–25K", range: [12000, 25000] },
      b5: { label: "£25–50K", range: [25000, 50000] },
      b6: { label: "£50K+", range: [50000, Infinity] },
    },
    paymentBands: [3000, 16000],
    phaseAbove: 28000,
    reviewLag: 0.1,
    rtl: false,
    compliance: {
      label: "UK GDPR & cookie consent",
      detail: "Consent-based cookie banner, privacy notice, data-processing and subject-request setup",
      hours: { engineering: 3, content: 2, qa: 1 },
    },
    vendors: {
      payments: "Stripe",
      paymentFee: "about 1.5% + 20p per UK card",
      invoices: "VAT invoices",
      booking: "Calendly or Acuity",
      crm: "HubSpot, Salesforce or Pipedrive",
      crmLite: "HubSpot or Pipedrive",
      whatsapp: "via Twilio or a Meta partner",
      accounting: "Xero / QuickBooks (MTD-ready)",
      shipping: "Royal Mail / Evri / DPD via ShipStation",
    },
    running: {
      hostingSite: [5, 20],
      hostingPlatform: [30, 120],
      hostingSaas: [80, 300],
      shopify: [25, 65],
      domainYear: [10, 20],
      appleYear: 79,
      googleOnce: 20,
    },
    adSpend: [1000, 4000],
    monthly: {
      seo: [600, 1500],
      paid: [600, 1500],
      intel: [600, 1400],
      whatsapp: [40, 160],
      sms: [15, 80],
      maps: [0, 80],
      booking: [0, 15],
      crm: [0, 40],
      automation: [0, 25],
    },
  },

  AE: {
    id: "AE",
    name: "UAE",
    currency: "AED",
    prefix: "AED ",
    locale: "en-AE",
    rates: { strategy: 200, pm: 165, design: 175, engineering: 220, qa: 130, devops: 200, content: 160, growth: 185, data: 200 },
    round: 100,
    tax: {
      rate: 0,
      label: "VAT",
      note: "No Indian GST — this is an export of services. VAT-registered UAE clients account for 5% VAT under the reverse charge.",
    },
    invoicing: "Invoiced in AED, or USD on request.",
    budgets: {
      b1: { label: "Under AED 10K", range: [0, 10000] },
      b2: { label: "AED 10–25K", range: [10000, 25000] },
      b3: { label: "AED 25–50K", range: [25000, 50000] },
      b4: { label: "AED 50–100K", range: [50000, 100000] },
      b5: { label: "AED 100–200K", range: [100000, 200000] },
      b6: { label: "AED 200K+", range: [200000, Infinity] },
    },
    paymentBands: [15000, 75000],
    phaseAbove: 130000,
    reviewLag: 0,
    rtl: true,
    compliance: {
      label: "Privacy & consent — UAE PDPL",
      detail: "Consent capture, privacy notice and data-request handling under the UAE's PDPL",
      hours: { engineering: 2, content: 2 },
    },
    vendors: {
      payments: "Stripe, Telr or Network International",
      paymentFee: "around 2.5–3% per transaction",
      invoices: "VAT invoices",
      booking: "Calendly or Zoho Bookings",
      crm: "Zoho, HubSpot or Salesforce",
      crmLite: "Zoho or HubSpot CRM",
      whatsapp: "via a Meta partner (Twilio, 360dialog, WATI)",
      accounting: "Zoho Books / Xero (FTA VAT-ready)",
      shipping: "Aramex / Quiqup / Shipa",
    },
    running: {
      hostingSite: [20, 100],
      hostingPlatform: [150, 500],
      hostingSaas: [350, 1500],
      shopify: [140, 390],
      domainYear: [50, 150],
      appleYear: 365,
      googleOnce: 92,
    },
    adSpend: [5000, 20000],
    monthly: {
      seo: [3000, 7000],
      paid: [3000, 7000],
      intel: [3000, 6500],
      whatsapp: [300, 1200],
      sms: [100, 400],
      maps: [0, 300],
      booking: [0, 80],
      crm: [0, 200],
      automation: [0, 120],
    },
  },
};

export const MARKET_LIST: Market[] = ["IN", "US", "UK", "AE"];
