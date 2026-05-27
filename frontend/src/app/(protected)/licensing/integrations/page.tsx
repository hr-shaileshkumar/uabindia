"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ApiKeyRow = {
  name: string;
  prefix: string;
  isActive: boolean;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.licensing.apiKeys();
        setKeys(res.data.apiKeys || []);
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err, "Failed to load API keys");
        notifyError(msg, "API Keys");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <ModuleTablePage
      title="API Keys / Integrations"
      subtitle="Manage external integration keys, prefixes, and active states."
      eyebrow="Licensing / Integrations"
      icon="settings"
      toolbarTitle="Integration key registry"
      toolbarSubtitle="Monitor external-access keys, exposed prefixes, and runtime state from a secure operator view."
      loading={loading}
      error={error}
      rows={keys}
      countLabel={(count) => `${count} keys`}
      emptyMessage="No API keys found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total API Keys</p><p className="erp-kpi-value">{keys.length}</p><p className="erp-kpi-meta">Integration keys</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{keys.filter(k => k.isActive).length}</p><p className="erp-kpi-meta">Active integrations</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Inactive</p><p className="erp-kpi-value erp-kpi-value-danger">{keys.filter(k => !k.isActive).length}</p><p className="erp-kpi-meta">Disabled keys</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Prefixes</p><p className="erp-kpi-value">{new Set(keys.map(k => k.prefix).filter(Boolean)).size}</p><p className="erp-kpi-meta">Unique key prefixes</p></div>
        </div>
      }
      columns={[
        { label: "Name" },
        { label: "Prefix" },
        { label: "Status" },
      ]}
      renderRow={(key) => (
        <tr key={key.prefix} className="erp-tr">
          <td className="erp-td">
            <div className="erp-row-title">{key.name}</div>
            <div className="erp-row-meta">Integration credential</div>
          </td>
          <td className="erp-td text-xs text-slate-500">{key.prefix}</td>
          <td className="erp-td">
            <span className={key.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {key.isActive ? "Active" : "Inactive"}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
