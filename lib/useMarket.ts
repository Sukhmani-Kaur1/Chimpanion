"use client";

import { useCallback, useEffect, useState } from "react";
import { detectMarket } from "./pricing/detect";
import { MARKET_LIST } from "./pricing/markets";
import type { Market } from "./pricing/types";

const KEY = "chimpanion.market";

function stored(): Market | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return MARKET_LIST.includes(v as Market) ? (v as Market) : null;
  } catch {
    return null;
  }
}

/**
 * The visitor's market, guessed from the device time zone immediately and refined with the
 * edge-reported country when the host provides one.
 *
 * `remember` is for the admin planner only: there, picking a market is a deliberate act (pricing a
 * client abroad) and should stick. Public pages always detect, so an internal override never leaks
 * into what a visitor sees.
 */
export function useMarket(options: { remember?: boolean } = {}): {
  market: Market;
  setMarket: (m: Market) => void;
  ready: boolean;
} {
  const remember = options.remember ?? false;
  const [market, setState] = useState<Market>("IN");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const chosen = remember ? stored() : null;
    if (chosen) {
      setState(chosen);
      setReady(true);
      return;
    }
    const local = {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      languages: navigator.languages,
    };
    setState(detectMarket(local));
    setReady(true);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    fetch("/api/geo", { signal: ctrl.signal })
      .then((r) => r.json())
      .then(({ country }: { country: string | null }) => {
        if (country && !(remember && stored())) setState(detectMarket({ ...local, country }));
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => ctrl.abort();
  }, [remember]);

  const setMarket = useCallback(
    (m: Market) => {
      setState(m);
      if (!remember) return;
      try {
        window.localStorage.setItem(KEY, m);
      } catch {}
    },
    [remember]
  );

  return { market, setMarket, ready };
}
