import Link from "next/link";
import ModuleIcon from "@/components/ModuleIcon";
import { StatusBadge } from "@/components/erp/status-badge";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/erp/crud-workspace";

export type ModuleOverviewTile = {
  href: string;
  title: string;
  description: string;
  icon: string;
  meta: string;
};

type ModuleOverviewPageProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon?: string;
  actionHref?: string;
  actionLabel?: string;
  tiles: ModuleOverviewTile[];
  notice?: string;
};

export default function ModuleOverviewPage({
  title,
  subtitle,
  eyebrow,
  icon,
  actionHref,
  actionLabel,
  tiles,
  notice,
}: ModuleOverviewPageProps) {
  const tileCount = tiles.length;

  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      icon={icon}
      meta={
        <>
          <StatusBadge tone={tileCount > 0 ? "positive" : "warning"}>
            {tileCount > 0 ? "Workspace ready" : "Setup pending"}
          </StatusBadge>
          <span className="rounded-full border border-[#d9e6ff] bg-[#eef4ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2152d8]">
            {tileCount} actions
          </span>
        </>
      }
      actions={
        actionHref && actionLabel ? (
          <Link href={actionHref} className="erp-action-btn erp-action-btn-primary">
            {actionLabel}
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <CrudCard
          title="Module Areas"
          description="Use overview pages only when the module genuinely needs a launchpad. Otherwise route directly into the working table or form."
          badge={<span className="erp-toolbar-badge">{tileCount} areas</span>}
        >
          <p className="text-sm leading-6 text-slate-600">
            Start with the highest-frequency workspace first and keep overview pages focused on navigation, not secondary metrics.
          </p>
        </CrudCard>
        <div className="erp-tile-grid gap-4">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-[var(--erp-shadow-sm)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_26px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] bg-[#eef4ff] text-[color:var(--erp-primary)] ring-1 ring-[#dbe7ff]" aria-hidden>
                  <ModuleIcon name={icon || "layers"} className="h-4.5 w-4.5" />
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {tile.meta}
                </span>
              </div>
              <div className="mt-4 text-lg font-semibold tracking-[-0.03em] text-slate-950">{tile.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tile.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--erp-primary)] transition group-hover:gap-3">
                Open area
                <span aria-hidden>{tile.icon && tile.icon.length <= 2 ? tile.icon : ">"}</span>
              </div>
            </Link>
          ))}
        </div>

        {notice ? <div className="erp-alert-info">{notice}</div> : null}
      </div>
    </StandardPageLayout>
  );
}
