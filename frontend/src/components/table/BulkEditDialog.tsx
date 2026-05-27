"use client";

import { useState } from "react";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";

interface BulkEditDialogProps {
  fields: BulkActionFieldConfig[];
  selectionCount: number;
  onApply: (updates: Record<string, unknown>) => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

/**
 * Multi-field bulk edit dialog.
 * Users choose which fields to update and enter new values,
 * then click Apply to patch all selected rows.
 */
export function BulkEditDialog({
  fields,
  selectionCount,
  onApply,
  onClose,
  loading = false,
}: BulkEditDialogProps) {
  const editableFields = fields.filter((f) => f.editable !== false);

  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    editableFields.forEach((f) => {
      if (f.fieldType === "boolean") init[f.key] = false;
      else if (f.fieldType === "number") init[f.key] = "";
      else init[f.key] = "";
    });
    return init;
  });

  const toggleField = (key: string) => {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = async () => {
    const updates: Record<string, unknown> = {};
    enabledKeys.forEach((key) => {
      updates[key] = values[key];
    });
    if (Object.keys(updates).length === 0) return;
    await onApply(updates);
  };

  return (
    <div className="erp-modal-backdrop p-4" onClick={onClose}>
      <div className="erp-modal-card erp-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="erp-modal-accent" />
        {/* Header */}
        <div className="erp-modal-header">
          <div className="min-w-0">
            <h3 className="erp-modal-title">Bulk Edit</h3>
            <p className="erp-modal-subtitle">
              Editing {selectionCount} selected {selectionCount === 1 ? "record" : "records"}. Check fields to update.
            </p>
          </div>
          <button type="button" onClick={onClose} className="erp-modal-close" title="Close">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="erp-modal-body max-h-[50vh] space-y-4">
          {editableFields.length === 0 && (
            <p className="text-sm text-slate-500">No editable fields configured for this page.</p>
          )}
          {editableFields.map((field) => {
            const active = enabledKeys.has(field.key);
            return (
              <div key={field.key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`bulk-field-${field.key}`}
                  checked={active}
                  onChange={() => toggleField(field.key)}
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`bulk-field-${field.key}`}
                    className="block text-sm font-medium text-slate-700"
                  >
                    {field.label}
                  </label>
                  {active && (
                    <div className="mt-1.5">
                      {field.fieldType === "select" && (
                        <select
                          value={String(values[field.key] ?? "")}
                          onChange={(e) => setValue(field.key, e.target.value)}
                          className="erp-input w-full"
                        >
                          <option value="">— Select —</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {field.fieldType === "boolean" && (
                        <select
                          value={String(values[field.key])}
                          onChange={(e) => setValue(field.key, e.target.value === "true")}
                          className="erp-input w-full"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      )}
                      {field.fieldType === "number" && (
                        <input
                          type="number"
                          value={String(values[field.key] ?? "")}
                          onChange={(e) => setValue(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="erp-input w-full"
                        />
                      )}
                      {(field.fieldType === "text" || field.fieldType === "date") && (
                        <input
                          type={field.fieldType === "date" ? "date" : "text"}
                          value={String(values[field.key] ?? "")}
                          onChange={(e) => setValue(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="erp-input w-full"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="erp-modal-footer">
          <button type="button" onClick={onClose} className="erp-action-btn erp-action-btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || enabledKeys.size === 0}
            onClick={() => void handleApply()}
            className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
          >
            {loading ? "Applying…" : `Apply to ${selectionCount} records`}
          </button>
        </div>
      </div>
    </div>
  );
}
