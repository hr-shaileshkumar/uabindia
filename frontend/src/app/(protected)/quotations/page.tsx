"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type QuotationRow = {
  id: string;
  quoteNumber?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  validUntil?: string;
  createdDate?: string;
  status?: string;
  notes?: string;
  soNumber?: string;
  totalAmount?: number;
  expectedDeliveryDate?: string;
  soDate?: string;
};

type QuoteForm = {
  customerId: string;
  amount: number;
  validUntil: string;
  notes: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Draft: { chip: "erp-chip erp-chip-neutral", label: "Draft" },
  Sent: { chip: "erp-chip erp-chip-info", label: "Sent" },
  Pending: { chip: "erp-chip erp-chip-warning", label: "Pending" },
  Accepted: { chip: "erp-chip erp-chip-success", label: "Accepted" },
  Rejected: { chip: "erp-chip erp-chip-danger", label: "Rejected" },
  Expired: { chip: "erp-chip erp-chip-neutral", label: "Expired" },
};

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function QuotationsPage() {
  const [records, setRecords] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<QuoteForm>({
    customerId: "",
    amount: 0,
    validUntil: "",
    notes: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hrApi.erp.salesOrders.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const mapped: QuotationRow[] = list
        .filter((salesOrder: QuotationRow) => salesOrder.status === "Draft")
        .map((salesOrder: QuotationRow) => ({
          id: salesOrder.id,
          quoteNumber: `QT-${(salesOrder.soNumber || salesOrder.id?.slice(0, 8) || "").replace("SO-", "")}`,
          customerId: salesOrder.customerId,
          customerName: salesOrder.customerName || salesOrder.customerId,
          amount: salesOrder.totalAmount,
          validUntil: salesOrder.expectedDeliveryDate,
          createdDate: salesOrder.soDate,
          status: "Pending",
          notes: salesOrder.notes,
        }));

      setRecords(mapped);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load quotations.");
      setError(message);
      notifyError(message, "Quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerId || form.amount <= 0) {
      return;
    }

    try {
      setSaving(true);
      await hrApi.erp.salesOrders.create({
        soNumber: `QT-${Date.now()}`,
        customerId: form.customerId,
        soDate: new Date().toISOString(),
        expectedDeliveryDate: form.validUntil,
        totalAmount: form.amount,
        status: "Draft",
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ customerId: "", amount: 0, validUntil: "", notes: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create quotation."), "Quotation");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.quoteNumber || "").toLowerCase().includes(query) ||
      (record.customerName || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const acceptedCount = filtered.filter((record) => record.status === "Accepted").length;
  const _pendingCount = filtered.filter((record) =>
    ["Pending", "Sent"].includes(record.status || ""),
  ).length;
  const pipelineValue = filtered
    .filter((record) => ["Pending", "Sent"].includes(record.status || ""))
    .reduce((sum, record) => sum + (record.amount || 0), 0);
  const conversionRate = filtered.length ? Math.round((acceptedCount / filtered.length) * 100) : 0;

  return (
    <StandardPageLayout
      title="Quotations"
      subtitle="Manage quote creation, validity, and sales pipeline visibility without heavy duplicate UI blocks."
      eyebrow="Sales / Quotation Control"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Quotations", value: filtered.length, helper: "visible" },
            { label: "Accepted", value: acceptedCount, tone: "positive" },
            { label: "Pipeline", value: formatCurrency(pipelineValue), tone: "warning" },
            { label: "Conversion", value: `${conversionRate}%`, tone: "info" },
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
          New Quotation
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input
              className="erp-input"
              placeholder="Quotation number or customer..."
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
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
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
              <h2 className="erp-panel-title">Create Quotation</h2>
              <p className="mt-1 text-sm text-slate-500">
                Set customer reference, value, validity period, and commercial notes.
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
                  <label className="erp-label">Quotation Amount (Rs)</label>
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
                  <label className="erp-label">Valid Until</label>
                  <input
                    className="erp-input"
                    type="date"
                    value={form.validUntil}
                    onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Notes or Terms</label>
                  <textarea
                    className="erp-input"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    placeholder="Pricing notes, validity terms, delivery assumptions..."
                  />
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
                  {saving ? "Creating..." : "Create Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Quotation Register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review quote value, customer, creation date, validity, and status in one list.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Quotation</th>
                <th className="erp-th">Customer</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Created</th>
                <th className="erp-th">Valid Until</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-td py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-400">No quotations found.</p>
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="erp-action-btn erp-action-btn-secondary text-xs"
                      >
                        New Quotation
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const isExpired = record.validUntil && new Date(record.validUntil) < new Date();
                  const statusKey = isExpired ? "Expired" : record.status || "Draft";
                  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Draft;

                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">
                        {record.quoteNumber || "-"}
                      </td>
                      <td className="erp-td text-slate-700">
                        {record.customerName || record.customerId || "-"}
                      </td>
                      <td className="erp-td font-semibold text-slate-900">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="erp-td text-slate-600">
                        {record.createdDate
                          ? new Date(record.createdDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="erp-td">
                        <span className={isExpired ? "font-semibold text-red-600" : "text-slate-600"}>
                          {record.validUntil
                            ? new Date(record.validUntil).toLocaleDateString("en-IN")
                            : "-"}
                          {isExpired ? <span className="ml-1 text-xs">Expired</span> : null}
                        </span>
                      </td>
                      <td className="erp-td">
                        <span className={status.chip}>{status.label}</span>
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
