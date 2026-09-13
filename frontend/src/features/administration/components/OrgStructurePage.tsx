"use client";

import React, { useMemo, useState } from "react";
import { Building2, MapPin, Tag, CheckCircle2, XCircle, Archive, Layers } from "lucide-react";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  mapOrgStructureRecord,
  useOrgStructureList,
  useOrgStructureMutations,
  type OrgResource,
} from "@/features/administration/hooks/useOrgStructure";

import { useLocalization } from "@/context/LocalizationContext";
import { GLOBAL_JURISDICTIONS, getCountryJurisdiction } from "@/lib/workspace/jurisdictions";

const COST_CENTER_TYPES = ["Revenue Center", "Cost Center", "Profit Center", "Investment Center", "Service Center"];

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  branches: Building2,
  "business-units": Layers,
  departments: Archive,
  designations: Tag,
  "cost-centers": Archive,
};

const RESOURCE_COLORS: Record<string, string> = {
  branches: "from-blue-500 to-blue-600",
  "business-units": "from-violet-500 to-purple-600",
  departments: "from-teal-500 to-teal-600",
  designations: "from-amber-500 to-orange-600",
  "cost-centers": "from-rose-500 to-rose-600",
};

type OrgStructurePageConfig = {
  resource: OrgResource;
  title: string;
  subtitle: string;
  categoryTag: string;
  icon?: string;
  codeLabel?: string;
  nameLabel?: string;
  showLocationFields?: boolean;
  showGradeFields?: boolean;
  showCostCenterType?: boolean;
  showWarehouseToggle?: boolean;
};

type Row = ReturnType<typeof mapOrgStructureRecord>;

