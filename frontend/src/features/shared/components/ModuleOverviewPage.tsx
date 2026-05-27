import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

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
  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      icon={icon}
      actions={
        actionHref && actionLabel ? (
          <Link href={actionHref} className="erp-action-btn erp-action-btn-primary">
            {actionLabel}
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="erp-tile-grid">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="erp-tile">
              <span className="erp-tile-icon" aria-hidden>{tile.icon}</span>
              <div className="erp-tile-title">{tile.title}</div>
              <p className="erp-tile-desc">{tile.description}</p>
              <div className="erp-tile-meta">{tile.meta}</div>
            </Link>
          ))}
        </div>

        {notice ? <div className="erp-alert-info">{notice}</div> : null}
      </div>
    </StandardPageLayout>
  );
}
