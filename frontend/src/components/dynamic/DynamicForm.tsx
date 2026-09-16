"use client";

import React, { useState } from "react";
import { DynamicFieldInput } from "./DynamicFieldRegistry";
import { DynamicLineItemsEditor } from "./DynamicLineItemsEditor";
import type { DynamicFormSection } from "@/lib/dynamic-schema/types";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { notifyError } from "@/lib/notifications";

interface DynamicFormProps {
  sections: DynamicFormSection[];
  initialData?: Record<string, any> | null;
  onSubmit: (formData: Record<string, any>) => Promise<void> | void;
  onCancel: () => void;
  isSaving?: boolean;
  isEdit?: boolean;
}

export function DynamicForm({
  sections,
  initialData,
  onSubmit,
  onCancel,
  isSaving = false,
  isEdit = false,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    for (const sec of sections) {
      for (const f of sec.fields) {
        if (initialData && initialData[f.key] !== undefined) {
          defaults[f.key] = initialData[f.key];
        } else if (f.defaultValue !== undefined) {
          defaults[f.key] = f.defaultValue;
        } else {
          defaults[f.key] = f.fieldType === "boolean" ? false : "";
        }
      }
    }
    return { ...defaults, ...(initialData || {}) };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // Cascading logic: if any field depends on this key, clear child values
      for (const sec of sections) {
        for (const f of sec.fields) {
          if (f.dependsOn === key) {
            next[f.key] = "";
          }
        }
      }
      return next;
    });

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Layer 3: Dynamic Validation Engine
    const newErrors: Record<string, string> = {};
    for (const sec of sections) {
      for (const f of sec.fields) {
        const val = formData[f.key];

        // 1. Mandatory check
        if (f.required) {
          if (val === undefined || val === null || (typeof val === "string" && !val.trim())) {
            newErrors[f.key] = `${f.label} is required.`;
            continue;
          }
        }

        // 2. Regex Pattern check
        if (f.validation?.pattern && typeof val === "string" && val.trim()) {
          try {
            const regex = new RegExp(f.validation.pattern);
            if (!regex.test(val.trim())) {
              newErrors[f.key] = f.validation.patternMessage || `${f.label} format is invalid.`;
            }
          } catch {
            // Safe fallback if invalid regex
          }
        }

        // 3. Min boundary check
        if (f.validation?.min !== undefined && val !== undefined && val !== "") {
          if (f.fieldType === "number" || f.fieldType === "currency" || f.fieldType === "decimal") {
            const numVal = Number(val);
            if (!isNaN(numVal) && numVal < f.validation.min) {
              newErrors[f.key] = `${f.label} must be at least ${f.validation.min}.`;
            }
          } else if (typeof val === "string" && val.length < f.validation.min) {
            newErrors[f.key] = `${f.label} must have at least ${f.validation.min} characters.`;
          }
        }

        // 4. Max boundary check
        if (f.validation?.max !== undefined && val !== undefined && val !== "") {
          if (f.fieldType === "number" || f.fieldType === "currency" || f.fieldType === "decimal") {
            const numVal = Number(val);
            if (!isNaN(numVal) && numVal > f.validation.max) {
              newErrors[f.key] = `${f.label} cannot exceed ${f.validation.max}.`;
            }
          } else if (typeof val === "string" && val.length > f.validation.max) {
            newErrors[f.key] = `${f.label} cannot exceed ${f.validation.max} characters.`;
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifyError("Please correct the highlighted fields before submitting.");
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((sec, secIdx) => (
        <div
          key={sec.title || secIdx}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-4"
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {sec.title}
            </h4>
            {sec.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sec.description}</p>
            )}
          </div>

          {sec.fields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sec.fields.map((field) => (
                <div
                  key={field.key}
                  className={
                    field.fieldType === "textarea" ? "sm:col-span-2" : "col-span-1"
                  }
                >
                  <DynamicFieldInput
                    field={field}
                    value={formData[field.key]}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    error={errors[field.key]}
                    disabled={isSaving}
                    formValues={formData}
                  />
                </div>
              ))}
            </div>
          )}

          {sec.lineItems && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <DynamicLineItemsEditor
                config={sec.lineItems}
                items={Array.isArray(formData[sec.lineItems.key]) ? formData[sec.lineItems.key] : []}
                disabled={isSaving}
                onChange={(updatedItems) => {
                  const key = sec.lineItems!.key;
                  const totalField = sec.lineItems!.totalComputedField;
                  setFormData((prev) => {
                    const next = { ...prev, [key]: updatedItems };
                    if (totalField) {
                      const sum = updatedItems.reduce((acc, row) => {
                        const val = parseFloat(row.total ?? row.lineTotal ?? row.amount ?? 0) || 0;
                        return acc + val;
                      }, 0);
                      next[totalField] = sum;
                    }
                    return next;
                  });
                }}
              />
            </div>
          )}
        </div>
      ))}

      <div className="pt-2">
        <ErpDrawerFooter
          onCancel={onCancel}
          onSave={() => void handleSubmit()}
          saving={isSaving}
          isEdit={isEdit}
        />
      </div>
    </form>
  );
}
