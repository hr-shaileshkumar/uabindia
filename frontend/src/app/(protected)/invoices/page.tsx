"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type InvoiceRow = {
  id: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  dueDate?: string;
  issueDate?: string;
  soDate?: string;
  expectedDeliveryDate?: string;
  status?: string;
  soNumber?: string;
};

type InvoiceForm = {
  customerId: string;
  soNumber: string;
  amount: number;
  taxAmount: number;
  dueDate: string;
  notes: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Paid: { chip: "erp-chip erp-chip-success", label: "Paid" },
  Outstanding: { chip: "erp-chip erp-chip-info", label: "Outstanding" },
  Overdue: { chip: "erp-chip erp-chip-danger", label: "Overdue" },
  Draft: { chip: "erp-chip erp-chip-neutral", label: "Draft" },
  Cancelled: { chip: "erp-chip erp-chip-danger", label: "Cancelled" },
};

const formatCurrency = (v?: number) => v != null ? `Rs ${v.toLocaleString("en-IN")}` : "-";

function mapSoStatusToInvoiceStatus(soStatus?: string): string {
  switch (soStatus) {
    case "Completed":
      return "Paid";
    case "Confirmed":
      return "Outstanding";
    case "Cancelled":
      return "Cancelled";
    case "Draft":
      return "Draft";
    default:
      return "Outstanding";
  }
}

export default function InvoicesPage() {
  const [records, setRecords] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<InvoiceForm>({
    customerId: "",
    soNumber: "",
    amount: 0,
    taxAmount: 0,
    dueDate: "",
    notes: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.erp.salesOrders.getAll(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const mapped: InvoiceRow[] = list.map((so: InvoiceRow) => ({
        id: so.id,
        invoiceNumber: `INV-${(so.soNumber || so.id?.slice(0, 8) || "").replace("SO-", "")}`,
        customerId: so.customerId,
        customerName: so.customerName || so.customerId,
        amount: so.totalAmount,
        totalAmount: so.totalAmount,
        issueDate: so.soDate,
        dueDate: so.expectedDeliveryDate || so.dueDate,
        status: mapSoStatusToInvoiceStatus(so.status),
        soNumber: so.soNumber,
      }));
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load invoices.");
      setError(msg);
      notifyError(msg, "Invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || form.amount <= 0) return;
    try {
      setSaving(true);
      await hrApi.erp.salesOrders.create({
        soNumber: `SO-${Date.now()}`,
        customerId: form.customerId,
        soDate: new Date().toISOString(),
        expectedDeliveryDate: form.dueDate,
        totalAmount: form.amount + form.taxAmount,
        status: "Draft",
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ customerId: "", soNumber: "", amount: 0, taxAmount: 0, dueDate: "", notes: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create invoice."), "Invoice");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (r.invoiceNumber || "").toLowerCase().includes(q) ||
      (r.customerName || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const now = new Date();
  const paid = filtered.filter((r) => r.status === "Paid").length;
  const outstanding = filtered.filter((r) => r.status === "Outstanding").length;
  const overdue = filtered.filter((r) => {
    if (r.status !== "Outstanding") return false;
    return r.dueDate ? new Date(r.dueDate) < now : false;
  }).length;
  const totalOutstanding = filtered
    .filter((r) => r.status === "Outstanding")
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  return (
    <StandardPageLayout
      title="Invoices"
      subtitle="Manage customer invoices, track payment status, and monitor outstanding receivables across all billing entities."
      eyebrow="Finance / Transactions"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Invoices", value: filtered.length, helper: "visible" },
            { label: "Paid", value: paid, tone: "positive" },
            { label: "Outstanding", value: outstanding, helper: formatCurrency(totalOutstanding), tone: "warning" },
            { label: "Overdue", value: overdue, tone: "danger" },
          ]}
        />
      }
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Create Invoice
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Invoice # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Outstanding">Outstanding</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Invoice</h2>
              <p className="mt-1 text-sm text-slate-500">Raise a new customer invoice against a sales order or standalone transaction.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Customer ID</label>
                  <input className="erp-input" placeholder="Enter customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">SO Reference (optional)</label>
                  <input className="erp-input" placeholder="e.g. SO-2024-0001" value={form.soNumber} onChange={(e) => setForm({ ...form, soNumber: e.target.value })} />
                </div>
                <div>
                  <label className="erp-label">Amount (Rs)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Tax Amount (Rs)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="erp-label">Due Date</label>
                  <input className="erp-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Total</label>
                  <div className="erp-input bg-slate-50 font-semibold text-slate-900">{formatCurrency(form.amount + form.taxAmount)}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Notes</label>
                  <textarea className="erp-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Creating..." : "Create Invoice"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Invoice Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} invoices</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Invoice #</th>
                <th className="erp-th">Customer</th>
                <th className="erp-th">Issue Date</th>
                <th className="erp-th">Due Date</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No invoices found. Create one to get started.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Create Invoice</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Draft"] || STATUS_CONFIG.Draft;
                  const isOverdue = r.status === "Outstanding" && r.dueDate && new Date(r.dueDate) < now;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">{r.invoiceNumber || "-"}</td>
                      <td className="erp-td text-slate-700">{r.customerName || r.customerId || "-"}</td>
                      <td className="erp-td text-slate-600">{r.issueDate ? new Date(r.issueDate).toLocaleDateString("en-IN") : "-"}</td>
                      <td className="erp-td">
                        <span className={isOverdue ? "font-semibold text-red-600" : "text-slate-600"}>
                          {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "-"}
                          {isOverdue && <span className="ml-1 text-xs">!</span>}
                        </span>
                      </td>
                      <td className="erp-td font-semibold text-slate-900">{formatCurrency(r.totalAmount)}</td>
                      <td className="erp-td"><span className={cfg.chip}>{cfg.label}</span></td>
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
