import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import Typography from "./Typography";

/** The site's single content column: full-bleed background, measured content. */
export function Container({
  as: Tag = "div",
  className,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { as?: ElementType }) {
  return <Tag className={cn("mx-auto w-full max-w-site px-4 sm:px-[22px]", className)} {...rest} />;
}

/** Vertical rhythm between page sections — tighter on phones, generous on desktop. */
export function Section({
  as: Tag = "section",
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"section"> & { as?: ElementType }) {
  return (
    <Tag className={cn("py-13 sm:py-16 lg:py-24", className)} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Section eyebrow + heading on the left, supporting copy on the right —
 * stacked on phones, side by side once there's room.
 */
export function SectionHead({
  kicker,
  title,
  titleId,
  children,
  className,
}: {
  kicker: string;
  title: ReactNode;
  titleId?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-9 lg:mb-10",
        className
      )}
    >
      <div>
        <Typography variant="kicker">{kicker}</Typography>
        <Typography variant="h2" id={titleId} className="mt-2">
          {title}
        </Typography>
      </div>
      {children && (
        <Typography variant="bodySm" className="max-w-[480px]">
          {children}
        </Typography>
      )}
    </div>
  );
}

/** White card on the page background. */
export function Card({
  as: Tag = "div",
  className,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { as?: ElementType }) {
  return (
    <Tag
      className={cn(
        "rounded-panel border border-line bg-card p-[18px] sm:rounded-surface sm:p-[22px]",
        className
      )}
      {...rest}
    />
  );
}

const chipTones = {
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  crit: "bg-crit-bg text-crit",
  info: "bg-[#eceae0] text-muted",
  neutral: "bg-[#efeee6] text-ink",
} as const;

export type ChipTone = keyof typeof chipTones;

/** Status pill — one line of verdict next to a number. */
export function Chip({
  tone = "info",
  className,
  ...rest
}: ComponentPropsWithoutRef<"span"> & { tone?: ChipTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-[7px] text-xs leading-snug font-bold",
        chipTones[tone],
        className
      )}
      {...rest}
    />
  );
}

/** Compact badge for inside a row or table cell. */
export function Tag({
  tone = "neutral",
  className,
  ...rest
}: ComponentPropsWithoutRef<"span"> & { tone?: ChipTone }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-[10px] py-[3px] text-xs font-bold",
        chipTones[tone],
        className
      )}
      {...rest}
    />
  );
}

/** Text input / textarea styling. 16px minimum keeps iOS from zooming on focus. */
export const fieldClass =
  "w-full min-h-[46px] rounded-field border border-line bg-card px-[14px] py-[13px] " +
  "text-[16px] outline-none focus:border-ink";
