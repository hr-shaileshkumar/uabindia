"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useUiSchema } from "@/context/UiSchemaContext";
import type { FieldDefDto, PageSchemaDto, TableColumnDto } from "@/lib/ui-schema/types";

type Primitive = string | number | boolean;
type CrudRow = Record<string, Primitive | null | undefined>;
type CrudFormData = Record<string, Primitive>;

type CrudApi = {
  getAll: (page?: number, limit?: number) => Promise<unknown>;
  create: (data: Record<string, Primitive>) => Promise<unknown>;
  update: (id: string, data: Record<string, Primitive>) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
};

type SchemaCrudPageProps = {
  pageKey: string;
  api: CrudApi;
  fallback: React.ReactNode;
  fallbackTitle: string;
  fallbackSubtitle?: string;
};

const formatValue = (value: Primitive | null | undefined, column: TableColumnDto) => {
  if (value === null || value === undefined || value === "") return "—";

  if (column.dataType === "boolean") return value ? "Yes" : "No";
  if (column.dataType === "currency") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(numeric);
  }
  if (column.dataType === "number") {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric.toLocaleString("en-IN") : String(value);
  }
  if (column.dataType === "date") {
    const asDate = new Date(String(value));
    return Number.isNaN(asDate.getTime()) ? String(value) : asDate.toLocaleDateString();
  }

  return String(value);
};

