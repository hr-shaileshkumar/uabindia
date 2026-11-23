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
          "fixed inset-0 z-[9999] h-screen w-screen flex flex-col items-center justify-center overflow-hidden bg-[#f8fafc] dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100 select-none",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        {/* Top Micro-Progress Stream */}
        <div className="fixed top-0 left-0 right-0 z-[10000] h-[2.5px] bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden">
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 shadow-[0_0_12px_rgba(56,189,248,0.8)] animate-[loading-progress_1.6s_easeInOut_infinite]" />
        </div>

        {/* Ambient Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(37,99,235,0.06),transparent_65%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(37,99,235,0.14),transparent_65%)]"
        />

        {/* Compact Pill */}
        <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-3 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6)]">
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-[2px] border-slate-200 dark:border-slate-800" />
            <span className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-blue-600 border-r-cyan-400 dark:border-t-cyan-400 dark:border-r-blue-500 animate-spin [animation-duration:0.9s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
              {label}
            </span>
            <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{sublabel || "Enterprise Cloud"}</span>
            </span>
          </div>

          <div className="absolute -bottom-[1px] left-4 right-4 h-[1.5px] rounded-full bg-gradient-to-r from-blue-600/0 via-blue-500/60 to-cyan-400/0 dark:via-cyan-400/70" />
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
