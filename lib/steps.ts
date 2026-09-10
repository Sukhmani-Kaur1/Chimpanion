export type StepType = "single" | "multi" | "form";

export interface Step {
  key: string;
  title: string;
  hint: string;
  type: StepType;
  opts: [string, string, string][];
}

export const steps: Step[] = [
  {
    key: "timeline",
    title: "When does this need to be live?",
    hint: "The real deadline, not the aspirational one — it decides whether a rush premium applies.",
    type: "single",
    opts: [
      ["explore", "No fixed date", "Still validating the idea"],
      ["one", "1–2 months", "Rush delivery — premium applies"],
      ["three", "3–4 months", "Standard planned build"],
      ["six", "4–6 months", "Room to phase the work"],
      ["later", "6+ months", "Long-horizon roadmap"],
    ],
  },
  {
    key: "business",
    title: "What has to change in the business?",
    hint: "Every outcome that matters. This sets the scope of discovery, not just the build.",
    type: "multi",
    opts: [
      ["online", "Build a stronger online presence", "Website / digital storefront"],
      ["leads", "Get more qualified leads", "Acquisition + conversion"],
      ["sales", "Make sales easier", "Sales workflow / CRM"],
      ["operations", "Run the business better", "Internal tools / automation"],
      ["product", "Launch something new", "Software product / SaaS"],
      ["data", "Understand the market", "Research / competitor intelligence"],
    ],
  },
  {
    key: "type",
    title: "What are we actually building?",
    hint: "Combine as many as apply — each one adds its own build hours.",
    type: "multi",
    opts: [
      ["website", "Business website", "Information + enquiries"],
      ["store", "E-commerce", "Products + checkout"],
      ["webapp", "Web application", "Customers or staff log in"],
      ["app", "Mobile app", "iOS / Android"],
      ["saas", "SaaS / software product", "A new digital product"],
      ["internal", "Internal system", "Operations / CRM / dashboard"],
      ["growth", "Growth engine", "SEO / paid / lead generation"],
      ["data", "Data / intelligence", "Market + competitor data"],
    ],
  },
  {
    key: "current",
    title: "What already exists today?",
    hint: "Starting from zero adds discovery hours. Existing systems add integration hours.",
    type: "multi",
    opts: [
      ["nothing", "Starting from scratch", "No existing digital system"],
      ["site", "Existing website", "Needs improvement or expansion"],
      ["software", "Existing software", "Needs new features or a rebuild"],
      ["brand", "Brand already exists", "Visual identity is ready"],
      ["crm", "Existing CRM / tools", "Needs integration"],
      ["data", "Existing data", "Needs analysis or a new pipeline"],
    ],
  },
  {
    key: "features",
    title: "What does it need to do on day one?",
    hint: "Only what ships with v1. Anything else becomes phase two — no extra discovery cost today.",
    type: "multi",
    opts: [
      ["catalogue", "Catalogue / content", "Products, services or information"],
      ["accounts", "Customer accounts", "Login, profile, permissions"],
      ["payments", "Payments", "Checkout, subscriptions or deposits"],
      ["booking", "Bookings", "Appointments / consultations"],
      ["admin", "Admin panel", "Your team manages the system"],
      ["crm", "CRM / lead management", "Track enquiries and customers"],
      ["dashboard", "Dashboards", "Business reporting"],
      ["automation", "Automations", "Notifications and workflows"],
      ["custom", "Custom business workflow", "Your unique process"],
    ],
  },
  {
    key: "growth",
    title: "What happens the week after launch?",
    hint: "Each channel adds setup hours. Ongoing media spend is separate, and paid directly by you.",
    type: "multi",
    opts: [
      ["seo", "SEO", "Organic search"],
      ["paid", "Paid acquisition", "Google / Meta"],
      ["media", "Media planning", "Channel + campaign strategy"],
      ["leads", "Lead generation", "Capture + qualification"],
      ["sales", "Sales enablement", "Process + collateral"],
      ["analytics", "Analytics", "Measuring behaviour and conversion"],
      ["none", "We'll handle growth ourselves", "Already have a team"],
    ],
  },
  {
    key: "data",
    title: "Do you need to see what competitors are doing?",
    hint: "One-off research and always-on monitoring are priced differently.",
    type: "multi",
    opts: [
      ["research", "Competitor research", "One-time market view"],
      ["pricing", "Pricing intelligence", "Monitor public pricing"],
      ["products", "Product monitoring", "Catalogue / feature changes"],
      ["public", "Public-web data", "Structured data collection"],
      ["recurring", "Recurring monitoring", "Scheduled refresh, billed monthly"],
      ["dashboard", "Intelligence dashboard", "Visualise the data"],
      ["none", "Not needed", "Keep the project focused"],
    ],
  },
  {
    key: "design",
    title: "How much design effort does this deserve?",
    hint: "After the build itself, this is the biggest lever on cost.",
    type: "single",
    opts: [
      ["efficient", "Clean & efficient", "Professional, fast, and focused"],
      ["custom", "Distinctive & custom", "Designed around your brand"],
      ["premium", "Premium product experience", "Deep UX + custom interaction design"],
    ],
  },
  {
    key: "budget",
    title: "What are you planning around?",
    hint: "This won't change our number — it changes whether we flag a mismatch now instead of later.",
    type: "single",
    opts: [
      ["50", "Under ₹50K", "Small, focused work"],
      ["150", "₹50K–₹1.5L", "Lean digital build"],
      ["300", "₹1.5L–₹3L", "Business system"],
      ["500", "₹3L–₹5L", "Larger platform"],
      ["1000", "₹5L–₹10L", "Complex product"],
      ["more", "₹10L+", "Large / custom"],
      ["unknown", "Not sure yet", "Recommend a sensible path"],
    ],
  },
  {
    key: "contact",
    title: "Where should we send the breakdown?",
    hint: "Hours, rate, range and the reasoning. No call unless you want one.",
    type: "form",
    opts: [],
  },
];

export const optionLabels: Record<string, string> = Object.fromEntries(
  steps.flatMap((s) => s.opts).map((o) => [o[0], o[1]])
);
