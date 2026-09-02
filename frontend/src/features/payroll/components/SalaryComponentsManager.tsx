"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { payrollApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

export type PayrollStructure = { id: string; name?: string };

export type PayrollComponent = {
  id: string;
  structureId?: string;
  name?: string;
  type?: string;
  calculationType?: string;
  amount?: number | null;
  percentage?: number | null;
  formula?: string | null;
  percentageBase?: string | null;
  isStatutory?: boolean;
};

const emptyForm = () => ({
  structureId: "",
  name: "",
  type: "Earning",
  calculationType: "FixedAmount",
  amount: "",
  percentage: "",
  formula: "",
  percentageBase: "Basic",
  isStatutory: false,
});

export function SalaryComponentsManager() {
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
      [c.name, c.type, c.calculationType, c.formula, structureName(c.structureId)].some((v) =>
        (v || "").toLowerCase().includes(q),
      ),
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
      calculationType: row.calculationType || (row.formula ? "Formula" : row.percentage != null ? "PercentageOfBasic" : "FixedAmount"),
      amount: row.amount != null ? String(row.amount) : "",
      percentage: row.percentage != null ? String(row.percentage) : "",
      formula: row.formula || "",
      percentageBase: row.percentageBase || "Basic",
      isStatutory: Boolean(row.isStatutory),
    });
    setDrawerOpen(true);
  };

  const insertVariable = (variable: string) => {
    setForm((prev) => ({
      ...prev,
      formula: prev.formula ? `${prev.formula} ${variable}` : variable,
    }));
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
      calculationType: form.calculationType,
      amount: form.calculationType === "FixedAmount" && form.amount ? Number(form.amount) : null,
      percentage:
        form.calculationType.startsWith("Percentage") && form.percentage
          ? Number(form.percentage)
          : null,
      formula: form.calculationType === "Formula" ? form.formula.trim() : null,
      percentageBase: form.percentageBase,
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

  const earningCount = components.filter((c) => c.type === "Earning").length;
  const deductionCount = components.filter((c) => c.type === "Deduction").length;
  const formulaCount = components.filter((c) => Boolean(c.formula) || c.calculationType === "Formula").length;

  const renderCalculationSummary = (c: PayrollComponent) => {
    if (c.calculationType === "Formula" || c.formula) {
      return (
        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
          fx: {c.formula || "—"}
        </span>
      );
    }
    if (c.calculationType === "PercentageOfGross" || c.percentageBase === "Gross") {
      return <span>{c.percentage != null ? `${c.percentage}% of Gross` : "—"}</span>;
    }
    if (c.calculationType === "PercentageOfCtc" || c.percentageBase === "CTC") {
      return <span>{c.percentage != null ? `${c.percentage}% of CTC` : "—"}</span>;
    }
    if (c.percentage != null && c.percentage > 0) {
      return <span>{c.percentage}% of Basic</span>;
    }
    if (c.amount != null) {
      return <span>₹ {Number(c.amount).toLocaleString("en-IN")}</span>;
    }
    return <span className="text-slate-400">Fixed / Default</span>;
  };

  return (
    <StandardPageLayout
      title="Salary & Deduction Components"
      subtitle="Configure dynamic earnings, deductions, percentages, ratios, and math formulas per structure."
      actions={
        <div className="flex items-center gap-2">
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton onClick={openCreate} label="Add Component" />
        </div>
      }
    >
      <CrudHeaderStats
        items={[
          { label: "Total Components", value: components.length, helper: "Across all structures" },
          { label: "Earnings / Allowances", value: earningCount, helper: "Base, HRA, Special, Travel" },
          { label: "Deductions & Taxes", value: deductionCount, helper: "PF, TDS, ESI, Custom Dues" },
          { label: "Dynamic Formulas", value: formulaCount, helper: "Algebraic calculation rules" },
        ]}
      />

      <CrudCard>
        <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-slate-200 dark:border-slate-800">
          <ErpSearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search by name, type, formula, or structure..."
          />
          <div className="w-full md:w-64">
            <select
              aria-label="Filter by structure"
              className="erp-select"
              value={structureFilter}
              onChange={(e) => setStructureFilter(e.target.value)}
            >
              <option value="all">All Structures ({structures.length})</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Component Name</th>
                <th>Structure</th>
                <th>Type</th>
                <th>Calculation Rule / Formula</th>
                <th>Statutory</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Loading components...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-td">
                    <ErpEmptyState
                      message="No components found."
                      description="Create earnings, statutory deductions, or dynamic math formula rules."
                      action={<ErpCreateButton label="Add Component" onClick={openCreate} />}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((component) => (
                  <tr key={component.id} className="erp-tr">
                    <td className="erp-td text-slate-900 dark:text-white font-medium">
                      {component.name || "Component"}
                    </td>
                    <td className="erp-td text-slate-600 dark:text-slate-400">
                      {structureName(component.structureId)}
                    </td>
                    <td className="erp-td">
                      <span
                        className={
                          component.type === "Earning"
                            ? "erp-chip erp-chip-success"
                            : "erp-chip erp-chip-warning"
                        }
                      >
                        {component.type || "Earning"}
                      </span>
                    </td>
                    <td className="erp-td text-sm text-slate-700 dark:text-slate-300">
                      {renderCalculationSummary(component)}
                    </td>
                    <td className="erp-td">
                      <span
                        className={
                          component.isStatutory
                            ? "erp-chip erp-chip-info"
                            : "erp-chip erp-chip-neutral"
                        }
                      >
                        {component.isStatutory ? "Statutory" : "Standard"}
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

      <SideDrawer
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title="Component Details"
      >
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Name</label>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {viewRow.name || "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Structure</label>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {structureName(viewRow.structureId)}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Type</label>
              <p className="text-sm text-slate-800 dark:text-slate-200">{viewRow.type || "—"}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Calculation Mode</label>
              <div className="mt-1">{renderCalculationSummary(viewRow)}</div>
            </div>
            {viewRow.formula ? (
              <div className="erp-field md:col-span-2">
                <label className="erp-label">Formula Expression</label>
                <code className="block p-2 text-xs bg-slate-100 dark:bg-slate-900 rounded font-mono text-indigo-600 dark:text-indigo-400">
                  {viewRow.formula}
                </code>
              </div>
            ) : null}
            <div className="erp-field">
              <label className="erp-label">Statutory Flag</label>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {viewRow.isStatutory ? "Yes (Statutory Compliance)" : "No (Custom)"}
              </p>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit Payroll & Deduction Component" : "New Payroll & Deduction Component"}
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
            <label className="erp-label">Component Name *</label>
            <input
              className="erp-input"
              placeholder="e.g. Basic, HRA, Provident Fund, Health Insurance, Canteen Dues, Custom TDS"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Component Type *</label>
            <select
              className="erp-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="Earning">Earning / Allowance (+)</option>
              <option value="Deduction">Deduction / Tax (-)</option>
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Statutory Compliance</label>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.isStatutory}
                onChange={(e) => setForm({ ...form, isStatutory: e.target.checked })}
              />
              Statutory line (PF / ESI / PT / TDS)
            </label>
          </div>

          <div className="erp-field md:col-span-2">
            <label className="erp-label">Calculation Method *</label>
            <select
              className="erp-select font-medium text-slate-800 dark:text-slate-200"
              value={form.calculationType}
              onChange={(e) => setForm({ ...form, calculationType: e.target.value })}
            >
              <option value="FixedAmount">Fixed Amount (₹ exact amount)</option>
              <option value="PercentageOfBasic">Percentage of Basic (% of Basic)</option>
              <option value="PercentageOfGross">Percentage of Gross (% of Gross Earnings)</option>
              <option value="PercentageOfCtc">Percentage of CTC (% of Total CTC)</option>
              <option value="Formula">Dynamic Math Formula (e.g. (BASIC + HRA) * 0.05)</option>
            </select>
          </div>

          {form.calculationType === "FixedAmount" ? (
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Fixed Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 50000 or 1500"
                className="erp-input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Direct monthly fixed rupee value.</p>
            </div>
          ) : null}

          {form.calculationType.startsWith("Percentage") ? (
            <div className="erp-field md:col-span-2">
              <label className="erp-label">
                Percentage (%) *{" "}
                <span className="text-xs text-indigo-600 font-normal">
                  ({form.calculationType === "PercentageOfGross" ? "of Gross" : form.calculationType === "PercentageOfCtc" ? "of CTC" : "of Basic"})
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 10 for 10% or 40 for 40%"
                className="erp-input"
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Calculates ratio automatically based on selected wage base.
              </p>
            </div>
          ) : null}

          {form.calculationType === "Formula" ? (
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Dynamic Math Formula *</label>
              <input
                type="text"
                placeholder="e.g. (BASIC + HRA) * 0.05 or BASIC * 0.10 + 500"
                className="erp-input font-mono text-sm"
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
              />
              <div className="mt-2">
                <span className="text-xs text-slate-500 mr-2">Click to insert variables:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {["BASIC", "HRA", "SPECIAL", "GROSS", "CTC", "DAYS", "FACTOR"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-mono border border-slate-200 dark:border-slate-700 transition"
                    >
                      +{v}
                    </button>
                  ))}
                  {["+", "-", "*", "/", "(", ")"].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => insertVariable(op)}
                      className="px-2 py-0.5 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 rounded font-mono transition"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
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

export default SalaryComponentsManager;
