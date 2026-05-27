import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
};

export default function AdminTableShell({ title, subtitle, badge, children }: Props) {
  return (
    <div className="erp-panel">
      <div className="erp-table-toolbar">
        <div>
          <div className="erp-table-title">{title}</div>
          {subtitle ? <div className="erp-table-subtitle">{subtitle}</div> : null}
        </div>
        {badge ? <span className="erp-toolbar-badge">{badge}</span> : null}
      </div>
      <div className="erp-table-wrap rounded-none border-0 shadow-none">{children}</div>
    </div>
  );
}
