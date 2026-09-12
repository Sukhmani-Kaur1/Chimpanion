import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales, so the custom steps added
 * in the @theme block have to be registered here — otherwise `rounded-field`
 * wouldn't replace `rounded-full` and both would end up on the element.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      tracking: [{ tracking: ["headline", "snug", "label", "kicker"] }],
      rounded: [{ rounded: ["field", "chip", "card", "panel", "surface", "hero"] }],
    },
  },
});

/**
 * Joins class names and lets later Tailwind classes win over earlier ones —
 * so a `className` prop can override a component's own variant classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
