"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Calendar, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import apiClient from "@/services/apiClient";
import type { DynamicColumn, DynamicFormField, DynamicSelectOption } from "@/lib/dynamic-schema/types";
import { formatCurrency, formatDate, getCurrencySymbol } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/**
 * Masks sensitive values based on field security configuration.
 */
export function maskFieldValue(
  value: any,
  maskType?: "none" | "full" | "partial" | "lastFour"
): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value).trim();
  if (!maskType || maskType === "none") return str;

  if (maskType === "full") {
    return "••••••••";
  }

  if (maskType === "lastFour") {
    if (str.length <= 4) return "••••";
    const lastFour = str.slice(-4);
    const maskedPrefix = str.length > 8 ? "•••• •••• " : "•••• ";
    return `${maskedPrefix}${lastFour}`;
  }

  if (maskType === "partial") {
    if (str.includes("@")) {
      const parts = str.split("@");
      const user = parts[0];
      const domain = parts.slice(1).join("@");
      const maskedUser = user.length > 2 ? `${user.slice(0, 2)}••••` : `${user[0] || "•"}••••`;
      return `${maskedUser}@${domain}`;
    }
    if (str.length <= 4) {
      return `${str[0]}••${str.slice(-1)}`;
    }
    return `${str.slice(0, 2)}••••${str.slice(-2)}`;
  }

  return str;
}

/**
 * Renders a data cell in the DynamicTable according to column dataType and formatting.
 */
export function renderDynamicTableCell(column: DynamicColumn, value: any, row?: any): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span>;
  }

  if (column.security?.maskType && column.security.maskType !== "none") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
        <Lock className="h-3 w-3 text-slate-400 shrink-0" />
        <span>{maskFieldValue(value, column.security.maskType)}</span>
      </span>
    );
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
      const currCode = column.currencyCode || row?.currency || row?.currencyCode || "INR";
      const locale = currCode.toUpperCase() === "INR" ? "en-IN" : "en-US";
      return (
        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
          {formatCurrency(num, currCode, locale)}
        </span>
      );
    }

    case "date": {
      return (
        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs font-mono">
          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
          {formatDate(value)}
        </span>
      );
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

    default: {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
              >
                {String(item)}
              </span>
            ))}
          </div>
        );
      }

      const keyLower = (column.key || "").toLowerCase();
      if (keyLower.includes("role")) {
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
            {String(value)}
          </span>
        );
      }

      // Check if row has a companion display name (e.g. departmentId -> departmentName or department)
      const companionKeys = [
        column.key.replace(/id$/i, "Name"),
        column.key.replace(/id$/i, "Title"),
        column.key.replace(/id$/i, "Label"),
        column.key.replace(/id$/i, ""),
      ];
      for (const cKey of companionKeys) {
        if (row && row[cKey] && typeof row[cKey] === "string" && row[cKey] !== value) {
          return <span className="text-slate-800 dark:text-slate-200 text-xs font-medium">{row[cKey]}</span>;
        }
      }

      const valStr = String(value);

      // Handle Image Thumbnail column
      if (keyLower.includes("image") || keyLower.includes("avatar") || keyLower.includes("photo")) {
        if (valStr && (valStr.startsWith("http") || valStr.startsWith("data:") || valStr.startsWith("/"))) {
          return (
            <div className="h-7 w-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
              <img src={valStr} alt="thumbnail" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            </div>
          );
        }
      }

      // Handle Full Name / Name with Avatar Pill (Frappe / ERPNext style)
      if (keyLower === "fullname" || keyLower === "name" || keyLower === "displayname" || keyLower === "employeename") {
        const initials = valStr
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "—";
        const imageSrc = row?.image || row?.avatar || row?.photoUrl;

        return (
          <div className="inline-flex items-center gap-2.5">
            {imageSrc ? (
              <img src={imageSrc} alt={valStr} className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            ) : (
              <span className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-[10px] font-bold shrink-0">
                {initials}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {valStr}
            </span>
          </div>
        );
      }

      // If it's a raw GUID ID, render cleanly
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valStr)) {
        return (
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400" title={valStr}>
            {valStr.slice(0, 8)}…
          </span>
        );
      }

      return <span className="text-slate-800 dark:text-slate-200 text-xs">{valStr}</span>;
    }
  }
}

