import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Ledger tables: numbers in a monospaced, right-aligned column so they line up,
 * and a horizontal scroller on narrow screens rather than a squeezed layout.
 */
export const tableClass = "w-full border-collapse text-sm";
export const thClass =
  "border-b border-line pr-2 pb-2 text-left text-xs font-bold uppercase tracking-label text-faint";
export const tdClass = "border-b border-line py-[9px] pr-2 align-top";
/** Add to any cell holding a figure. */
export const numClass = "text-right font-mono tabular-nums";

export function TableWrap({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("overflow-x-auto [-webkit-overflow-scrolling:touch] print:overflow-visible", className)}
      {...rest}
    />
  );
}

export function Th({ num, className, ...rest }: ComponentPropsWithoutRef<"th"> & { num?: boolean }) {
  return <th className={cn(thClass, num && numClass, className)} {...rest} />;
}

export function Td({ num, className, ...rest }: ComponentPropsWithoutRef<"td"> & { num?: boolean }) {
  return <td className={cn(tdClass, num && numClass, className)} {...rest} />;
}
