import { cn } from "@/lib/cn";

/**
 * The site's circle motif, as a bubble: a shaded sphere with a specular highlight, a soft halo,
 * and rings rippling outward from it. Decorative only — it carries no meaning, so it's hidden from
 * assistive tech, and the reduced-motion rule in globals.css stops every part of it moving.
 *
 * Position and size come from `className`, the way the flat circles did.
 */
const tones = {
  /** Bright lime, for dark surfaces. */
  accent: {
    body: "bg-[radial-gradient(circle_at_32%_26%,#e2ffb2_0%,#c6f76b_38%,#a9e442_72%,#8cc22f_100%)]",
    halo: "bg-accent/25",
    ring: "border-accent/40",
    highlight: "bg-white/40",
  },
  /** Pale lime, for the off-white and white surfaces. */
  soft: {
    body: "bg-[radial-gradient(circle_at_32%_26%,#ffffff_0%,#f1fce0_40%,#e4f6c1_72%,#d2ec9c_100%)]",
    halo: "bg-soft/70",
    ring: "border-accent/30",
    highlight: "bg-white/70",
  },
} as const;

export default function Bubble({
  tone = "accent",
  rings = 3,
  className,
}: {
  tone?: keyof typeof tones;
  /** Set to 0 for a still bubble. */
  rings?: number;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute animate-float rounded-full", className)}>
      <span className={cn("absolute -inset-4 rounded-full blur-2xl", t.halo)} />

      {Array.from({ length: rings }, (_, i) => (
        <span
          key={i}
          className={cn("absolute inset-0 animate-ripple rounded-full border-2", t.ring)}
          // Evenly spaced through the 5s cycle, so a new ring leaves as the last one fades.
          style={{ animationDelay: `${(i * 5) / rings}s` }}
        />
      ))}

      <span
        className={cn(
          "absolute inset-0 rounded-full shadow-[inset_-14px_-18px_34px_rgba(0,0,0,0.16),inset_12px_14px_28px_rgba(255,255,255,0.45)]",
          t.body
        )}
      >
        <span
          className={cn("absolute top-[14%] left-[18%] h-[20%] w-[28%] -rotate-12 rounded-[50%] blur-[6px]", t.highlight)}
        />
      </span>
    </span>
  );
}
