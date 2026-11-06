"use client";

import { useMemo } from "react";

export type MatrixPermission = {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
};

const STANDARD_COLUMNS = ["view", "create", "edit", "delete", "approve", "export", "access"] as const;

const humanize = (value: string) =>
  value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function parseAction(action: string): { resource: string; column: string } {
  const normalized = action.trim().toLowerCase();
  if (!normalized) return { resource: "_module", column: "access" };
  const parts = normalized.split(".");
  if (parts.length === 1) return { resource: "_module", column: parts[0] };
  return { resource: parts.slice(0, -1).join("."), column: parts[parts.length - 1] };
}

type PermissionMatrixProps = {
  permissions: MatrixPermission[];
  assigned: Set<string>;
  onToggle: (permissionId: string) => void;
  onToggleModule: (moduleKey: string) => void;
  onToggleColumn?: (moduleKey: string, column: string) => void;
};

export function PermissionMatrix({
  permissions,
  assigned,
  onToggle,
  onToggleModule,
  onToggleColumn,
}: PermissionMatrixProps) {
  const modules = useMemo(() => {
    const byModule = new Map<string, MatrixPermission[]>();
    for (const permission of permissions) {
      const key = permission.module || "general";
      const bucket = byModule.get(key) ?? [];
      bucket.push(permission);
      byModule.set(key, bucket);
    }

    return Array.from(byModule.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([moduleKey, modulePermissions]) => {
        const columnSet = new Set<string>();
        const resourceMap = new Map<string, Map<string, MatrixPermission>>();

        for (const permission of modulePermissions) {
          const { resource, column } = parseAction(permission.action);
          columnSet.add(column);
          const columns = resourceMap.get(resource) ?? new Map<string, MatrixPermission>();
          columns.set(column, permission);
          resourceMap.set(resource, columns);
        }

        const columns = [
          ...STANDARD_COLUMNS.filter((column) => columnSet.has(column)),
          ...Array.from(columnSet)
            .filter((column) => !(STANDARD_COLUMNS as readonly string[]).includes(column))
            .sort(),
        ];

        const resources = Array.from(resourceMap.entries()).sort(([left], [right]) => {
          if (left === "_module") return -1;
          if (right === "_module") return 1;
          return left.localeCompare(right);
        });

        const assignedCount = modulePermissions.filter((permission) => assigned.has(permission.id)).length;

        return {
          moduleKey,
          modulePermissions,
          columns,
          resources,
          assignedCount,
          total: modulePermissions.length,
        };
      });
  }, [assigned, permissions]);

  if (modules.length === 0) {
    return <div className="erp-empty min-h-[12rem]">No permissions match the current filters.</div>;
  }

  return (
    <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
      {modules.map((module) => {
        const partial = module.assignedCount > 0 && module.assignedCount < module.total;
        return (
          <section key={module.moduleKey} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{humanize(module.moduleKey)}</h3>
                  {partial ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Partial
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {module.assignedCount} of {module.total} permissions assigned
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleModule(module.moduleKey)}
                className="erp-action-btn erp-action-btn-secondary text-xs"
              >
                {module.assignedCount === module.total ? "Clear module" : "Grant module"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="erp-table min-w-full">
                <thead className="erp-thead">
                  <tr>
                    <th className="erp-th sticky left-0 z-10 bg-slate-50 min-w-[10rem]">Resource</th>
                    {module.columns.map((column) => (
                      <th key={column} className="erp-th text-center min-w-[5.5rem]">
                        <button
                          type="button"
                          className="font-semibold uppercase tracking-wide text-[10px] text-slate-600 hover:text-slate-900"
                          title={`Toggle all ${column} in ${module.moduleKey}`}
                          onClick={() => onToggleColumn?.(module.moduleKey, column)}
                        >
                          {humanize(column)}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {module.resources.map(([resource, columns]) => (
                    <tr key={`${module.moduleKey}-${resource}`} className="erp-tr">
                      <td className="erp-td sticky left-0 z-10 bg-white text-xs font-medium text-slate-800">
                        {resource === "_module" ? "Module access" : humanize(resource)}
                      </td>
                      {module.columns.map((column) => {
                        const permission = columns.get(column);
                        if (!permission) {
                          return (
                            <td key={column} className="erp-td text-center text-slate-300">
                              —
                            </td>
                          );
                        }
                        const enabled = assigned.has(permission.id);
                        return (
                          <td key={column} className="erp-td text-center">
                            <button
                              type="button"
                              title={permission.name}
                              aria-pressed={enabled}
                              onClick={() => onToggle(permission.id)}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold transition ${
                                enabled
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700"
                              }`}
                            >
                              {enabled ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function collectColumnPermissionIds(
  permissions: MatrixPermission[],
  moduleKey: string,
  column: string,
): string[] {
  return permissions
    .filter((permission) => permission.module === moduleKey)
    .filter((permission) => parseAction(permission.action).column === column.toLowerCase())
    .map((permission) => permission.id);
}
