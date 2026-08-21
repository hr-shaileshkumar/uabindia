"use client";

import React, { useMemo, useState } from "react";
import { Database, Plus, CheckCircle2, Layers } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapEntityFieldDefinition, useEntityFieldDefinitions } from "@/features/platform/hooks/useEntityFieldDefinitions";

export default function SchemaManagerPage() {
  const { data = [], isLoading, isError, error, refetch } = useEntityFieldDefinitions();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const fields = useMemo(() => data.map(mapEntityFieldDefinition), [data]);
  const entityOptions = useMemo(
    () => Array.from(new Set(fields.map((field) => field.entityName))).sort(),
    [fields]
  );

  const filteredFields = fields.filter((field) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      field.fieldName.toLowerCase().includes(q) ||
      field.entityName.toLowerCase().includes(q);
    const matchesEntity = entityFilter === "all" || field.entityName === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Custom Fields", value: fields.length, tone: "info", icon: <Database className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Entity Types", value: entityOptions.length, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Scoped" },
    { label: "Required Fields", value: fields.filter((f) => f.isRequired).length, tone: "warning", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Validation" },
    { label: "Active Fields", value: fields.filter((f) => f.isSearchable).length, tone: "positive", icon: <Plus className="h-3.5 w-3.5" />, subtext: "Active" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Schema Manager & Custom Field Registry"
      subtitle="Tenant-scoped custom field definitions from the entity-fields API."
      categoryTag="Metadata Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter entity or field name..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "entity",
          label: "All Entities",
          value: entityFilter,
          onChange: setEntityFilter,
          options: [{ label: "All Entities", value: "all" }, ...entityOptions.map((e) => ({ label: e, value: e }))],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setEntityFilter("all");
      }}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load field definitions.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Entity</th>
              <th className="erp-th">Field</th>
              <th className="erp-th">Type</th>
              <th className="erp-th">Required</th>
              <th className="erp-th">Section</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filteredFields.length === 0 ? (
              <tr><td colSpan={5} className="erp-td text-center py-8 text-xs text-muted-foreground">No custom fields configured.</td></tr>
            ) : (
              filteredFields.map((field) => (
                <tr key={field.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
                  <td className="erp-td font-mono text-xs">{field.entityName}</td>
                  <td className="erp-td text-xs font-semibold">{field.fieldName}</td>
                  <td className="erp-td text-xs">{field.dataType}</td>
                  <td className="erp-td text-xs">{field.isRequired ? "Yes" : "No"}</td>
                  <td className="erp-td text-xs text-muted-foreground">{field.section}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
