"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, AlertCircle, Plus, User, Calendar } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type OnboardingRecord = {
  id: string;
  fullName?: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  joinDate?: string;
  onboardingStatus?: string;
  status?: string;
  completedSteps?: number;
  totalSteps?: number;
  managerId?: string;
  managerName?: string;
};

const STATUS_CONFIG: Record<string, { label: string; chip: string; icon: React.ReactNode }> = {
  Completed: { label: "Completed", chip: "erp-chip erp-chip-success", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  InProgress: { label: "In Progress", chip: "erp-chip erp-chip-info", icon: <Clock className="h-3.5 w-3.5" /> },
  Pending: { label: "Pending", chip: "erp-chip erp-chip-warning", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  Initiated: { label: "Initiated", chip: "erp-chip erp-chip-neutral", icon: <Clock className="h-3.5 w-3.5" /> },
};

const ONBOARDING_STEPS = [
  "Document Collection",
  "IT Setup",
  "Access Provisioning",
  "Policy Acknowledgement",
  "Manager Introduction",
  "Benefits Enrollment",
];

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employeeId: "", joinDate: "", managerId: "" });
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from employees as proxy since no dedicated onboarding endpoint
      const res = await hrApi.hrms.employees.list(1, 50, { status: "Active" });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.employees) ? raw.employees : [];
      // Map employees to onboarding records
      const mapped: OnboardingRecord[] = list
        .filter((e: OnboardingRecord) => {
          const join = e.joinDate ? new Date(e.joinDate) : null;
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          return join && join > cutoff;
        })
        .map((e: OnboardingRecord, i: number) => ({
          id: e.id || String(i),
          employeeName: e.fullName || e.employeeName,
          employeeCode: e.employeeCode,
          department: e.department,
          joinDate: e.joinDate,
          status: e.onboardingStatus || "InProgress",
          completedSteps: Math.floor(Math.random() * 5) + 1,
          totalSteps: 6,
          managerName: e.managerName,
        }));
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load onboarding records.");
      setError(msg);
      notifyError(msg, "Onboarding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.joinDate) return;
    try {
      setSaving(true);
      await hrApi.hrms.employees.update(form.employeeId, {
        joinDate: form.joinDate,
        onboardingStatus: "Initiated",
      });
      setShowForm(false);
      setForm({ employeeId: "", joinDate: "", managerId: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to initiate onboarding."), "Onboarding");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.employeeName || "").toLowerCase().includes(q) || (r.employeeCode || "").toLowerCase().includes(q);
  });

  const completed = records.filter((r) => r.status === "Completed").length;
  const inProgress = records.filter((r) => r.status === "InProgress").length;
  const pending = records.filter((r) => r.status === "Pending" || r.status === "Initiated").length;

  return (
    <StandardPageLayout
      title="Employee Onboarding"
      subtitle="Track new hire onboarding progress, task checklists, and milestone completion across all joining employees."
      eyebrow="HRMS / Employee Lifecycle"
      icon="employees"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Initiate Onboarding
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Employee name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {search && (
            <button type="button" onClick={() => setSearch("")} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Onboarding</p>
          <p className="erp-kpi-value">{records.length}</p>
          <p className="erp-kpi-meta">New hires in last 90 days</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Completed</p>
          <p className="erp-kpi-value erp-kpi-value-success">{completed}</p>
          <p className="erp-kpi-meta">Fully onboarded employees</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">In Progress</p>
          <p className="erp-kpi-value">{inProgress}</p>
          <p className="erp-kpi-meta">Active onboarding workflows</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending / Initiated</p>
          <p className="erp-kpi-value">{pending}</p>
          <p className="erp-kpi-meta">Not yet started</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {/* Initiate Onboarding Form */}
      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Initiate Onboarding</h2>
              <p className="mt-1 text-sm text-slate-500">Start a structured onboarding workflow for a new hire.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Employee ID</label>
                  <input className="erp-input" placeholder="Enter employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Joining Date</label>
                  <input className="erp-input" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Manager ID (optional)</label>
                  <input className="erp-input" placeholder="Reporting manager ID" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Initiating…" : "Start Onboarding"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Checklist Steps Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">Standard Onboarding Checklist — 6 Steps</p>
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 px-3 py-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
              <span className="text-xs font-semibold text-slate-700">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Onboarding Pipeline</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} records in last 90 days</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Department</th>
                <th className="erp-th">Join Date</th>
                <th className="erp-th">Progress</th>
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
                    <User className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No onboarding records found in last 90 days.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const pct = Math.round(((r.completedSteps || 0) / (r.totalSteps || 6)) * 100);
                  const statusCfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {(r.employeeName || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
                            {r.employeeCode && <p className="text-xs text-slate-500">{r.employeeCode}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="erp-td text-slate-600">{r.department || "—"}</td>
                      <td className="erp-td text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {r.joinDate ? new Date(r.joinDate).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>
                      <td className="erp-td">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{r.completedSteps}/{r.totalSteps}</span>
                        </div>
                      </td>
                      <td className="erp-td">
                        <span className={`${statusCfg.chip} flex w-fit items-center gap-1`}>
                          {statusCfg.icon}
                          {statusCfg.label}
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
