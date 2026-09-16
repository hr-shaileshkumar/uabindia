"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type SsoRow = {
  id: string;
  name?: string;
  protocol?: string;
  provider?: string;
  issuer?: string;
  clientId?: string;
  hasClientSecret?: boolean;
  metadataUrl?: string;
  redirectUri?: string;
  scopes?: string;
  status?: string;
  lastError?: string;
  lastTestedAt?: string;
};

const PROTOCOLS = ["OIDC", "SAML", "OAuth2"];
const PROVIDERS = ["Azure AD", "Google Workspace", "Okta", "Auth0", "ADFS", "Custom"];

const emptyForm = () => ({
  name: "",
  protocol: "OIDC",
  provider: "Azure AD",
  issuer: "",
  clientId: "",
  clientSecret: "",
  metadataUrl: "",
  redirectUri: "",
  scopes: "openid profile email",
});

const asList = (raw: unknown): SsoRow[] => {
  if (Array.isArray(raw)) return raw as SsoRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as SsoRow[];
  }
  return [];
};

const chip = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "active") return "erp-chip erp-chip-success";
  if (s === "configured") return "erp-chip erp-chip-info";
  if (s === "error") return "erp-chip erp-chip-danger";
  return "erp-chip erp-chip-neutral";
};

function LegacySingleSignOnPage() {
  const [records, setRecords] = useState<SsoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.security.ssoProviders();
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load SSO providers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        [r.name, r.provider, r.protocol, r.issuer, r.status].some((v) => (v || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: SsoRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      protocol: row.protocol || "OIDC",
      provider: row.provider || "Custom",
      issuer: row.issuer || "",
      clientId: row.clientId || "",
      clientSecret: "",
      metadataUrl: row.metadataUrl || "",
      redirectUri: row.redirectUri || "",
      scopes: row.scopes || "openid profile email",
    });
    setDrawerOpen(true);
  };

  const payload = () => ({
    name: form.name.trim(),
    protocol: form.protocol,
    provider: form.provider,
    issuer: form.issuer.trim(),
    clientId: form.clientId.trim(),
    clientSecret: form.clientSecret.trim() || undefined,
    metadataUrl: form.metadataUrl.trim() || undefined,
    redirectUri: form.redirectUri.trim() || undefined,
    scopes: form.scopes.trim() || undefined,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      notifyError("Provider name is required.");
      return;
    }
    try {
      setSaving(true);
      if (editingId) await appApi.security.updateSsoProvider(editingId, payload());
      else await appApi.security.createSsoProvider(payload());
      notifySuccess(editingId ? "SSO provider updated." : "SSO provider created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save SSO provider."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "test" | "enable" | "disable" | "delete") => {
    try {
      if (action === "test") await appApi.security.testSsoProvider(id);
      if (action === "enable") await appApi.security.enableSsoProvider(id);
      if (action === "disable") await appApi.security.disableSsoProvider(id);
      if (action === "delete") await appApi.security.deleteSsoProvider(id);
      notifySuccess(action === "delete" ? "Provider deleted." : "Provider updated.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  return (
    <>
      <ModuleTablePage
        title="Single sign-on"
        subtitle="Configure OAuth2/OIDC, SAML, or directory federation for your organization."
        eyebrow="Security / Authentication"
        icon="shield"
        toolbarTitle="Identity providers"
        toolbarSubtitle="Store issuer, client, and metadata for each IdP. Enable a provider after a successful test."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} providers`}
        emptyMessage="No SSO providers configured."
        emptyAction={<ListCreateButton label="Add provider" onClick={openCreate} />}
        actions={<ListCreateButton label="Add provider" onClick={openCreate} />}
        filters={
          <>
            <ListSearchInput value={search} onChange={setSearch} placeholder="Filter name, issuer, or protocol…" />
            <ListStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Inactive", value: "inactive" },
                { label: "Configured", value: "configured" },
                { label: "Active", value: "active" },
                { label: "Error", value: "error" },
              ]}
            />
          </>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Providers", value: records.length, helper: "configured" },
              { label: "Active", value: records.filter((r) => r.status === "Active").length, tone: "positive" },
              { label: "Errors", value: records.filter((r) => r.status === "Error").length, tone: "danger" },
            ]}
          />
        }
        columns={[
          { label: "Provider" },
          { label: "Protocol" },
          { label: "Issuer" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td">
              <p className="font-semibold text-slate-900">{r.name || "—"}</p>
              <p className="text-xs text-slate-500">{r.provider}</p>
            </td>
            <td className="erp-td">
              <span className="erp-chip erp-chip-neutral">{r.protocol}</span>
            </td>
            <td className="erp-td text-xs text-slate-600">
              <p className="truncate max-w-[280px]">{r.issuer || "—"}</p>
              {r.clientId ? <p className="mt-0.5 font-mono text-[11px] text-slate-400">{r.clientId}</p> : null}
            </td>
            <td className="erp-td">
              <span className={chip(r.status)}>{r.status}</span>
              {r.lastError ? <p className="mt-1 text-[11px] text-rose-600">{r.lastError}</p> : null}
            </td>
            <td className="erp-td text-right">
              <div className="inline-flex flex-wrap justify-end gap-1">
                <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "test")}>
                  Test
                </button>
                {r.status === "Active" ? (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "disable")}>
                    Disable
                  </button>
                ) : (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "enable")}>
                    Enable
                  </button>
                )}
                <button
                  type="button"
                  className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`}
                  onClick={() => void runAction(r.id, "delete")}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit SSO provider" : "Add SSO provider"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Display name *</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Protocol</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                {PROTOCOLS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>IdP</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                {PROVIDERS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Issuer / Entity ID</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="https://login.microsoftonline.com/{tenant}/v2.0" />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Client ID</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Client secret {editingId ? "(leave blank to keep)" : ""}</label>
            <input type="password" className={`${erpFormInputClassName} mt-1`} value={form.clientSecret} onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Metadata URL</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.metadataUrl} onChange={(e) => setForm({ ...form, metadataUrl: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Redirect URI</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.redirectUri} onChange={(e) => setForm({ ...form, redirectUri: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Scopes</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

export default function SingleSignOnPage() {
  return (
    <DynamicPage
      pageKey="security.single-sign-on"
      fallback={<LegacySingleSignOnPage />}
      renderMode="auto"
    />
  );
}
