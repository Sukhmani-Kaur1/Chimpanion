"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Estimator from "./Estimator";

interface EstimatorContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const EstimatorContext = createContext<EstimatorContextValue | null>(null);

export function useEstimator(): EstimatorContextValue {
  const ctx = useContext(EstimatorContext);
  if (!ctx) throw new Error("useEstimator must be used inside EstimatorProvider");
  return ctx;
}

export function EstimatorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <EstimatorContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && <Estimator onClose={close} />}
    </EstimatorContext.Provider>
  );
}
