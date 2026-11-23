"use client";

import { cn } from "@/lib/utils";

type PublicPageLoadingProps = {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
  className?: string;
};

export function PublicPageLoading({
  label = "Loading...",
  sublabel,
  fullScreen = true,
  className,
}: PublicPageLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden bg-[#f8fafc] text-slate-900 select-none dark:bg-slate-950 dark:text-slate-100",
        fullScreen
          ? "fixed inset-0 z-[9999] h-screen w-screen"
          : "relative min-h-[32vh] w-full py-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* ── Top Micro-Progress Stream (GitHub/Stripe/Vercel Style) ── */}
      {fullScreen && (
        <div className="fixed top-0 left-0 right-0 z-[10000] h-[2.5px] bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden">
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 shadow-[0_0_12px_rgba(56,189,248,0.8)] animate-[loading-progress_1.6s_easeInOut_infinite]" />
        </div>
      )}

      {/* ── Subtle Ambient Background Radial Light ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(37,99,235,0.06),transparent_65%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(37,99,235,0.14),transparent_65%)]" />
      </div>

      {/* ── Compact Floating Enterprise Loader Pill ── */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="group relative flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-3 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6)]">
          {/* Subtle Glowing Orbit Ring Loader (Compact 24px x 24px) */}
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-[2px] border-slate-200 dark:border-slate-800" />
            <span className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-blue-600 border-r-cyan-400 dark:border-t-cyan-400 dark:border-r-blue-500 animate-spin [animation-duration:0.9s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          </div>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* Compact Info Copy */}
          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
              {label}
            </span>
            <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{sublabel || "Enterprise Cloud"}</span>
            </span>
          </div>

          {/* Micro Card Accent Line */}
          <div className="absolute -bottom-[1px] left-4 right-4 h-[1.5px] rounded-full bg-gradient-to-r from-blue-600/0 via-blue-500/60 to-cyan-400/0 dark:via-cyan-400/70" />
        </div>
      </div>
    </div>
  );
}

export default PublicPageLoading;
