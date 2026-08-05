"use client";

export interface StatCardItem {
  title: string;
  value: number | string;
  change?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  subtext?: string;
}

export interface StatsCardsProps {
  items: StatCardItem[];
}

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((stat, idx) => {
        let borderTone = "border-slate-200 dark:border-slate-800";
        let textTone = "text-slate-900 dark:text-slate-100";
        if (stat.tone === "success") {
          borderTone = "border-emerald-200/80 dark:border-emerald-900/50";
          textTone = "text-emerald-700 dark:text-emerald-300";
        } else if (stat.tone === "warning") {
          borderTone = "border-amber-200/80 dark:border-amber-900/50";
          textTone = "text-amber-700 dark:text-amber-300";
        } else if (stat.tone === "danger") {
          borderTone = "border-rose-200/80 dark:border-rose-900/50";
          textTone = "text-rose-700 dark:text-rose-300";
        } else if (stat.tone === "info") {
          borderTone = "border-indigo-200/80 dark:border-indigo-900/50";
          textTone = "text-indigo-700 dark:text-indigo-300";
        }

        return (
          <div
            key={`${stat.title}-${idx}`}
            className={`rounded-xl border ${borderTone} bg-white dark:bg-slate-900 p-4 shadow-2xs`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-bold tracking-tight ${textTone}`}>{stat.value}</span>
              {stat.change ? (
                <span className="text-xs font-medium text-slate-500">{stat.change}</span>
              ) : null}
            </div>
            {stat.subtext ? <p className="mt-1 text-xs text-slate-400">{stat.subtext}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
