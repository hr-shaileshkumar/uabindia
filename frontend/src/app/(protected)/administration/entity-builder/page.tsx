"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Table,
  CheckCircle2,
  Tag,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Database,
  Search,
  Sparkles,
  Eye,
  Trash2,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName } from "@/components/workspace/styles";
import { platformApi } from "@/services/modules/administration";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ROUTES } from "@/constants/routes";

interface EntityMetadata {
  name: string;
  category: string;
  description: string;
  table: string;
  icon: string;
}

const SYSTEM_ENTITIES: EntityMetadata[] = [
  { name: "Employee", category: "HRMS", description: "Core workforce profiles and statutory details", table: "Employees", icon: "Users" },
  { name: "Customer", category: "CRM / Sales", description: "B2B client ledgers and billing accounts", table: "Customers", icon: "Building2" },
  { name: "Vendor", category: "Procurement", description: "Supplier records, GST profiles, and payment terms", table: "Vendors", icon: "Truck" },
  { name: "Lead", category: "CRM", description: "Inbound sales opportunities and prospective contacts", table: "Leads", icon: "Compass" },
  { name: "SalesOrder", category: "Sales", description: "Commercial orders, line items, and fulfillment", table: "SalesOrders", icon: "ShoppingCart" },
  { name: "Invoice", category: "Finance", description: "Tax invoices, GST schedules, and payment vouchers", table: "Invoices", icon: "Receipt" },
  { name: "Item", category: "Inventory", description: "SKU catalog, HSN codes, and valuation rates", table: "Items", icon: "Package" },
  { name: "Project", category: "Projects", description: "Billable client engagements and milestones", table: "Projects", icon: "Briefcase" },
  { name: "Department", category: "Platform", description: "Corporate functional hierarchy and cost lines", table: "Departments", icon: "Layers" },
  { name: "Company", category: "Platform", description: "Legal entities, GSTIN profiles, and corporate branches", table: "Companies", icon: "Landmark" },
];

