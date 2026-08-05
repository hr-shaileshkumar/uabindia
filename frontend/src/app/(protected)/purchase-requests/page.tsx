"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Plus,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type PurchaseRequest = {
  id: string;
  requestNumber?: string;
  poNumber?: string;
  requestedBy?: string;
  description?: string;
  itemDescription?: string;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  estimatedCost?: number;
  totalAmount?: number;
  poDate?: string;
  expectedDeliveryDate?: string;
  requiredDate?: string;
  department?: string;
  justification?: string;
  status?: string;
  approvedBy?: string;
  poReference?: string;
  createdAt?: string;
};

type RequestForm = {
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  requiredDate: string;
  department: string;
  justification: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
  Approved: {
    chip: "erp-chip erp-chip-success",
    label: "Approved",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  Pending: {
    chip: "erp-chip erp-chip-warning",
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Rejected: {
    chip: "erp-chip erp-chip-danger",
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  Converted: {
    chip: "erp-chip erp-chip-info",
    label: "Converted to PO",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
  },
  Draft: {
    chip: "erp-chip erp-chip-neutral",
    label: "Draft",
    icon: null,
  },
};

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function PurchaseRequestsPage() {
  const [records, setRecords] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<RequestForm>({
    itemDescription: "",
    quantity: 1,
    estimatedCost: 0,
    requiredDate: "",
    department: "",
    justification: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hrApi.erp.purchaseOrders.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const requests: PurchaseRequest[] = list
        .filter((purchaseOrder: PurchaseRequest) =>
          ["Draft", "Submitted", "Approved"].includes(purchaseOrder.status || ""),
        )
        .map((purchaseOrder: PurchaseRequest, index: number) => ({
          id: purchaseOrder.id || String(index),
          requestNumber: `PR-${(purchaseOrder.poNumber || purchaseOrder.id?.slice(0, 8) || "").replace("PO-", "")}`,
          requestedBy: purchaseOrder.requestedBy || "System User",
          itemDescription: purchaseOrder.description || `Requested item ${index + 1}`,
          quantity: Math.max(1, Math.floor((purchaseOrder.totalAmount || 0) / 1000)) || 1,
          estimatedCost: purchaseOrder.totalAmount || 0,
          requiredDate: purchaseOrder.expectedDeliveryDate,
          department: purchaseOrder.department || "Operations",
          status:
            purchaseOrder.status === "Approved"
              ? "Approved"
              : purchaseOrder.status === "Submitted"
                ? "Pending"
                : "Draft",
          createdAt: purchaseOrder.poDate,
        }));

      setRecords(requests);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load purchase requests.");
      setError(message);
      notifyError(message, "Purchase Requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.itemDescription || form.quantity <= 0) {
      return;
    }

    try {
      setSaving(true);
      await hrApi.erp.purchaseOrders.create({
        poNumber: `PR-${Date.now()}`,
        vendorId: "TBD",
        poDate: new Date().toISOString(),
        expectedDeliveryDate: form.requiredDate,
        totalAmount: form.estimatedCost * form.quantity,
        status: "Draft",
        description: form.itemDescription,
        department: form.department,
        notes: form.justification,
      });
      setShowForm(false);
      setForm({
        itemDescription: "",
        quantity: 1,
        estimatedCost: 0,
        requiredDate: "",
        department: "",
        justification: "",
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create purchase request."), "Purchase Request");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.requestNumber || "").toLowerCase().includes(query) ||
      (record.itemDescription || "").toLowerCase().includes(query) ||
      (record.requestedBy || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approvedCount = filtered.filter((record) =>
    ["Approved", "Converted"].includes(record.status || ""),
  ).length;
  const pendingCount = filtered.filter((record) => record.status === "Pending").length;
  const totalValue = filtered.reduce((sum, record) => sum + (record.estimatedCost || 0), 0);

  return (
    <StandardPageLayout
      title="Purchase Requests"
      subtitle="Keep internal demand capture, approval visibility, and PO readiness in one clean requisition workspace."
      eyebrow="Procurement / Requisition Control"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Requests", value: filtered.length, helper: "visible" },
            { label: "Approved", value: approvedCount, tone: "positive" },
            { label: "Pending", value: pendingCount, tone: "warning" },
            { label: "Value", value: formatCurrency(totalValue), tone: "info" },
          ]}
        />
      }
      actions={
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="erp-action-btn erp-action-btn-primary"
        >
          <Plus className="h-4 w-4" />
          Raise Request
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input
              className="erp-input"
              placeholder="Request number, item, or requester..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-select w-40"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Converted">Converted to PO</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Raise Purchase Request</h2>
              <p className="mt-1 text-sm text-slate-500">
                Capture the item need, department, timing, and justification before sourcing starts.
              </p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div className="md:col-span-2">
                  <label className="erp-label">Item Description</label>
                  <input
                    className="erp-input"
                    placeholder="5 HP ProBook laptops, safety stock, office furniture..."
                    value={form.itemDescription}
                    onChange={(event) => setForm({ ...form, itemDescription: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Quantity</label>
                  <input
                    className="erp-input"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Estimated Unit Cost (Rs)</label>
                  <input
                    className="erp-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.estimatedCost}
                    onChange={(event) =>
                      setForm({ ...form, estimatedCost: Number(event.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Required By</label>
                  <input
                    className="erp-input"
                    type="date"
                    value={form.requiredDate}
                    onChange={(event) => setForm({ ...form, requiredDate: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Department</label>
                  <input
                    className="erp-input"
                    placeholder="Engineering, Operations, Admin..."
                    value={form.department}
                    onChange={(event) => setForm({ ...form, department: event.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Business Justification</label>
                  <textarea
                    className="erp-input"
                    rows={3}
                    value={form.justification}
                    onChange={(event) => setForm({ ...form, justification: event.target.value })}
                    placeholder="Explain why the purchase is needed and any urgency..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Estimated Total</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(form.quantity * form.estimatedCost)}
                </span>
              </div>
              <div className="erp-form-actions">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="erp-action-btn erp-action-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Requisition Register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review requested items, required dates, department demand, and approval state.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Request</th>
                <th className="erp-th">Item</th>
                <th className="erp-th">Qty</th>
                <th className="erp-th text-right">Estimate</th>
                <th className="erp-th">Required By</th>
                <th className="erp-th">Department</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={7} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-td py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-400">No purchase requests found.</p>
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="erp-action-btn erp-action-btn-secondary text-xs"
                      >
                        Raise Request
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const status = STATUS_CONFIG[record.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td font-mono text-xs font-semibold text-slate-700">
                        {record.requestNumber || "-"}
                      </td>
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{record.itemDescription || "-"}</p>
                        {record.requestedBy && (
                          <p className="text-xs text-slate-500">Requested by {record.requestedBy}</p>
                        )}
                      </td>
                      <td className="erp-td text-slate-600">{record.quantity || 0}</td>
                      <td className="erp-td text-right font-semibold text-slate-900">
                        {formatCurrency(record.estimatedCost)}
                      </td>
                      <td className="erp-td text-slate-600">
                        {record.requiredDate
                          ? new Date(record.requiredDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="erp-td">
                        <span className="erp-chip erp-chip-neutral text-xs">
                          {record.department || "-"}
                        </span>
                      </td>
                      <td className="erp-td">
                        <span className={`${status.chip} flex w-fit items-center gap-1`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
