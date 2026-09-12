"use client";

import Button, { type ButtonVariant } from "./ui/Button";
import { useEstimator } from "./EstimatorProvider";

export default function StartButton({
  children,
  variant = "lime",
  className,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { open } = useEstimator();
  return (
    <Button variant={variant} className={className} onClick={open}>
      {children}
    </Button>
  );
}
