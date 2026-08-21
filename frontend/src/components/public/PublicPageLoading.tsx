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
  sublabel = "Please wait a moment",
  fullScreen = true,
  className,
}: PublicPageLoadingProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-[#f8fafc] px-4",
        fullScreen ? "min-h-[100dvh]" : "min-h-[40vh] py-16",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_0%,rgba(37,99,235,0.08),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_10%,rgba(15,23,42,0.04),transparent_50%)]"
      />

      <div className="relative w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white px-7 py-8 text-center shadow-[0_16px_48px_-20px_rgba(15,23,42,0.25)]">
        <img src="/logo.png" alt="" className="mx-auto mb-6 h-6 w-auto object-contain" />
        <RoundArcSpinner size="lg" className="mx-auto" />
        <p className="mt-5 text-sm font-semibold tracking-tight text-slate-900">{label}</p>
        <p className="mt-1.5 text-xs text-slate-500">{sublabel}</p>
        <div className="relative mx-auto mt-5 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-slate-100">
          <div className="absolute inset-y-0 left-0 rounded-full bg-slate-900 animate-[loading-progress_1.6s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default PublicPageLoading;
