"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput } from "@/components/erp/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/erp/erpStyles";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EmployeeOption = { id: string; fullName?: string; employeeCode?: string };

type TaxDeclarationRecord = {
  id: string;
  employeeId?: string;
  employeeName: string;
  financialYear: number;
  regime: string;
  declaredAmount: number;
  approvedAmount: number;
  section80C_Total?: number;
  section80D_Total?: number;
  section80G_Donation?: number;
  rentPaid?: number;
  proofSubmitted?: boolean;
  status: string;
};

const currentFy = () => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const emptyForm = () => ({
  employeeId: "",
  financialYear: String(currentFy()),
  regime: "Old",
  section80C_Total: "",
  section80D_Total: "",
  section80G_Donation: "",
  rentPaid: "",
  proofSubmitted: false,
});

const asList = (raw: unknown): TaxDeclarationRecord[] => {
  if (Array.isArray(raw)) return raw as TaxDeclarationRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as TaxDeclarationRecord[];
  }
  return [];
};

export default function TaxDeclarationsPage() {
  const [records, setRecords] = useState<TaxDeclarationRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [declRes, empRes] = await Promise.all([payrollApi.taxDeclarations.list(), payrollApi.employees()]);
      setRecords(asList(declRes.data));
      const empRaw = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load tax declarations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => [r.employeeName, r.regime, r.status, String(r.financialYear)].some((v) => (v || "").toLowerCase().includes(q)));
  }, [records, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: TaxDeclarationRecord) => {
    setEditingId(row.id);
    setForm({
      employeeId: row.employeeId ?? "",
      financialYear: String(row.financialYear),
      regime: row.regime || "Old",
      section80C_Total: String(row.section80C_Total ?? ""),
      section80D_Total: String(row.section80D_Total ?? ""),
      section80G_Donation: String(row.section80G_Donation ?? ""),
      rentPaid: String(row.rentPaid ?? ""),
      proofSubmitted: Boolean(row.proofSubmitted),
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editingId && !form.employeeId) {
      notifyError("Select an employee.");
      return;
    }
    const payload = {
      employeeId: form.employeeId,
      financialYear: Number(form.financialYear),
      regime: form.regime,
      section80C_Total: Number(form.section80C_Total) || 0,
      section80D_Total: Number(form.section80D_Total) || 0,
      section80G_Donation: Number(form.section80G_Donation) || 0,
      rentPaid: Number(form.rentPaid) || 0,
      proofSubmitted: form.proofSubmitted,
    };
    try {
      setSaving(true);
      if (editingId) await payrollApi.taxDeclarations.update(editingId, payload);
      else await payrollApi.taxDeclarations.create(payload);
      notifySuccess(editingId ? "Declaration updated." : "Declaration created.");
      setDrawerOpen(false);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save declaration."));
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await payrollApi.taxDeclarations.verify(id);
      notifySuccess("Declaration verified.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to verify declaration."));
    }
  };

  const chip = (status: string) => {
    const s = status.toLowerCase();
    if (s === "verified") return "erp-chip erp-chip-success";
    if (s.includes("proof")) return "erp-chip erp-chip-info";
    if (s === "rejected") return "erp-chip erp-chip-danger";
    return "erp-chip erp-chip-warning";
  };

  return (
    <>
      <ModuleTablePage
        title="Tax Declarations"
        subtitle="Manage employee investment declarations, proof submission, and tax regime selections."
        eyebrow="Payroll / Compliance"
        icon="shield"
        toolbarTitle="Tax declaration register"
        toolbarSubtitle="Capture 80C/80D/80G declarations, then verify proofs for payroll TDS."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} declarations`}
        emptyMessage="No tax declarations found."
        emptyAction={<ListCreateButton label="New declaration" onClick={openCreate} />}
        actions={<ListCreateButton label="New declaration" onClick={openCreate} />}
        filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Filter employee, FY, or status…" />}
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Declarations", value: records.length, helper: "total" },
              {
                label: "Verified",
                value: records.filter((record) => record.status === "Verified").length,
                tone: "positive",
              },
              {
                label: "Pending",
                value: records.filter((record) => record.status !== "Verified").length,
                tone: "warning",
              },
              {
                label: "New Regime",
                value: records.filter((record) => record.regime === "New").length,
                tone: "info",
              },
            ]}
          />
        }
        columns={[
          { label: "Employee" },
          { label: "FY" },
          { label: "Regime" },
          { label: "Declared" },
          { label: "Approved" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td text-slate-900">{r.employeeName}</td>
            <td className="erp-td text-slate-600">{r.financialYear}-{String(r.financialYear + 1).slice(-2)}</td>
            <td className="erp-td">
              <span className="erp-chip erp-chip-neutral">{r.regime}</span>
            </td>
            <td className="erp-td text-slate-600">₹ {(r.declaredAmount || 0).toLocaleString("en-IN")}</td>
            <td className="erp-td text-slate-600">₹ {(r.approvedAmount || 0).toLocaleString("en-IN")}</td>
            <td className="erp-td">
              <span className={chip(r.status)}>{r.status}</span>
            </td>
            <td className="erp-td text-right">
              <div className="inline-flex gap-1">
                <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => openEdit(r)}>
                  Edit
                </button>
                {r.status !== "Verified" ? (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2 text-emerald-700`} onClick={() => void handleVerify(r.id)}>
                    <Check className="h-3.5 w-3.5" />
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
        title={editingId ? "Edit tax declaration" : "New tax declaration"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : editingId ? "Save" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Employee *</label>
            <select
              className={`${erpFormInputClassName} mt-1`}
              value={form.employeeId}
              disabled={Boolean(editingId)}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Financial year *</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.financialYear} onChange={(e) => setForm({ ...form, financialYear: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Regime</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.regime} onChange={(e) => setForm({ ...form, regime: e.target.value })}>
                <option value="Old">Old</option>
                <option value="New">New</option>
              </select>
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Section 80C</label>
            <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.section80C_Total} onChange={(e) => setForm({ ...form, section80C_Total: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Section 80D</label>
            <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.section80D_Total} onChange={(e) => setForm({ ...form, section80D_Total: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Section 80G donation</label>
            <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.section80G_Donation} onChange={(e) => setForm({ ...form, section80G_Donation: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Rent paid</label>
            <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.rentPaid} onChange={(e) => setForm({ ...form, rentPaid: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.proofSubmitted} onChange={(e) => setForm({ ...form, proofSubmitted: e.target.checked })} />
            Proof submitted
          </label>
        </div>
      </SideDrawer>
    </>
  );
}
