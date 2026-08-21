"use client";

import { cn } from "@/lib/utils";

type PublicProductPreviewProps = {
  className?: string;
  compact?: boolean;
};

/** Abstract product UI preview — no fake metrics or customer names. */
export default function PublicProductPreview({ className, compact = false }: PublicProductPreviewProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <div className="ml-2 h-1.5 flex-1 max-w-[100px] rounded-full bg-slate-200" />
      </div>

      <div className={cn("flex", compact ? "min-h-[168px]" : "min-h-[240px]")}>
        <div className="hidden w-16 shrink-0 space-y-2.5 border-r border-slate-100 bg-slate-50/60 p-2.5 sm:block">
          <div className="h-7 rounded-md bg-slate-900/90" />
          {[70, 55, 62, 48].map((width, index) => (
            <div key={index} className="h-1.5 rounded-full bg-slate-200" style={{ width: `${width}%` }} />
          ))}
        </div>

        <div className={cn("min-w-0 flex-1 space-y-2.5", compact ? "p-3" : "p-4")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="h-2 w-20 rounded-full bg-slate-200" />
              <div className="mt-1.5 h-3 w-28 rounded-full bg-slate-300/80" />
            </div>
            <div className="h-7 w-16 rounded-md bg-slate-900" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["People", "Payroll", "Finance"].map((label) => (
              <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <div className="mt-1.5 h-2.5 w-10 rounded bg-slate-200" />
              </div>
            ))}
          </div>

          {!compact ? (
            <div className="rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/40 p-3">
              <div className="flex h-16 items-end gap-1">
                {[42, 58, 48, 72, 54, 78, 62].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-slate-800 to-slate-500/70"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-12 items-end gap-1 rounded-lg border border-slate-100 bg-slate-50/80 px-2 pb-2 pt-3">
              {[42, 58, 48, 72, 54, 68].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-sm bg-slate-700/80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