export function OrgStructurePage({
  resource,
  title,
  subtitle,
  categoryTag,
  icon = "building",
  codeLabel = "Code",
  nameLabel = "Name",
  showLocationFields = false,
  showGradeFields = false,
  showCostCenterType = false,
  showWarehouseToggle = false,
}: OrgStructurePageConfig) {
  const { companyId } = useOrgContext();
  const { activeCountry } = useLocalization();
  const { data = [], isLoading, isError, error, refetch } = useOrgStructureList(resource, companyId);
  const { create, update, remove } = useOrgStructureMutations(resource);

  const rows = useMemo(() => data.map(mapOrgStructureRecord), [data]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [gstin, setGstin] = useState("");
  const [grade, setGrade] = useState("");
  const [level, setLevel] = useState("");
  const [costCenterType, setCostCenterType] = useState("");
  const [isWarehouse, setIsWarehouse] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const ResourceIcon = RESOURCE_ICONS[resource] ?? Building2;
  const colorClass = RESOURCE_COLORS[resource] ?? "from-indigo-500 to-indigo-600";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !q || row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && row.isActive) ||
        (statusFilter === "inactive" && !row.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const resetForm = () => {
    setCode(""); setName(""); setDescription(""); setCity(""); setState(""); setGstin("");
    setGrade(""); setLevel(""); setCostCenterType(""); setIsWarehouse(false); setIsActive(true);
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setMode("create"); };

  const openEdit = (row: Row) => {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setDescription((row as unknown as Record<string, unknown>).description as string ?? "");
    setCity(row.city ?? "");
    setState(row.state ?? "");
    setGstin(row.gstin ?? "");
    setGrade(row.grade ?? "");
    setLevel(row.level ?? "");
    setCostCenterType(row.costCenterType ?? "");
    setIsWarehouse(Boolean(row.isWarehouse));
    setIsActive(row.isActive);
    setMode("edit");
  };

  const closeInspector = () => { setMode("closed"); resetForm(); };

  const buildPayload = () => ({
    companyId: editing?.companyId ?? companyId,
    name: name.trim(),
    code: code.trim(),
    isActive,
    ...(showLocationFields ? { city: city.trim() || undefined, state: state.trim() || undefined, gstin: gstin.trim() || undefined, isWarehouse } : {}),
    ...(showGradeFields ? { grade: grade.trim() || undefined, level: level.trim() || undefined } : {}),
    ...(showCostCenterType ? { costCenterType: costCenterType.trim() || undefined } : {}),
  });

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) { notifyError(`${codeLabel} and ${nameLabel} are required.`); return; }
    if (mode === "create") {
      if (!companyId) { notifyError("Select a company in workspace context first."); return; }
      try { await create.mutateAsync(buildPayload()); notifySuccess(`${nameLabel} created.`); closeInspector(); }
      catch (err) { notifyError(getApiErrorMessage(err, `Failed to create ${nameLabel.toLowerCase()}.`)); }
      return;
    }
    if (mode === "edit" && editing) {
      try { await update.mutateAsync({ id: editing.id, payload: buildPayload() }); notifySuccess(`${nameLabel} updated.`); closeInspector(); }
      catch (err) { notifyError(getApiErrorMessage(err, `Failed to update ${nameLabel.toLowerCase()}.`)); }
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total", value: rows.length, tone: "info", icon: <ResourceIcon className="h-3.5 w-3.5" />, subtext: nameLabel + " records" },
    { label: "Active", value: rows.filter((r) => r.isActive).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "In use" },
    { label: "Inactive", value: rows.filter((r) => !r.isActive).length, tone: "warning", icon: <XCircle className="h-3.5 w-3.5" />, subtext: "Dormant" },
  ];

  const listColumns = [
    { key: "name", label: nameLabel, dataType: "string" as const },
    { key: "code", label: codeLabel },
    ...(showLocationFields ? [{ key: "location", label: "Location" }] : []),
    ...(showGradeFields ? [{ key: "grade", label: "Grade / Level" }] : []),
    ...(showCostCenterType ? [{ key: "type", label: "Center Type" }] : []),
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", locked: true },
  ];

  const drawerForm = (
    <div className="space-y-4">
      {!companyId && mode === "create" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          ? Please select a company from workspace context first before creating records.
        </div>
      )}

      {/* Section: Identity */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Identification</h3>
        <div className="erp-form-grid">
          <div className="erp-field">
            <label className="erp-label">{codeLabel} *</label>
            <input className="erp-input font-mono" value={code} placeholder="e.g. BR-001" onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <div className="erp-field">
            <label className="erp-label">{nameLabel} *</label>
            <input className="erp-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Section: Location (conditional) */}
      {showLocationFields && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Location Details</h3>
          <div className="erp-form-grid">
            <div className="erp-field">
              <label className="erp-label">City</label>
              <input className="erp-input" value={city} placeholder="e.g. Mumbai, New York, London, Dubai" onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="erp-field">
              <label className="erp-label">{activeCountry.subdivisionType}</label>
              <select className="erp-input" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select {activeCountry.subdivisionType}</option>
                {activeCountry.subdivisions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">{activeCountry.taxIdLabel} (Branch-wise)</label>
              <input className="erp-input font-mono" value={gstin} placeholder={`Branch ${activeCountry.taxIdLabel}`} onChange={(e) => setGstin(e.target.value.toUpperCase())} />
            </div>
            {showWarehouseToggle && (
              <label className="erp-field flex items-center gap-2 text-xs md:col-span-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={isWarehouse} onChange={(e) => setIsWarehouse(e.target.checked)} />
                <div>
                  <span className="font-semibold text-slate-700">Warehouse / Depot Location</span>
                  <span className="block text-slate-500">Check if this branch is a stock-keeping unit or warehouse</span>
                </div>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Section: Grade (conditional) */}
      {showGradeFields && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Designation Grade</h3>
          <div className="erp-form-grid">
            <div className="erp-field">
              <label className="erp-label">Grade</label>
              <input className="erp-input" value={grade} placeholder="e.g. L3 / M1 / Senior" onChange={(e) => setGrade(e.target.value)} />
            </div>
            <div className="erp-field">
              <label className="erp-label">Seniority Level</label>
              <input className="erp-input" value={level} placeholder="e.g. Junior / Mid / Lead" onChange={(e) => setLevel(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Section: Cost Center Type (conditional) */}
      {showCostCenterType && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Cost Center Classification</h3>
          <div className="erp-field">
            <label className="erp-label">Center Type</label>
            <select className="erp-input" value={costCenterType} onChange={(e) => setCostCenterType(e.target.value)}>
              <option value="">Select Type</option>
              {COST_CENTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Status */}
      {mode === "edit" && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</h3>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="font-medium text-slate-700">Active — visible in all selectors</span>
          </label>
        </div>
      )}

      {isError && (
        <p className="text-xs text-rose-600 rounded-lg border border-rose-200 bg-rose-50 p-2">
          {getApiErrorMessage(error, "Load error.")}
        </p>
      )}

      <div className="border-t border-slate-100 pt-4">
        <ErpDrawerFooter
          onCancel={closeInspector}
          onSave={() => void handleSubmit()}
          saving={create.isPending || update.isPending}
          isEdit={mode === "edit"}
          disabled={mode === "create" && !companyId}
        />
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title={title}
        subtitle={subtitle}
        categoryTag={categoryTag}
        icon={icon}
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${nameLabel.toLowerCase()} name or code…`}
        filterOptions={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "active" },
              { label: "Inactive Only", value: "inactive" },
            ],
          },
        ]}
        onClearFilters={() => { setSearch(""); setStatusFilter("all"); }}
        primaryActionLabel={`Add ${nameLabel}`}
        onPrimaryAction={openCreate}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        listKey={`platform-org-${resource}`}
        listRows={filtered}
        getRowId={(row) => row.id}
        listColumns={listColumns}
        emptyMessage={`No ${nameLabel.toLowerCase()} records found. Create your first entry to populate the org structure.`}
        onBulkDelete={(selected) => {
          void (async () => {
            try {
              for (const row of selected) await remove.mutateAsync(row.id);
              notifySuccess("Selected records deleted.");
            } catch (err) { notifyError(getApiErrorMessage(err, "Bulk delete failed.")); }
          })();
        }}
        renderListRow={(row) => (
          <tr key={row.id} className="erp-tr">
            <td className="erp-td">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass} text-xs font-bold text-white shadow-sm`}>
                  {row.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{row.name}</div>
                </div>
              </div>
            </td>
            <td className="erp-td font-mono text-xs text-slate-600">{row.code || "—"}</td>
            {showLocationFields ? (
              <td className="erp-td">
                {(row.city || row.state) ? (
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {[row.city, row.state].filter(Boolean).join(", ")}
                    {row.isWarehouse ? <span className="ml-1 erp-chip erp-chip-info">Warehouse</span> : null}
                  </div>
                ) : <span className="text-xs text-slate-400">—</span>}
              </td>
            ) : null}
            {showGradeFields ? (
              <td className="erp-td">
                <div className="space-y-0.5">
                  {row.grade && <div className="text-xs font-medium text-slate-700">{row.grade}</div>}
                  {row.level && <div className="text-xs text-slate-500">{row.level}</div>}
                  {!row.grade && !row.level && <span className="text-xs text-slate-400">—</span>}
                </div>
              </td>
            ) : null}
            {showCostCenterType ? (
              <td className="erp-td">
                {row.costCenterType
                  ? <span className="erp-chip erp-chip-neutral">{row.costCenterType}</span>
                  : <span className="text-xs text-slate-400">—</span>}
              </td>
            ) : null}
            <td className="erp-td">
              <span className={row.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                {row.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                onEdit={{ label: `Edit ${nameLabel}`, onClick: () => openEdit(row) }}
                onDelete={{ label: `Delete ${nameLabel}`, onClick: () => setDeleteId(row.id) }}
              />
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={closeInspector}
        inspectorTitle={mode === "edit" ? `Edit ${nameLabel}: ${editing?.name}` : `New ${nameLabel}`}
        inspectorSubTitle={mode === "create" ? `Add a new ${nameLabel.toLowerCase()} to the organization` : `Update ${nameLabel.toLowerCase()} details`}
        inspectorContent={drawerForm}
      />

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={`Delete ${nameLabel}`}
        entityName={rows.find((r) => r.id === deleteId)?.name}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await remove.mutateAsync(deleteId);
            notifySuccess(`${nameLabel} deleted.`);
            void refetch();
          } catch (err) {
            notifyError(getApiErrorMessage(err, `Failed to delete ${nameLabel.toLowerCase()}.`));
          } finally {
            setDeleteId(null);
          }
        }}
        loading={remove.isPending}
      />
    </>
  );
}
