import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "lime" | "dark" | "ghost";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 font-extrabold " +
  "transition-[transform,box-shadow,background-color,border-color] duration-150 hover:-translate-y-px " +
  "disabled:cursor-default disabled:opacity-45 disabled:hover:translate-y-0";

const byVariant: Record<ButtonVariant, string> = {
  lime: "bg-accent text-accent-ink",
  dark: "bg-dark text-white",
  ghost: "border border-line bg-card text-ink hover:border-ink",
};

const bySize: Record<ButtonSize, string> = {
  md: "min-h-[46px] px-[18px] py-3 text-sm",
  sm: "min-h-[38px] px-[14px] py-2 text-xs",
};

/** Button styling for elements that can't be a <Button> — links, submits inside forms. */
export function pillClass(variant: ButtonVariant = "lime", size: ButtonSize = "md", className?: string) {
  return cn(base, byVariant[variant], bySize[size], className);
}

export default function Button({
  variant = "lime",
  size = "md",
  className,
  type = "button",
  ...rest
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={pillClass(variant, size, className)} {...rest} />;
}