/**
 * Humanizes and sanitizes field labels and placeholders, cleaning bad acronym splits and underscores.
 */
export function cleanFieldLabel(label: string): string {
  if (!label) return "";
  return label
    .replace(/\bH\s*R[_\s]*/gi, "HR ")
    .replace(/\bU\s*R\s*L\b/gi, "URL")
    .replace(/\bP\s*A\s*N\b/gi, "PAN")
    .replace(/\bG\s*S\s*T\b/gi, "GST")
    .replace(/\bI\s*F\s*S\s*C\b/gi, "IFSC")
    .replace(/\bI\s*D\b/gi, "ID")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const lookupCache = new Map<string, DynamicSelectOption[]>();

function inferLookupEndpoint(key: string, fieldType: string): string | null {
  const k = key.toLowerCase();
  if (k.includes("country")) return "/api/v1/lookup?type=countries";
  if (k.includes("state")) return "/api/v1/lookup?type=states";
  if (k.includes("city") || k.includes("district")) return "/api/v1/lookup?type=cities";
  if (k.includes("department")) return "/api/v1/lookup?type=departments";
  if (k.includes("designation")) return "/api/v1/lookup?type=designations";
  if (k.includes("branch")) return "/api/v1/lookup?type=branches";
  if (k.includes("company") && !k.includes("name")) return "/api/v1/lookup?type=companies";
  if (k.includes("project") && !k.includes("name")) return "/api/v1/lookup?type=projects";
  if (k.includes("manager") || (k.includes("employee") && !k.includes("name") && !k.includes("code"))) return "/api/v1/lookup?type=employees";
  if (k.includes("vendor")) return "/api/v1/lookup?type=vendors";
  if (k.includes("customer")) return "/api/v1/lookup?type=customers";
  if (k.includes("item") && !k.includes("count") && !k.includes("total")) return "/api/v1/lookup?type=items";
  if (k.includes("warehouse")) return "/api/v1/lookup?type=warehouses";
  if (k.includes("shift")) return "/api/v1/lookup?type=shifts";
  if (k.includes("leavetype")) return "/api/v1/lookup?type=leave-types";
  if (k.includes("costcenter")) return "/api/v1/lookup?type=cost-centers";
  if (k.includes("businessunit")) return "/api/v1/lookup?type=business-units";
  if (k === "currency") return "/api/v1/lookup?type=currencies";
  if (fieldType === "lookup") return `/api/v1/lookup?type=${encodeURIComponent(k.replace(/id$/i, ""))}`;
  return null;
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
  const [isUnmasked, setIsUnmasked] = useState(false);
  const isMaskedField = Boolean(field.security?.maskType && field.security.maskType !== "none");

  // Cascading lookup parent value
  const parentValue = field.dependsOn && formValues ? formValues[field.dependsOn] : undefined;
  const isParentMissing = field.dependsOn ? !parentValue : false;

  useEffect(() => {
    const targetEndpoint = field.optionsEndpoint || inferLookupEndpoint(field.key, field.fieldType);
    if ((field.fieldType === "lookup" || field.fieldType === "select") && targetEndpoint) {
      if (field.fieldType === "select" && !field.optionsEndpoint && field.options && field.options.length > 0) {
        return;
      }

      if (field.dependsOn && !parentValue) {
        setLookupOptions([]);
        return;
      }

      const filterParam = field.filterParam
        ? field.filterParam
        : targetEndpoint.includes("/lookup")
          ? "parentId"
          : (field.dependsOn || "parentId");
      let endpoint = targetEndpoint;
      if (parentValue && filterParam) {
        const separator = endpoint.includes("?") ? "&" : "?";
        endpoint = `${endpoint}${separator}${encodeURIComponent(filterParam)}=${encodeURIComponent(String(parentValue))}`;
      }

      if (lookupCache.has(endpoint)) {
        setLookupOptions(lookupCache.get(endpoint)!);
        return;
      }

      let isMounted = true;
      setLoadingLookup(true);

      apiClient
        .get(endpoint)
        .then((res) => {
          if (!isMounted) return;
          const raw = res.data?.items ?? res.data?.data ?? res.data;
          if (Array.isArray(raw)) {
            const valKey = field.lookupValueKey || "id";
            const lblKey = field.lookupLabelKey || "name";
            const opts: DynamicSelectOption[] = raw.map((item: any) => ({
              value: String(item[valKey] ?? item.id ?? item.code ?? ""),
              label: String(item[lblKey] ?? item.name ?? item.title ?? item.label ?? "Unnamed"),
            }));
            lookupCache.set(endpoint, opts);
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
  }, [field.fieldType, field.optionsEndpoint, field.key, field.options, field.lookupValueKey, field.lookupLabelKey, field.dependsOn, field.filterParam, parentValue]);

  const rawVal = value ?? field.defaultValue ?? "";
  const cleanLabel = cleanFieldLabel(field.label);
  const safeKey = field.key || `field_${cleanLabel.replace(/\s+/g, "_").toLowerCase()}`;
  const cleanPlaceholder = field.placeholder
    ? cleanFieldLabel(field.placeholder)
    : `Enter ${cleanLabel.toLowerCase()}…`;

  return (
    <div className="erp-field space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="erp-label text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          {cleanLabel} {field.required && <span className="text-rose-500">*</span>}
          {isMaskedField && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.2 rounded"
              title={`Secured Field (${field.security?.maskType} masking)`}
            >
              <Lock className="h-2.5 w-2.5" />
              Secured
            </span>
          )}
        </label>
        <div className="flex items-center gap-1.5">
          {isMaskedField && (
            <button
              type="button"
              onClick={() => setIsUnmasked((prev) => !prev)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
              title={isUnmasked ? "Mask value" : "Reveal unmasked value"}
            >
              {isUnmasked ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  <span>Mask</span>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  <span>Reveal</span>
                </>
              )}
            </button>
          )}
          {field.isCustom && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
              Custom
            </span>
          )}
        </div>
      </div>

      {field.fieldType === "image" ||
      field.fieldType === "file" ||
      safeKey.toLowerCase().includes("image") ||
      safeKey.toLowerCase().includes("avatar") ||
      safeKey.toLowerCase().includes("photo") ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id={`field-${field.key}`}
                name={field.key}
                type="text"
                value={rawVal}
                placeholder={cleanPlaceholder || "Image URL or /files/…"}
                disabled={disabled || field.readOnly}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                  "erp-input text-xs font-mono h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 w-full",
                  error && "border-rose-500 focus:border-rose-500"
                )}
              />
            </div>
            {rawVal && !disabled && !field.readOnly && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Clear
              </button>
            )}
            <label className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0">
              <span>Upload</span>
              <input
                id={`field-upload-${field.key}`}
                name={`upload_${field.key}`}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={disabled || field.readOnly}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        onChange(event.target.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          {rawVal && (
            <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-2xs">
              <img
                src={rawVal}
                alt={cleanLabel}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      ) : field.fieldType === "textarea" ? (
        <textarea
          id={`field-${field.key}`}
          name={field.key}
          rows={3}
          value={rawVal}
          placeholder={cleanPlaceholder}
          disabled={disabled || field.readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "erp-textarea text-xs leading-relaxed rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500",
            error && "border-rose-500 focus:border-rose-500"
          )}
        />
      ) : field.fieldType === "select" ? (
        <select
          id={`field-${field.key}`}
          name={field.key}
          value={rawVal}
          disabled={disabled || field.readOnly || loadingLookup || isParentMissing}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "erp-input text-xs h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500",
            error && "border-rose-500 focus:border-rose-500"
          )}
        >
          <option value="">
            {loadingLookup
              ? "Loading options…"
              : isParentMissing
              ? `Select ${cleanFieldLabel(field.dependsOn || "")} first…`
              : cleanPlaceholder || `Select ${cleanLabel}…`}
          </option>
          {(lookupOptions.length > 0 ? lookupOptions : field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {cleanFieldLabel(opt.label)}
            </option>
          ))}
        </select>
      ) : field.fieldType === "lookup" ? (
        <select
          id={`field-${field.key}`}
          name={field.key}
          value={rawVal}
          disabled={disabled || field.readOnly || loadingLookup || isParentMissing}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "erp-input text-xs font-medium h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500",
            error && "border-rose-500 focus:border-rose-500"
          )}
        >
          <option value="">
            {loadingLookup
              ? "Loading options…"
              : isParentMissing
              ? `Select ${cleanFieldLabel(field.dependsOn || "")} first…`
              : cleanPlaceholder || `Select ${cleanLabel}…`}
          </option>
          {(lookupOptions.length > 0 ? lookupOptions : field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {cleanFieldLabel(opt.label)}
            </option>
          ))}
        </select>
      ) : field.fieldType === "boolean" || field.fieldType === "checkbox" ? (
        <div className="pt-1 pb-0.5">
          <label className="group inline-flex items-center gap-3 cursor-pointer select-none">
            <div className="relative inline-flex items-center">
              <input
                id={`field-${field.key}`}
                name={field.key}
                type="checkbox"
                checked={Boolean(rawVal)}
                disabled={disabled || field.readOnly}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-500/30" />
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-2xs" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              {Boolean(rawVal) ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  Inactive
                </span>
              )}
            </span>
          </label>
        </div>
      ) : field.fieldType === "date" ? (
        <input
          id={`field-${field.key}`}
          name={field.key}
          type="date"
          value={typeof rawVal === "string" ? rawVal.slice(0, 10) : ""}
          disabled={disabled || field.readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "erp-input text-xs font-mono h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500",
            error && "border-rose-500 focus:border-rose-500"
          )}
        />
      ) : field.fieldType === "currency" ? (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs font-semibold font-mono select-none">
            {getCurrencySymbol(field.currencyCode || "INR")}
          </span>
          <input
            id={`field-${field.key}`}
            name={field.key}
            type="number"
            step="any"
            value={rawVal}
            placeholder={field.placeholder || "0.00"}
            disabled={disabled || field.readOnly}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "erp-input pl-8 text-xs font-mono h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500",
              error && "border-rose-500 focus:border-rose-500"
            )}
          />
        </div>
      ) : field.readOnly ? (
        <div className="flex h-9 items-center justify-between rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 px-3 text-xs font-mono text-slate-500 dark:text-slate-400 select-none">
          <span className="flex items-center gap-1.5 truncate">
            {rawVal ? (
              <>
                <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {isMaskedField && !isUnmasked
                    ? maskFieldValue(rawVal, field.security?.maskType)
                    : rawVal}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="italic text-slate-400 dark:text-slate-500">Auto-generated on save</span>
              </>
            )}
          </span>
          <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider shrink-0">
            System
          </span>
        </div>
      ) : (
        <div className="relative w-full">
          <input
            id={`field-${field.key}`}
            name={field.key}
            type={
              isMaskedField && !isUnmasked
                ? "password"
                : field.fieldType === "number"
                ? "number"
                : field.fieldType === "email"
                ? "email"
                : field.fieldType === "phone"
                ? "tel"
                : "text"
            }
            value={
              isMaskedField && !isUnmasked && field.security?.maskType !== "full" && rawVal
                ? maskFieldValue(rawVal, field.security?.maskType)
                : rawVal
            }
            placeholder={cleanPlaceholder}
            disabled={disabled || field.readOnly}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (isMaskedField && !isUnmasked && field.security?.maskType !== "full") {
                setIsUnmasked(true);
              }
            }}
            className={cn(
              "erp-input text-xs h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500",
              isMaskedField && "pr-9",
              error && "border-rose-500 focus:border-rose-500"
            )}
          />
          {isMaskedField && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsUnmasked((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title={isUnmasked ? "Hide sensitive value" : "Show sensitive value"}
            >
              {isUnmasked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {field.helpText && <p className="text-[10px] text-slate-400">{field.helpText}</p>}
    </div>
  );
}
