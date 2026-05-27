import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Standalone ERP page chrome (for screens that do not use StandardPageLayout).
 */
export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <div className="erp-page">
      <header className="erp-page-header">
        <div className="min-w-0">
          <h1 className="erp-page-title">{title}</h1>
          {subtitle ? <p className="erp-page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
