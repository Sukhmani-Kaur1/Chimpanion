import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The single place text is styled.
 *
 * Sizes come from the fluid scale in app/globals.css — every step is a
 * clamp() between a 360px and a 1440px viewport, so type resizes smoothly on
 * every screen instead of stepping at breakpoints. That means a variant needs
 * no responsive font-size classes of its own, and none should be added here.
 *
 * The display face is a high-contrast serif, so these variants override the sans defaults it would
 * otherwise inherit: tracking sits near zero (negative tracking closes up a serif's joins) and the
 * big sizes get their own leading, because the scale's 0.94 would let Playfair's descenders collide
 * with the line below. Weight tops out at 700 — past that the contrast turns from classy to shouty.
 */
const variants = {
  /** Page-opening statement. One per page. */
  display: "font-display font-bold text-7xl tracking-[-0.015em] leading-[1.02] text-balance",
  /** Section opener. */
  h1: "font-display font-bold text-6xl tracking-[-0.015em] leading-[1.05] text-balance",
  h2: "font-display font-bold text-5xl tracking-[-0.01em] leading-[1.08] text-balance",
  h3: "font-display font-semibold text-2xl tracking-normal leading-[1.25]",
  h4: "font-display font-semibold text-xl tracking-normal",
  /** Card and form-group heading. */
  h5: "font-display font-semibold text-lg tracking-normal",
  /** Intro paragraph under a heading. */
  lead: "text-lg text-body",
  /** Default running copy. */
  body: "text-base text-body",
  /** Denser copy — cards, tables, list rows. */
  bodySm: "text-sm text-muted",
  /** Hints and metadata. */
  caption: "text-xs text-subtle",
  /** Fine print. */
  fine: "text-2xs text-subtle",
  /** Uppercase section eyebrow. */
  kicker: "text-2xs font-extrabold uppercase tracking-kicker text-subtle",
  /** Uppercase label above a value. */
  overline: "text-xs font-bold uppercase tracking-label text-faint",
  /** Form and control label. */
  label: "text-sm font-bold text-ink",
  /** Headline figure. */
  price: "font-mono font-bold tabular-nums text-4xl tracking-tight",
  /** Figure inside a card or sidebar. */
  priceSm: "font-mono font-bold tabular-nums text-2xl tracking-tight",
  /** Any number that should line up in a column. */
  mono: "font-mono tabular-nums",
} as const;

const tones = {
  ink: "text-ink",
  body: "text-body",
  muted: "text-muted",
  subtle: "text-subtle",
  faint: "text-faint",
  accent: "text-accent-ink",
  /** On a dark surface. */
  onDark: "text-white",
  onDarkMuted: "text-dark-muted",
  onDarkBody: "text-dark-text",
  good: "text-good",
  warn: "text-warn",
  crit: "text-crit",
  /** Take the colour of whatever contains it. */
  inherit: "text-inherit",
} as const;

export type TypographyVariant = keyof typeof variants;
export type TypographyTone = keyof typeof tones;

/** The tag each variant renders when `as` isn't given. */
const defaultTag: Record<TypographyVariant, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  lead: "p",
  body: "p",
  bodySm: "p",
  caption: "p",
  fine: "p",
  kicker: "div",
  overline: "div",
  label: "span",
  price: "div",
  priceSm: "div",
  mono: "span",
};

type OwnProps<T extends ElementType> = {
  as?: T;
  variant?: TypographyVariant;
  tone?: TypographyTone;
  className?: string;
  children?: ReactNode;
};

export type TypographyProps<T extends ElementType> = OwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof OwnProps<T>>;

export default function Typography<T extends ElementType = "p">({
  as,
  variant = "body",
  tone,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Tag = (as ?? defaultTag[variant]) as ElementType;
  return (
    <Tag className={cn(variants[variant], tone && tones[tone], className)} {...rest}>
      {children}
    </Tag>
  );
}

/** For the odd place that needs the classes without the element. */
export function typographyClass(
  variant: TypographyVariant,
  tone?: TypographyTone,
  className?: string
) {
  return cn(variants[variant], tone && tones[tone], className);
}
