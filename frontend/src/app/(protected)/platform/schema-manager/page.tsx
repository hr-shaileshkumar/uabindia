"use client";

import React, { useState } from "react";
import { Database, Plus, Eye, Code2, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface CustomFieldRow {
  id: string;
  entityName: string;
  fieldName: string;
  dataType: "String" | "Number" | "Boolean" | "DateTime" | "JSON";
  isRequired: boolean;
  isSearchable: boolean;
}

const SEED_FIELDS: CustomFieldRow[] = [
  { id: "f1", entityName: "Tenant", fieldName: "CustomDomainSSLCert", dataType: "String", isRequired: false, isSearchable: true },
  { id: "f2", entityName: "User", fieldName: "EmployeeBadgeCode", dataType: "String", isRequired: true, isSearchable: true },
  { id: "f3", entityName: "SalesOrder", fieldName: "DispatchedCarrierTracking", dataType: "String", isRequired: false, isSearchable: true },
  { id: "f4", entityName: "Company", fieldName: "TaxExemptionPercentage", dataType: "Number", isRequired: false, isSearchable: false },
];

export default function SchemaManagerPage() {
  const [fields, setFields] = useState<CustomFieldRow[]>(SEED_FIELDS);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomFieldRow | null>(null);

  // Form State
  const [entityName, setEntityName] = useState("Tenant");
  const [fieldName, setFieldName] = useState("");
  const [dataType, setDataType] = useState<CustomFieldRow["dataType"]>("String");

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    const newF: CustomFieldRow = {
      id: `f_${Date.now()}`,
      entityName,
      fieldName: fieldName.trim(),
      dataType,
      isRequired: false,
      isSearchable: true,
    };

    setFields((prev) => [...prev, newF]);
    setIsDrawerOpen(false);
    setFieldName("");
    notifySuccess(`Custom field "${newF.fieldName}" attached to schema entity "${entityName}".`);
  };

  const filteredFields = fields.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || f.fieldName.toLowerCase().includes(q) || f.entityName.toLowerCase().includes(q);
    const matchesEntity = entityFilter === "all" || f.entityName.toLowerCase() === entityFilter.toLowerCase();
    return matchesSearch && matchesEntity;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Dynamic Fields", value: fields.length, tone: "info", icon: <Database className="h-3.5 w-3.5" />, subtext: "Schema" },
    { label: "Extended Entities", value: new Set(fields.map((f) => f.entityName)).size, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Entities" },
    { label: "Indexed Fields", value: fields.filter((f) => f.isSearchable).length, tone: "warning", icon: <Code2 className="h-3.5 w-3.5" />, subtext: "Searchable" },
    { label: "Required Fields", value: fields.filter((f) => f.isRequired).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Strict" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Dynamic Schema & Custom Fields Manager"
      subtitle="Extend core database entities with dynamic custom fields, data types, and index constraints."
      categoryTag="Data Architecture Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter entity name, custom field key, or type..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "entity",
          label: "All Entities",
          value: entityFilter,
          onChange: setEntityFilter,
          options: [
            { label: "All Entities", value: "all" },
            { label: "Tenant", value: "tenant" },
            { label: "User", value: "user" },
            { label: "SalesOrder", value: "salesorder" },
            { label: "Company", value: "company" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setEntityFilter("all");
      }}
      primaryActionLabel="Attach Custom Field"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedField}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedField(null);
      }}
      inspectorTitle={selectedField ? `Custom Field: ${selectedField.fieldName}` : "Extend Entity Schema"}
      inspectorSubTitle={selectedField ? `Attached to Entity ${selectedField.entityName}` : "Define data type and index constraints."}
      inspectorContent={
        selectedField ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Entity:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedField.entityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Field Name:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedField.fieldName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data Type:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedField.dataType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Search Indexed:</span>
                <span className="font-semibold text-emerald-600">{selectedField.isSearchable ? "Yes" : "No"}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedField(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateField} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Target Entity Name</Label>
              <Input placeholder="Tenant / User / SalesOrder" value={entityName} onChange={(e) => setEntityName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Field Identifier *</Label>
              <Input placeholder="VATRegistrationNumber" value={fieldName} onChange={(e) => setFieldName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Data Type</Label>
              <select className="erp-select" value={dataType} onChange={(e) => setDataType(e.target.value as CustomFieldRow["dataType"])}>
                <option value="String">String (Text)</option>
                <option value="Number">Number (Numeric)</option>
                <option value="Boolean">Boolean (True/False)</option>
                <option value="DateTime">DateTime (Timestamp)</option>
                <option value="JSON">JSON Payload</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Attach Field
              </Button>
            </div>
          </form>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Target Entity</th>
              <th className="erp-th">Custom Field Identifier</th>
              <th className="erp-th">Data Type</th>
              <th className="erp-th">Required</th>
              <th className="erp-th">Indexed</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredFields.map((f) => (
              <tr key={f.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {f.entityName}
                  </Badge>
                </td>
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{f.fieldName}</td>
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{f.dataType}</td>
                <td className="erp-td">
                  <span className={f.isRequired ? "erp-chip erp-chip-danger" : "erp-chip erp-chip-neutral"}>
                    {f.isRequired ? "Yes" : "Optional"}
                  </span>
                </td>
                <td className="erp-td">
                  <span className={f.isSearchable ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {f.isSearchable ? "Indexed" : "No"}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedField(f)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
