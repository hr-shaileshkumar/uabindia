import type { ReactNode } from "react";

type ProfileItem = {
  label: string;
  value: ReactNode;
};

type EntityProfileCardProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  items: ProfileItem[];
  footer?: ReactNode;
  className?: string;
};

export default function EntityProfileCard({
  title,
  subtitle,
  badge,
  items,
  footer,
  className,
}: EntityProfileCardProps) {
  return (
    <div className={["erp-kpi-card erp-kpi-card-info", className].filter(Boolean).join(" ")}>
      <div className="erp-kpi-head">
        <div className="erp-kpi-icon">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="erp-kpi-label">Profile</p>
          <p className="text-base font-semibold text-slate-900 truncate">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
        {badge ? <div className="ml-auto">{badge}</div> : null}
      </div>

      <div className="erp-metric-list mt-4">
        {items.map((item) => (
          <div key={item.label} className="erp-metric-row">
            <span className="erp-metric-label">{item.label}</span>
            <span className="erp-metric-value text-right">{item.value}</span>
          </div>
        ))}
      </div>

      {footer ? <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div> : null}
    </div>
  );
}
