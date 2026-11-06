"use client";

import React, { useMemo } from "react";
import { PlusCircle, MinusCircle, RefreshCw, CheckCircle2 } from "lucide-react";

interface AuditDiffViewerProps {
  oldValue: string | null | undefined;
  newValue: string | null | undefined;
  action?: string;
}

interface DiffRow {
  key: string;
  type: "added" | "removed" | "modified" | "unchanged";
  oldVal: unknown;
  newVal: unknown;
}

function tryParseJson(value: string | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "string") return null;
  try {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    }
  } catch {
    // Return null if not valid JSON
  }
  return null;
}

function formatVal(val: unknown): string {
  if (val === undefined) return "";
  if (val === null) return "null";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export function AuditDiffViewer({ oldValue, newValue, action }: AuditDiffViewerProps) {
  const oldJson = useMemo(() => tryParseJson(oldValue), [oldValue]);
  const newJson = useMemo(() => tryParseJson(newValue), [newValue]);

  const rows = useMemo<DiffRow[]>(() => {
    if (!oldJson && !newJson) return [];

    const keys = Array.from(new Set([...Object.keys(oldJson || {}), ...Object.keys(newJson || {})]));
    keys.sort();

    return keys.map((key) => {
      const hasOld = oldJson !== null && Object.prototype.hasOwnProperty.call(oldJson, key);
      const hasNew = newJson !== null && Object.prototype.hasOwnProperty.call(newJson, key);
      const oVal = hasOld ? oldJson![key] : undefined;
      const nVal = hasNew ? newJson![key] : undefined;

      if (!hasOld && hasNew) {
        return { key, type: "added", oldVal: undefined, newVal: nVal };
      }
      if (hasOld && !hasNew) {
        return { key, type: "removed", oldVal: oVal, newVal: undefined };
      }
      if (JSON.stringify(oVal) !== JSON.stringify(nVal)) {
        return { key, type: "modified", oldVal: oVal, newVal: nVal };
      }
      return { key, type: "unchanged", oldVal: oVal, newVal: nVal };
    });
  }, [oldJson, newJson]);

  // If neither oldValue nor newValue is JSON, display side-by-side text block
  if (!oldJson && !newJson) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-rose-200/50 bg-rose-50/30 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-2">
              Previous State
            </span>
            <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
              {oldValue || "— Empty / Null —"}
            </pre>
          </div>
          <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-2">
              New State
            </span>
            <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
              {newValue || "— Empty / Null —"}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const changeCounts = rows.reduce(
    (acc, r) => {
      acc[r.type]++;
      return acc;
    },
    { added: 0, removed: 0, modified: 0, unchanged: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Summary Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {changeCounts.modified > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
            <RefreshCw className="h-3 w-3" />
            {changeCounts.modified} modified
          </span>
        )}
        {changeCounts.added > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
            <PlusCircle className="h-3 w-3" />
            {changeCounts.added} added
          </span>
        )}
        {changeCounts.removed > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50">
            <MinusCircle className="h-3 w-3" />
            {changeCounts.removed} removed
          </span>
        )}
        {changeCounts.unchanged > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <CheckCircle2 className="h-3 w-3" />
            {changeCounts.unchanged} unchanged
          </span>
        )}
      </div>

      {/* Diff Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <th className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 w-1/4">Field</th>
                <th className="py-2.5 px-3 font-semibold text-rose-600 dark:text-rose-400 w-[37.5%]">Original Value</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400 w-[37.5%]">Modified Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {rows.map((row) => {
                let rowBg = "hover:bg-slate-50/50 dark:hover:bg-slate-800/30";
                if (row.type === "modified") rowBg = "bg-amber-50/30 dark:bg-amber-950/10";
                if (row.type === "added") rowBg = "bg-emerald-50/30 dark:bg-emerald-950/10";
                if (row.type === "removed") rowBg = "bg-rose-50/30 dark:bg-rose-950/10";

                return (
                  <tr key={row.key} className={rowBg}>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        {row.type === "added" && <PlusCircle className="h-3 w-3 text-emerald-600 shrink-0" />}
                        {row.type === "removed" && <MinusCircle className="h-3 w-3 text-rose-600 shrink-0" />}
                        {row.type === "modified" && <RefreshCw className="h-3 w-3 text-amber-600 shrink-0" />}
                        <span>{row.key}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 align-top text-slate-600 dark:text-slate-400 break-all">
                      {row.type === "added" ? (
                        <span className="text-slate-300 dark:text-slate-600 italic">None</span>
                      ) : (
                        <span className={row.type === "removed" || row.type === "modified" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 px-1.5 py-0.5 rounded" : ""}>
                          {formatVal(row.oldVal)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 align-top text-slate-600 dark:text-slate-400 break-all">
                      {row.type === "removed" ? (
                        <span className="text-slate-300 dark:text-slate-600 italic">Removed</span>
                      ) : (
                        <span className={row.type === "added" || row.type === "modified" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded" : ""}>
                          {formatVal(row.newVal)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
