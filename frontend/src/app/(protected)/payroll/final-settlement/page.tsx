"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/erp/templates/UniversalDeleteDialog";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EmployeeOption = { id: string; fullName?: string; employeeCode?: string; status?: string };

type FinalSettlementRecord = {
  id: string;
  employeeId?: string;
  employeeName: string;
  exitDate: string;
  gratuity: number;
  leaveEncashment: number;
  otherDues?: number;
  recoveries?: number;
  totalSettlement: number;
  status: string;
  remarks?: string;
};

const emptyForm = () => ({
  employeeId: "",
  exitDate: new Date().toISOString().slice(0, 10),
  gratuity: "",
  leaveEncashment: "",
  otherDues: "",
  recoveries: "",
  remarks: "",
});

const asList = (raw: unknown): FinalSettlementRecord[] => {
  if (Array.isArray(raw)) return raw as FinalSettlementRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as FinalSettlementRecord[];
  }
  return [];
};

const formatInr = (v?: number) => `₹ ${(v || 0).toLocaleString("en-IN")}`;

export default function FinalSettlementPage() {
  const [records, setRecords] = useState<FinalSettlementRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<FinalSettlementRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [setRes, empRes] = await Promise.all([
        payrollApi.settlements.list(),
        payrollApi.employees(),
      ]);
      setRecords(asList(setRes.data));
      const empRaw = empRes.data?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load settlements"));
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
    return records.filter((r) =>
      [r.employeeName, r.status].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [records, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: FinalSettlementRecord) => {
    setEditingId(row.id);
    setForm({
      employeeId: row.employeeId ?? "",
      exitDate: String(row.exitDate).slice(0, 10),
      gratuity: String(row.gratuity ?? ""),
      leaveEncashment: String(row.leaveEncashment ?? ""),
      otherDues: String(row.otherDues ?? ""),
      recoveries: String(row.recoveries ?? ""),
      remarks: row.remarks ?? "",
    });
    setDrawerOpen(true);
  };

  const payload = () => ({
    employeeId: form.employeeId,
    exitDate: form.exitDate,
    gratuity: Number(form.gratuity) || 0,
    leaveEncashment: Number(form.leaveEncashment) || 0,
    otherDues: Number(form.otherDues) || 0,
    recoveries: Number(form.recoveries) || 0,
    remarks: form.remarks || undefined,
  });

  const handleSave = async () => {
    if (!editingId && !form.employeeId) {
      notifyError("Select an employee.");
      return;
    }
    if (!form.exitDate) {
      notifyError("Exit date is required.");
      return;
    }
    try {
      setSaving(true);
      if (editingId) await payrollApi.settlements.update(editingId, payload());
      else await payrollApi.settlements.create(payload());
      notifySuccess(editingId ? "Settlement updated." : "Settlement created.");
      setDrawerOpen(false);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save settlement."));
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async (id: string) => {
    try {
      await payrollApi.settlements.settle(id);
      notifySuccess("Marked settled.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to settle."));
    }
  };

  return (
    <StandardPageLayout
      title="Final Settlement"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Settlements", value: records.length },
            {
              label: "Settled",
              value: records.filter((r) => r.status === "Settled").length,
              tone: "positive",
            },
            {
              label: "Pending",
              value: records.filter((r) => r.status === "Pending").length,
              tone: "warning",
            },
            {
              label: "Paid Out",
              value: records
                .reduce((total, r) => total + (r.totalSettlement || 0), 0)
                .toLocaleString("en-IN"),
              tone: "info",
            },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton label="New settlement" onClick={openCreate} />
        </>
      }
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter employee…" />}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Exit Date</th>
                <th className="erp-th">Gratuity</th>
                <th className="erp-th">Leave Encashment</th>
                <th className="erp-th">Total</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-td">
                    <ErpEmptyState
                      message="No final settlement records found."
                      action={<ErpCreateButton label="New settlement" onClick={openCreate} />}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="erp-tr">
                    <td className="erp-td text-slate-900">{r.employeeName}</td>
                    <td className="erp-td text-slate-600">
                      {r.exitDate ? new Date(r.exitDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="erp-td text-slate-600">{formatInr(r.gratuity)}</td>
                    <td className="erp-td text-slate-600">{formatInr(r.leaveEncashment)}</td>
                    <td className="erp-td font-medium text-slate-900">{formatInr(r.totalSettlement)}</td>
                    <td className="erp-td">
                      <span
                        className={
                          r.status === "Settled" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== "Settled" ? (
                          <button
                            type="button"
                            className={`${erpButtonClassName.secondary} text-xs text-emerald-700`}
                            onClick={() => void handleSettle(r.id)}
                          >
                            Settle
                          </button>
                        ) : null}
                        <ErpRowActions
                          onView={{ label: "View", onClick: () => setViewRow(r) }}
                          onEdit={
                            r.status !== "Settled"
                              ? { label: "Edit", onClick: () => openEdit(r) }
                              : undefined
                          }
                          onDelete={{ label: "Delete", onClick: () => setDeleteId(r.id) }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Settlement details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Employee</label>
              <p className="text-sm text-slate-800">{viewRow.employeeName}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Exit date</label>
              <p className="text-sm text-slate-800">
                {viewRow.exitDate ? new Date(viewRow.exitDate).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Status</label>
              <p className="text-sm text-slate-800">{viewRow.status}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Gratuity</label>
              <p className="text-sm text-slate-800">{formatInr(viewRow.gratuity)}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Leave encashment</label>
              <p className="text-sm text-slate-800">{formatInr(viewRow.leaveEncashment)}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Other dues</label>
              <p className="text-sm text-slate-800">{formatInr(viewRow.otherDues)}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Recoveries</label>
              <p className="text-sm text-slate-800">{formatInr(viewRow.recoveries)}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Total settlement</label>
              <p className="text-sm font-semibold text-slate-900">{formatInr(viewRow.totalSettlement)}</p>
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
        title={editingId ? "Edit settlement" : "New final settlement"}
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={saving}
            isEdit={Boolean(editingId)}
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Employee *</label>
            <select
              className="erp-select"
              value={form.employeeId}
              disabled={Boolean(editingId)}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName || e.employeeCode || e.id}
                  {e.status ? ` · ${e.status}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Exit date *</label>
            <input
              type="date"
              className="erp-input"
              value={form.exitDate}
              onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Gratuity</label>
            <input
              type="number"
              className="erp-input"
              value={form.gratuity}
              onChange={(e) => setForm({ ...form, gratuity: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Leave encashment</label>
            <input
              type="number"
              className="erp-input"
              value={form.leaveEncashment}
              onChange={(e) => setForm({ ...form, leaveEncashment: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Other dues</label>
            <input
              type="number"
              className="erp-input"
              value={form.otherDues}
              onChange={(e) => setForm({ ...form, otherDues: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Recoveries</label>
            <input
              type="number"
              className="erp-input"
              value={form.recoveries}
              onChange={(e) => setForm({ ...form, recoveries: e.target.value })}
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Remarks</label>
            <textarea
              className="erp-input min-h-20"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete settlement"
        entityName={records.find((r) => r.id === deleteId)?.employeeName}
        onConfirm={async () => {
          if (!deleteId) return;
          await payrollApi.settlements.delete(deleteId);
          notifySuccess("Settlement deleted.");
          setDeleteId(null);
          await load();
        }}
      />
    </StandardPageLayout>
  );
}
