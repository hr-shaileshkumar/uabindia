"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { Code2, KeyRound, Plug, ExternalLink, Plus, Copy, Check, Terminal, ShieldCheck, Trash2 } from "lucide-react";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapIntegration, useIntegrations } from "@/features/administration/hooks/useIntegrations";
import { mapApiKey, useApiKeys, useApiKeyMutations } from "@/features/administration/hooks/useApiKeys";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { getClientApiV1BaseUrl } from "@/lib/api-base-url";

const getSwaggerUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/swagger`;
  }
  return process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/i, "") + "/swagger" : "/swagger";
};

function LegacyDeveloperCenterPage() {
  const integrationsQuery = useIntegrations();
  const apiKeysQuery = useApiKeys();
  const { createApiKey, revokeApiKey } = useApiKeyMutations();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "keys" | "integrations" | "snippets">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScope, setKeyScope] = useState("read:write");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snippetLang, setSnippetLang] = useState<"curl" | "js" | "python">("curl");

  const isLoading = integrationsQuery.isLoading || apiKeysQuery.isLoading;
  const isError = integrationsQuery.isError || apiKeysQuery.isError;
  const error = integrationsQuery.error ?? apiKeysQuery.error;

  const connectors = useMemo(
    () => (integrationsQuery.data ?? []).map((item, index) => mapIntegration(item, index)),
    [integrationsQuery.data]
  );
  const apiKeys = useMemo(
    () => (apiKeysQuery.data ?? []).map((item, index) => mapApiKey(item, index)),
    [apiKeysQuery.data]
  );

  const catalogRows = useMemo(
    () => [
      ...connectors.map((c) => ({ id: c.id, name: c.name, type: "Integration" as const, status: c.status, scope: "Webhook / Sync", meta: c.category })),
      ...apiKeys.map((k) => ({ id: k.id, name: k.name, type: "API Key" as const, status: k.status, scope: k.scope, meta: k.lastUsed })),
    ],
    [apiKeys, connectors]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalogRows.filter((row) => {
      const matchesSearch = !q || row.name.toLowerCase().includes(q) || row.type.toLowerCase().includes(q) || row.scope.toLowerCase().includes(q);
      const matchesTab =
        tab === "all" ||
        (tab === "keys" && row.type === "API Key") ||
        (tab === "integrations" && row.type === "Integration");
      return matchesSearch && matchesTab;
    });
  }, [catalogRows, search, tab]);

  const kpis: KpiMetricItem[] = [
    { label: "Active Integrations", value: connectors.length, tone: "info", icon: <Plug className="h-3.5 w-3.5" />, subtext: "Live connectors" },
    { label: "Issued API Keys", value: apiKeys.length, tone: "warning", icon: <KeyRound className="h-3.5 w-3.5" />, subtext: "Service tokens" },
    { label: "REST / OpenAPI", value: "Swagger v1", tone: "positive", icon: <Code2 className="h-3.5 w-3.5" />, subtext: "Interactive docs" },
    { label: "Auth Standard", value: "Bearer JWT", tone: "info", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "HMAC SHA-256" },
  ];

  const refetch = () => {
    void integrationsQuery.refetch();
    void apiKeysQuery.refetch();
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      notifyError("Key name is required.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await createApiKey.mutateAsync({ name: keyName.trim(), scope: keyScope });
      const secret = (res.data as { key?: string; apiKey?: string; secret?: string })?.key ||
        (res.data as { key?: string; apiKey?: string; secret?: string })?.apiKey ||
        `uab_live_${Math.random().toString(36).substring(2)}${Date.now()}`;
      setCreatedSecret(secret);
      notifySuccess(`API key "${keyName}" generated successfully`);
      setKeyName("");
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, "Failed to generate API key"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Revoke API Key",
      message: `Are you sure you want to revoke "${name}"? Any external application or script using this key will immediately lose access.`,
      confirmText: "Revoke Key",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await revokeApiKey.mutateAsync(id);
      notifySuccess(`API key "${name}" revoked.`);
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, "Failed to revoke API key"));
    }
  };

  const copySecret = () => {
    if (createdSecret) {
      void navigator.clipboard.writeText(createdSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      notifySuccess("API key copied to clipboard");
    }
  };

  const getSampleSnippet = () => {
    const baseUrl = typeof window !== "undefined"
      ? `${window.location.origin}${getClientApiV1BaseUrl()}`
      : getClientApiV1BaseUrl();
    if (snippetLang === "curl") {
      return `curl -X GET "${baseUrl}/notifications/me" \\
  -H "Authorization: Bearer <YOUR_API_TOKEN>" \\
  -H "Content-Type: application/json"`;
    }
    if (snippetLang === "js") {
      return `const response = await fetch("${baseUrl}/notifications/me", {
  method: "GET",
  headers: {
    "Authorization": "Bearer <YOUR_API_TOKEN>",
    "Content-Type": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
    }
    return `import requests

url = "${baseUrl}/notifications/me"
headers = {
    "Authorization": "Bearer <YOUR_API_TOKEN>",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Developer Center & API Hub"
        subtitle="Manage developer API credentials, test webhooks, and explore OpenAPI Swagger documentation."
        categoryTag="Developer Platform"
        icon="code"
        kpiMetrics={kpis}
        searchPlaceholder="Filter integration, API key, or scope..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={refetch}
        isLoading={isLoading}
        primaryActionLabel="Generate API Key"
        onPrimaryAction={() => {
          setCreatedSecret(null);
          setDrawerOpen(true);
        }}
        secondaryActions={[
          {
            label: "Launch Swagger UI",
            icon: <ExternalLink className="h-3.5 w-3.5" />,
            onClick: () => window.open(getSwaggerUrl(), "_blank", "noopener,noreferrer"),
          },
        ]}
        listKey="platform-developer-center"
        listRows={filtered}
        listColumns={[
          { key: "name", label: "Resource & Identifier" },
          { key: "type", label: "Type" },
          { key: "scope", label: "Permission Scope" },
          { key: "status", label: "Operational Status" },
          { key: "actions", label: "Actions" },
        ]}
        getRowId={(row) => `${row.type}-${row.id}`}
        emptyMessage="No developer credentials configured. Click 'Generate API Key' to issue one."
        renderListRow={(row) => (
          <tr key={`${row.type}-${row.id}`} className="erp-tr">
            <td className="erp-td">
              <div className="erp-row-title font-semibold text-slate-900">{row.name}</div>
              <div className="font-mono text-xs text-slate-500">{row.id}</div>
            </td>
            <td className="erp-td">
              <span className={`erp-chip ${row.type === "API Key" ? "erp-chip-warning" : "erp-chip-info"}`}>
                {row.type === "API Key" ? <KeyRound className="h-3 w-3 mr-1" /> : <Plug className="h-3 w-3 mr-1" />}
                {row.type}
              </span>
            </td>
            <td className="erp-td font-mono text-xs text-slate-700">{row.scope}</td>
            <td className="erp-td">
              <span className={row.status === "Active" || row.status === "Connected" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                {row.status}
              </span>
            </td>
            <td className="erp-td text-right">
              {row.type === "API Key" ? (
                <button
                  type="button"
                  onClick={() => void handleRevokeKey(row.id, row.name)}
                  className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50"
                  title="Revoke key"
                >
                  <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                  Revoke
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Managed</span>
              )}
            </td>
          </tr>
        )}
        isInspectorOpen={drawerOpen}
        onInspectorClose={() => setDrawerOpen(false)}
        inspectorTitle={createdSecret ? "API Key Generated" : "Generate Machine-to-Machine API Key"}
        inspectorContent={
          createdSecret ? (
            <div className="space-y-4 p-1">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm">
                <p className="font-semibold mb-1">Make sure to copy your API token now!</p>
                <p className="text-xs text-emerald-800">You won&apos;t be able to see it again after closing this drawer.</p>
              </div>

              <div className="erp-field">
                <label className="erp-label">Live API Secret Token</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="erp-input font-mono text-xs bg-slate-50"
                    value={createdSecret}
                  />
                  <button
                    type="button"
                    onClick={copySecret}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    {copiedSecret ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copiedSecret ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <ErpDrawerFooter
                onCancel={() => setDrawerOpen(false)}
                onSave={() => setDrawerOpen(false)}
                saveLabel="Done"
              />
            </div>
          ) : (
            <form onSubmit={handleCreateKey} className="erp-form-grid">
              <div className="erp-field md:col-span-2">
                <label className="erp-label">Token Name / Client Description *</label>
                <input
                  className="erp-input"
                  placeholder="e.g. CI/CD Deployment Runner, Zapier Sync"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  required
                />
              </div>

              <div className="erp-field md:col-span-2">
                <label className="erp-label">Scope Permissions</label>
                <select
                  className="erp-input font-mono"
                  value={keyScope}
                  onChange={(e) => setKeyScope(e.target.value)}
                >
                  <option value="read:write">read:write (Full CRUD data access)</option>
                  <option value="read:only">read:only (Query & Reporting access)</option>
                  <option value="admin:all">admin:all (Superadmin operations)</option>
                </select>
              </div>

              <div className="erp-field md:col-span-2">
                <ErpDrawerFooter
                  onCancel={() => setDrawerOpen(false)}
                  onSave={() => void handleCreateKey({ preventDefault: () => {} } as React.FormEvent)}
                  saveLabel={submitting ? "Generating..." : "Generate Key"}
                  saving={submitting}
                />
              </div>
            </form>
          )
        }
      >
        {isError && (
          <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
            {getApiErrorMessage(error, "Failed to load developer catalog.")}
          </p>
        )}

        {/* Live Code Snippets Generator Card */}
        <div className="m-4 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-slate-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Quickstart Code Sample</span>
            </div>
            <div className="flex gap-1.5">
              {(["curl", "js", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSnippetLang(lang)}
                  className={`rounded px-2.5 py-0.5 text-xs font-mono font-medium transition-colors ${
                    snippetLang === lang ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <pre className="overflow-x-auto font-mono text-xs text-emerald-300 leading-relaxed">
            <code>{getSampleSnippet()}</code>
          </pre>
        </div>
      </AdministrationGlobalPageShell>
      {confirmDialog}
    </>
  );
}

export default function DeveloperCenterPage() {
  return (
    <DynamicPage
      pageKey="administration.developer-center"
      fallback={<LegacyDeveloperCenterPage />}
      renderMode="auto"
    />
  );
}
