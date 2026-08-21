"use client";

import React, { useMemo, useState } from "react";
import { Layers, CheckCircle2 } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapEntityFieldDefinition, useEntityFieldDefinitions } from "@/features/platform/hooks/useEntityFieldDefinitions";

export default function EntityBuilderPage() {
  const { data = [], isLoading, isError, error, refetch } = useEntityFieldDefinitions();
  const [search, setSearch] = useState("");

  const fields = useMemo(() => data.map(mapEntityFieldDefinition), [data]);
  const entities = useMemo(() => {
    const grouped = new Map<string, ReturnType<typeof mapEntityFieldDefinition>[]>();
    for (const field of fields) {
      const list = grouped.get(field.entityName) ?? [];
      list.push(field);
      grouped.set(field.entityName, list);
    }
    return Array.from(grouped.entries()).map(([entityName, entityFields]) => ({
      id: entityName,
      entityName,
      fieldCount: entityFields.length,
      requiredCount: entityFields.filter((f) => f.isRequired).length,
    }));
  }, [fields]);

  const filtered = entities.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.entityName.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Entity Types", value: entities.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Total Fields", value: fields.length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Definitions" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Entity Builder & Dynamic Schema Composer"
      subtitle="Entity types derived from tenant custom field definitions."
      categoryTag="Dynamic Entity Modeling"
      kpiMetrics={kpis}
      searchPlaceholder="Filter entity name..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load entities.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Entity Name</th>
              <th className="erp-th">Custom Fields</th>
              <th className="erp-th">Required Fields</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">No entities with custom fields yet.</td></tr>
            ) : (
              filtered.map((entity) => (
                <tr key={entity.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
                  <td className="erp-td font-semibold text-xs">{entity.entityName}</td>
                  <td className="erp-td text-xs">{entity.fieldCount}</td>
                  <td className="erp-td text-xs">{entity.requiredCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
