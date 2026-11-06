"use client";

import React, { useMemo } from "react";
import { Plus, MoreVertical, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRowFieldValue } from "@/lib/workspace/list-view";
import type { DynamicColumn } from "@/lib/dynamic-schema/types";

interface DynamicKanbanViewProps {
  rows: any[];
  columns: DynamicColumn[];
  groupByKey?: string;
  onEdit: (row: any) => void;
  onDelete?: (row: any) => void;
  onCreateInLane?: (statusValue: string) => void;
  idField?: string;
}

export function DynamicKanbanView({
  rows,
  columns,
  groupByKey = "status",
  onEdit,
  onDelete,
  onCreateInLane,
  idField = "id",
}: DynamicKanbanViewProps) {
  // Discover distinct lanes
  const lanes = useMemo(() => {
    const map = new Map<string, any[]>();
    // Pre-populate standard ERP lanes if grouping by status
    if (groupByKey === "status") {
      map.set("Draft", []);
      map.set("Pending", []);
      map.set("Active", []);
      map.set("Completed", []);
    }

    rows.forEach((row) => {
      const rawLane = getRowFieldValue(row, groupByKey) ?? (row.isActive === true ? "Active" : row.isActive === false ? "Inactive" : "Draft");
      const strVal: string = String(rawLane ?? "Draft");
      const normalized = strVal.charAt(0).toUpperCase() + strVal.slice(1);
      if (!map.has(normalized)) {
        map.set(normalized, []);
      }
      map.get(normalized)!.push(row);
    });

    return Array.from(map.entries()).filter(([_, items]) => items.length > 0 || groupByKey === "status");
  }, [rows, groupByKey]);

  const displayCols = columns.filter((c) => !c.hidden && c.key !== groupByKey && c.key !== "actions").slice(0, 3);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin items-start w-full">
      {lanes.map(([laneName, laneRows]) => {
        const laneTone =
          laneName.toLowerCase() === "active" || laneName.toLowerCase() === "completed"
            ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10"
            : laneName.toLowerCase() === "pending" || laneName.toLowerCase() === "draft"
            ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10"
            : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40";

        const badgeTone =
          laneName.toLowerCase() === "active" || laneName.toLowerCase() === "completed"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
            : laneName.toLowerCase() === "pending" || laneName.toLowerCase() === "draft"
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
            : "bg-slate-200 text-slate-700 dark:bg-slate-750 dark:text-slate-300";

        return (
          <div
            key={laneName}
            className={cn(
              "w-72 shrink-0 rounded-xl border p-3 space-y-3 transition-colors shadow-2xs",
              laneTone
            )}
          >
            {/* Lane Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {laneName}
                </span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", badgeTone)}>
                  {laneRows.length}
                </span>
              </div>
              {onCreateInLane && (
                <button
                  type="button"
                  onClick={() => onCreateInLane(laneName)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  title={`Add to ${laneName}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Lane Cards List */}
            <div className="space-y-2.5 min-h-24">
              {laneRows.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No records
                </div>
              ) : (
                laneRows.map((row) => {
                  const title = row.fullName || row.name || row.title || row.code || `ID: ${String(row[idField]).slice(0, 8)}`;
                  const code = row.code || (row[idField] ? String(row[idField]).slice(0, 8) : "");

                  return (
                    <div
                      key={String(row[idField] || Math.random())}
                      onClick={() => onEdit(row)}
                      className="group relative rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:shadow-sm hover:border-indigo-500/50 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {title}
                          </p>
                          {code && code !== title && (
                            <p className="font-mono text-[10px] text-slate-400">{code}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display field badges */}
                      {displayCols.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          {displayCols.map((c) => {
                            const val = getRowFieldValue(row, c.key);
                            if (val === undefined || val === null || val === "") return null;
                            return (
                              <div key={c.key} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-[10px] uppercase font-medium">{c.label}:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                  {String(val)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
