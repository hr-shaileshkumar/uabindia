"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Subscriptions", value: subs.length, helper: "total" },
            {
              label: "Enabled",
              value: subs.filter((subscription) => subscription.isEnabled).length,
              tone: "positive",
            },
            {
              label: "Disabled",
              value: subs.filter((subscription) => !subscription.isEnabled).length,
              tone: "warning",
            },
            {
              label: "Modules",
              value: new Set(subs.map((subscription) => subscription.moduleKey).filter(Boolean)).size,
              helper: "distinct",
              tone: "info",
            },
          ]}
        />
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
