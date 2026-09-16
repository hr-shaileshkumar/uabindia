"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { AdministrationGlobalPageShell } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  mapEntityFieldDefinition,
  useEntityFieldDefinitions,
  useEntityFieldMutations,
} from "@/features/administration/hooks/useEntityFieldDefinitions";

type FieldRow = ReturnType<typeof mapEntityFieldDefinition>;

const emptyForm = () => ({
  entityName: "Employee",
  fieldKey: "",
  fieldLabel: "",
  fieldType: "text",
  isRequired: false,
  section: "General",
});

function LegacySchemaManagerPage() {
  const { data = [], isLoading, isError, error, refetch } = useEntityFieldDefinitions();
  const { createDefinition, updateDefinition, deleteDefinition } = useEntityFieldMutations();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<FieldRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fields = useMemo(() => data.map(mapEntityFieldDefinition), [data]);
  const entityOptions = useMemo(
    () => Array.from(new Set(fields.map((field) => field.entityName))).sort(),
    [fields]
  );

  const filteredFields = useMemo(() => {
    const q = search.toLowerCase();
    return fields.filter((field) => {
      const matchesSearch =
        !q ||
        field.fieldName.toLowerCase().includes(q) ||
        field.fieldKey.toLowerCase().includes(q) ||
        field.entityName.toLowerCase().includes(q);
      const matchesEntity = entityFilter === "all" || field.entityName === entityFilter;
      return matchesSearch && matchesEntity;
    });
  }, [fields, search, entityFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setMode("create");
  };

  const openEdit = (field: FieldRow) => {
    setEditing(field);
    setForm({
      entityName: field.entityName,
      fieldKey: field.fieldKey,
      fieldLabel: field.fieldLabel || field.fieldName,
      fieldType: field.fieldType || "text",
      isRequired: field.isRequired,
      section: field.section || "General",
    });
    setMode("edit");
  };

  const save = async () => {
    if (!form.entityName.trim() || !form.fieldKey.trim() || !form.fieldLabel.trim()) {
      notifyError("Entity, field key, and label are required.");
      return;
    }
    try {
      if (mode === "edit" && editing) {
        await updateDefinition.mutateAsync({
          id: editing.id,
          payload: {
            fieldLabel: form.fieldLabel.trim(),
            fieldType: form.fieldType,
            isRequired: form.isRequired,
            section: form.section.trim() || undefined,
          },
        });
        notifySuccess("Field definition updated.");
      } else {
        await createDefinition.mutateAsync({
          entityName: form.entityName.trim(),
          fieldKey: form.fieldKey.trim(),
          fieldLabel: form.fieldLabel.trim(),
          fieldType: form.fieldType,
          isRequired: form.isRequired,
          section: form.section.trim() || undefined,
        });
        notifySuccess("Field definition created.");
      }
      setMode("closed");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save field definition."));
    }
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Schema manager"
        categoryTag="Platform"
        icon="database"
        kpiMetrics={[
          { label: "Custom fields", value: fields.length, tone: "info" },
          { label: "Entities", value: entityOptions.length, tone: "positive" },
          { label: "Required", value: fields.filter((f) => f.isRequired).length, tone: "warning" },
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter entity or field…"
        filterOptions={[
          {
            key: "entity",
            label: "Entity",
            value: entityFilter,
            onChange: setEntityFilter,
            options: [{ label: "All entities", value: "all" }, ...entityOptions.map((e) => ({ label: e, value: e }))],
          },
        ]}
        primaryActionLabel="New field"
        onPrimaryAction={openCreate}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        listKey="platform-schema-fields"
        listRows={filteredFields}
        getRowId={(row) => row.id}
        emptyMessage="No custom fields yet. Add definitions to extend entity forms."
        listColumns={[
          { key: "entityName", label: "Entity", dataType: "string" },
          { key: "fieldName", label: "Field", dataType: "string" },
          { key: "dataType", label: "Type", dataType: "string" },
          { key: "isRequired", label: "Required", dataType: "boolean" },
          { key: "section", label: "Section", dataType: "string" },
          { key: "actions", label: "Actions", locked: true },
        ]}
        renderListRow={(field) => (
          <>
            <td className="erp-td font-mono text-xs">{field.entityName}</td>
            <td className="erp-td">
              <div className="erp-row-title text-xs">{field.fieldName}</div>
              <div className="font-mono text-[11px] text-slate-500">{field.fieldKey}</div>
            </td>
            <td className="erp-td text-xs">{field.dataType}</td>
            <td className="erp-td text-xs">{field.isRequired ? "Yes" : "No"}</td>
            <td className="erp-td text-xs text-slate-500">{field.section}</td>
            <td className="erp-td">
              <ErpRowActions
                onEdit={{ label: "Edit", onClick: () => openEdit(field) }}
                onDelete={{ label: "Delete", onClick: () => setDeleteId(field.id) }}
              />
            </td>
          </>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={mode === "edit" ? "Edit field" : "New field"}
        inspectorContent={
          <div className="erp-form-grid">
            {isError ? (
              <p className="md:col-span-2 text-xs text-rose-600">{getApiErrorMessage(error, "Load failed.")}</p>
            ) : null}
            <div className="erp-field">
              <label className="erp-label">Entity *</label>
              <input
                className="erp-input"
                value={form.entityName}
                disabled={mode === "edit"}
                onChange={(e) => setForm((f) => ({ ...f, entityName: e.target.value }))}
              />
            </div>
            <div className="erp-field">
              <label className="erp-label">Field key *</label>
              <input
                className="erp-input font-mono"
                value={form.fieldKey}
                disabled={mode === "edit"}
                onChange={(e) => setForm((f) => ({ ...f, fieldKey: e.target.value }))}
              />
            </div>
            <div className="erp-field">
              <label className="erp-label">Label *</label>
              <input className="erp-input" value={form.fieldLabel} onChange={(e) => setForm((f) => ({ ...f, fieldLabel: e.target.value }))} />
            </div>
            <div className="erp-field">
              <label className="erp-label">Type</label>
              <select className="erp-input" value={form.fieldType} onChange={(e) => setForm((f) => ({ ...f, fieldType: e.target.value }))}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
              </select>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Section</label>
              <input className="erp-input" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
            </div>
            <label className="erp-field flex items-center gap-2 text-xs md:col-span-2">
              <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))} />
              Required
            </label>
            <div className="md:col-span-2">
              <ErpDrawerFooter
                onCancel={() => setMode("closed")}
                onSave={() => void save()}
                saving={createDefinition.isPending || updateDefinition.isPending}
                isEdit={mode === "edit"}
              />
            </div>
          </div>
        }
      />

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete field definition"
        entityName={fields.find((f) => f.id === deleteId)?.fieldName}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteDefinition.mutateAsync(deleteId);
          notifySuccess("Field deleted.");
          setDeleteId(null);
        }}
        loading={deleteDefinition.isPending}
      />
    </>
  );
}

export default function SchemaManagerPage() {
  return (
    <DynamicPage
      pageKey="administration.schema-manager"
      fallback={<LegacySchemaManagerPage />}
      renderMode="auto"
    />
  );
}
