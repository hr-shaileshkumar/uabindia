"use client";

import { useCallback, useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ListCreateButton } from "@/components/workspace/list-toolbar";
import { erpButtonClassName } from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useRouter } from "next/navigation";

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  status?: string;
  createdAt: string;
};

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.licensing.apiKeys();
      setKeys(res.data.apiKeys || []);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to load API keys");
      notifyError(msg, "API Keys");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Revoke this API key?")) return;
    try {
      await appApi.licensing.revokeApiKey(id);
      notifySuccess("API key revoked.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to revoke API key."));
    }
  };

  const isActive = (key: ApiKeyRow) => key.status === "Active" || key.isActive;

  return (
    <ModuleTablePage
      title="API Keys / Integrations"
      subtitle="Manage external integration keys, prefixes, and active states."
      eyebrow="Licensing / Integrations"
      icon="settings"
      toolbarTitle="Integration key registry"
      toolbarSubtitle="Keys are stored hashed. Create and revoke from this registry or the integrations API Keys page."
      loading={loading}
      error={error}
      onRetry={load}
      rows={keys}
      countLabel={(count) => `${count} keys`}
      emptyMessage="No API keys found."
      emptyAction={<ListCreateButton label="New API key" onClick={() => router.push("/integrations/api-keys")} />}
      actions={<ListCreateButton label="New API key" onClick={() => router.push("/integrations/api-keys")} />}
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Keys", value: keys.length, helper: "total" },
            {
              label: "Active",
              value: keys.filter((key) => isActive(key)).length,
              tone: "positive",
            },
            {
              label: "Inactive",
              value: keys.filter((key) => !isActive(key)).length,
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
      columns={[{ label: "Name" }, { label: "Prefix" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
      renderRow={(key) => (
        <tr key={key.id || key.prefix} className="erp-tr">
          <td className="erp-td">
            <div className="erp-row-title">{key.name}</div>
            <div className="erp-row-meta">Integration credential</div>
          </td>
          <td className="erp-td text-xs text-slate-500">{key.prefix}</td>
          <td className="erp-td">
            <span className={isActive(key) ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {isActive(key) ? "Active" : "Revoked"}
            </span>
          </td>
          <td className="erp-td text-right">
            {isActive(key) ? (
              <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`} onClick={() => void handleRevoke(key.id)}>
                Revoke
              </button>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </td>
        </tr>
      )}
    />
  );
}
