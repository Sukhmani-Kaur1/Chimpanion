/**
 * The hero's argument in concrete form: what a business looks like today, and what it looks like
 * once the work is done. Written per trade, because "we build software" means nothing until you
 * see your own Tuesday in it.
 *
 * Every pair is an operational change we can actually deliver — no numbers, no promised uplift.
 */
export interface Outcome {
  id: string;
  label: string;
  /** Each pair is [what happens today, what happens instead]. */
  pairs: [today: string, then: string][];
}

export const outcomes: Outcome[] = [
  {
    id: "suppliers",
    label: "Suppliers",
    pairs: [
      ["Buyers find you only by word of mouth", "Retailers find you, and see what you stock"],
      ["Rate lists sent as WhatsApp screenshots", "A catalogue that always shows today's rates"],
      ["Orders re-typed from calls into a book", "Orders placed and confirmed in writing"],
    ],
  },
  {
    id: "manufacturer",
    label: "Manufacturer",
    pairs: [
      ["Buyers wait for a catalogue PDF by email", "A catalogue buyers search themselves"],
      ["Enquiries lost between sales and the floor", "Every enquiry tracked to a quote and a job"],
      ["Production status lives in someone's head", "Job status the whole team can see"],
    ],
  },
  {
    id: "store",
    label: "Retail store",
    pairs: [
      ["Walk-ins, and a page on someone's marketplace", "Your own store, your customers, your data"],
      ["Stock counted twice, online and in shop", "One stock count behind both"],
      ["No way to bring a buyer back", "Repeat buyers reached without paying for them twice"],
    ],
  },
  {
    id: "services",
    label: "Service business",
    pairs: [
      ["Leads sit in an inbox until they go cold", "Every lead followed up the same day"],
      ["Quotes rebuilt from scratch every time", "Quotes from templates, out in minutes"],
      ["No idea which ads actually pay", "Spend traced to the jobs it won"],
    ],
  },
];
