import type { ReactNode } from "react";

type CrudStatTone = "neutral" | "positive" | "warning" | "danger" | "info";

type CrudStat = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: CrudStatTone;
};

export function CrudStatStrip({ items }: { items: CrudStat[] }) {
  if (items.length === 0) return null;

  return (
    <div className="erp-crud-stat-strip">
      {items.map((item) => (
        <div key={item.label} className={`erp-crud-stat erp-crud-stat-${item.tone ?? "neutral"}`}>
          <p className="erp-crud-stat-label">{item.label}</p>
          <div className="erp-crud-stat-value">{item.value}</div>
          {item.helper ? <p className="erp-crud-stat-helper">{item.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function CrudHeaderStats({ items }: { items: CrudStat[] }) {
  if (items.length === 0) return null;

  return (
    <div className="erp-crud-header-stats">
      {items.map((item) => (
        <div key={item.label} className={`erp-crud-header-stat erp-crud-header-stat-${item.tone ?? "neutral"}`}>
          <span className="erp-crud-header-stat-label">{item.label}</span>
          <span className="erp-crud-header-stat-value">{item.value}</span>
          {item.helper ? <span className="erp-crud-header-stat-helper">{item.helper}</span> : null}
        </div>
      ))}
    </div>
  );
}

type CrudCardProps = {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function CrudCard({
  title,
  description,
  badge,
  actions,
  children,
}: CrudCardProps) {
  return (
    <section className="erp-crud-card">
      <div className="erp-crud-card-header">
        <div className="min-w-0">
          <h2 className="erp-crud-card-title">{title}</h2>
          {description ? <p className="erp-crud-card-description">{description}</p> : null}
        </div>
        {badge || actions ? (
          <div className="erp-crud-card-aside">
            {badge}
            {actions}
          </div>
        ) : null}
      </div>
      <div className="erp-crud-card-body">{children}</div>
    </section>
  );
}

/** Avatar Initial Badge Component for Entity Tables */
export function EntityAvatar({ name, subtext }: { name: string; subtext?: string }) {
  const initials = (name || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/50">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">{name}</p>
        {subtext && <p className="text-[11px] text-slate-500 truncate">{subtext}</p>}
      </div>
    </div>
  );
}
