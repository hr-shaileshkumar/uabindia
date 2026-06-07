"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ExpenseRow = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  amount?: number;
  currency?: string;
  expenseDate?: string;
  submittedBy?: string;
  employeeName?: string;
  status?: string;
  approvedBy?: string;
  notes?: string;
};

type ExpenseForm = {
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  description: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Approved:  { chip: "erp-chip erp-chip-success", label: "Approved" },
  Pending:   { chip: "erp-chip erp-chip-warning", label: "Pending"  },
  Rejected:  { chip: "erp-chip erp-chip-danger",  label: "Rejected" },
  Draft:     { chip: "erp-chip erp-chip-neutral", label: "Draft"    },
};

const CATEGORIES = ["Travel", "Food & Dining", "Accommodation", "Office Supplies", "Training", "Entertainment", "Medical", "Communication", "Other"];

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function ExpensesPage() {
  const [records, setRecords] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState<ExpenseForm>({
    title: "", category: "Travel", amount: 0, expenseDate: new Date().toISOString().split("T")[0], description: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use payments API as a proxy for expenses (they share the same ledger concept)
      const res = await hrApi.erp.payments.list(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setRecords(list.map((p: ExpenseRow) => ({
        ...p,
        title: p.title || p.description || "Expense",
        category: p.category || "Other",
        status: p.status || "Pending",
        amount: p.amount || 0,
      })));
    } catch {
      // If no payments API, show empty with form
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.amount <= 0) return;
    try {
      setSaving(true);
      await hrApi.erp.payments.create({
        paymentType: "Expense",
        description: form.title,
        amount: form.amount,
        paymentDate: form.expenseDate,
        notes: form.description,
        category: form.category,
        status: "Pending",
      });
      setShowForm(false);
      setForm({ title: "", category: "Travel", amount: 0, expenseDate: new Date().toISOString().split("T")[0], description: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to submit expense."), "Expense");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.title || "").toLowerCase().includes(q) || (r.employeeName || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchCat = !categoryFilter || r.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const totalSpend = filtered.reduce((s, r) => s + (r.amount || 0), 0);
  const approved   = filtered.filter((r) => r.status === "Approved").length;
  const pending    = filtered.filter((r) => r.status === "Pending").length;
  const approvedAmt = filtered.filter((r) => r.status === "Approved").reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <StandardPageLayout
      title="Expense Management"
      subtitle="Submit, review, and approve employee business expenses with category-wise tracking and approval workflows."
      eyebrow="Finance / Transactions"
      icon="file"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Submit Expense
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Title or employee…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Category</label>
            <select className="erp-select w-40" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {(search || statusFilter || categoryFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); setCategoryFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Expenses</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">Matching current filters</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Approved ({approved})</p>
          <p className="erp-kpi-value erp-kpi-value-success">{formatCurrency(approvedAmt)}</p>
          <p className="erp-kpi-meta">Cleared for reimbursement</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending</p>
          <p className="erp-kpi-value">{pending}</p>
          <p className="erp-kpi-meta">Awaiting approval</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Spend</p>
          <p className="erp-kpi-value">{formatCurrency(totalSpend)}</p>
          <p className="erp-kpi-meta">Sum of filtered expenses</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Submit New Expense</h2>
              <p className="mt-1 text-sm text-slate-500">Capture expense details, category, and amount for approval routing.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Title / Purpose</label>
                  <input className="erp-input" placeholder="e.g. Client dinner, Flight to Delhi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Category</label>
                  <select className="erp-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Amount (₹)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Expense Date</label>
                  <input className="erp-input" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Description</label>
                  <textarea className="erp-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of business purpose…" />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Submitting…" : "Submit Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Expense Ledger</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} expense records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Title</th>
                <th className="erp-th">Category</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Date</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Receipt className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No expenses found. Submit one to get started.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Submit Expense</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{r.title || "—"}</p>
                        {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                      </td>
                      <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.category || "Other"}</span></td>
                      <td className="erp-td font-semibold text-slate-900">{formatCurrency(r.amount)}</td>
                      <td className="erp-td text-slate-600">{r.expenseDate ? new Date(r.expenseDate).toLocaleDateString("en-IN") : "—"}</td>
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
