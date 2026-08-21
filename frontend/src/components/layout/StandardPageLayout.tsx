import type { ReactNode } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { cn } from "@/lib/utils";

type StandardPageLayoutProps = {
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
 * Canonical ERP page chrome.
 * Title only — no eyebrow, subtitle, or breadcrumb (those duplicate the sidebar).
 * Header right: Refresh / Actions / Columns / New last. Filter bar is compact. Content is the table/hub.
 * All modules including Platform, Integrations, and Security use this layout. `PlatformGlobalPageShell` is only an adapter.
 */
export default function StandardPageLayout({
  title,
  icon,
  meta,
  actions,
  filters,
  children,
  pagination,
  className,
}: StandardPageLayoutProps) {
  return (
    <div className={cn("erp-page", className)}>
      <section className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon ? (
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <ModuleIcon name={icon} className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
              {meta ? <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div> : null}
        </div>
      </section>

      {filters ? (
        <section className="rounded-lg border border-slate-200 bg-white px-3 py-2">{filters}</section>
      ) : null}

      {children ? <section className="min-w-0 space-y-3">{children}</section> : null}

      {pagination ? <section>{pagination}</section> : null}
    </div>
  );
}
