import type { ReactNode } from "react";
import ModuleIcon from "@/components/ModuleIcon";

type StandardPageLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
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
  actions,
  filters,
  breadcrumb,
  children,
  pagination,
}: StandardPageLayoutProps) {
  return (
    <div className="erp-page space-y-4">
      {breadcrumb ? <div>{breadcrumb}</div> : null}

      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,249,253,0.96))] px-4 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(15,74,125,0.1),rgba(11,123,115,0.1))] text-[color:var(--erp-primary)] ring-1 ring-white/80">
                <ModuleIcon name={icon} className="h-5 w-5" />
              </span>
            ) : null}

            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-1 text-[1.85rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.1rem]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[0.92rem]">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm">
              {actions}
            </div>
          ) : null}
        </div>
      </section>

      {filters ? (
        <section className="rounded-[1.1rem] border border-slate-200/80 bg-white/95 p-3.5 shadow-[var(--erp-shadow-sm)] backdrop-blur-sm">
          {filters}
        </section>
      ) : null}

      <section className="min-w-0 space-y-4">{children}</section>

      {pagination ? <section className="erp-page-pagination">{pagination}</section> : null}
    </div>
  );
}
