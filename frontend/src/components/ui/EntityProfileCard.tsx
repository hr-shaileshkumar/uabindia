import type { ReactNode } from "react";
import { CrudCard } from "@/components/erp/crud-workspace";

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
}: EntityProfileCardProps) {
  return (
    <CrudCard title={title} description={subtitle} badge={badge} actions={footer}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[0.95rem] border border-slate-200 bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
            <div className="mt-2 text-sm font-medium text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>
    </CrudCard>
  );
}
