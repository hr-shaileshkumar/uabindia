"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useUiSchema } from "@/context/UiSchemaContext";
import { ROUTES } from "@/constants/routes";

type SystemInfo = {
  version: string;
  tenantCount: number;
  health: string;
};

export default function PlatformOverviewPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigation } = useUiSchema();

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const [versionRes, tenantsRes] = await Promise.all([
          hrApi.system.getVersion(),
          hrApi.platform.tenants(),
        ]);

        setSystemInfo({
          version: versionRes.version || "1.0.0",
          tenantCount: tenantsRes.data?.tenants?.length || 0,
          health: "Operational",
        });
      } catch (error) {
        notifyError(getApiErrorMessage(error, 'Failed to load system information.'), 'Platform');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  const fallbackPlatformTiles = [
    { href: ROUTES.PLATFORM_COMPANIES, title: "Company Setup", description: "Create and manage company master records.", icon: "🏢", meta: "Foundation" },
    { href: ROUTES.PLATFORM_PROJECTS, title: "Project Mapping", description: "Define projects, cost centers, and reporting slices.", icon: "📁", meta: "Structure" },
    { href: ROUTES.PLATFORM_USERS, title: "User & Roles", description: "Assign users, security policies, and access models.", icon: "🛡️", meta: "Access control" },
    { href: ROUTES.PLATFORM_RECYCLE_BIN, title: "Recycle Bin", description: "Restore or permanently delete soft-deleted records.", icon: "♻️", meta: "Governance" },
    { href: ROUTES.AUDIT_LOGS, title: "Audit Logs", description: "Review platform-wide changes and governance events.", icon: "🧭", meta: "Oversight" },
  ];

  const schemaPlatformTiles = navigation.modules
    .find((module) => module.key === "platform")
    ?.groups
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((group) =>
      group.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          href: item.path,
          title: item.name,
          description: `Manage ${item.name.toLowerCase()} configuration and governance.`,
          icon: "🧩",
          meta: group.label,
        }))
    )
    .slice(0, 6);

  const platformTiles = schemaPlatformTiles && schemaPlatformTiles.length > 0 ? schemaPlatformTiles : fallbackPlatformTiles;
  const auditHref = platformTiles.find((tile) => tile.href.includes("audit"))?.href || ROUTES.AUDIT_LOGS;

  if (loading) {
    return (
      <StandardPageLayout title="Platform & Administration" subtitle="System-wide governance, configuration, and operational control.">
        <div className="erp-panel erp-loading">Loading platform overview...</div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Platform & Administration"
      subtitle="System-wide governance, configuration, and operational control for the ERP estate."
      actions={<Link href={auditHref} className="erp-action-btn erp-action-btn-primary">Open Audit Logs</Link>}
    >
      <div className="space-y-6">
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">System Version</p><p className="erp-kpi-value">{systemInfo?.version}</p><p className="erp-kpi-meta">Current deployed release</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Tenants</p><p className="erp-kpi-value">{systemInfo?.tenantCount}</p><p className="erp-kpi-meta">Managed organizations</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">System Health</p><p className="erp-kpi-value erp-kpi-value-success">{systemInfo?.health}</p><p className="erp-kpi-meta">Operational readiness</p></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Components</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Tenants and companies for multi-entity administration.</li>
              <li>Projects and cost centers for reporting structure.</li>
              <li>Users, roles, and policies for enterprise access control.</li>
              <li>Feature flags, settings, and audit logs for governance.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="erp-tile-grid">
          {platformTiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="erp-tile">
              <span className="erp-tile-icon" aria-hidden>{tile.icon}</span>
              <div className="erp-tile-title">{tile.title}</div>
              <p className="erp-tile-desc">{tile.description}</p>
              <div className="erp-tile-meta">{tile.meta}</div>
            </Link>
          ))}
        </div>
      </div>
    </StandardPageLayout>
  );
}
