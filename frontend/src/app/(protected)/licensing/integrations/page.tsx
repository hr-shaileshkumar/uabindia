"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Keys", value: keys.length, helper: "total" },
            {
              label: "Active",
              value: keys.filter((key) => key.isActive).length,
              tone: "positive",
            },
            {
              label: "Inactive",
              value: keys.filter((key) => !key.isActive).length,
              tone: "danger",
            },
            {
              label: "Prefixes",
              value: new Set(keys.map((key) => key.prefix).filter(Boolean)).size,
              helper: "unique",
              tone: "info",
            },
          ]}
        />
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
