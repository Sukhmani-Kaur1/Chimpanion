/**
 * Which market a visitor is probably pricing for — without a location prompt. Signals, strongest
 * first: the country their hosting edge reports for their IP, their device's time zone, then
 * their browser languages. Visitors from anywhere else see US dollars.
 */
import type { Market } from "./types.ts";

const COUNTRY: Record<string, Market> = { IN: "IN", US: "US", GB: "UK", AE: "AE" };

const UK_ZONES = ["Europe/London", "Europe/Belfast", "Europe/Guernsey", "Europe/Isle_of_Man", "Europe/Jersey"];

export function marketFromCountry(code?: string | null): Market | null {
  return (code && COUNTRY[code.toUpperCase()]) || null;
}

export function marketFromTimeZone(tz?: string | null): Market | null {
  if (!tz) return null;
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
  if (tz === "Asia/Dubai") return "AE";
  if (UK_ZONES.includes(tz)) return "UK";
  if (tz.startsWith("America/") || tz.startsWith("US/") || tz === "Pacific/Honolulu") return "US";
  return null;
}

export function marketFromLanguage(lang?: string | null): Market | null {
  if (!lang) return null;
  const [base, region] = lang.split("-");
  if (region?.toUpperCase() === "IN" || base === "hi") return "IN";
  if (region?.toUpperCase() === "GB") return "UK";
  if (region?.toUpperCase() === "AE") return "AE";
  if (region?.toUpperCase() === "US") return "US";
  return null;
}

export function detectMarket(signals: {
  country?: string | null;
  timeZone?: string | null;
  languages?: readonly string[];
}): Market {
  return (
    marketFromCountry(signals.country) ??
    marketFromTimeZone(signals.timeZone) ??
    signals.languages?.map(marketFromLanguage).find((m): m is Market => m !== null) ??
    "US"
  );
}
