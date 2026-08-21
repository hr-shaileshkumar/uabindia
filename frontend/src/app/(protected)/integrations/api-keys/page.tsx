"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/erp/templates/UniversalDeleteDialog";
import { useErpListView } from "@/components/erp/erp-list-view";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ApiKeyRow = {
  id: string;
  name: string;
  prefix?: string;
  scope?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  lastUsedAt?: string;
};

const statusOf = (row: ApiKeyRow) => row.status || (row.isActive ? "Active" : "Revoked");

export default function IntegrationsApiKeysPage() {
  const [records, setRecords] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("read");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.licensing.apiKeys();
      setRecords((res.data?.apiKeys ?? []) as ApiKeyRow[]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load API keys."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.name, r.prefix, r.scope, statusOf(r)].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [records, search]);

  const openCreate = () => {
    setName("");
    setScope("read");
    setPlaintext(null);
    setDrawerOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      notifyError("Key name is required.");
      return;
    }
    try {
      setSaving(true);
      const res = await appApi.licensing.createApiKey({ name: name.trim(), scope });
      const created = res.data?.apiKey as ApiKeyRow & { plaintextKey?: string };
      setPlaintext(created?.plaintextKey || null);
      notifySuccess("API key created. Copy the secret now — it will not be shown again.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create API key."));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    try {
      setRevoking(true);
      await appApi.licensing.revokeApiKey(revokeId);
      notifySuccess("API key revoked.");
      setRevokeId(null);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to revoke API key."));
    } finally {
      setRevoking(false);
    }
  };

  const copySecret = async () => {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    notifySuccess("Secret copied to clipboard.");
  };

  const list = useErpListView({
    listKey: "integrations-api-keys",
    rows: filtered,
    columns: [
      { key: "name", label: "Name", dataType: "string" },
      { key: "prefix", label: "Prefix", dataType: "string" },
      { key: "scope", label: "Scope", dataType: "string" },
      { key: "createdAt", label: "Created", dataType: "string" },
      { key: "lastUsedAt", label: "Last used", dataType: "string" },
      { key: "status", label: "Status", dataType: "string" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No API keys yet. Create a key for external integrations.",
    emptyAction: <ErpCreateButton label="New API key" onClick={openCreate} />,
    onCreate: openCreate,
    createLabel: "New API key",
    onRefresh: () => void load(),
    renderRow: (r) => {
      const status = statusOf(r);
      return (
        <>
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td font-mono text-xs text-slate-500">{r.prefix || "—"}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral">{r.scope || "read"}</span>
          </td>
          <td className="erp-td text-xs text-slate-600">
            {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
          </td>
          <td className="erp-td text-xs text-slate-600">
            {r.lastUsedAt ? new Date(r.lastUsedAt).toLocaleDateString("en-IN") : "Never"}
          </td>
          <td className="erp-td">
            <span className={`erp-chip ${status === "Active" ? "erp-chip-success" : "erp-chip-danger"}`}>
              {status}
            </span>
          </td>
          <td className="erp-td">
            {status === "Active" ? (
              <ErpRowActions
                onDelete={{ label: "Revoke", onClick: () => setRevokeId(r.id) }}
              />
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </td>
        </>
      );
    },
  });

  return (
    <>
      <StandardPageLayout
        title="API Keys"
        icon="key"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Keys", value: records.length, helper: "total" },
              {
                label: "Active",
                value: records.filter((r) => statusOf(r) === "Active").length,
                tone: "positive",
              },
              {
                label: "Revoked",
                value: records.filter((r) => statusOf(r) === "Revoked").length,
                tone: "danger",
              },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void load()} loading={loading} />
            {list.headerTools}
            <ErpCreateButton label="New API key" onClick={openCreate} />
          </>
        }
        filters={
          <>
            <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter name, prefix, or scope…" />
            {list.filterBar}
          </>
        }
      >
        {error ? <div className="erp-alert-error">{error}</div> : null}
        <CrudCard>{list.table}</CrudCard>
        <p className="text-xs text-slate-500">
          Keys are shown by prefix only. The full secret is returned once at creation. There is no edit endpoint —
          revoke and create a new key to rotate.
        </p>
      </StandardPageLayout>

      <SideDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setPlaintext(null);
        }}
        title={plaintext ? "Copy your API secret" : "New API key"}
        footer={
          plaintext ? (
            <div className="flex justify-end">
              <button
                type="button"
                className={erpButtonClassName.primary}
                onClick={() => {
                  setDrawerOpen(false);
                  setPlaintext(null);
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <ErpDrawerFooter
              onCancel={() => setDrawerOpen(false)}
              onSave={() => void handleCreate()}
              saving={saving}
              saveLabel="Create key"
              disabled={!name.trim()}
            />
          )
        }
      >
        {plaintext ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Store this secret now. It will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                {plaintext}
              </code>
              <button
                type="button"
                className={`${erpButtonClassName.secondary} h-10 px-3`}
                onClick={() => void copySecret()}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Name *</label>
              <input
                className="erp-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GST portal production"
              />
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Scope</label>
              <select className="erp-select" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="read">read</option>
                <option value="write">write</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
        )}
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(revokeId)}
        onOpenChange={(open) => !open && setRevokeId(null)}
        title="Revoke API key"
        description="Existing integrations using this key will stop working. This cannot be undone."
        isHardDelete
        onConfirm={() => void handleRevoke()}
        loading={revoking}
      />
    </>
  );
}
