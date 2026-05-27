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
    <div className="erp-page">
      {breadcrumb ? <div className="erp-breadcrumb-nav mb-4">{breadcrumb}</div> : null}
      <section className="erp-page-header">
        <div className="erp-page-heading">
          {icon ? (
            <span className="erp-page-icon" aria-hidden>
              <ModuleIcon name={icon} className="h-5 w-5" />
            </span>
          ) : null}
          <div>
            {eyebrow ? <p className="erp-page-kicker">{eyebrow}</p> : null}
            <h1 className="erp-page-title">{title}</h1>
            {subtitle ? <p className="erp-page-subtitle">{subtitle}</p> : null}
          </div>
        </div>

        {actions ? <div className="erp-page-actions">{actions}</div> : null}
      </section>

      {filters ? <section className="erp-panel erp-panel-body">{filters}</section> : null}

      <section className="min-w-0 space-y-4">{children}</section>

      {pagination ? <section className="erp-page-pagination">{pagination}</section> : null}
    </div>
  );
}
