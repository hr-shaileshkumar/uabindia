"use client";

import { cn } from "@/lib/utils";
import { RoundArcSpinner, GlobalLoadingSize } from "@/components/ui/GlobalLoading";

type ArcLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

export function ArcLoader({ size = "md", label = "Loading", className }: ArcLoaderProps) {
  const mappedSize: GlobalLoadingSize = size === "lg" ? "lg" : size === "sm" ? "sm" : "md";
  return (
    <span
      className={cn("inline-flex items-center justify-center gap-2", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <RoundArcSpinner size={mappedSize} />
    </span>
  );
}
