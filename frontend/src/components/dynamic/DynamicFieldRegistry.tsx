"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Calendar, IndianRupee } from "lucide-react";
import apiClient from "@/services/apiClient";
import type { DynamicColumn, DynamicFormField, DynamicSelectOption } from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

/**
 * Renders a data cell in the DynamicTable according to column dataType and formatting.
 */
export function renderDynamicTableCell(column: DynamicColumn, value: any, row?: any): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span>;
  }

  switch (column.dataType) {
    case "badge":
    case "status": {
      const valStr = String(value);
      const isPositive = ["active", "approved", "completed", "paid", "confirmed", "permanent"].includes(
        valStr.toLowerCase()
      );
      const isWarning = ["onleave", "pending", "probationary", "notice", "planning", "draft"].includes(
        valStr.toLowerCase()
      );
      const isNegative = ["inactive", "terminated", "rejected", "overdue", "cancelled"].includes(
        valStr.toLowerCase()
      );

      const badgeClasses = isPositive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
        : isWarning
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
        : isNegative
        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs",
            badgeClasses
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isPositive
                ? "bg-emerald-500"
                : isWarning
                ? "bg-amber-500"
                : isNegative
                ? "bg-rose-500"
                : "bg-slate-400"
            )}
          />
          {valStr}
        </span>
      );
    }

    case "currency": {
      const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
      if (isNaN(num)) return String(value);
      return (
        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
          ₹ {num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }

    case "date": {
      const str = String(value).slice(0, 10);
      try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs font-mono">
            <Calendar className="h-3 w-3 text-slate-400" />
            {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      } catch {
        return str;
      }
    }

    case "boolean": {
      const isTrue = value === true || String(value).toLowerCase() === "true";
      return isTrue ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
          <XCircle className="h-3.5 w-3.5" />
          No
        </span>
      );
    }

    default:
      return <span className="text-slate-800 dark:text-slate-200 text-xs">{String(value)}</span>;
  }
}

/**
 * Reusable dynamic input control for forms.
 */
export function DynamicFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
  formValues,
}: {
  field: DynamicFormField;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
  formValues?: Record<string, any>;
}) {
  const [lookupOptions, setLookupOptions] = useState<DynamicSelectOption[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Cascading lookup parent value
  const parentValue = field.dependsOn && formValues ? formValues[field.dependsOn] : undefined;
  const isParentMissing = field.dependsOn ? !parentValue : false;

  useEffect(() => {
    if (field.fieldType === "lookup" && field.optionsEndpoint) {
      if (field.dependsOn && !parentValue) {
        setLookupOptions([]);
        return;
      }

      let isMounted = true;
      setLoadingLookup(true);

      const filterParam = field.filterParam || field.dependsOn;
      let endpoint = field.optionsEndpoint;
      if (parentValue && filterParam) {
        const separator = endpoint.includes("?") ? "&" : "?";
        endpoint = `${endpoint}${separator}${encodeURIComponent(filterParam)}=${encodeURIComponent(String(parentValue))}`;
      }

      apiClient
        .get(endpoint)
        .then((res) => {
          if (!isMounted) return;
          const raw = res.data?.items ?? res.data?.data ?? res.data;
          if (Array.isArray(raw)) {
            const valKey = field.lookupValueKey || "id";
            const lblKey = field.lookupLabelKey || "name";
            const opts: DynamicSelectOption[] = raw.map((item: any) => ({
              value: String(item[valKey] ?? item.id ?? ""),
              label: String(item[lblKey] ?? item.name ?? item.title ?? "Unnamed"),
            }));
            setLookupOptions(opts);
          }
        })
        .catch(() => {
          if (isMounted) setLookupOptions([]);
        })
        .finally(() => {
          if (isMounted) setLoadingLookup(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [field.fieldType, field.optionsEndpoint, field.lookupValueKey, field.lookupLabelKey, field.dependsOn, field.filterParam, parentValue]);

  const rawVal = value ?? field.defaultValue ?? "";

  return (
    <div className="erp-field space-y-1">
      <div className="flex items-center justify-between">
        <label className="erp-label text-xs font-semibold text-slate-700 dark:text-slate-300">
          {field.label} {field.required && <span className="text-rose-500">*</span>}
        </label>
        {field.isCustom && (
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
            Custom
          </span>
        )}
      </div>

      {field.fieldType === "textarea" ? (
        <textarea
          rows={3}
          value={rawVal}
          placeholder={field.placeholder}
          disabled={disabled || field.readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={cn("erp-textarea text-xs", error && "border-rose-500 focus:border-rose-500")}
        />
      ) : field.fieldType === "select" ? (
        <select
          value={rawVal}
          disabled={disabled || field.readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={cn("erp-input text-xs", error && "border-rose-500 focus:border-rose-500")}
        >
          <option value="">{field.placeholder || `Select ${field.label}…`}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.fieldType === "lookup" ? (
        <select
          value={rawVal}
          disabled={disabled || field.readOnly || loadingLookup || isParentMissing}
          onChange={(e) => onChange(e.target.value)}
          className={cn("erp-input text-xs font-medium", error && "border-rose-500 focus:border-rose-500")}
        >
          <option value="">
            {loadingLookup
              ? "Loading options…"
              : isParentMissing
              ? `Select ${field.dependsOn} first…`
              : field.placeholder || `Select ${field.label}…`}
          </option>
          {(lookupOptions.length > 0 ? lookupOptions : field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.fieldType === "boolean" || field.fieldType === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={Boolean(rawVal)}
            disabled={disabled || field.readOnly}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
          />
          <span className="text-xs text-slate-700 dark:text-slate-300">
            {field.placeholder || "Enable / Active"}
          </span>
        </label>
      ) : field.fieldType === "date" ? (
        <input
          type="date"
          value={typeof rawVal === "string" ? rawVal.slice(0, 10) : ""}
          disabled={disabled || field.readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={cn("erp-input text-xs font-mono", error && "border-rose-500 focus:border-rose-500")}
        />
      ) : field.fieldType === "currency" ? (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
            <IndianRupee className="h-3 w-3" />
          </span>
          <input
            type="number"
            step="any"
            value={rawVal}
            placeholder={field.placeholder || "0.00"}
            disabled={disabled || field.readOnly}
            onChange={(e) => onChange(e.target.value)}
            className={cn("erp-input pl-8 text-xs font-mono", error && "border-rose-500 focus:border-rose-500")}
          />
        </div>
      ) : (
        <input
          type={
            field.fieldType === "number"
              ? "number"
              : field.fieldType === "email"
              ? "email"
              : field.fieldType === "phone"
              ? "tel"
              : "text"
          }
          value={rawVal}
          placeholder={field.placeholder}
          disabled={disabled || field.readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={cn("erp-input text-xs", error && "border-rose-500 focus:border-rose-500")}
        />
      )}

      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {field.helpText && <p className="text-[10px] text-slate-400">{field.helpText}</p>}
    </div>
  );
}
