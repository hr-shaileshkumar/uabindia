import type { ReactNode } from "react";
import ModuleIcon from "@/components/ModuleIcon";

type StandardPageLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
};

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
}: StandardPageLayoutProps) {
  return (
    <div className="erp-page space-y-5">
      {breadcrumb ? <div className="-mb-2">{breadcrumb}</div> : null}

      {/* SAP Fiori / ERPNext Enterprise Desk Header Card */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Track: Icon + Titles */}
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
              {meta ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div> : null}
            </div>
          </div>

          {/* Right Track: Action Buttons */}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              {actions}
            </div>
          ) : null}
        </div>
      </section>

      {/* Filter Toolbar Section */}
      {filters ? (
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          {filters}
        </section>
      ) : null}

      {/* Main Page Workspace */}
      <section className="min-w-0 space-y-4">{children}</section>

      {/* Pagination Footer */}
      {pagination ? <section className="pt-2">{pagination}</section> : null}
    </div>
  );
}
