import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { StatItem } from "@/lib/erp/types";
import { cn } from "@/lib/utils";

const toneClassMap = {
  default: "text-slate-600",
  positive: "text-emerald-600",
  warning: "text-amber-600",
  critical: "text-rose-600",
};

export function StatCard({ item }: { item: StatItem }) {
  const tone = item.tone || "default";
  const Icon = tone === "positive" ? ArrowUpRight : tone === "critical" ? ArrowDownRight : Minus;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">{item.value}</p>
        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", toneClassMap[tone])}>
          <Icon className="h-3.5 w-3.5" />
          {item.change}
        </span>
      </div>
    </article>
  );
}
