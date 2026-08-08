"use client";

import React from "react";

export type GlobalLoadingVariant = "card" | "fullscreen" | "inline" | "minimal";
export type GlobalLoadingSize = "sm" | "md" | "lg" | "xl";

export interface GlobalLoadingProps {
  /** Optional loading text label */
  label?: string;
  /** Subtitle text shown below the main label (optional) */
  sublabel?: string;
  /** Layout mode: 'card' (default section loader), 'fullscreen' (route loading/overlay), 'inline' (table/panel), 'minimal' (topbar/compact) */
  variant?: GlobalLoadingVariant;
  /** Spinner size: 'sm', 'md', 'lg', 'xl' */
  size?: GlobalLoadingSize;
  /** Additional CSS class names for container */
  className?: string;
}

const sizeConfig: Record<
  GlobalLoadingSize,
  { container: string; outerArc: string; innerArc: string; core: string; text: string }
> = {
  sm: {
    container: "h-5 w-5",
    outerArc: "border-[2px]",
    innerArc: "border-[1.5px] inset-0.5",
    core: "h-1.5 w-1.5",
    text: "text-xs",
  },
  md: {
    container: "h-9 w-9",
    outerArc: "border-[2.5px]",
    innerArc: "border-[2px] inset-1",
    core: "h-2 w-2",
    text: "text-sm",
  },
  lg: {
    container: "h-16 w-16",
    outerArc: "border-[3px]",
    innerArc: "border-[2.5px] inset-2",
    core: "h-3 w-3",
    text: "text-sm sm:text-base",
  },
  xl: {
    container: "h-20 w-20",
    outerArc: "border-[3.5px]",
    innerArc: "border-[3px] inset-2.5",
    core: "h-4 w-4",
    text: "text-base sm:text-lg",
  },
};

/**
 * Standardized Round Arc Style Spinner component.
 * Features dual counter-rotating circular arcs with a glowing center pulse.
 */
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
      className={`relative flex items-center justify-center ${cfg.container} ${className}`}
      role="status"
      aria-label="Loading"
    >
      {/* Background Outer Ring Track */}
      <div className={`absolute inset-0 rounded-full border-slate-100/90 ${cfg.outerArc}`} />

      {/* Primary Outer Spinning Arc */}
      <div
        className={`absolute inset-0 animate-spin rounded-full border-transparent border-t-blue-600 border-r-blue-600 [animation-duration:0.85s] ${cfg.outerArc}`}
      />

      {/* Secondary Inner Counter-Spinning Arc */}
      <div
        className={`absolute animate-[spin_1.3s_linear_infinite_reverse] rounded-full border-transparent border-b-teal-500 border-l-teal-500 ${cfg.innerArc}`}
      />

      {/* Core Pulsing Center Accent */}
      <div
        className={`animate-pulse rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] ${cfg.core}`}
      />
    </div>
  );
}

/**
 * Universal Global Loading component for UabIndia ERP.
 * Use across all public pages, ERP modules, tables, modals, and route transitions.
 */
export function GlobalLoading({
  label = "Loading content...",
  sublabel,
  variant = "card",
  size,
  className = "",
}: GlobalLoadingProps) {
  // Determine appropriate size defaults per variant
  const effectiveSize = size || (variant === "fullscreen" ? "xl" : variant === "card" ? "lg" : variant === "inline" ? "md" : "sm");

  if (variant === "minimal") {
    return (
      <div className={`inline-flex items-center gap-2 text-slate-600 ${className}`}>
        <RoundArcSpinner size={effectiveSize} />
        {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex min-h-[8rem] w-full items-center justify-center p-4 text-center ${className}`}>
        <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-5 py-3 shadow-sm backdrop-blur-sm">
          <RoundArcSpinner size={effectiveSize} />
          {label && <span className="text-xs font-semibold text-slate-700 sm:text-sm">{label}</span>}
        </div>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-6 backdrop-blur-md transition-all duration-300 ${className}`}>
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white/95 px-8 py-8 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] backdrop-blur-md sm:px-12 sm:py-10">
          {/* Top Accent Gradient Bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

          {/* Round Arc Spinner */}
          <RoundArcSpinner size={effectiveSize} />

          {/* Text Labels */}
          <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
            <span className="text-base font-bold tracking-tight text-slate-800 sm:text-lg">
              {label}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              {sublabel || "Connecting to secure server..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default: 'card' mode
  return (
    <div className={`flex min-h-[40vh] w-full items-center justify-center p-6 transition-all duration-300 ${className}`}>
      <div className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white/95 px-8 py-7 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-10 sm:py-8">
        {/* Top Accent Gradient Bar */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

        {/* Round Arc Spinner */}
        <RoundArcSpinner size={effectiveSize} />

        {/* Text Labels */}
        <div className="mt-5 flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm font-semibold tracking-tight text-slate-800 sm:text-base">
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-[0.72rem] font-medium text-slate-400 sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            {sublabel || "Please wait a moment"}
          </span>
        </div>
      </div>
    </div>
  );
}
