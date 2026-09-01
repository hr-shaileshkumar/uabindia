"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type FieldDefinition = {
  id: string;
  entityName: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: "text" | "number" | "date" | "boolean" | "select" | "textarea";
  optionsJson?: string;
  isRequired: boolean;
  section?: string;
};

type DynamicCustomFieldsFormProps = {
  entityName: string;
  recordId?: string;
  valueMap: Record<string, string | undefined>;
  onChange: (fieldKey: string, value: string) => void;
};

export function DynamicCustomFieldsForm({
  entityName,
  recordId,
  valueMap,
  onChange,
}: DynamicCustomFieldsFormProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiClient
      .get(`/platform/custom-fields/definitions/${encodeURIComponent(entityName)}`, {
        headers: { "X-Silent-Error": "1" },
      })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setFields(list);
      })
      .catch(() => {
        if (active) setFields([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [entityName]);

  useEffect(() => {
    if (!recordId || !entityName) return;
    let active = true;

    apiClient
      .get<{ values: Record<string, string | null> }>(
        `/platform/custom-fields/values/${encodeURIComponent(entityName)}/${encodeURIComponent(recordId)}`,
        { headers: { "X-Silent-Error": "1" } }
      )
      .then((res) => {
        if (!active || !res.data?.values) return;
        Object.entries(res.data.values).forEach(([k, v]) => {
          if (v != null) onChange(k, v);
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [entityName, recordId]);

  if (loading || fields.length === 0) {
    return null;
  }

  // Group by section
  const sections = new Map<string, FieldDefinition[]>();
  for (const field of fields) {
    const sec = field.section || "Custom Attributes";
    const list = sections.get(sec) ?? [];
    list.push(field);
    sections.set(sec, list);
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      {Array.from(sections.entries()).map(([sectionName, sectionFields]) => (
        <div key={sectionName} className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{sectionName}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sectionFields.map((field) => {
              const val = valueMap[field.fieldKey] ?? "";
              const options = field.optionsJson ? JSON.parse(field.optionsJson) : [];

              return (
                <div key={field.fieldKey} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    {field.fieldLabel} {field.isRequired ? <span className="text-rose-500">*</span> : null}
                  </Label>

                  {field.fieldType === "boolean" ? (
                    <div className="flex items-center gap-3 pt-1">
                      <Switch
                        checked={val === "true"}
                        onCheckedChange={(checked) => onChange(field.fieldKey, checked ? "true" : "false")}
                      />
                      <span className="text-xs text-slate-600">{val === "true" ? "Yes" : "No"}</span>
                    </div>
                  ) : field.fieldType === "select" ? (
                    <select
                      value={val}
                      onChange={(e) => onChange(field.fieldKey, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select option…</option>
                      {options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.fieldType === "textarea" ? (
                    <textarea
                      value={val}
                      onChange={(e) => onChange(field.fieldKey, e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                    />
                  ) : (
                    <Input
                      type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
                      value={val}
                      onChange={(e) => onChange(field.fieldKey, e.target.value)}
                      className="h-8 text-xs bg-white"
                      placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
