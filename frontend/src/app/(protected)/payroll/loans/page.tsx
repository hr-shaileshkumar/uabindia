"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput, ListStatusFilter } from "@/components/erp/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/erp/erpStyles";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EmployeeOption = { id: string; fullName?: string; employeeCode?: string };

type LoanRow = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  loanType?: string;
  principalAmount?: number;
  outstandingAmount?: number;
  emiAmount?: number;
  interestRate?: number;
  disbursementDate?: string;
  status?: string;
  installmentsPaid?: number;
  totalInstallments?: number;
};

const LOAN_TYPES = ["Personal Loan", "Home Loan Advance", "Vehicle Loan", "Education Loan", "Medical Emergency", "Festival Advance", "Salary Advance", "Other"];
const formatCurrency = (v?: number) => (v != null ? `₹${v.toLocaleString("en-IN")}` : "—");

const emptyForm = () => ({
  employeeId: "",
  loanType: "Personal Loan",
  principalAmount: "",
  interestRate: "0",
  emiAmount: "",
  totalInstallments: "12",
  disbursementDate: new Date().toISOString().slice(0, 10),
  purpose: "",
});

const asList = (raw: unknown): LoanRow[] => {
  if (Array.isArray(raw)) return raw as LoanRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as LoanRow[];
  }
  return [];
};

const chip = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "approved") return "erp-chip erp-chip-info";
  if (s === "closed") return "erp-chip erp-chip-success";
  if (s === "rejected" || s === "overdue") return "erp-chip erp-chip-danger";
  return "erp-chip erp-chip-warning";
};

export default function PayrollLoansPage() {
  const [records, setRecords] = useState<LoanRow[]>([]);
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
      const [loanRes, empRes] = await Promise.all([payrollApi.loans.list(), payrollApi.employees()]);
      setRecords(asList(loanRes.data));
      const empRaw = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load loans"));
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
        [r.employeeName, r.employeeCode, r.loanType, r.status].some((v) => (v || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const handleSave = async () => {
    if (!form.employeeId || !form.principalAmount || !form.emiAmount) {
      notifyError("Employee, principal, and EMI are required.");
      return;
    }
    try {
      setSaving(true);
      await payrollApi.loans.create({
        employeeId: form.employeeId,
        loanType: form.loanType,
        principalAmount: Number(form.principalAmount),
        interestRate: Number(form.interestRate) || 0,
        emiAmount: Number(form.emiAmount),
        totalInstallments: Number(form.totalInstallments) || 12,
        disbursementDate: form.disbursementDate,
        purpose: form.purpose || undefined,
      });
      notifySuccess("Loan created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create loan."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "approve" | "activate" | "recordEmi" | "close") => {
    try {
      if (action === "approve") await payrollApi.loans.approve(id);
      if (action === "activate") await payrollApi.loans.activate(id);
      if (action === "recordEmi") await payrollApi.loans.recordEmi(id);
      if (action === "close") await payrollApi.loans.close(id);
      notifySuccess(action === "recordEmi" ? "EMI recorded." : "Loan updated.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  return (
    <>
      <ModuleTablePage
        title="Employee Loans"
        subtitle="Manage employee loan disbursements, EMI schedules, repayment tracking, and outstanding balance monitoring."
        eyebrow="Payroll / Employee Finance"
        icon="credit-card"
        toolbarTitle="Loan register"
        toolbarSubtitle="Create loans, approve disbursement, then record EMI until the balance is closed."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} loans`}
        emptyMessage="No loan records found."
        emptyAction={<ListCreateButton label="New loan" onClick={() => setDrawerOpen(true)} />}
        actions={<ListCreateButton label="New loan" onClick={() => setDrawerOpen(true)} />}
        filters={
          <>
            <ListSearchInput value={search} onChange={setSearch} placeholder="Filter employee or type…" />
            <ListStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Active", value: "active" },
                { label: "Closed", value: "closed" },
              ]}
            />
          </>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Loans", value: records.length, helper: "total" },
              { label: "Active", value: records.filter((r) => r.status === "Active").length, tone: "info" },
              {
                label: "Outstanding",
                value: formatCurrency(records.reduce((s, r) => s + (r.outstandingAmount || 0), 0)),
                tone: "warning",
              },
              {
                label: "Disbursed",
                value: formatCurrency(records.reduce((s, r) => s + (r.principalAmount || 0), 0)),
                tone: "positive",
              },
            ]}
          />
        }
        columns={[
          { label: "Employee" },
          { label: "Type" },
          { label: "Principal" },
          { label: "Outstanding" },
          { label: "Progress" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(r) => {
          const pct = r.totalInstallments ? Math.round(((r.installmentsPaid || 0) / r.totalInstallments) * 100) : 0;
          return (
            <tr key={r.id} className="erp-tr">
              <td className="erp-td">
                <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
                {r.employeeCode ? <p className="text-xs text-slate-500">{r.employeeCode}</p> : null}
              </td>
              <td className="erp-td">
                <span className="erp-chip erp-chip-neutral">{r.loanType}</span>
              </td>
              <td className="erp-td text-slate-900">{formatCurrency(r.principalAmount)}</td>
              <td className="erp-td text-rose-600">{formatCurrency(r.outstandingAmount)}</td>
              <td className="erp-td">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-600">
                    {r.installmentsPaid || 0}/{r.totalInstallments || 0}
                  </span>
                </div>
              </td>
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
                    <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "activate")}>
                      Activate
                    </button>
                  ) : null}
                  {r.status === "Active" ? (
                    <>
                      <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "recordEmi")}>
                        EMI
                      </button>
                      <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "close")}>
                        Close
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        }}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New employee loan"
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
          <div>
            <label className={erpFormLabelClassName}>Loan type</label>
            <select className={`${erpFormInputClassName} mt-1`} value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value })}>
              {LOAN_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Principal *</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.principalAmount} onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>EMI *</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.emiAmount} onChange={(e) => setForm({ ...form, emiAmount: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Interest % p.a.</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Installments</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.totalInstallments} onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Disbursement date</label>
            <input type="date" className={`${erpFormInputClassName} mt-1`} value={form.disbursementDate} onChange={(e) => setForm({ ...form, disbursementDate: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Purpose</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
