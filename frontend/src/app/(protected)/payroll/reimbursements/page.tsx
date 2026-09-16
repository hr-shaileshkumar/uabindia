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

type ReimbursementRecord = {
  id: string;
  employeeId?: string;
  employeeName: string;
  category: string;
  title?: string;
  amount: number;
  submittedDate: string;
  status: string;
};

const CATEGORIES = ["Travel", "Medical", "Internet", "Food", "Conveyance", "General"];

const emptyForm = () => ({
  employeeId: "",
  title: "",
  category: "General",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
});

const asList = (raw: unknown): ReimbursementRecord[] => {
  if (Array.isArray(raw)) return raw as ReimbursementRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as ReimbursementRecord[];
  }
  return [];
};

function LegacyPayrollReimbursementsPage() {
  const [records, setRecords] = useState<ReimbursementRecord[]>([]);
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
      const [reimRes, empRes] = await Promise.all([payrollApi.reimbursements.list(), payrollApi.employees()]);
      setRecords(asList(reimRes.data));
      const empRaw = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load reimbursements"));
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
        [r.employeeName, r.category, r.title, r.status].some((v) => (v || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) {
      notifyError("Title and amount are required.");
      return;
    }
    try {
      setSaving(true);
      await payrollApi.reimbursements.create({
        employeeId: form.employeeId || undefined,
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
      });
      notifySuccess("Reimbursement submitted.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create reimbursement."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "approve" | "reject" | "markPaid") => {
    try {
      if (action === "approve") await payrollApi.reimbursements.approve(id);
      if (action === "reject") await payrollApi.reimbursements.reject(id);
      if (action === "markPaid") await payrollApi.reimbursements.markPaid(id);
      notifySuccess(action === "approve" ? "Approved." : action === "reject" ? "Rejected." : "Marked paid.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  const chip = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved" || s === "paid") return "erp-chip erp-chip-success";
    if (s === "rejected") return "erp-chip erp-chip-danger";
    if (s === "submitted") return "erp-chip erp-chip-warning";
    return "erp-chip erp-chip-neutral";
  };

  return (
    <>
      <ModuleTablePage
        title="Reimbursements"
        subtitle="Process employee expense reimbursements, approvals, and payment tracking."
        eyebrow="Payroll / Setup"
        icon="file"
        toolbarTitle="Reimbursement register"
        toolbarSubtitle="Submit claims, approve them, and mark disbursement from the payroll queue."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} reimbursements`}
        emptyMessage="No reimbursement records found."
        emptyAction={<ListCreateButton label="New claim" onClick={() => setDrawerOpen(true)} />}
        actions={<ListCreateButton label="New claim" onClick={() => setDrawerOpen(true)} />}
        filters={
          <>
            <ListSearchInput value={search} onChange={setSearch} placeholder="Filter employee or category…" />
            <ListStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Submitted", value: "submitted" },
                { label: "Approved", value: "approved" },
                { label: "Paid", value: "paid" },
                { label: "Rejected", value: "rejected" },
              ]}
            />
          </>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Claims", value: records.length, helper: "total" },
              {
                label: "Approved",
                value: records.filter((record) => record.status === "Approved" || record.status === "Paid").length,
                tone: "positive",
              },
              {
                label: "Pending",
                value: records.filter((record) => record.status === "Submitted" || record.status === "Draft").length,
                tone: "warning",
              },
              {
                label: "Amount",
                value: records.reduce((total, record) => total + (record.amount || 0), 0).toLocaleString("en-IN"),
                helper: "sum",
                tone: "info",
              },
            ]}
          />
        }
        columns={[
          { label: "Employee" },
          { label: "Category" },
          { label: "Amount" },
          { label: "Submitted" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td text-slate-900">{r.employeeName || "—"}</td>
            <td className="erp-td text-slate-600">{r.category}</td>
            <td className="erp-td text-slate-600">₹ {(r.amount || 0).toLocaleString("en-IN")}</td>
            <td className="erp-td text-slate-600">{r.submittedDate ? new Date(r.submittedDate).toLocaleDateString("en-IN") : "—"}</td>
            <td className="erp-td">
              <span className={chip(r.status)}>{r.status}</span>
            </td>
            <td className="erp-td text-right">
              <div className="inline-flex gap-1">
                {r.status === "Submitted" ? (
                  <>
                    <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2 text-emerald-700`} onClick={() => void runAction(r.id, "approve")}>
                      Approve
                    </button>
                    <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`} onClick={() => void runAction(r.id, "reject")}>
                      Reject
                    </button>
                  </>
                ) : null}
                {r.status === "Approved" ? (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "markPaid")}>
                    Mark paid
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
        title="New reimbursement"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Submit"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Employee</label>
            <select className={`${erpFormInputClassName} mt-1`} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName || e.employeeCode || e.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Title *</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Category</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Amount *</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Date</label>
            <input type="date" className={`${erpFormInputClassName} mt-1`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Notes</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

export default function PayrollReimbursementsPage() {
  return (
    <DynamicPage
      pageKey="payroll.reimbursements"
      fallback={<LegacyPayrollReimbursementsPage />}
      renderMode="auto"
    />
  );
}