export default function EntityBuilderPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityMetadata>(SYSTEM_ENTITIES[0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fields, setFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Drawer for new custom field
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [form, setForm] = useState({
    fieldKey: "",
    fieldLabel: "",
    fieldType: "text",
    isRequired: false,
    section: "General",
    optionsJson: "",
  });

  const loadEntityFields = async (entityName: string) => {
    try {
      setLoadingFields(true);
      const res = await platformApi.customFields.getDefinitions(entityName);
      setFields(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    void loadEntityFields(selectedEntity.name);
  }, [selectedEntity]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fieldKey.trim() || !form.fieldLabel.trim()) {
      notifyError("Field Key and Label are required.");
      return;
    }

    try {
      setSavingField(true);
      await platformApi.customFields.createDefinition({
        entityName: selectedEntity.name,
        fieldKey: form.fieldKey.trim().toLowerCase().replace(/\s+/g, "_"),
        fieldLabel: form.fieldLabel.trim(),
        fieldType: form.fieldType,
        isRequired: form.isRequired,
        section: form.section.trim() || "General",
        optionsJson: form.optionsJson.trim() || undefined,
      });

      notifySuccess(`Custom field '${form.fieldLabel}' added to ${selectedEntity.name}.`);
      setDrawerOpen(false);
      setForm({
        fieldKey: "",
        fieldLabel: "",
        fieldType: "text",
        isRequired: false,
        section: "General",
        optionsJson: "",
      });
      await loadEntityFields(selectedEntity.name);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create custom field."));
    } finally {
      setSavingField(false);
    }
  };

  const filteredEntities = useMemo(() => {
    return SYSTEM_ENTITIES.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || e.category.toLowerCase().includes(categoryFilter.toLowerCase());
      return matchSearch && matchCategory;
    });
  }, [search, categoryFilter]);

  return (
    <StandardPageLayout
      title="Visual Entity Builder & Schema Modeler"
      subtitle="Model extensible business entities, browse relational schemas, and add custom metadata fields across the ERP."
      eyebrow="Administration / Configuration"
      icon="layers"
      meta={
        <HeaderSummary
          items={[
            { label: "Core Entities", value: SYSTEM_ENTITIES.length, tone: "info" },
            { label: "Selected Entity", value: selectedEntity.name, tone: "success" },
            { label: "Custom Fields", value: fields.length, tone: "warning" },
            { label: "Storage Model", value: "EAV + JSON", tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <Link href={ROUTES.PLATFORM_SCHEMA_MANAGER} className={erpButtonClassName.secondary}>
            Advanced Schema Manager
          </Link>
          <button type="button" onClick={() => setDrawerOpen(true)} className={erpButtonClassName.primary}>
            <Plus className="h-4 w-4" />
            Add Field to {selectedEntity.name}
          </button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Entity Registry Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Entities</h3>
              <span className="text-xs text-slate-400 font-mono">{filteredEntities.length} available</span>
            </div>

            <input
              type="text"
              placeholder="Search entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="erp-input text-xs"
            />

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredEntities.map((entity) => {
                const isSelected = entity.name === selectedEntity.name;
                return (
                  <button
                    key={entity.name}
                    type="button"
                    onClick={() => setSelectedEntity(entity)}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                        : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{entity.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {entity.category}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">{entity.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Entity Schema & Custom Fields Detail */}
        <div className="lg:col-span-8 space-y-5">
          <CrudCard>
            <div className="p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedEntity.name} Schema Definition</h3>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-700">
                      dbo.{selectedEntity.table}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{selectedEntity.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Custom Field
                </button>
              </div>

              {/* Custom Fields List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Extension Fields ({fields.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">Tenant Custom Definitions</span>
                </div>

                {loadingFields ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Loading field definitions...</p>
                ) : fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                    <Database className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">No custom fields defined for {selectedEntity.name}</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click &quot;Add Custom Field&quot; to extend this entity with custom drop-downs, date pickers, or text attributes.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                    {fields.map((field) => (
                      <div key={field.id || field.fieldKey} className="flex items-center justify-between p-3.5 hover:bg-slate-50">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{field.fieldLabel}</span>
                            <span className="font-mono text-[11px] text-slate-400">({field.fieldKey})</span>
                            {field.isRequired && (
                              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span>Type: <strong className="text-slate-700">{field.fieldType}</strong></span>
                            <span>Section: <strong className="text-slate-700">{field.section || "General"}</strong></span>
                          </div>
                        </div>
                        <span className="erp-chip erp-chip-success text-xs">Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CrudCard>
        </div>
      </div>

      {/* SideDrawer: Create Field */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Add Custom Field to ${selectedEntity.name}`}
        subtitle="Extend entity model with persistent custom attributes"
      >
        <form onSubmit={handleCreateField} className="space-y-4 p-1 text-xs">
          <div className="erp-field">
            <label className="erp-label">Field Label *</label>
            <input
              className="erp-input"
              placeholder="e.g. Clearance Certificate ID"
              value={form.fieldLabel}
              onChange={(e) => {
                const label = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  fieldLabel: label,
                  fieldKey: prev.fieldKey || label.toLowerCase().replace(/\s+/g, "_"),
                }));
              }}
              required
            />
          </div>

          <div className="erp-field">
            <label className="erp-label">Field Key (Unique Identifier) *</label>
            <input
              className="erp-input font-mono"
              placeholder="e.g. clearance_certificate_id"
              value={form.fieldKey}
              onChange={(e) => setForm((prev) => ({ ...prev, fieldKey: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="erp-field">
              <label className="erp-label">Data Type</label>
              <select
                className="erp-input"
                value={form.fieldType}
                onChange={(e) => setForm((prev) => ({ ...prev, fieldType: e.target.value }))}
              >
                <option value="text">Text (Single Line)</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean (Yes / No)</option>
                <option value="textarea">Text (Multi-line)</option>
                <option value="select">Dropdown Select</option>
              </select>
            </div>

            <div className="erp-field">
              <label className="erp-label">Form Section</label>
              <input
                className="erp-input"
                placeholder="e.g. General, Compliance"
                value={form.section}
                onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))}
              />
            </div>
          </div>

          {form.fieldType === "select" && (
            <div className="erp-field">
              <label className="erp-label">Dropdown Options (JSON Array)</label>
              <input
                className="erp-input font-mono text-[11px]"
                placeholder='["Option 1", "Option 2", "Option 3"]'
                value={form.optionsJson}
                onChange={(e) => setForm((prev) => ({ ...prev, optionsJson: e.target.value }))}
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm((prev) => ({ ...prev, isRequired: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="font-semibold text-slate-700">Mandatory / Required Field</span>
          </label>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-xl border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingField}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingField ? "Adding..." : "Add Field to Model"}
            </button>
          </div>
        </form>
      </SideDrawer>
    </StandardPageLayout>
  );
}
