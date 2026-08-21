"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type GlobalLoadingVariant = "card" | "fullscreen" | "inline" | "minimal";
export type GlobalLoadingSize = "sm" | "md" | "lg" | "xl";

export interface GlobalLoadingProps {
  label?: string;
  sublabel?: string;
  variant?: GlobalLoadingVariant;
  size?: GlobalLoadingSize;
  className?: string;
}

const sizeConfig: Record<
  GlobalLoadingSize,
  { container: string; outerArc: string; innerArc: string; core: string }
> = {
  sm: {
    container: "h-5 w-5",
    outerArc: "border-[2px]",
    innerArc: "border-[1.5px] inset-0.5",
    core: "h-1.5 w-1.5",
  },
  md: {
    container: "h-9 w-9",
    outerArc: "border-[2.5px]",
    innerArc: "border-[2px] inset-1",
    core: "h-2 w-2",
  },
  lg: {
    container: "h-14 w-14",
    outerArc: "border-[3px]",
    innerArc: "border-[2.5px] inset-2",
    core: "h-2.5 w-2.5",
  },
  xl: {
    container: "h-16 w-16",
    outerArc: "border-[3px]",
    innerArc: "border-[2.5px] inset-2",
    core: "h-3 w-3",
  },
};

export function RoundArcSpinner({
  size = "md",
  className = "",
}: {
  size?: GlobalLoadingSize;
  className?: string;
}) {
  const cfg = sizeConfig[size];

  return (
    <div
      className={cn("relative flex items-center justify-center", cfg.container, className)}
      role="status"
      aria-label="Loading"
    >
      <div className={cn("absolute inset-0 rounded-full border-slate-200", cfg.outerArc)} />
      <div
        className={cn(
          "absolute inset-0 animate-spin rounded-full border-transparent border-t-slate-900 border-r-slate-900/40 [animation-duration:0.9s]",
          cfg.outerArc,
        )}
      />
      <div
        className={cn(
          "absolute animate-[spin_1.35s_linear_infinite_reverse] rounded-full border-transparent border-b-slate-400 border-l-slate-300",
          cfg.innerArc,
        )}
      />
      <div className={cn("rounded-full bg-slate-900", cfg.core)} />
    </div>
  );
}

export function GlobalLoading({
  label = "Loading...",
  sublabel,
  variant = "card",
  size,
  className = "",
}: GlobalLoadingProps) {
  const effectiveSize =
    size || (variant === "fullscreen" ? "xl" : variant === "card" ? "lg" : variant === "inline" ? "md" : "sm");

  if (variant === "minimal") {
    return (
      <div className={cn("inline-flex items-center gap-2 text-slate-600", className)}>
        <RoundArcSpinner size={effectiveSize} />
        {label ? <span className="text-xs font-medium text-slate-700">{label}</span> : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex min-h-[8rem] w-full items-center justify-center p-4 text-center", className)}>
        <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <RoundArcSpinner size={effectiveSize} />
          {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
        </div>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-6 backdrop-blur-sm", className)}>
        <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-8 py-9 text-center shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]">
          <RoundArcSpinner size={effectiveSize} className="mx-auto" />
          <p className="mt-5 text-base font-semibold tracking-tight text-slate-900">{label}</p>
          <p className="mt-1.5 text-sm text-slate-500">{sublabel || "Please wait a moment"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[40vh] w-full items-center justify-center p-6", className)}>
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-8 py-8 text-center shadow-[0_12px_40px_-16px_rgba(15,23,42,0.18)]">
        <RoundArcSpinner size={effectiveSize} className="mx-auto" />
        <p className="mt-5 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{label}</p>
        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">{sublabel || "Please wait a moment"}</p>
      </div>
    </div>
  );
}
