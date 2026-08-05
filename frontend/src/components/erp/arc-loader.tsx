"use client";

import { cn } from "@/lib/utils";

type ArcLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const sizeClasses: Record<NonNullable<ArcLoaderProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function ArcLoader({ size = "md", label = "Loading", className }: ArcLoaderProps) {
  return (
    <span className={cn("relative inline-flex items-center justify-center", sizeClasses[size], className)} role="status" aria-live="polite" aria-label={label}>
      <span className="erp-arc-loader" aria-hidden="true" />
    </span>
  );
}
