"use client";

import { useCallback, useEffect, useState } from "react";
import { appApi } from "@/services/modules";

type FieldDef = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  options?: string[] | null;
  isRequired: boolean;
  section?: string | null;
  value?: string | null;
};

type ApiFieldValue = {
  fieldDefinitionId?: string;
  id?: string;
  fieldKey?: string;
  fieldLabel?: string;
  fieldType?: string;
  options?: string[] | null;
  isRequired?: boolean;
  section?: string | null;
  value?: string | null;
};

type DynamicFieldsSectionProps = {
  entityName: string;
  recordId: string;
  /** Whether to render in edit mode (default: false = read-only display) */
  editable?: boolean;
  /** Compact layout for drawers/inspectors */
  compact?: boolean;
  /** Called when values are saved */
  onSaved?: () => void;
};

function mapApiField(raw: ApiFieldValue): FieldDef | null {
  const id = String(raw.fieldDefinitionId ?? raw.id ?? "");
  if (!id) return null;
  return {
    id,
    fieldKey: String(raw.fieldKey ?? ""),
    fieldLabel: String(raw.fieldLabel ?? raw.fieldKey ?? "Field"),
    fieldType: String(raw.fieldType ?? "text"),
    options: Array.isArray(raw.options) ? raw.options : null,
    isRequired: Boolean(raw.isRequired),
    section: raw.section ?? null,
    value: raw.value ?? null,
  };
}

/** Alias used in Horizon 2 docs / product language. */
export function CustomFieldsPanel(props: DynamicFieldsSectionProps) {
  return <DynamicFieldsSection {...props} />;
}

export default function DynamicFieldsSection({
  entityName,
  recordId,
  editable = false,
  compact = false,
  onSaved,
}: DynamicFieldsSectionProps) {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchFields = useCallback(async () => {
    if (!recordId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.entityFields.getValues(entityName, recordId);
      const rawList: ApiFieldValue[] = Array.isArray(res.data?.values)
        ? res.data.values
        : Array.isArray(res.data)
          ? res.data
          : [];
      const mapped = rawList.map(mapApiField).filter((f): f is FieldDef => f != null);
      setFields(mapped);
      const initial: Record<string, string> = {};
      for (const f of mapped) {
        initial[f.id] = f.value ?? "";
      }
      setValues(initial);
    } catch {
      setError("Failed to load custom fields");
    } finally {
      setLoading(false);
    }
  }, [entityName, recordId]);

  useEffect(() => {
    void fetchFields();
  }, [fetchFields]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = fields.map((f) => ({
        fieldDefinitionId: f.id,
        value: values[f.id] ?? null,
      }));
      await appApi.entityFields.saveValues(entityName, recordId, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.();
    } catch {
      setError("Failed to save custom fields");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mt-4 text-xs text-slate-400 animate-pulse">Loading custom fields…</div>;
  }

  if (fields.length === 0) {
    return editable ? (
      <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        No custom fields defined for {entityName}. Admins can add them under Platform → Schema Manager.
      </div>
    ) : null;
  }

  const sections = new Map<string, FieldDef[]>();
  for (const f of fields) {
    const key = f.section ?? "Additional Information";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(f);
  }

  return (
    <div
      className={
        compact
          ? "mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white"
          : "mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white"
      }
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-sm font-semibold text-slate-700">Custom Fields</h3>
        {editable ? (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="erp-action-btn erp-action-btn-primary text-xs min-h-8! px-3! disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save Custom Fields"}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 sm:mx-6">
          {error}
        </div>
      ) : null}

      <div className={compact ? "space-y-4 p-4" : "space-y-6 p-6"}>
        {Array.from(sections.entries()).map(([sectionName, sectionFields]) => (
          <div key={sectionName}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {sectionName}
            </p>
            <div className={`grid gap-4 ${compact ? "sm:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {sectionFields.map((f) => (
                <div key={f.id}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {f.fieldLabel}
                    {f.isRequired ? <span className="ml-0.5 text-red-500">*</span> : null}
                  </label>
                  {editable ? (
                    <FieldInput
                      field={f}
                      value={values[f.id] ?? ""}
                      onChange={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
                    />
                  ) : (
                    <p className="text-sm text-slate-800">
                      {values[f.id] || <span className="text-slate-400">—</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200";

  switch (field.fieldType) {
    case "select":
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">{value === "true" ? "Yes" : "No"}</span>
        </label>
      );
    case "number":
      return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={base} />;
    case "date":
      return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={base} />;
    case "textarea":
      return (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={base} />
      );
    default:
      return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={base} />;
  }
}
