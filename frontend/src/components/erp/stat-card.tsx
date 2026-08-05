import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";
import type { StatItem } from "@/lib/erp/types";
import { cn } from "@/lib/utils";

const toneClassMap = {
  default: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  positive: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
  warning: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
  critical: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50",
};

export function StatCard({ item }: { item: StatItem }) {
  const tone = item.tone || "default";
  const Icon = tone === "positive" ? ArrowUpRight : tone === "critical" ? ArrowDownRight : Minus;

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-all duration-200 hover:shadow-md group">
      {/* Top indicator bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 transition-all duration-200",
          tone === "positive" && "bg-emerald-500",
          tone === "warning" && "bg-amber-500",
          tone === "critical" && "bg-rose-500",
          tone === "default" && "bg-indigo-500"
        )}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {item.label}
        </p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {item.value}
        </p>
        {item.change ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              toneClassMap[tone]
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {item.change}
          </span>
        ) : null}
      </div>
    </article>
  );
}
