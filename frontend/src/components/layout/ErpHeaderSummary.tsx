"use client";

type ErpHeaderSummaryItem = {
  label: string;
  value: string | number;
  tone?: "default" | "info" | "success" | "warning" | "danger";
};

const toneClassMap: Record<NonNullable<ErpHeaderSummaryItem["tone"]>, { badge: string; dot: string }> = {
  default: {
    badge: "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
  info: {
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-500",
  },
  success: {
    badge: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  warning: {
    badge: "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  danger: {
    badge: "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export default function ErpHeaderSummary({
  items,
}: {
  items: ErpHeaderSummaryItem[];
}) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const style = toneClassMap[item.tone || "default"];
        return (
          <div
            key={item.label}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${style.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className="uppercase tracking-wider text-[10px] opacity-75">{item.label}</span>
            <span className="text-xs font-bold font-mono leading-none">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