const getStringValue = (value: Primitive | null | undefined, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const coerceDefaultByFieldType = (field: FieldDefDto): Primitive => {
  const rawDefault = field.defaultValue ?? "";

  if (field.fieldType === "number") {
    const asNumber = Number(rawDefault || "0");
    return Number.isFinite(asNumber) ? asNumber : 0;
  }
  if (field.fieldType === "checkbox") {
    return ["true", "1", "yes", "on"].includes(rawDefault.toLowerCase());
  }

  return rawDefault;
};

const mapResponseToRows = (result: unknown): CrudRow[] => {
  if (typeof result !== "object" || result === null) return [];

  const dataRoot = (result as { data?: unknown }).data;
  if (Array.isArray(dataRoot)) return dataRoot as CrudRow[];
  if (typeof dataRoot === "object" && dataRoot !== null) {
    const nestedData = (dataRoot as { data?: unknown; items?: unknown; results?: unknown });
    if (Array.isArray(nestedData.data)) return nestedData.data as CrudRow[];
    if (Array.isArray(nestedData.items)) return nestedData.items as CrudRow[];
    if (Array.isArray(nestedData.results)) return nestedData.results as CrudRow[];
  }

  return [];
};

const buildInitialFormData = (schema: PageSchemaDto): CrudFormData => {
  const fields = (schema.form?.fields ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const initial: CrudFormData = {};

  for (const field of fields) {
    initial[field.key] = coerceDefaultByFieldType(field);
  }

  return initial;
};

export default function SchemaCrudPage({
  pageKey,
  api,
  fallback,
  fallbackTitle,
  fallbackSubtitle,
}: SchemaCrudPageProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { getPageSchema } = useUiSchema();
  const [schema, setSchema] = useState<PageSchemaDto | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [rows, setRows] = useState<CrudRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CrudFormData>({});

  const hasRenderableSchema = useMemo(() => {
    return !!(schema && schema.layout === "crud" && schema.form && schema.table);
  }, [schema]);

  useEffect(() => {
    let alive = true;
    const loadSchema = async () => {
      try {
        setSchemaLoading(true);
        const nextSchema = await getPageSchema(pageKey);
        if (!alive) return;
        setSchema(nextSchema);
        if (nextSchema?.form?.fields) {
          setFormData(buildInitialFormData(nextSchema));
        }
      } finally {
        if (alive) setSchemaLoading(false);
      }
    };

    void loadSchema();
    return () => {
      alive = false;
    };
  }, [getPageSchema, pageKey]);

  const tableColumns = useMemo(() => {
    if (!schema?.table?.columns) return [] as TableColumnDto[];
    return schema.table.columns
      .filter((column) => !column.hidden)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [schema]);

  const formFields = useMemo(() => {
    if (!schema?.form?.fields) return [] as FieldDefDto[];
    return schema.form.fields.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }, [schema]);

  const resetForm = useCallback(() => {
    if (!schema) return;
    setFormData(buildInitialFormData(schema));
  }, [schema]);

  const fetchRows = useCallback(async () => {
    if (!hasRenderableSchema) return;
    try {
      setLoading(true);
      const res = await api.getAll();
      const nextRows = mapResponseToRows(res);
      setRows(nextRows);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch records";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [api, hasRenderableSchema]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const handleFieldChange = useCallback((field: FieldDefDto, rawValue: string | boolean) => {
    setFormData((prev) => {
      if (field.fieldType === "number") {
        const parsed = Number(rawValue);
        return { ...prev, [field.key]: Number.isFinite(parsed) ? parsed : 0 };
      }

      if (field.fieldType === "checkbox") {
        return { ...prev, [field.key]: Boolean(rawValue) };
      }

      return { ...prev, [field.key]: String(rawValue) };
    });
  }, []);

  const handleEdit = useCallback((row: CrudRow) => {
    const nextData: CrudFormData = {};
    for (const field of formFields) {
      const existing = row[field.key];
      if (existing === null || existing === undefined) {
        nextData[field.key] = coerceDefaultByFieldType(field);
      } else if (field.fieldType === "number") {
        const parsed = Number(existing);
        nextData[field.key] = Number.isFinite(parsed) ? parsed : 0;
      } else if (field.fieldType === "checkbox") {
        nextData[field.key] = Boolean(existing);
      } else {
        nextData[field.key] = String(existing);
      }
    }
    setFormData(nextData);
    setEditingId(getStringValue(row.id, ""));
    setActiveTab("form");
  }, [formFields]);

  const validateForm = useCallback(() => {
    for (const field of formFields) {
      if (!field.required) continue;
      const value = formData[field.key];
      if (field.fieldType === "checkbox") continue;
      if (value === "" || value === null || value === undefined) {
        return `${field.label} is required`;
      }
    }

    return null;
  }, [formData, formFields]);

  const handleSave = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const entityTitle = schema?.title ?? fallbackTitle;

    const ok = await confirm({
      title: editingId ? `Update ${entityTitle}` : `Create ${entityTitle}`,
      message: editingId
        ? `Review changes and confirm updating this ${entityTitle.toLowerCase()} record.`
        : `Confirm creating this new ${entityTitle.toLowerCase()} record.`,
      confirmText: editingId ? "Update" : "Create",
    });
    if (!ok) {
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.update(editingId, formData);
      } else {
        await api.create(formData);
      }
      setEditingId(null);
      resetForm();
      setActiveTab("list");
      await fetchRows();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save record";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [api, confirm, editingId, fallbackTitle, fetchRows, formData, resetForm, schema?.title, validateForm]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await confirm({
      title: "Delete record",
      message: "Permanently delete this record? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(id);
      await fetchRows();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete record";
      setError(message);
    }
  }, [api, confirm, fetchRows]);

  if (schemaLoading) {
    return (
      <StandardPageLayout title={fallbackTitle} subtitle={fallbackSubtitle}>
        <div className="erp-loading p-4">Loading page schema…</div>
      </StandardPageLayout>
    );
  }

  if (!hasRenderableSchema || !schema?.table || !schema.form) {
    return <>{fallback}</>;
  }

  const tableSchema = schema.table;

  return (
    <StandardPageLayout title={schema.title} subtitle={schema.subTitle || fallbackSubtitle}>
      <div className="space-y-4 p-4">
        {confirmDialog}
        {error && (
          <div className="erp-alert-error">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* KPI summary cards */}
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Records</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">{schema.title} entries</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Fields</p><p className="erp-kpi-value">{tableColumns.length}</p><p className="erp-kpi-meta">Visible columns</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => r.isActive === true || r.isActive === undefined).length}</p><p className="erp-kpi-meta">Active records</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Mode</p><p className="erp-kpi-value text-sm">{editingId ? 'Edit' : 'Create'}</p><p className="erp-kpi-meta">Current form mode</p></div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">Record List</TabsTrigger>
            <TabsTrigger value="form">{editingId ? "Edit Record" : "New Record"}</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{schema.title} Directory</CardTitle>
                {tableSchema.canCreate && (
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      resetForm();
                      setActiveTab("form");
                    }}
                  >
                    Add {schema.title}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="erp-loading">Loading records…</div>
                ) : rows.length === 0 ? (
                  <div className="erp-empty">No records found.</div>
                ) : (
                  <div className="erp-table-wrap border-0 shadow-none">
                    <table className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          {tableColumns.map((column) => (
                            <th key={column.key} className="erp-th">{column.label}</th>
                          ))}
                          {(tableSchema.canEdit || tableSchema.canDelete) && (
                            <th className="erp-th">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => {
                          const rowId = getStringValue(row.id, `row-${idx}`);
                          return (
                            <tr key={rowId} className="erp-tr">
                              {tableColumns.map((column) => (
                                <td key={`${rowId}-${column.key}`} className="erp-td text-slate-700">
                                  {formatValue(row[column.key], column)}
                                </td>
                              ))}
                              {(tableSchema.canEdit || tableSchema.canDelete) && (
                                <td className="erp-td">
                                  <div className="flex gap-2">
                                    {tableSchema.canEdit && (
                                      <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
                                        Edit
                                      </Button>
                                    )}
                                    {tableSchema.canDelete && row.id && (
                                      <Button variant="destructive" size="sm" onClick={() => void handleDelete(String(row.id))}>
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form">
            <Card className="erp-kpi-card erp-kpi-card-info erp-kpi-action-card">
              <CardHeader>
                <CardTitle>{editingId ? `Edit ${schema.title}` : `Create ${schema.title}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {formFields.map((field) => {
                    const value = formData[field.key];

                    if (field.fieldType === "textarea") {
                      return (
                        <textarea
                          key={field.key}
                          name={field.key}
                          value={getStringValue(value)}
                          placeholder={field.placeholder || field.label}
                          onChange={(event) => handleFieldChange(field, event.target.value)}
                          className="erp-input min-h-24 md:col-span-2"
                          required={field.required}
                          readOnly={field.readOnly}
                        />
                      );
                    }

                    if (field.fieldType === "select") {
                      return (
                        <select
                          key={field.key}
                          name={field.key}
                          value={getStringValue(value)}
                          onChange={(event) => handleFieldChange(field, event.target.value)}
                          className="erp-select"
                          required={field.required}
                          disabled={field.readOnly}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((option) => (
                            <option key={`${field.key}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      );
                    }

                    if (field.fieldType === "checkbox") {
                      return (
                        <label key={field.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                          <input
                            type="checkbox"
                            name={field.key}
                            checked={Boolean(value)}
                            onChange={(event) => handleFieldChange(field, event.target.checked)}
                            disabled={field.readOnly}
                          />
                          <span className="text-sm text-slate-700">{field.label}</span>
                        </label>
                      );
                    }

                    const inputType = field.fieldType === "number"
                      ? "number"
                      : field.fieldType === "email"
                        ? "email"
                        : field.fieldType === "phone"
                          ? "tel"
                          : field.fieldType === "date"
                            ? "date"
                            : "text";

                    return (
                      <input
                        key={field.key}
                        name={field.key}
                        type={inputType}
                        value={field.fieldType === "number" ? String(value ?? 0) : getStringValue(value)}
                        placeholder={field.placeholder || field.label}
                        onChange={(event) => handleFieldChange(field, event.target.value)}
                        className="erp-input"
                        required={field.required}
                        readOnly={field.readOnly}
                      />
                    );
                  })}
                </div>

                <div className="erp-kpi-action-footer border-t border-slate-100 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                  <Button onClick={() => void handleSave()} disabled={loading}>
                    {editingId ? "Update" : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
}
