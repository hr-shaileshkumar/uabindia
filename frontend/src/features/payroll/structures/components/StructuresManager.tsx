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
import { orgApi } from "@/services/modules/org";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Building2, Briefcase, CheckCircle2 } from "lucide-react";
import {
  type PayrollStructure,
  type StructureFormState,
} from "../types/structure.types";

const emptyForm = (): StructureFormState => ({
  name: "",
  description: "",
  companyId: "",
  projectId: "",
  isDefault: false,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
});

export default function StructuresManager() {
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
  const [form, setForm] = useState<StructureFormState>(emptyForm());
  const [recentCutoff] = useState(() => Date.now() - 30 * 86400000);

  // Multi-scope state
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [companiesList, setCompaniesList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  // Load companies
  useEffect(() => {
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  // Load projects
  useEffect(() => {
    orgApi.project.getAll(companyFilter || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [companyFilter]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrollApi.structures.list({
        companyId: companyFilter || undefined,
        projectId: projectFilter || undefined,
      });
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
  }, [companyFilter, projectFilter]);

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
    setForm({
      ...emptyForm(),
      companyId: companyFilter || "",
      projectId: projectFilter || "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (row: PayrollStructure) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? "",
      description: row.description ?? "",
      companyId: row.companyId ?? "",
      projectId: row.projectId ?? "",
      isDefault: row.isDefault ?? false,
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
      description: form.description?.trim() || undefined,
      companyId: form.companyId || undefined,
      projectId: form.projectId || undefined,
      isDefault: form.isDefault ?? false,
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

  const companyMap = useMemo(() => new Map(companiesList.map((c) => [c.id, c.name])), [companiesList]);
  const projectMap = useMemo(() => new Map(projectsList.map((p) => [p.id, p.name])), [projectsList]);

  const list = useErpListView({
    listKey: "payroll-structures",
    rows: filtered,
    columns: [
      { key: "name", label: "Name" },
      { key: "scope", label: "Scope Override" },
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
      <div className="flex flex-wrap items-center gap-2">
        <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter name or status…" />
        <select
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value);
            setProjectFilter("");
          }}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Companies</option>
          {companiesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Projects / Sites</option>
          {projectsList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    ),
    renderRow: (structure) => (
      <tr key={structure.id} className="erp-tr">
        <td className="erp-td text-slate-900 font-medium">
          {structure.name || "Structure"}
          {structure.isDefault && (
            <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 font-semibold">
              Default
            </span>
          )}
        </td>
        <td className="erp-td">
          {structure.projectId ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-medium text-purple-800">
              <Briefcase className="h-3 w-3" />
              {projectMap.get(structure.projectId) || "Site Override"}
            </span>
          ) : structure.companyId ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-800">
              <Building2 className="h-3 w-3" />
              {companyMap.get(structure.companyId) || "Company Override"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              Tenant Baseline
            </span>
          )}
        </td>
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
          {/* Scope Hierarchy */}
          <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Applicable Company</label>
              <select
                value={form.companyId || ""}
                onChange={(e) => setForm({ ...form, companyId: e.target.value, projectId: "" })}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="">Tenant Baseline (All Companies)</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Applicable Project / Site</label>
              <select
                value={form.projectId || ""}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="">Company Baseline (All Sites)</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="erp-field md:col-span-2">
            <label className="erp-label">Structure Name *</label>
            <input
              className="erp-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Executive Hospital Staff Grade-A"
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Description</label>
            <input
              className="erp-input"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of application scope"
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
