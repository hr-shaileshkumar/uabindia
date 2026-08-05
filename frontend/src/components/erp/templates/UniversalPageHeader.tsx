"use client";

import type { ReactNode } from "react";
import ModuleIcon from "@/components/ModuleIcon";

export interface HeaderStatItem {
  label: string;
  value: number | string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

export interface UniversalPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
  stats?: HeaderStatItem[];
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  extraMeta?: ReactNode;
}

export function UniversalPageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  stats = [],
  actions,
  breadcrumb,
  extraMeta,
}: UniversalPageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumb ? <div className="-mb-2">{breadcrumb}</div> : null}

      <section className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Track: Icon + Module Eyebrow + Titles */}
          <div className="flex min-w-0 items-start sm:items-center gap-3.5">
            {icon ? (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
                <ModuleIcon name={icon} className="h-5 w-5" />
              </span>
            ) : null}

            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-4xl">
                  {subtitle}
                </p>
              ) : null}

              {/* Statistics Badges Bar */}
              {stats.length > 0 || extraMeta ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {stats.map((stat, i) => {
                    let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                    if (stat.tone === "success") {
                      badgeStyle = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40";
                    } else if (stat.tone === "warning") {
                      badgeStyle = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40";
                    } else if (stat.tone === "danger") {
                      badgeStyle = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/40";
                    } else if (stat.tone === "info") {
                      badgeStyle = "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40";
                    }

                    return (
                      <div
                        key={`${stat.label}-${i}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}
                      >
                        <span className="text-[11px] font-medium opacity-80">{stat.label}:</span>
                        <span className="font-bold">{stat.value}</span>
                      </div>
                    );
                  })}
                  {extraMeta}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Track: Primary & Secondary Actions */}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              {actions}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
