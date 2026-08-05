"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle, Clock, Plus, RotateCcw, XCircle } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ReturnRow = {
  id: string;
  returnNumber?: string;
  customerId?: string;
  customerName?: string;
  originalOrderRef?: string;
  amount?: number;
  reason?: string;
  returnDate?: string;
  status?: string;
  creditNoteNumber?: string;
  soNumber?: string;
  totalAmount?: number;
  soDate?: string;
};

type ReturnForm = {
  customerId: string;
  originalOrderRef: string;
  amount: number;
  reason: string;
  returnDate: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
  Pending: {
    chip: "erp-chip erp-chip-warning",
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Processed: {
    chip: "erp-chip erp-chip-success",
    label: "Processed",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  Rejected: {
    chip: "erp-chip erp-chip-danger",
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  Approved: {
    chip: "erp-chip erp-chip-info",
    label: "Approved",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
};

const RETURN_REASONS = [
  "Defective Product",
  "Wrong Item Delivered",
  "Damaged in Transit",
  "Customer Changed Mind",
  "Quantity Mismatch",
  "Quality Issue",
  "Other",
];

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function ReturnsPage() {
  const [records, setRecords] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<ReturnForm>({
    customerId: "",
    originalOrderRef: "",
    amount: 0,
    reason: "Defective Product",
    returnDate: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hrApi.erp.salesOrders.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const mapped: ReturnRow[] = list
        .filter((salesOrder: ReturnRow) => salesOrder.status === "Cancelled")
        .map((salesOrder: ReturnRow, index: number) => ({
          id: salesOrder.id || String(index),
          returnNumber: `RTN-${(salesOrder.soNumber || salesOrder.id?.slice(0, 8) || "").replace("SO-", "")}`,
          customerId: salesOrder.customerId,
          customerName: salesOrder.customerName || salesOrder.customerId,
          originalOrderRef: salesOrder.soNumber,
          amount: salesOrder.totalAmount,
          reason: "Customer Changed Mind",
          returnDate: salesOrder.soDate,
          status: "Pending",
        }));

      setRecords(mapped);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load return records.");
      setError(message);
      notifyError(message, "Returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerId) {
      return;
    }

    try {
      setSaving(true);
      await hrApi.erp.payments.create({
        paymentType: "CreditNote",
        customerId: form.customerId,
        amount: -Math.abs(form.amount),
        paymentDate: form.returnDate,
        referenceNumber: form.originalOrderRef,
        notes: form.reason,
        status: "Pending",
      });
      setShowForm(false);
      setForm({
        customerId: "",
        originalOrderRef: "",
        amount: 0,
        reason: "Defective Product",
        returnDate: new Date().toISOString().split("T")[0],
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create return."), "Return");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.returnNumber || "").toLowerCase().includes(query) ||
      (record.customerName || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const processedCount = filtered.filter((record) => record.status === "Processed").length;
  const pendingCount = filtered.filter((record) => record.status === "Pending").length;
  const totalReturnValue = filtered.reduce((sum, record) => sum + (record.amount || 0), 0);

  return (
    <StandardPageLayout
      title="Returns Management"
      subtitle="Handle return capture, credit-note workflow, and customer reverse-flow visibility from one simple screen."
      eyebrow="Sales / Return Control"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Returns", value: filtered.length, helper: "visible" },
            { label: "Processed", value: processedCount, tone: "positive" },
            { label: "Pending", value: pendingCount, tone: "warning" },
            { label: "Value", value: formatCurrency(totalReturnValue), tone: "info" },
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
          New Return
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input
              className="erp-input"
              placeholder="Return number or customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-select w-36"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Processed">Processed</option>
              <option value="Rejected">Rejected</option>
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
              <h2 className="erp-panel-title">Initiate Return</h2>
              <p className="mt-1 text-sm text-slate-500">
                Link the return to the original order, amount, reason, and customer reference.
              </p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Customer ID</label>
                  <input
                    className="erp-input"
                    placeholder="Enter customer ID"
                    value={form.customerId}
                    onChange={(event) => setForm({ ...form, customerId: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Original Order Reference</label>
                  <input
                    className="erp-input"
                    placeholder="SO-2024-0001"
                    value={form.originalOrderRef}
                    onChange={(event) => setForm({ ...form, originalOrderRef: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Return Amount (Rs)</label>
                  <input
                    className="erp-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Return Date</label>
                  <input
                    className="erp-input"
                    type="date"
                    value={form.returnDate}
                    onChange={(event) => setForm({ ...form, returnDate: event.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Reason</label>
                  <select
                    className="erp-select"
                    value={form.reason}
                    onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  >
                    {RETURN_REASONS.map((reason) => (
                      <option key={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
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
                  {saving ? "Saving..." : "Initiate Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Returns Register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review return references, customer impact, reason codes, and processing state.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Return</th>
                <th className="erp-th">Customer</th>
                <th className="erp-th">Order Ref</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Reason</th>
                <th className="erp-th">Date</th>
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
                      <RotateCcw className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-400">No return records found.</p>
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="erp-action-btn erp-action-btn-secondary text-xs"
                      >
                        New Return
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const status = STATUS_CONFIG[record.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">
                        {record.returnNumber || "-"}
                      </td>
                      <td className="erp-td text-slate-700">
                        {record.customerName || record.customerId || "-"}
                      </td>
                      <td className="erp-td font-mono text-xs text-slate-600">
                        {record.originalOrderRef || "-"}
                      </td>
                      <td className="erp-td font-semibold text-slate-900">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="erp-td">
                        <span className="erp-chip erp-chip-neutral text-xs">{record.reason || "-"}</span>
                      </td>
                      <td className="erp-td text-slate-600">
                        {record.returnDate
                          ? new Date(record.returnDate).toLocaleDateString("en-IN")
                          : "-"}
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
