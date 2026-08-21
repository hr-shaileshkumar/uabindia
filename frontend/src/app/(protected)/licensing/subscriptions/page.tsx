"use client";

import { useCallback, useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ListSearchInput } from "@/components/erp/list-toolbar";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useUiSchema } from "@/context/UiSchemaContext";

type SubscriptionRow = {
  moduleKey: string;
  isEnabled: boolean;
};

export default function SubscriptionsPage() {
  const { refresh: refreshUiSchema } = useUiSchema();
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.modules.subscriptions();
      setSubs(res.data.subscriptions || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: SubscriptionRow) => {
    try {
      setToggling(row.moduleKey);
      await appApi.modules.updateSubscriptions({
        subscriptions: [{ moduleKey: row.moduleKey, isEnabled: !row.isEnabled }],
      });
      notifySuccess(row.isEnabled ? `${row.moduleKey} disabled` : `${row.moduleKey} enabled`);
      await Promise.all([load(), refreshUiSchema()]);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update subscription."));
    } finally {
      setToggling(null);
    }
  };

  const filtered = search.trim()
    ? subs.filter((s) => s.moduleKey.toLowerCase().includes(search.trim().toLowerCase()))
    : subs;

  return (
    <ModuleTablePage
      title="Module Subscriptions"
      subtitle="Review tenant-level module subscriptions and entitlement state."
      eyebrow="Licensing / Entitlements"
      icon="dashboard"
      toolbarTitle="Subscription matrix"
      toolbarSubtitle="Enable or disable module entitlements for this tenant."
      loading={loading}
      error={error}
      onRetry={load}
      rows={filtered}
      countLabel={(count) => `${count} subscriptions`}
      emptyMessage="No subscriptions found."
      filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Filter module key…" />}
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
      columns={[{ label: "Module Key" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
      renderRow={(sub) => (
        <tr key={sub.moduleKey} className="erp-tr">
          <td className="erp-td text-xs text-slate-500">{sub.moduleKey}</td>
          <td className="erp-td">
            <span className={sub.isEnabled ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {sub.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </td>
          <td className="erp-td text-right">
            <button
              type="button"
              className={sub.isEnabled ? erpButtonClassName.secondary : erpButtonClassName.primary}
              disabled={toggling === sub.moduleKey}
              onClick={() => void toggle(sub)}
            >
              {toggling === sub.moduleKey ? "Saving…" : sub.isEnabled ? "Disable" : "Enable"}
            </button>
          </td>
        </tr>
      )}
    />
  );
}
