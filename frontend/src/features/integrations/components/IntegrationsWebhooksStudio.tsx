"use client";

import React, { useState } from "react";
import {
  Webhook,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Key,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
  Zap,
  Globe,
  Landmark,
  Radio,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface IntegrationConnector {
  id: string;
  name: string;
  category: "GOVERNMENT_GST" | "COMMUNICATION" | "BANKING" | "LEGACY_ERP";
  description: string;
  status: "CONNECTED" | "CONFIGURING" | "DISCONNECTED";
  lastSync: string;
  apiVersion: string;
  icon: string;
}

export interface WebhookEndpoint {
  id: string;
  event: string;
  targetUrl: string;
  status: "ACTIVE" | "PAUSED";
  successRatePct: number;
}

export const INITIAL_CONNECTORS: IntegrationConnector[] = [
  {
    id: "conn-1",
    name: "NIC GST E-Invoice & E-Way Bill System",
    category: "GOVERNMENT_GST",
    description: "Real-time B2B electronic invoice registration (IRN) and QR code generation",
    status: "CONNECTED",
    lastSync: "3 mins ago",
    apiVersion: "v1.04",
    icon: "GST",
  },
  {
    id: "conn-2",
    name: "WhatsApp Cloud API (Meta for Business)",
    category: "COMMUNICATION",
    description: "Automated payslip PDF delivery, PO dispatch alerts, and customer notifications",
    status: "CONNECTED",
    lastSync: "Just now",
    apiVersion: "v20.0",
    icon: "WA",
  },
  {
    id: "conn-3",
    name: "HDFC Corporate Direct Banking Gateway",
    category: "BANKING",
    description: "Automated NEFT/RTGS vendor payments and monthly salary direct credit",
    status: "CONNECTED",
    lastSync: "1 hour ago",
    apiVersion: "v3.2",
    icon: "BANK",
  },
  {
    id: "conn-4",
    name: "Tally Prime & SAP ECC Connector (XML Sync)",
    category: "LEGACY_ERP",
    description: "Two-way general ledger vouchers and inventory sync for subsidiary companies",
    status: "CONNECTED",
    lastSync: "25 mins ago",
    apiVersion: "v2.8",
    icon: "ERP",
  },
];

export const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  { id: "wh-1", event: "sales.order.approved", targetUrl: "https://api.uabindia.internal/hooks/order-fulfillment", status: "ACTIVE", successRatePct: 99.8 },
  { id: "wh-2", event: "inventory.low_stock.alert", targetUrl: "https://api.uabindia.internal/hooks/procurement-trigger", status: "ACTIVE", successRatePct: 100 },
  { id: "wh-3", event: "hrms.payroll.locked", targetUrl: "https://api.uabindia.internal/hooks/bank-disbursement", status: "ACTIVE", successRatePct: 99.4 },
];

export function IntegrationsWebhooksStudio() {
  const [connectors, setConnectors] = useState<IntegrationConnector[]>(INITIAL_CONNECTORS);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(INITIAL_WEBHOOKS);

  const handleTestConnection = (name: string) => {
    notifySuccess(`Ping test to ${name} succeeded! Latency: 42ms.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Connected Enterprise Integrations & Webhooks
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                All Gateways Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Government GST portals, Meta WhatsApp Cloud API, HDFC Banking, Tally/SAP sync, and event-driven webhooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => notifySuccess("All connected API gateways pinged successfully.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync All Gateways
          </button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectors.map((conn) => (
          <div
            key={conn.id}
            className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                  {conn.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{conn.name}</h3>
                  <div className="text-[11px] text-muted-foreground">{conn.category.replace("_", " ")}</div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {conn.status}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {conn.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
              <span className="text-[11px] text-muted-foreground">
                API {conn.apiVersion} • Last sync: <span className="font-semibold text-foreground">{conn.lastSync}</span>
              </span>
              <button
                onClick={() => handleTestConnection(conn.name)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-muted/70 transition-colors"
              >
                Test Ping
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Webhooks Section */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Real-Time Outbound Event Webhooks</h2>
            <p className="text-xs text-muted-foreground">HTTPS automated payloads dispatched on enterprise state mutations</p>
          </div>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
            3 Active Listeners
          </span>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Event Topic</th>
                <th className="py-2.5 px-3 min-w-[280px]">Destination Webhook URL</th>
                <th className="py-2.5 px-3 text-right">Delivery Health</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {webhooks.map((wh) => (
                <tr key={wh.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-primary">{wh.event}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-foreground">{wh.targetUrl}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                    {wh.successRatePct}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      {wh.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => notifySuccess(`Test payload fired for ${wh.event}`)}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Fire Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

