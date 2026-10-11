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
  breadcrumb,
  children,
  pagination,
  className,
}: StandardPageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:gap-3.5 w-full flex-1", className)}>
      {/* Optional In-Page Breadcrumb */}
      {breadcrumb && <div className="min-w-0">{breadcrumb}</div>}

      {/* Page Header Command Banner */}
      <section className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 sm:px-4.5 sm:py-3 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex flex-wrap items-center justify-between gap-2.5">
          {/* Title block */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {icon && (
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white text-blue-600 shadow-2xs dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-850 dark:text-blue-400">
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
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl truncate sm:overflow-visible">
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

      {/* Contextual Filters Section */}
      {filters && (
        <section className="rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
          {filters}
        </section>
      )}

      {/* Content Section */}
      {children && (
        <section className="min-w-0 space-y-3.5 sm:space-y-4">
          {children}
        </section>
      )}

      {/* Pagination Section */}
      {pagination && <section className="min-w-0">{pagination}</section>}
    </div>
  );
}
