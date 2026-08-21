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
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type PayrollStructure = { id: string; name?: string };

type PayrollComponent = {
  id: string;
  structureId?: string;
  name?: string;
  type?: string;
  amount?: number | null;
  percentage?: number | null;
  isStatutory?: boolean;
};

const emptyForm = () => ({
  structureId: "",
  name: "",
  type: "Earning",
  amount: "",
  percentage: "",
  isStatutory: false,
});

export default function PayrollComponentsPage() {
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [structures, setStructures] = useState<PayrollStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [structureFilter, setStructureFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<PayrollComponent | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const structureName = useCallback(
    (id?: string) => structures.find((s) => s.id === id)?.name || "Unassigned",
    [structures],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [compRes, structRes] = await Promise.all([
        payrollApi.components.list(structureFilter !== "all" ? structureFilter : undefined),
        payrollApi.structures.list(),
      ]);
      const rawComp = compRes.data;
      const rawStruct = structRes.data;
      setComponents(
        Array.isArray(rawComp) ? rawComp : Array.isArray(rawComp?.data) ? rawComp.data : [],
      );
      setStructures(
        Array.isArray(rawStruct)
          ? rawStruct
          : Array.isArray(rawStruct?.data)
            ? rawStruct.data
            : Array.isArray(rawStruct?.structures)
              ? rawStruct.structures
              : [],
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load components"));
    } finally {
      setLoading(false);
    }
  }, [structureFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return components;
    return components.filter((c) =>
      [c.name, c.type, structureName(c.structureId)].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [components, search, structureName]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      structureId: structureFilter !== "all" ? structureFilter : structures[0]?.id || "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (row: PayrollComponent) => {
    setEditingId(row.id);
    setForm({
      structureId: row.structureId ?? "",
      name: row.name ?? "",
      type: row.type || "Earning",
      amount: row.amount != null ? String(row.amount) : "",
      percentage: row.percentage != null ? String(row.percentage) : "",
      isStatutory: Boolean(row.isStatutory),
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notifyError("Component name is required.");
      return;
    }
    if (!editingId && !form.structureId) {
      notifyError("Select a payroll structure.");
      return;
    }
    const payload = {
      structureId: form.structureId,
      name: form.name.trim(),
      type: form.type,
      amount: form.amount ? Number(form.amount) : null,
      percentage: form.percentage ? Number(form.percentage) : null,
      isStatutory: form.isStatutory,
    };
    try {
      setSaving(true);
      if (editingId) await payrollApi.components.update(editingId, payload);
      else await payrollApi.components.create(payload);
      notifySuccess(editingId ? "Component updated." : "Component created.");
      setDrawerOpen(false);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save component."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Payroll Components"
      icon="settings"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Components", value: components.length },
            {
              label: "Earnings",
              value: components.filter((c) => (c.type || "").toLowerCase() === "earning").length,
              tone: "positive",
            },
            {
              label: "Deductions",
              value: components.filter((c) => (c.type || "").toLowerCase() === "deduction").length,
              tone: "danger",
            },
            {
              label: "Statutory",
              value: components.filter((c) => c.isStatutory).length,
              tone: "info",
            },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton
            label="New component"
            onClick={openCreate}
            disabled={structures.length === 0}
          />
        </>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter name or type…" />
          <div>
            <label className="erp-label">Structure</label>
            <select
              className="erp-select min-w-44"
              value={structureFilter}
              onChange={(e) => setStructureFilter(e.target.value)}
            >
              <option value="all">All structures</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || "Structure"}
                </option>
              ))}
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
                <th className="erp-th">Name</th>
                <th className="erp-th">Structure</th>
                <th className="erp-th">Type</th>
                <th className="erp-th">Amount / %</th>
                <th className="erp-th">Statutory</th>
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
                      message={
                        structures.length === 0
                          ? "Create a payroll structure first, then add components."
                          : "No components found."
                      }
                      action={
                        structures.length > 0 ? (
                          <ErpCreateButton label="New component" onClick={openCreate} />
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((component) => (
                  <tr key={component.id} className="erp-tr">
                    <td className="erp-td text-slate-900">{component.name || "Component"}</td>
                    <td className="erp-td text-slate-600">{structureName(component.structureId)}</td>
                    <td className="erp-td text-slate-600">{component.type || "Earning"}</td>
                    <td className="erp-td text-xs text-slate-600">
                      {component.amount != null
                        ? `₹ ${Number(component.amount).toLocaleString("en-IN")}`
                        : "—"}
                      {component.percentage != null ? ` · ${component.percentage}%` : ""}
                    </td>
                    <td className="erp-td">
                      <span
                        className={
                          component.isStatutory ? "erp-chip erp-chip-info" : "erp-chip erp-chip-neutral"
                        }
                      >
                        {component.isStatutory ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <ErpRowActions
                        onView={{ label: "View", onClick: () => setViewRow(component) }}
                        onEdit={{ label: "Edit", onClick: () => openEdit(component) }}
                        onDelete={{ label: "Delete", onClick: () => setDeleteId(component.id) }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Component details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Name</label>
              <p className="text-sm text-slate-800">{viewRow.name || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Structure</label>
              <p className="text-sm text-slate-800">{structureName(viewRow.structureId)}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Type</label>
              <p className="text-sm text-slate-800">{viewRow.type || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Amount</label>
              <p className="text-sm text-slate-800">
                {viewRow.amount != null ? `₹ ${Number(viewRow.amount).toLocaleString("en-IN")}` : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Percentage</label>
              <p className="text-sm text-slate-800">
                {viewRow.percentage != null ? `${viewRow.percentage}%` : "—"}
              </p>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit payroll component" : "New payroll component"}
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
            <label className="erp-label">Structure *</label>
            <select
              className="erp-select"
              value={form.structureId}
              disabled={Boolean(editingId)}
              onChange={(e) => setForm({ ...form, structureId: e.target.value })}
            >
              <option value="">Select structure</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Name *</label>
            <input
              className="erp-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Type *</label>
            <select
              className="erp-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="Earning">Earning</option>
              <option value="Deduction">Deduction</option>
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Statutory</label>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isStatutory}
                onChange={(e) => setForm({ ...form, isStatutory: e.target.checked })}
              />
              Statutory component
            </label>
          </div>
          <div className="erp-field">
            <label className="erp-label">Amount</label>
            <input
              type="number"
              className="erp-input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Percentage</label>
            <input
              type="number"
              className="erp-input"
              value={form.percentage}
              onChange={(e) => setForm({ ...form, percentage: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete payroll component"
        entityName={components.find((c) => c.id === deleteId)?.name}
        onConfirm={async () => {
          if (!deleteId) return;
          await payrollApi.components.delete(deleteId);
          notifySuccess("Component deleted.");
          setDeleteId(null);
          await load();
        }}
      />
    </StandardPageLayout>
  );
}
