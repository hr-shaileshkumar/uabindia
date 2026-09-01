import type { ReactNode } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { cn } from "@/lib/utils";

export type StandardPageLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  breadcrumb?: ReactNode;
  children?: ReactNode;
  pagination?: ReactNode;
  className?: string;
};

/**
 * Standard Workspace Page Layout
 * Unified page container for List, Hub, Form, and Workflow pages.
 */
export default function StandardPageLayout({
  title,
  subtitle,
  eyebrow,
  icon,
  meta,
  actions,
  filters,
  children,
  pagination,
  className,
}: StandardPageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {/* Page Header Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 sm:px-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          {/* Title block */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon && (
              <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <ModuleIcon name={icon} className="h-4.5 w-4.5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {/* Row 1: Title + Eyebrow Pill + Stats Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {title}
                </h1>
                {eyebrow && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {eyebrow}
                  </span>
                )}
                {meta && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {meta}
                  </div>
                )}
              </div>

              {/* Row 2: Subtitle */}
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions Bar */}
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </section>

      {/* Filters Section */}
      {filters && (
        <section className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {filters}
        </section>
      )}

      {/* Content Section */}
      {children && (
        <section className="min-w-0 space-y-4">
          {children}
        </section>
      )}

      {/* Pagination Section */}
      {pagination && <section>{pagination}</section>}
    </div>
  );
}
