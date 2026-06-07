"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type PayrollRun = {
  id: string;
  runCode?: string;
  runDate?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  status?: string;
  totalEmployees?: number;
  totalGross?: number;
  totalNet?: number;
  totalDeductions?: number;
  processedBy?: string;
};

const STATUS_CHIP: Record<string, string> = {
  completed: "erp-chip erp-chip-success",
  processed: "erp-chip erp-chip-success",
  pending: "erp-chip erp-chip-warning",
  draft: "erp-chip erp-chip-neutral",
  processing: "erp-chip erp-chip-info",
  failed: "erp-chip erp-chip-danger",
};

const formatCurrency = (v?: number) =>
  v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [newRunForm, setNewRunForm] = useState({
    payPeriodStart: "",
    payPeriodEnd: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.payroll.runs.list(statusFilter || undefined);
      const raw = res.data;
      setRuns(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load payroll runs.");
      setError(msg);
      notifyError(msg, "Payroll Runs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await hrApi.payroll.runs.create(newRunForm);
      setShowNewModal(false);
      setNewRunForm({ payPeriodStart: "", payPeriodEnd: "", notes: "" });
      void loadRuns();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create payroll run."), "New Run");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setCompleting(id);
      await hrApi.payroll.runs.complete(id);
      void loadRuns();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to complete payroll run."), "Complete Run");
    } finally {
      setCompleting(null);
    }
  };

  const completed = runs.filter((r) => ["completed", "processed"].includes((r.status || "").toLowerCase())).length;
  const pending = runs.filter((r) => ["pending", "draft"].includes((r.status || "").toLowerCase())).length;
  const totalNet = runs.reduce((s, r) => s + (r.totalNet || 0), 0);

  return (
    <>
      {showNewModal && (
        <div className="erp-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="erp-modal-card erp-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-accent" />
            <div className="erp-modal-header">
              <div className="flex items-center gap-3">
                <span className="erp-modal-icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </span>
                <span className="erp-modal-title">New Payroll Run</span>
              </div>
              <button type="button" onClick={() => setShowNewModal(false)} className="erp-modal-close" aria-label="Close">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateRun}>
              <div className="erp-modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Pay Period Start</label>
                    <input className="erp-input" type="date" value={newRunForm.payPeriodStart} onChange={(e) => setNewRunForm({ ...newRunForm, payPeriodStart: e.target.value })} required />
                  </div>
                  <div>
                    <label className="erp-label">Pay Period End</label>
                    <input className="erp-input" type="date" value={newRunForm.payPeriodEnd} onChange={(e) => setNewRunForm({ ...newRunForm, payPeriodEnd: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="erp-label">Notes (optional)</label>
                  <textarea className="erp-input" rows={2} value={newRunForm.notes} onChange={(e) => setNewRunForm({ ...newRunForm, notes: e.target.value })} placeholder="Add any notes for this run…" />
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" onClick={() => setShowNewModal(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">
                  {saving ? "Creating…" : "Create Run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StandardPageLayout
        title="Payroll Runs"
        subtitle="Create and manage payroll processing cycles, track status, and finalize salary disbursements."
        eyebrow="Payroll / Processing"
        icon="payroll"
        actions={
          <button type="button" onClick={() => setShowNewModal(true)} className="erp-action-btn erp-action-btn-primary">
            + New Run
          </button>
        }
        filters={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="erp-label">Status</label>
              <select className="erp-select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        }
      >
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card">
            <p className="erp-kpi-label">Total Runs</p>
            <p className="erp-kpi-value">{runs.length}</p>
            <p className="erp-kpi-meta">All payroll processing cycles</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-success">
            <p className="erp-kpi-label">Completed</p>
            <p className="erp-kpi-value erp-kpi-value-success">{completed}</p>
            <p className="erp-kpi-meta">Successfully processed</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-warning">
            <p className="erp-kpi-label">Pending / Draft</p>
            <p className="erp-kpi-value">{pending}</p>
            <p className="erp-kpi-meta">Awaiting action</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-info">
            <p className="erp-kpi-label">Total Disbursed</p>
            <p className="erp-kpi-value">{formatCurrency(totalNet)}</p>
            <p className="erp-kpi-meta">Sum of net across all runs</p>
          </div>
        </div>

        {error && <div className="erp-alert-error">{error}</div>}

        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Run Ledger</h2>
              <p className="mt-1 text-sm text-slate-500">{runs.length} payroll runs</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Run / Period</th>
                  <th className="erp-th">Employees</th>
                  <th className="erp-th">Gross</th>
                  <th className="erp-th">Deductions</th>
                  <th className="erp-th">Net Salary</th>
                  <th className="erp-th">Status</th>
                  <th className="erp-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                  ))
                ) : runs.length === 0 ? (
                  <tr><td colSpan={7} className="erp-td py-12 text-center text-slate-400">No payroll runs found. Create one to get started.</td></tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <div>
                          <p className="font-medium text-slate-900">{r.runCode || `Run ${r.id.slice(0, 8)}`}</p>
                          <p className="text-xs text-slate-500">
                            {r.payPeriodStart ? new Date(r.payPeriodStart).toLocaleDateString("en-IN") : "—"} → {r.payPeriodEnd ? new Date(r.payPeriodEnd).toLocaleDateString("en-IN") : "—"}
                          </p>
                        </div>
                      </td>
                      <td className="erp-td text-slate-600">{r.totalEmployees ?? "—"}</td>
                      <td className="erp-td text-slate-700">{formatCurrency(r.totalGross)}</td>
                      <td className="erp-td text-red-600">{formatCurrency(r.totalDeductions)}</td>
                      <td className="erp-td font-semibold text-slate-900">{formatCurrency(r.totalNet)}</td>
                      <td className="erp-td">
                        <span className={STATUS_CHIP[(r.status || "").toLowerCase()] || "erp-chip erp-chip-neutral"}>
                          {r.status || "Draft"}
                        </span>
                      </td>
                      <td className="erp-td text-right">
                        {["pending", "draft"].includes((r.status || "").toLowerCase()) && (
                          <button
                            type="button"
                            disabled={completing === r.id}
                            onClick={() => void handleComplete(r.id)}
                            className="erp-action-btn erp-action-btn-success text-xs px-3"
                          >
                            {completing === r.id ? "Processing…" : "Complete Run"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </StandardPageLayout>
    </>
  );
}
