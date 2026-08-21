"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  mapOrgStructureRecord,
  useOrgStructureList,
  useOrgStructureMutations,
  type OrgResource,
} from "@/features/platform/hooks/useOrgStructure";

type OrgStructurePageConfig = {
  resource: OrgResource;
  title: string;
  subtitle: string;
  categoryTag: string;
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
  codeLabel = "Code",
  nameLabel = "Name",
  showLocationFields = false,
  showGradeFields = false,
  showCostCenterType = false,
  showWarehouseToggle = false,
}: OrgStructurePageConfig) {
  const { companyId } = useOrgContext();
  const { data = [], isLoading, isError, error, refetch } = useOrgStructureList(resource, companyId);
  const { create, update, remove } = useOrgStructureMutations(resource);

  const rows = useMemo(() => data.map(mapOrgStructureRecord), [data]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<Row | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [gstin, setGstin] = useState("");
  const [grade, setGrade] = useState("");
  const [level, setLevel] = useState("");
  const [costCenterType, setCostCenterType] = useState("");
  const [isWarehouse, setIsWarehouse] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return !q || row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setCity("");
    setState("");
    setGstin("");
    setGrade("");
    setLevel("");
    setCostCenterType("");
    setIsWarehouse(false);
    setIsActive(true);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
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

  const closeInspector = () => {
    setMode("closed");
    resetForm();
  };

  const buildPayload = () => ({
    companyId: editing?.companyId ?? companyId,
    name: name.trim(),
    code: code.trim(),
    isActive,
    ...(showLocationFields
      ? { city: city.trim() || undefined, state: state.trim() || undefined, gstin: gstin.trim() || undefined, isWarehouse }
      : {}),
    ...(showGradeFields ? { grade: grade.trim() || undefined, level: level.trim() || undefined } : {}),
    ...(showCostCenterType ? { costCenterType: costCenterType.trim() || undefined } : {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (mode === "create") {
      if (!companyId) {
        notifyError("Select a company in workspace context (/context) before creating records.");
        return;
      }
      try {
        await create.mutateAsync(buildPayload());
        notifySuccess(`${nameLabel} created successfully.`);
        closeInspector();
      } catch (err) {
        notifyError(getApiErrorMessage(err, `Failed to create ${nameLabel.toLowerCase()}.`));
      }
      return;
    }

    if (mode === "edit" && editing) {
      try {
        await update.mutateAsync({ id: editing.id, payload: buildPayload() });
        notifySuccess(`${nameLabel} updated.`);
        closeInspector();
      } catch (err) {
        notifyError(getApiErrorMessage(err, `Failed to update ${nameLabel.toLowerCase()}.`));
      }
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total Records", value: rows.length, tone: "info", subtext: "Live API" },
    { label: "Active", value: rows.filter((r) => r.isActive).length, tone: "positive", subtext: "Enabled" },
  ];

  const saving = create.isPending || update.isPending;

  return (
    <PlatformGlobalPageShell
      title={title}
      subtitle={subtitle}
      categoryTag={categoryTag}
      kpiMetrics={kpis}
      searchPlaceholder={`Filter ${nameLabel.toLowerCase()} or code...`}
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel={`New ${nameLabel}`}
      onPrimaryAction={openCreate}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      isInspectorOpen={mode !== "closed"}
      onInspectorClose={closeInspector}
      inspectorTitle={mode === "edit" ? `Edit ${nameLabel}` : `Create ${nameLabel}`}
      inspectorContent={
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-xs">
          {!companyId && mode === "create" && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              Select a company in workspace context (/context) first.
            </p>
          )}
          <div className="space-y-2">
            <Label>{codeLabel}</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{nameLabel}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {showLocationFields && (
            <>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={gstin} onChange={(e) => setGstin(e.target.value)} />
              </div>
              {showWarehouseToggle && (
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={isWarehouse} onChange={(e) => setIsWarehouse(e.target.checked)} />
                  Warehouse / depot location
                </label>
              )}
            </>
          )}
          {showGradeFields && (
            <>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Input value={level} onChange={(e) => setLevel(e.target.value)} />
              </div>
            </>
          )}
          {showCostCenterType && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={costCenterType} onChange={(e) => setCostCenterType(e.target.value)} />
            </div>
          )}
          {mode === "edit" && (
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={closeInspector}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || (mode === "create" && !companyId)}>
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      }
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load records.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Code</th>
              <th className="erp-th">Name</th>
              {showLocationFields && <th className="erp-th">Location</th>}
              {showGradeFields && <th className="erp-th">Grade</th>}
              {showCostCenterType && <th className="erp-th">Type</th>}
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="erp-td text-center py-8 text-xs text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="erp-td text-center py-8 text-xs text-muted-foreground">
                  No records found. Use New {nameLabel} to create one.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
                  <td className="erp-td font-mono text-xs">{row.code}</td>
                  <td className="erp-td text-xs font-semibold">{row.name}</td>
                  {showLocationFields && (
                    <td className="erp-td text-xs text-muted-foreground">
                      {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                      {row.isWarehouse ? " · Warehouse" : ""}
                    </td>
                  )}
                  {showGradeFields && <td className="erp-td text-xs">{row.grade ?? "—"}</td>}
                  {showCostCenterType && <td className="erp-td text-xs">{row.costCenterType ?? "—"}</td>}
                  <td className="erp-td">
                    <span className={row.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                      {row.status}
                    </span>
                  </td>
                  <td className="erp-td text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-rose-600"
                        disabled={remove.isPending}
                        onClick={() =>
                          void remove
                            .mutateAsync(row.id)
                            .then(() => notifySuccess("Record deleted."))
                            .catch((err) => notifyError(getApiErrorMessage(err, "Failed to delete record.")))
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
