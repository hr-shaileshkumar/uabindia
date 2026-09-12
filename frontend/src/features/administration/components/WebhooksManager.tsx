"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName, erpFormInputClassName, erpFormLabelClassName } from "@/components/workspace/styles";
import apiClient from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Globe,
  Shield,
  FileCode,
  Sparkles,
} from "lucide-react";

export type Webhook = {
  id: string;
  name: string;
  targetUrl: string;
  secretKey: string;
  eventsJson: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  lastError?: string;
};

export interface ParsedEdiDocument {
  documentType: string;
  senderId: string;
  receiverId: string;
  controlNumber: string;
  documentNumber: string;
  documentDate: string;
  totalAmount: number;
  currency: string;
  buyerName?: string;
  shipToAddress?: string;
  items: Array<{
    lineNumber: number;
    itemCode: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    description: string;
  }>;
}

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ediDrawerOpen, setEdiDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // EDI Parser state
  const [ediContent, setEdiContent] = useState(
    "ISA*00*          *00*          *ZZ*PARTNER        *ZZ*UABINDIA       *260824*0640*U*00401*000000001*0*P*>~\nGS*PO*PARTNER*UABINDIA*20260824*0640*1*X*004010~\nST*850*0001~\nBEG*00*SA*PO-2026-9876**20260824~\nCUR*BY*USD~\nN1*BY*GLOBAL RETAIL CORP~\nN1*ST*CENTRAL WAREHOUSE DOCK 4~\nPO1*1*100*EA*45.50**VN*SKU-PRO-100~\nPO1*2*50*EA*120.00**VN*SKU-ENT-200~\nTDS*1055000~\nSE*9*0001~\nGE*1*1~\nIEA*1*000000001~"
  );
  const [isParsingEdi, setIsParsingEdi] = useState(false);
  const [parsedEdi, setParsedEdi] = useState<ParsedEdiDocument | null>(null);

  const [form, setForm] = useState({
    name: "",
    targetUrl: "",
    events: ["*"],
  });

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{ success: boolean; webhooks: Webhook[] }>("/webhooks");
      if (res.data?.webhooks) setWebhooks(res.data.webhooks);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load webhooks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWebhooks();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.targetUrl.trim()) {
      notifyError("Name and Target URL are required.");
      return;
    }
    try {
      setSaving(true);
      await apiClient.post("/webhooks", form);
      notifySuccess("Webhook endpoint created.");
      setDrawerOpen(false);
      setForm({ name: "", targetUrl: "", events: ["*"] });
      await loadWebhooks();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create webhook."));
    } finally {
      setSaving(false);
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      setTestingId(id);
      const res = await apiClient.post<{ success: boolean; statusCode: number; durationMs: number; response?: string }>(
        `/webhooks/${id}/test`
      );
      if (res.data.success) {
        notifySuccess(`Ping delivered! HTTP ${res.data.statusCode} (${res.data.durationMs}ms)`);
      } else {
        notifyError(`Ping failed (HTTP ${res.data.statusCode}): ${res.data.response || "Endpoint unreachable"}`);
      }
      await loadWebhooks();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Test ping failed."));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      await apiClient.delete(`/webhooks/${id}`);
      notifySuccess("Webhook deleted.");
      await loadWebhooks();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete webhook."));
    }
  };

  const handleParseEdi = async () => {
    if (!ediContent.trim()) {
      notifyError("Please enter EDI X12 content.");
      return;
    }

    setIsParsingEdi(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: ParsedEdiDocument }>("/integrations/edi/parse", {
        ediContent,
      });
      if (res.data?.data) {
        setParsedEdi(res.data.data);
        notifySuccess(`Parsed ${res.data.data.documentType} document successfully.`);
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to parse EDI document."));
    } finally {
      setIsParsingEdi(false);
    }
  };

  const activeCount = webhooks.filter((w) => w.isActive).length;
  const failureCount = webhooks.reduce((sum, w) => sum + (w.failureCount > 0 ? 1 : 0), 0);

  return (
    <StandardPageLayout
      title="B2B EDI Gateway & External Webhook Hub"
      subtitle="Manage real-time HMAC-signed webhook event subscriptions and ANSI X12 EDI 850/810/856 B2B supply chain translators."
      eyebrow="Integrations / Connectivity"
      icon="settings"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEdiDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            EDI X12 Translator
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`${erpButtonClassName.primary} flex items-center gap-1.5 text-xs cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            New Webhook Subscription
          </button>
        </div>
      }
    >
      <HeaderSummary
        items={[
          { label: "Total Subscriptions", value: webhooks.length },
          { label: "Active Channels", value: activeCount, tone: "success" },
          { label: "Failing Endpoints", value: failureCount, tone: failureCount > 0 ? "danger" : "success" },
        ]}
      />

      {error && <div className="erp-alert-error my-4">{error}</div>}

      {/* Webhooks Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mt-6">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3.5">Endpoint Name</th>
              <th className="p-3.5">Target URL</th>
              <th className="p-3.5">Subscribed Events</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Last Triggered</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {webhooks.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No active webhook subscriptions configured. Create one to receive automated event dispatches.
                </td>
              </tr>
            )}
            {webhooks.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                  {w.name}
                </td>
                <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">{w.targetUrl}</td>
                <td className="p-3.5">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {w.eventsJson}
                  </span>
                </td>
                <td className="p-3.5">
                  {w.failureCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Failing ({w.failureCount})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-slate-500 dark:text-slate-400">{w.lastTriggeredAt ? formatDateTime(w.lastTriggeredAt) : "Never"}</td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => void handleTestPing(w.id)}
                    disabled={testingId === w.id}
                    className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {testingId === w.id ? "Pinging..." : "Test Ping"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(w.id)}
                    className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Webhook Drawer */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Register Webhook Endpoint"
        subtitle="Subscribe external microservices to real-time transactional domain events with HMAC-SHA256 signatures."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className={erpFormLabelClassName}>Subscription Name</label>
            <input
              type="text"
              placeholder="e.g. Shopify Store Sync"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={erpFormInputClassName}
            />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Target Endpoint HTTPS URL</label>
            <input
              type="url"
              placeholder="https://api.partner.com/erp-events"
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              className={erpFormInputClassName}
            />
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4 text-amber-600" />
              Cryptographic Delivery Security
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Each delivery includes a <code>X-UabIndia-Signature</code> header generated using HMAC-SHA256 over the payload using your unique secret key.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            {saving ? "Creating Endpoint..." : "Register Webhook"}
          </button>
        </div>
      </SideDrawer>

      {/* B2B EDI X12 Translator Drawer */}
      <SideDrawer
        open={ediDrawerOpen}
        onClose={() => setEdiDrawerOpen(false)}
        title="B2B ANSI X12 EDI Translator Console"
        subtitle="Parse and validate standard EDI 850 (Purchase Orders), EDI 810 (Invoices), and EDI 856 (Shipment ASNs)."
        width="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className={erpFormLabelClassName}>Raw ANSI X12 EDI Stream</label>
            <textarea
              rows={8}
              value={ediContent}
              onChange={(e) => setEdiContent(e.target.value)}
              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={handleParseEdi}
            disabled={isParsingEdi}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isParsingEdi ? "Translating EDI Document..." : "Parse & Validate EDI Document"}
          </button>

          {parsedEdi && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <span className="font-bold text-sm text-indigo-600 block">{parsedEdi.documentType}</span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    Doc #: {parsedEdi.documentNumber || "N/A"} • Ctrl: {parsedEdi.controlNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Monies</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {formatCurrency(parsedEdi.totalAmount, parsedEdi.currency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Sender / Receiver:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {parsedEdi.senderId} → {parsedEdi.receiverId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Buyer Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {parsedEdi.buyerName || "Standard Partner"}
                  </span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-1 mt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Document Line Items ({parsedEdi.items.length})
                </span>
                {parsedEdi.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{item.itemCode}</span>
                      <span className="text-slate-400 block">
                        Qty: {item.quantity} {item.unitOfMeasure} @ {formatCurrency(item.unitPrice, parsedEdi.currency)}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(item.quantity * item.unitPrice, parsedEdi.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default WebhooksManager;
