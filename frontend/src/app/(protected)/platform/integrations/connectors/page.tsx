"use client";

import React, { useState } from "react";
import { Key, Plus, Eye, CheckCircle2, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface ConnectorRow {
  id: string;
  name: string;
  category: "Payment Gateway" | "Communication" | "Cloud Storage" | "Productivity";
  provider: string;
  status: "Connected" | "Configured" | "Disconnected";
  lastSyncAt: string;
}

const SEED_CONNECTORS: ConnectorRow[] = [
  { id: "conn_1", name: "Razorpay Payment Gateway", category: "Payment Gateway", provider: "Razorpay", status: "Connected", lastSyncAt: "2026-07-29 12:10" },
  { id: "conn_2", name: "Stripe Subscriptions", category: "Payment Gateway", provider: "Stripe", status: "Connected", lastSyncAt: "2026-07-28 15:40" },
  { id: "conn_3", name: "WhatsApp Business API", category: "Communication", provider: "Twilio / Meta", status: "Connected", lastSyncAt: "2026-07-29 08:30" },
  { id: "conn_4", name: "Microsoft 365 Outlook & Teams", category: "Productivity", provider: "Microsoft Azure", status: "Connected", lastSyncAt: "2026-07-29 11:05" },
  { id: "conn_5", name: "AWS S3 MinIO Storage", category: "Cloud Storage", provider: "Amazon Web Services", status: "Connected", lastSyncAt: "2026-07-29 13:00" },
];

export default function IntegrationConnectorsPage() {
  const [connectors] = useState<ConnectorRow[]>(SEED_CONNECTORS);
  const [search, setSearch] = useState("");

  const filteredConnectors = connectors.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Connected APIs", value: connectors.filter((c) => c.status === "Connected").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Active Connectors" },
    { label: "Payment Gateways", value: connectors.filter((c) => c.category === "Payment Gateway").length, tone: "info", icon: <Key className="h-3.5 w-3.5" />, subtext: "Razorpay & Stripe" },
    { label: "Messaging Services", value: connectors.filter((c) => c.category === "Communication").length, tone: "warning", icon: <Layers className="h-3.5 w-3.5" />, subtext: "WhatsApp API" },
    { label: "Sync Health", value: "99.9%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Optimal" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Third-Party Integration Connectors Marketplace"
      subtitle="Configure enterprise connectors for Razorpay, Stripe, WhatsApp Business, Microsoft 365, Google Workspace, and AWS S3."
      categoryTag="Integrations Ecosystem"
      kpiMetrics={kpis}
      searchPlaceholder="Filter connector name, provider, or category..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Add Connector"
      onPrimaryAction={() => notifySuccess("Connector wizard opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Connector Name</th>
              <th className="erp-th">Provider</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Last Sync</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredConnectors.map((c) => (
              <tr key={c.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-indigo-500" />
                  {c.name}
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{c.provider}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {c.category}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-slate-500">{c.lastSyncAt}</td>
                <td className="erp-td text-right">
                  <span className="erp-chip erp-chip-success">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
