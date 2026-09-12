"use client";

import { cn } from "@/lib/cn";
import Typography from "../ui/Typography";

interface Base {
  label: string;
  hint?: string;
}

/** Shared shell: a labelled field inside a form group. */
const fieldWrap = "mb-[18px] min-w-0 border-0 p-0 m-0";
const inlineWrap = "flex items-center justify-between gap-4";

export const chipClass = (on: boolean) =>
  cn(
    "min-h-[38px] rounded-full border border-line bg-card px-[13px] py-2 text-sm font-semibold",
    "transition-[background-color,border-color,color] duration-100 hover:border-[#c4c4b8]",
    on && "border-dark bg-dark text-white hover:border-dark"
  );

export function Chips<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: Base & { options: [T, string][]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <fieldset className={fieldWrap}>
      <Typography variant="label" as="legend" className="mb-2 block p-0">
        {label}
      </Typography>
      {hint && (
        <Typography variant="caption" className="-mt-1 mb-2 leading-[1.45]">
          {hint}
        </Typography>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => {
          const on = value.includes(v);
          return (
            <button
              type="button"
              key={v}
              className={chipClass(on)}
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])}
            >
              {l}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Choice<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: Base & { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className={fieldWrap}>
      <Typography variant="label" as="legend" className="mb-2 block p-0">
        {label}
      </Typography>
      {hint && (
        <Typography variant="caption" className="-mt-1 mb-2 leading-[1.45]">
          {hint}
        </Typography>
      )}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map(([v, l]) => (
          <button
            type="button"
            key={v}
            role="radio"
            aria-checked={value === v}
            className={chipClass(value === v)}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: Base & { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const step =
    "h-[38px] w-10 border-0 bg-card text-lg font-bold disabled:cursor-default disabled:text-[#c8c8be]";
  return (
    <div className={cn(fieldWrap, inlineWrap)}>
      <div>
        <Typography variant="label" as="div">
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" className="leading-[1.45]">
            {hint}
          </Typography>
        )}
      </div>
      <div className="inline-flex flex-none items-center overflow-hidden rounded-full border border-line bg-card">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className={step}
        >
          −
        </button>
        <output aria-live="polite" className="min-w-9 text-center font-mono font-bold tabular-nums">
          {value}
        </output>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className={step}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: Base & { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={cn(fieldWrap, inlineWrap, "cursor-pointer")}>
      <span>
        <Typography variant="label" as="span" className="block">
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" as="span" className="block leading-[1.45]">
            {hint}
          </Typography>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          "relative m-0 h-[26px] w-11 flex-none cursor-pointer appearance-none rounded-full bg-[#d9d9cf] transition-colors duration-150",
          "after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-white after:shadow-[0_1px_2px_rgba(0,0,0,0.2)] after:transition-transform after:duration-150 after:content-['']",
          "checked:bg-dark checked:after:translate-x-[18px]"
        )}
      />
    </label>
  );
}
