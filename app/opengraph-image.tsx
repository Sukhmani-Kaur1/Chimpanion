import { OG_SIZE, OG_TYPE, ogCard } from "@/lib/og";

export const alt = "Chimpanion — you paid for a website. What you wanted was customers.";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogCard();
}
