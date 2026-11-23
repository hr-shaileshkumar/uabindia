"use client";

import React from "react";
import { DiagonalQuadLoader } from "@/components/ui/DiagonalQuadLoader";
import { cn } from "@/lib/utils";

export { DiagonalQuadLoader };

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
      <div className={cn("inline-flex items-center gap-2.5 text-slate-600 dark:text-slate-300 select-none", className)}>
        <DiagonalQuadLoader size="sm" />
        {label ? <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span> : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex min-h-[6rem] w-full items-center justify-center p-4 text-center select-none", className)}>
        <div className="inline-flex items-center gap-3.5 rounded-tl-[18px] rounded-br-[18px] rounded-tr-[8px] rounded-bl-[8px] border border-slate-200/90 bg-white/95 px-5 py-3 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <DiagonalQuadLoader size="sm" />
          {label ? <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span> : null}
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

        {/* Center Diagonal Rounded Card (Vertical: Top Icon, Down Loading...) */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[10px] rounded-bl-[10px] border border-slate-200/90 bg-white/95 px-7 py-5 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6)]">
          {/* Top: 4 Rotating Diagonal Rectangles with Dynamic Colors */}
          <DiagonalQuadLoader size="md" />

          {/* Down: Loading... text only */}
          <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200 select-none">
            {label}
          </span>

          <div className="absolute -bottom-[1px] left-4 right-4 h-[1.5px] rounded-full bg-gradient-to-r from-blue-600/0 via-cyan-400/80 to-purple-600/0" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[30vh] w-full flex-col items-center justify-center p-6 text-center select-none", className)}>
      <div className="relative flex flex-col items-center justify-center gap-3 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[10px] rounded-bl-[10px] border border-slate-200/90 bg-white/95 px-7 py-5 shadow-xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90">
        <DiagonalQuadLoader size="lg" className="mx-auto" />
        <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200">
          {label}
        </span>
      </div>
    </div>
  );
}
