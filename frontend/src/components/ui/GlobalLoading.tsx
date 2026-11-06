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
  {
    container: string;
    outerTrack: string;
    innerInset: string;
    innerTrack: string;
    core: string;
  }
> = {
  sm: {
    container: "h-6 w-6",
    outerTrack: "border-[2px]",
    innerInset: "inset-[2.5px]",
    innerTrack: "border-[1.5px]",
    core: "h-1.5 w-1.5",
  },
  md: {
    container: "h-10 w-10",
    outerTrack: "border-[2.5px]",
    innerInset: "inset-[4.5px]",
    innerTrack: "border-[2px]",
    core: "h-2 w-2",
  },
  lg: {
    container: "h-16 w-16",
    outerTrack: "border-[3.5px]",
    innerInset: "inset-[7px]",
    innerTrack: "border-[2.5px]",
    core: "h-2.5 w-2.5",
  },
  xl: {
    container: "h-20 w-20",
    outerTrack: "border-[4px]",
    innerInset: "inset-[9px]",
    innerTrack: "border-[3px]",
    core: "h-3.5 w-3.5",
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
      className={cn("relative flex items-center justify-center shrink-0", cfg.container, className)}
      role="status"
      aria-label="Loading"
    >
      {/* Outer track ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-slate-200/90 dark:border-slate-800/80",
          cfg.outerTrack,
        )}
      />
      {/* Outer sweeping active arc */}
      <div
        className={cn(
          "absolute inset-0 animate-spin rounded-full border-transparent border-t-slate-900 border-r-slate-900/40 dark:border-t-slate-100 dark:border-r-slate-100/40 [animation-duration:1s]",
          cfg.outerTrack,
        )}
      />

      {/* Inner concentric track ring */}
      <div
        className={cn(
          "absolute rounded-full border-slate-200/80 dark:border-slate-800/60",
          cfg.innerInset,
          cfg.innerTrack,
        )}
      />
      {/* Inner sweeping active arc */}
      <div
        className={cn(
          "absolute animate-[spin_1.5s_linear_infinite_reverse] rounded-full border-transparent border-b-slate-700 border-l-slate-400 dark:border-b-slate-200 dark:border-l-slate-400",
          cfg.innerInset,
          cfg.innerTrack,
        )}
      />

      {/* Center core dot */}
      <div className={cn("rounded-full bg-slate-900 dark:bg-slate-100 shadow-xs", cfg.core)} />
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
    size || (variant === "fullscreen" ? "lg" : variant === "card" ? "lg" : variant === "inline" ? "md" : "sm");

  if (variant === "minimal") {
    return (
      <div className={cn("inline-flex items-center gap-2 text-slate-600 dark:text-slate-300", className)}>
        <RoundArcSpinner size={effectiveSize} />
        {label ? <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span> : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex min-h-[8rem] w-full items-center justify-center p-4 text-center", className)}>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-sky-100/80 bg-white/70 px-5 py-3 shadow-[0_4px_20px_-8px_rgba(56,189,248,0.15)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
          <RoundArcSpinner size={effectiveSize} />
          {label ? <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span> : null}
        </div>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8fcff]/95 via-[#f0f8fd]/95 to-[#f4faff]/95 p-6 backdrop-blur-xl dark:from-[#030712]/95 dark:via-[#071526]/95 dark:to-[#030914]/95",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(56,189,248,0.14),transparent_65%),radial-gradient(ellipse_70%_50%_at_85%_65%,rgba(6,182,212,0.08),transparent_60%),radial-gradient(ellipse_65%_55%_at_15%_45%,rgba(14,165,233,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(14,165,233,0.12),transparent_65%),radial-gradient(ellipse_70%_50%_at_85%_65%,rgba(6,182,212,0.06),transparent_60%)]"
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <RoundArcSpinner size={effectiveSize} className="mx-auto" />
          <p className="mt-5 text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 select-none">
            {label}
          </p>
          {sublabel ? (
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 select-none">
              {sublabel}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[40vh] w-full flex-col items-center justify-center p-6 text-center", className)}>
      <RoundArcSpinner size={effectiveSize} className="mx-auto" />
      <p className="mt-5 text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 select-none">
        {label}
      </p>
      {sublabel ? (
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 select-none">
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
