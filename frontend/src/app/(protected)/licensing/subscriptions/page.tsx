"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type SubscriptionRow = {
  moduleKey: string;
  isEnabled: boolean;
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.modules.subscriptions();
        setSubs(res.data.subscriptions || []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <ModuleTablePage
      title="Module Subscriptions"
      subtitle="Review tenant-level module subscriptions and entitlement state."
      eyebrow="Licensing / Entitlements"
      icon="dashboard"
      toolbarTitle="Subscription matrix"
      toolbarSubtitle="See entitlement state and active subscription posture per module in a compact licensing grid."
      loading={loading}
      rows={subs}
      countLabel={(count) => `${count} subscriptions`}
      emptyMessage="No subscriptions found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Subscriptions</p><p className="erp-kpi-value">{subs.length}</p><p className="erp-kpi-meta">Module subscriptions</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Enabled</p><p className="erp-kpi-value erp-kpi-value-success">{subs.filter(s => s.isEnabled).length}</p><p className="erp-kpi-meta">Active subscriptions</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Disabled</p><p className="erp-kpi-value">{subs.filter(s => !s.isEnabled).length}</p><p className="erp-kpi-meta">Inactive subscriptions</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Modules</p><p className="erp-kpi-value">{new Set(subs.map(s => s.moduleKey).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct modules</p></div>
        </div>
      }
      columns={[
        { label: "Module Key" },
        { label: "Status" },
      ]}
      renderRow={(sub) => (
        <tr key={sub.moduleKey} className="erp-tr">
          <td className="erp-td text-xs text-slate-500">{sub.moduleKey}</td>
          <td className="erp-td">
            <span className={sub.isEnabled ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {sub.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
