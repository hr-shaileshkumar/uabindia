"use client";

import React, { useState } from "react";
import { Code2, ExternalLink, Download, Key, ShieldCheck, Terminal, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface ApiEndpointRow {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  scope: string;
}

const SEED_ENDPOINTS: ApiEndpointRow[] = [
  { method: "GET", path: "/api/v1/tenants", summary: "Fetch paginated tenant workspace list", scope: "tenants.read" },
  { method: "POST", path: "/api/v1/tenants", summary: "Provision new multi-tenant database schema", scope: "tenants.write" },
  { method: "GET", path: "/api/v1/users", summary: "Cross-tenant global user directory search", scope: "users.read" },
  { method: "POST", path: "/api/v1/auth/login", summary: "OAuth2 & JWT Token authentication endpoint", scope: "public" },
  { method: "GET", path: "/api/v1/audit-logs", summary: "Immutable governance event stream auditor", scope: "audit.read" },
];

export default function DeveloperCenterPage() {
  const [endpoints] = useState<ApiEndpointRow[]>(SEED_ENDPOINTS);
  const [search, setSearch] = useState("");

  const filteredEndpoints = endpoints.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.path.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.scope.toLowerCase().includes(q);
  });

  const getMethodBadge = (m: ApiEndpointRow["method"]) => {
    switch (m) {
      case "GET": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "POST": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "PUT": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "DELETE": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "OpenAPI Specification", value: "v3.0.3", tone: "info", icon: <Code2 className="h-3.5 w-3.5" />, subtext: "Swagger Specs" },
    { label: "API Endpoints", value: 142, tone: "positive", icon: <Terminal className="h-3.5 w-3.5" />, subtext: "REST Endpoints" },
    { label: "Rate Limit Window", value: "100 r/s", tone: "warning", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Nginx Limits" },
    { label: "SDK Client Downloads", value: "Node, C#, Py", tone: "positive", icon: <Download className="h-3.5 w-3.5" />, subtext: "Client Libraries" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Developer Center & OpenAPI Documentation"
      subtitle="Access interactive Swagger API specs, SDK downloads, webhook event schemas, and OAuth client scopes."
      categoryTag="Developer Platform Portal"
      kpiMetrics={kpis}
      searchPlaceholder="Filter API path, method, or scope..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Open Swagger Explorer"
      onPrimaryAction={() => window.open("/swagger", "_blank")}
      primaryActionIcon={<ExternalLink className="h-4 w-4 mr-1.5" />}
    >
      <div className="p-6 space-y-6">
        {/* Quick Dev Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-indigo-500" />
              TypeScript & Node.js SDK
            </h3>
            <p className="text-xs text-slate-500">Official npm package `@uabindia/erp-sdk` for server-side integration.</p>
            <div className="pt-2">
              <Badge variant="outline" className="font-mono text-[10px]">npm i @uabindia/erp-sdk</Badge>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-sky-500" />
              C# .NET 8 SDK
            </h3>
            <p className="text-xs text-slate-500">NuGet client package `UabIndia.ERP.Client` with async HttpResponse handlers.</p>
            <div className="pt-2">
              <Badge variant="outline" className="font-mono text-[10px]">dotnet add package UabIndia.ERP.Client</Badge>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-amber-500" />
              Webhook Signing Secret
            </h3>
            <p className="text-xs text-slate-500">Validate HMAC SHA-256 signatures for inbound webhook payloads.</p>
            <div className="pt-2">
              <Badge variant="outline" className="font-mono text-[10px]">X-ERP-Signature</Badge>
            </div>
          </div>
        </div>

        {/* API Endpoint Table */}
        <div className="erp-table-wrap rounded-lg border">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">HTTP Method</th>
                <th className="erp-th">API Route Path</th>
                <th className="erp-th">Endpoint Description</th>
                <th className="erp-th text-right">Required Scope</th>
              </tr>
            </thead>
            <tbody>
              {filteredEndpoints.map((e, idx) => (
                <tr key={idx} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="erp-td">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${getMethodBadge(e.method)}`}>
                      {e.method}
                    </span>
                  </td>
                  <td className="erp-td font-mono font-bold text-xs text-slate-900 dark:text-slate-100">{e.path}</td>
                  <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{e.summary}</td>
                  <td className="erp-td text-right">
                    <Badge variant="outline" className="font-mono text-xs">
                      {e.scope}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
