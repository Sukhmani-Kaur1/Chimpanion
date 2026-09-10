"use client";

import { useEstimator } from "./EstimatorProvider";

export default function StartButton({
  children,
  variant = "lime",
}: {
  children: React.ReactNode;
  variant?: "lime" | "dark" | "ghost";
}) {
  const { open } = useEstimator();
  return (
    <button className={`pill ${variant}`} onClick={open}>
      {children}
    </button>
  );
}
