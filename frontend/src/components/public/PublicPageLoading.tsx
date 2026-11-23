"use client";

import { DiagonalQuadLoader } from "@/components/ui/DiagonalQuadLoader";
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
        "flex flex-col items-center justify-center overflow-hidden bg-[#f8fafc] text-slate-900 select-none dark:bg-slate-950 dark:text-slate-100",
        fullScreen
          ? "fixed inset-0 z-[9999] m-0 p-0 h-full w-full min-h-screen"
          : "relative min-h-[32vh] w-full py-12",
        className,
      )}
      style={
        fullScreen
          ? {
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              width: "100%",
              height: "100%",
              minHeight: "100dvh",
            }
          : undefined
      }
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

      {/* ── Exact Geometric Center Floating Container (Top: Icon, Down: Loading...) ── */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="group relative flex flex-col items-center justify-center gap-3.5 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[10px] rounded-bl-[10px] border border-slate-200/90 bg-white/95 px-8 py-6 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)]">
          {/* Top: 4 Dynamic Small Rectangles (Rotating & Cycling Colors with Diagonal Rounded Corners) */}
          <div className="flex items-center justify-center">
            <DiagonalQuadLoader size="md" />
          </div>

          {/* Down: Loading... text only */}
          <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200 select-none text-center">
            {label}
          </span>

          {/* Micro Card Accent Line (Diagonal-cut glow) */}
          <div className="absolute -bottom-[1px] left-4 right-4 h-[1.5px] rounded-full bg-gradient-to-r from-blue-600/0 via-cyan-400/80 to-purple-600/0" />
        </div>
      </div>
    </div>
  );
}
