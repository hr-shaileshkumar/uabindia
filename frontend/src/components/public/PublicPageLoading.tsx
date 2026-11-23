"use client";

import { RoundArcSpinner } from "@/components/ui/GlobalLoading";
import { cn } from "@/lib/utils";

type PublicPageLoadingProps = {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
  className?: string;
};

export function PublicPageLoading({
  label = "Loading...",
  sublabel: _sublabel,
  fullScreen = true,
  className,
}: PublicPageLoadingProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-[#f8fafc] text-slate-900 px-4 dark:bg-slate-950 dark:text-slate-100",
        fullScreen ? "min-h-[100dvh] w-full" : "min-h-[40vh] py-16",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* ── Subtle Ambient Lighting Layer ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.08),transparent_50%)]" />

        {/* Ambient concentric ripples */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4">
          <div className="h-44 w-44 rounded-full border border-blue-400/20 dark:border-blue-400/15 animate-[water-ripple_4.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-0 h-44 w-44 rounded-full border border-cyan-400/15 dark:border-cyan-400/10 animate-[water-ripple_4.5s_cubic-bezier(0,0,0.2,1)_infinite_1.5s]" />
        </div>
      </div>

      {/* ── Spinner + Loading Label ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <RoundArcSpinner size="lg" className="mx-auto" />
        <p className="mt-5 text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 select-none">
          {label}
        </p>
      </div>
    </div>
  );
}

export default PublicPageLoading;
