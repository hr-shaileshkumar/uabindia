"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";

type FieldDef = {
  id: string;
  entityName: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  options?: string[];
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  section?: string;
};

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Dropdown" },
  { value: "multiselect", label: "Multi-select" },
  { value: "textarea", label: "Text Area" },
];

const KNOWN_ENTITIES = [
  "Employee",
  "Customer",
  "Vendor",
  "Item",
  "SalesOrder",
  "PurchaseOrder",
  "Project",
];

type FormMode = "create" | "edit" | null;

const EMPTY_FORM = {
  entityName: "Employee",
  fieldKey: "",
  fieldLabel: "",
  fieldType: "text",
  optionsRaw: "",
  isRequired: false,
  sortOrder: 0,
  section: "",
};

export default function SchemaManagerPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [defs, setDefs] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.entityFields.getAllDefinitions();
      setDefs(response.data?.definitions ?? []);
    } catch {
      const message =
        "Failed to load field definitions. Ensure the schema-manager endpoint is accessible.";
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDefs();
  }, [fetchDefs]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setEditingId(null);
    setFormMode("create");
  };

  const openEdit = (definition: FieldDef) => {
    setForm({
      entityName: definition.entityName,
      fieldKey: definition.fieldKey,
      fieldLabel: definition.fieldLabel,
      fieldType: definition.fieldType,
      optionsRaw: definition.options?.join(", ") ?? "",
      isRequired: definition.isRequired,
      sortOrder: definition.sortOrder,
      section: definition.section ?? "",
    });
    setFormError(null);
    setEditingId(definition.id);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.fieldLabel.trim()) {
      setFormError("Field label is required");
      return;
    }
    if (!form.fieldKey.trim() && formMode === "create") {
      setFormError("Field key is required");
      return;
    }

    const options = form.optionsRaw
      ? form.optionsRaw.split(",").map((option) => option.trim()).filter(Boolean)
      : undefined;

    const ok = await confirm({
      title: formMode === "create" ? "Create custom field" : "Update custom field",
      message:
        formMode === "create"
          ? `Create field "${form.fieldLabel.trim()}" for ${form.entityName}?`
          : `Save updates for field "${form.fieldLabel.trim()}"?`,
      confirmText: formMode === "create" ? "Create" : "Update",
    });
    if (!ok) {
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      if (formMode === "create") {
        await hrApi.entityFields.createDefinition({
          entityName: form.entityName,
          fieldKey: form.fieldKey.trim().toLowerCase().replace(/\s+/g, "_"),
          fieldLabel: form.fieldLabel.trim(),
          fieldType: form.fieldType,
          options,
          isRequired: form.isRequired,
          sortOrder: form.sortOrder,
          section: form.section.trim() || undefined,
        });
      } else if (editingId) {
        await hrApi.entityFields.updateDefinition(editingId, {
          fieldLabel: form.fieldLabel.trim(),
          fieldType: form.fieldType,
          options,
          isRequired: form.isRequired,
          sortOrder: form.sortOrder,
          section: form.section.trim() || undefined,
        });
      }

      closeForm();
      notifySuccess(
        formMode === "create"
          ? "Custom field added successfully."
          : "Custom field updated successfully.",
      );
      void fetchDefs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setFormError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const definition = defs.find((def) => def.id === id);
    const ok = await confirm({
      title: "Delete custom field",
      message: definition
        ? `Delete the "${definition.fieldLabel}" field from ${definition.entityName}? This cannot be undone and will remove the field from all records.`
        : "Delete this custom field? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    try {
      setDeletingId(id);
      await hrApi.entityFields.deleteDefinition(id);
      notifySuccess("Custom field deleted successfully.");
      void fetchDefs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setError(message);
      notifyError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = filterEntity === "all" ? defs : defs.filter((def) => def.entityName === filterEntity);
  const entities = [...new Set(defs.map((def) => def.entityName))];

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_SCHEMA_MANAGER_VIEW}>
      <>
        {confirmDialog}

        {formMode && (
          <div className="erp-drawer-overlay" onClick={closeForm}>
            <div
              className="erp-drawer-panel erp-drawer-panel-right h-full w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="erp-drawer-header">
                <h2 className="text-base font-semibold text-slate-800">
                  {formMode === "create" ? "Add Custom Field" : "Edit Custom Field"}
                </h2>
                <button type="button" onClick={closeForm} className="erp-modal-close">
                  x
                </button>
              </div>

              <div className="erp-drawer-body space-y-4">
                {formError && <div className="erp-alert-error">{formError}</div>}

                {formMode === "create" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Entity <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.entityName}
                      onChange={(event) => setForm((current) => ({ ...current, entityName: event.target.value }))}
                      className="erp-select"
                    >
                      {KNOWN_ENTITIES.map((entity) => (
                        <option key={entity} value={entity}>
                          {entity}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formMode === "create" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Field Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. blood_group"
                      value={form.fieldKey}
                      onChange={(event) => setForm((current) => ({ ...current, fieldKey: event.target.value }))}
                      className="erp-input"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Lowercase, underscores only. Cannot be changed after creation.
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Field Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blood Group"
                    value={form.fieldLabel}
                    onChange={(event) => setForm((current) => ({ ...current, fieldLabel: event.target.value }))}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Field Type</label>
                  <select
                    value={form.fieldType}
                    onChange={(event) => setForm((current) => ({ ...current, fieldType: event.target.value }))}
                    className="erp-select"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(form.fieldType === "select" || form.fieldType === "multiselect") && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A+, A-, B+, B-, O+, O-"
                      value={form.optionsRaw}
                      onChange={(event) => setForm((current) => ({ ...current, optionsRaw: event.target.value }))}
                      className="erp-input"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Section or Group</label>
                  <input
                    type="text"
                    placeholder="e.g. Personal Details"
                    value={form.section}
                    onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                    className="erp-input"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isRequired}
                    onChange={(event) => setForm((current) => ({ ...current, isRequired: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Required field</span>
                </label>
              </div>

              <div className="flex gap-3 border-t border-slate-200 p-6">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="erp-action-btn erp-action-btn-primary flex-1 justify-center"
                >
                  {saving ? "Saving..." : formMode === "create" ? "Create Field" : "Update Field"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="erp-action-btn erp-action-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <StandardPageLayout
          title="Schema Manager"
          subtitle="Extend entities with clean custom-field definitions instead of spreading tenant-specific inputs across many screens."
          eyebrow="Administration / Platform Schema"
          icon="settings"
          meta={
            <ErpHeaderSummary
              items={[
                { label: "Fields", value: defs.length },
                { label: "Entities", value: new Set(defs.map((def) => def.entityName)).size, tone: "info" },
                { label: "Required", value: defs.filter((def) => def.isRequired).length, tone: "warning" },
                { label: "Visible", value: filtered.length, tone: "success" },
              ]}
            />
          }
          actions={
            <button type="button" onClick={openCreate} className="erp-action-btn erp-action-btn-primary">
              Create Field
            </button>
          }
          filters={
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="erp-label">Entity</label>
                <select
                  value={filterEntity}
                  onChange={(event) => setFilterEntity(event.target.value)}
                  className="erp-select"
                >
                  <option value="all">All Entities</option>
                  {entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        >
          {error && <div className="erp-alert-error">{error}</div>}

          <div className="erp-panel">
            <div className="erp-table-toolbar">
              <div>
                <div className="erp-table-title">Field Definition Registry</div>
                <div className="erp-table-subtitle">
                  Manage custom fields, grouping, and display order for supported entities.
                </div>
              </div>
              <span className="erp-toolbar-badge">{loading ? "Loading..." : `${filtered.length} fields`}</span>
            </div>
            <div className="erp-table-wrap rounded-none border-0 shadow-none">
              <table className="erp-table">
                <thead className="erp-thead">
                  <tr>
                    <th className="erp-th">Entity</th>
                    <th className="erp-th">Key</th>
                    <th className="erp-th">Label</th>
                    <th className="erp-th">Type</th>
                    <th className="erp-th">Section</th>
                    <th className="erp-th">Required</th>
                    <th className="erp-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={7} className="erp-td">
                          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="erp-td py-10 text-center text-slate-400">
                        No custom fields defined yet. Use Create Field to add the first one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((definition) => (
                      <tr key={definition.id} className="erp-tr">
                        <td className="erp-td font-medium text-slate-700">{definition.entityName}</td>
                        <td className="erp-td font-mono text-xs text-slate-500">{definition.fieldKey}</td>
                        <td className="erp-td text-slate-800">{definition.fieldLabel}</td>
                        <td className="erp-td text-slate-500">{definition.fieldType}</td>
                        <td className="erp-td text-slate-400">{definition.section || "-"}</td>
                        <td className="erp-td">
                          {definition.isRequired ? (
                            <span className="text-xs font-medium text-red-500">Yes</span>
                          ) : (
                            <span className="text-xs text-slate-400">No</span>
                          )}
                        </td>
                        <td className="erp-td text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEdit(definition)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(definition.id)}
                              disabled={deletingId === definition.id}
                              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                            >
                              {deletingId === definition.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </StandardPageLayout>
      </>
    </ProtectedRoute>
  );
}
