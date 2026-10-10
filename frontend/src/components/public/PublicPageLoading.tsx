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
        "relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8fcff] via-[#f0f8fd] to-[#f4faff] px-4 dark:from-[#030712] dark:via-[#071526] dark:to-[#030914]",
        fullScreen ? "min-h-[100dvh] w-full" : "min-h-[40vh] py-16",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* ── Pristine Crystal Water Background & Caustic Refractions ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Sunlit shallow water surface caustics */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(56,189,248,0.14),transparent_65%),radial-gradient(ellipse_70%_50%_at_85%_65%,rgba(6,182,212,0.08),transparent_60%),radial-gradient(ellipse_65%_55%_at_15%_45%,rgba(14,165,233,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(14,165,233,0.12),transparent_65%),radial-gradient(ellipse_70%_50%_at_85%_65%,rgba(6,182,212,0.06),transparent_60%)]" />

        {/* Center liquid crystal focal clarity */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.85),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_48%,rgba(14,165,233,0.05),transparent_55%)]" />

        {/* Crystalline water ripple waves expanding softly behind spinner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4">
          <div className="h-44 w-44 rounded-full border border-sky-300/35 dark:border-sky-400/20 animate-[water-ripple_4.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-0 h-44 w-44 rounded-full border border-cyan-300/25 dark:border-cyan-400/15 animate-[water-ripple_4.5s_cubic-bezier(0,0,0.2,1)_infinite_1.5s]" />
          <div className="absolute inset-0 h-44 w-44 rounded-full border border-sky-200/20 dark:border-sky-400/10 animate-[water-ripple_4.5s_cubic-bezier(0,0,0.2,1)_infinite_3s]" />
        </div>
      </div>

      {/* ── Reference Image 2 Target Type: Frameless Concentric Spinner + Loading... ── */}
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
