"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EmployeeOption = { id: string; fullName?: string; employeeCode?: string };

type ArrearsRecord = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  period?: string;
  amount?: number;
  reason?: string;
  status?: string;
};

const ARREARS_REASONS = [
  "Salary Revision Backdated",
  "Incremental Arrears",
  "Promotion Arrear",
  "System Error Correction",
  "Leave Adjustment",
  "OT Adjustment",
  "Other",
];

const formatCurrency = (v?: number) => (v != null ? `₹${v.toLocaleString("en-IN")}` : "—");

const emptyForm = () => ({
  employeeId: "",
  period: new Date().toISOString().slice(0, 7),
  amount: "",
  reason: "Salary Revision Backdated",
});

const asList = (raw: unknown): ArrearsRecord[] => {
  if (Array.isArray(raw)) return raw as ArrearsRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as ArrearsRecord[];
  }
  return [];
};

const chip = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "processed") return "erp-chip erp-chip-success";
  if (s === "approved") return "erp-chip erp-chip-info";
  return "erp-chip erp-chip-warning";
};

const formatPeriod = (period?: string) => {
  if (!period) return "—";
  const d = new Date(`${period}-01`);
  return Number.isNaN(d.getTime()) ? period : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

function LegacyPayrollArrearsPage() {
  const [records, setRecords] = useState<ArrearsRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [arrRes, empRes] = await Promise.all([payrollApi.arrears.list(), payrollApi.employees()]);
      setRecords(asList(arrRes.data));
      const empRaw = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load arrears"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        [r.employeeName, r.employeeCode, r.reason, r.status].some((v) => (v || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const handleSave = async () => {
    if (!form.employeeId || !form.amount) {
      notifyError("Employee and amount are required.");
      return;
    }
    try {
      setSaving(true);
      await payrollApi.arrears.create({
        employeeId: form.employeeId,
        period: form.period,
        amount: Number(form.amount),
        reason: form.reason,
      });
      notifySuccess("Arrears created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create arrears."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "approve" | "process") => {
    try {
      if (action === "approve") await payrollApi.arrears.approve(id);
      if (action === "process") await payrollApi.arrears.process(id);
      notifySuccess(action === "approve" ? "Approved." : "Processed.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  return (
    <>
      <ModuleTablePage
        title="Payroll Arrears"
        subtitle="Process salary arrears for backdated revisions, increments, and pending payroll adjustments."
        eyebrow="Payroll / Processing"
        icon="credit-card"
        toolbarTitle="Arrears register"
        toolbarSubtitle="Record backdated differences, approve them, then process into payroll."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} arrears`}
        emptyMessage="No arrears records found."
        emptyAction={<ListCreateButton label="Add arrears" onClick={() => setDrawerOpen(true)} />}
        actions={<ListCreateButton label="Add arrears" onClick={() => setDrawerOpen(true)} />}
        filters={
          <>
            <ListSearchInput value={search} onChange={setSearch} placeholder="Filter employee or reason…" />
            <ListStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Processed", value: "processed" },
              ]}
            />
          </>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Entries", value: records.length, helper: "arrears" },
              { label: "Processed", value: records.filter((r) => r.status === "Processed").length, tone: "positive" },
              { label: "Pending", value: records.filter((r) => r.status === "Pending").length, tone: "warning" },
              {
                label: "Amount",
                value: formatCurrency(records.reduce((s, r) => s + (r.amount || 0), 0)),
                tone: "info",
              },
            ]}
          />
        }
        columns={[
          { label: "Employee" },
          { label: "Period" },
          { label: "Amount" },
          { label: "Reason" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td">
              <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
              {r.employeeCode ? <p className="text-xs text-slate-500">{r.employeeCode}</p> : null}
            </td>
            <td className="erp-td text-slate-600">{formatPeriod(r.period)}</td>
            <td className="erp-td font-medium text-emerald-700">{formatCurrency(r.amount)}</td>
            <td className="erp-td text-xs text-slate-600">{r.reason || "—"}</td>
            <td className="erp-td">
              <span className={chip(r.status)}>{r.status}</span>
            </td>
            <td className="erp-td text-right">
              <div className="inline-flex gap-1">
                {r.status === "Pending" ? (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "approve")}>
                    Approve
                  </button>
                ) : null}
                {r.status === "Approved" ? (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "process")}>
                    Process
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add arrears"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Employee *</label>
            <select className={`${erpFormInputClassName} mt-1`} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName || e.employeeCode || e.id}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Period</label>
              <input type="month" className={`${erpFormInputClassName} mt-1`} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Amount *</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Reason</label>
            <select className={`${erpFormInputClassName} mt-1`} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              {ARREARS_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

export default function PayrollArrearsPage() {
  return (
    <DynamicPage
      pageKey="payroll.arrears"
      fallback={<LegacyPayrollArrearsPage />}
      renderMode="auto"
    />
  );
}
