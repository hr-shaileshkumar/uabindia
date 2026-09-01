"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type PayrollStructure = {
  id: string;
  name?: string;
  status?: string;
  createdAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

const emptyForm = () => ({
  name: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
});

export default function PayrollStructuresPage() {
  const [structures, setStructures] = useState<PayrollStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<PayrollStructure | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [recentCutoff] = useState(() => Date.now() - 30 * 86400000);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrollApi.structures.list();
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.structures)
            ? raw.structures
            : [];
      setStructures(list);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load structures"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return structures;
    return structures.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) || (s.status || "").toLowerCase().includes(q),
    );
  }, [structures, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: PayrollStructure) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      effectiveFrom: row.effectiveFrom
        ? String(row.effectiveFrom).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      effectiveTo: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : "",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.effectiveFrom) {
      notifyError("Structure name and effective-from date are required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo || undefined,
    };
    try {
      setSaving(true);
      if (editingId) await payrollApi.structures.update(editingId, payload);
      else await payrollApi.structures.create(payload);
      notifySuccess(editingId ? "Structure updated." : "Structure created.");
      setDrawerOpen(false);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save structure."));
    } finally {
      setSaving(false);
    }
  };

  const pendingDeleteIds = deleteId ? [deleteId] : confirmDeleteIds;

  const list = useErpListView({
    listKey: "payroll-structures",
    rows: filtered,
    columns: [
      { key: "name", label: "Name" },
      { key: "effectiveFrom", label: "Effective from", dataType: "date" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created", dataType: "date" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No structures found.",
    onCreate: openCreate,
    createLabel: "New structure",
    onRefresh: () => void load(),
    onBulkDelete: (rows) => {
      if (rows.length === 1 && rows[0]) setDeleteId(rows[0].id);
      else if (rows.length > 1) setConfirmDeleteIds(rows.map((row) => row.id));
    },
    extraFilters: (
      <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter name or status…" />
    ),
    renderRow: (structure) => (
      <tr key={structure.id} className="erp-tr">
        <td className="erp-td text-slate-900">{structure.name || "Structure"}</td>
        <td className="erp-td text-xs text-slate-600">
          {structure.effectiveFrom
            ? new Date(structure.effectiveFrom).toLocaleDateString("en-IN")
            : "—"}
        </td>
        <td className="erp-td text-slate-600">{structure.status || "Active"}</td>
        <td className="erp-td text-slate-600">
          {structure.createdAt
            ? new Date(structure.createdAt).toLocaleDateString("en-IN")
            : "—"}
        </td>
        <td className="erp-td text-right">
          <ErpRowActions
            onView={{ label: "View", onClick: () => setViewRow(structure) }}
            onEdit={{ label: "Edit", onClick: () => openEdit(structure) }}
            onDelete={{ label: "Delete", onClick: () => setDeleteId(structure.id) }}
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Payroll Structures"
      subtitle="Configure salary components, earnings, allowances, deductions, and tax calculation rules."
      eyebrow="Payroll / Configuration"
      icon="settings"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Structures", value: structures.length },
            {
              label: "Active",
              value: structures.filter(
                (s) => !s.status || (s.status || "").toLowerCase() === "active",
              ).length,
              tone: "positive",
            },
            {
              label: "Inactive",
              value: structures.filter((s) => (s.status || "").toLowerCase() === "inactive").length,
              tone: "warning",
            },
            {
              label: "Recent",
              value: structures.filter((s) => {
                const createdAt = s.createdAt ? new Date(s.createdAt) : null;
                return createdAt !== null && createdAt.getTime() >= recentCutoff;
              }).length,
              tone: "info",
            },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New structure" onClick={openCreate} />
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Structure details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Name</label>
              <p className="text-sm text-slate-800">{viewRow.name || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Effective from</label>
              <p className="text-sm text-slate-800">
                {viewRow.effectiveFrom
                  ? new Date(viewRow.effectiveFrom).toLocaleDateString("en-IN")
                  : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Effective to</label>
              <p className="text-sm text-slate-800">
                {viewRow.effectiveTo
                  ? new Date(viewRow.effectiveTo).toLocaleDateString("en-IN")
                  : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Status</label>
              <p className="text-sm text-slate-800">{viewRow.status || "Active"}</p>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit payroll structure" : "New payroll structure"}
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
            <label className="erp-label">Name *</label>
            <input
              className="erp-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Effective from *</label>
            <input
              type="date"
              className="erp-input"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Effective to</label>
            <input
              type="date"
              className="erp-input"
              value={form.effectiveTo}
              onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={pendingDeleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setConfirmDeleteIds([]);
          }
        }}
        title={pendingDeleteIds.length > 1 ? `Delete ${pendingDeleteIds.length} structures` : "Delete payroll structure"}
        entityName={
          pendingDeleteIds.length > 1
            ? `${pendingDeleteIds.length} structures`
            : structures.find((s) => s.id === deleteId)?.name
        }
        onConfirm={async () => {
          for (const id of pendingDeleteIds) {
            await payrollApi.structures.delete(id);
          }
          notifySuccess(pendingDeleteIds.length > 1 ? "Structures deleted." : "Structure deleted.");
          setDeleteId(null);
          setConfirmDeleteIds([]);
          await load();
        }}
      />
    </StandardPageLayout>
  );
}
