"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpApproveRejectButtons,
  ErpCreateButton,
  ErpDrawerFooter,
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EmployeeOption = { id: string; fullName?: string; employeeCode?: string };

type BonusRow = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  bonusType?: string;
  amount?: number;
  bonusAmount?: number;
  paymentMonth?: string;
  status?: string;
  remarks?: string;
};

const BONUS_TYPES = [
  "Performance Bonus",
  "Festival Bonus",
  "Retention Bonus",
  "Joining Bonus",
  "Annual Bonus",
  "Referral Bonus",
  "Special Award",
  "Other",
];
const formatCurrency = (v?: number) => (v != null ? `₹${v.toLocaleString("en-IN")}` : "—");

const emptyForm = () => ({
  employeeId: "",
  bonusType: "Performance Bonus",
  amount: "",
  paymentMonth: new Date().toISOString().slice(0, 7),
  remarks: "",
});

const asList = (raw: unknown): BonusRow[] => {
  if (Array.isArray(raw)) return raw as BonusRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BonusRow[];
  }
  return [];
};

const chip = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "approved") return "erp-chip erp-chip-success";
  if (s === "rejected") return "erp-chip erp-chip-danger";
  return "erp-chip erp-chip-warning";
};

export default function PayrollBonusPage() {
  const [records, setRecords] = useState<BonusRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<BonusRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bonusRes, empRes] = await Promise.all([payrollApi.bonuses.list(), payrollApi.employees()]);
      setRecords(asList(bonusRes.data));
      const empRaw = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load bonuses"));
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
        [r.employeeName, r.employeeCode, r.bonusType, r.status].some((v) =>
          (v || "").toLowerCase().includes(q),
        );
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const amountOf = (r: BonusRow) => r.amount ?? r.bonusAmount ?? 0;

  const handleSave = async () => {
    if (!form.employeeId || !form.amount || !form.paymentMonth) {
      notifyError("Employee, amount, and payment month are required.");
      return;
    }
    try {
      setSaving(true);
      await payrollApi.bonuses.create({
        employeeId: form.employeeId,
        bonusType: form.bonusType,
        amount: Number(form.amount),
        paymentMonth: form.paymentMonth,
        remarks: form.remarks || undefined,
      });
      notifySuccess("Bonus created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create bonus."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "approve" | "pay" | "reject") => {
    try {
      if (action === "approve") await payrollApi.bonuses.approve(id);
      if (action === "pay") await payrollApi.bonuses.pay(id);
      if (action === "reject") await payrollApi.bonuses.reject(id);
      notifySuccess("Bonus updated.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  return (
    <StandardPageLayout
      title="Bonus Management"
      icon="credit-card"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Bonuses", value: records.length },
            {
              label: "Paid",
              value: records.filter((r) => (r.status || "").toLowerCase() === "paid").length,
              tone: "positive",
            },
            {
              label: "Pending",
              value: records.filter((r) => (r.status || "").toLowerCase() === "pending").length,
              tone: "warning",
            },
            {
              label: "Outlay",
              value: formatCurrency(records.reduce((s, r) => s + amountOf(r), 0)),
              tone: "info",
            },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton
            label="Add bonus"
            onClick={() => {
              setForm(emptyForm());
              setDrawerOpen(true);
            }}
          />
        </>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter employee or type…" />
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-select w-36"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Type</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Month</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-td">
                    <ErpEmptyState
                      message="No bonus entries found."
                      action={
                        <ErpCreateButton
                          label="Add bonus"
                          onClick={() => {
                            setForm(emptyForm());
                            setDrawerOpen(true);
                          }}
                        />
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="erp-tr">
                    <td className="erp-td">
                      <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
                      {r.employeeCode ? <p className="text-xs text-slate-500">{r.employeeCode}</p> : null}
                    </td>
                    <td className="erp-td">
                      <span className="erp-chip erp-chip-neutral">{r.bonusType}</span>
                    </td>
                    <td className="erp-td font-medium text-emerald-700">{formatCurrency(amountOf(r))}</td>
                    <td className="erp-td text-slate-600">{r.paymentMonth || "—"}</td>
                    <td className="erp-td">
                      <span className={chip(r.status)}>{r.status}</span>
                    </td>
                    <td className="erp-td text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(r.status || "").toLowerCase() === "pending" ? (
                          <ErpApproveRejectButtons
                            onApprove={() => void runAction(r.id, "approve")}
                            onReject={() => void runAction(r.id, "reject")}
                          />
                        ) : null}
                        {(r.status || "").toLowerCase() === "approved" ? (
                          <button
                            type="button"
                            className={`${erpButtonClassName.secondary} text-xs`}
                            onClick={() => void runAction(r.id, "pay")}
                          >
                            Mark paid
                          </button>
                        ) : null}
                        <ErpRowActions onView={{ label: "View", onClick: () => setViewRow(r) }} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Bonus details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Employee</label>
              <p className="text-sm text-slate-800">
                {viewRow.employeeName || "—"}
                {viewRow.employeeCode ? ` (${viewRow.employeeCode})` : ""}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Type</label>
              <p className="text-sm text-slate-800">{viewRow.bonusType || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Amount</label>
              <p className="text-sm text-slate-800">{formatCurrency(amountOf(viewRow))}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Month</label>
              <p className="text-sm text-slate-800">{viewRow.paymentMonth || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Status</label>
              <p className="text-sm text-slate-800">{viewRow.status || "—"}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Remarks</label>
              <p className="text-sm text-slate-800">{viewRow.remarks || "—"}</p>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add bonus"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel="Create"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Employee *</label>
            <select
              className="erp-select"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName || e.employeeCode || e.id}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Bonus type</label>
            <select
              className="erp-select"
              value={form.bonusType}
              onChange={(e) => setForm({ ...form, bonusType: e.target.value })}
            >
              {BONUS_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Amount *</label>
            <input
              type="number"
              className="erp-input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Payment month *</label>
            <input
              type="month"
              className="erp-input"
              value={form.paymentMonth}
              onChange={(e) => setForm({ ...form, paymentMonth: e.target.value })}
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Remarks</label>
            <textarea
              className="erp-input min-h-20"
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
