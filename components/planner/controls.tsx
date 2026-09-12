"use client";

interface Base {
  label: string;
  hint?: string;
}

export function Chips<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: Base & { options: [T, string][]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <fieldset className="pf">
      <legend className="pf-label">{label}</legend>
      {hint && <p className="pf-hint">{hint}</p>}
      <div className="pchips">
        {options.map(([v, l]) => {
          const on = value.includes(v);
          return (
            <button
              type="button"
              key={v}
              className={`pchip${on ? " on" : ""}`}
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
    <fieldset className="pf">
      <legend className="pf-label">{label}</legend>
      {hint && <p className="pf-hint">{hint}</p>}
      <div className="pchips" role="radiogroup" aria-label={label}>
        {options.map(([v, l]) => (
          <button
            type="button"
            key={v}
            role="radio"
            aria-checked={value === v}
            className={`pchip${value === v ? " on" : ""}`}
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
  return (
    <div className="pf pf-inline">
      <div>
        <div className="pf-label">{label}</div>
        {hint && <p className="pf-hint">{hint}</p>}
      </div>
      <div className="stepper">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: Base & { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="pf pf-inline ptoggle">
      <span>
        <span className="pf-label">{label}</span>
        {hint && <span className="pf-hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
