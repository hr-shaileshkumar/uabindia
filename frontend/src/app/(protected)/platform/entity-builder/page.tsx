"use client";

import React, { useState } from "react";
import { Code2, Plus, Eye, Layers, Database, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface EntityRow {
  id: string;
  name: string;
  tableName: string;
  fieldCount: number;
  isPublished: boolean;
  createdAt: string;
}

const SEED_ENTITIES: EntityRow[] = [
  { id: "ent_1", name: "Custom Vendor Evaluation", tableName: "custom_vendor_evals", fieldCount: 8, isPublished: true, createdAt: "2026-07-20" },
  { id: "ent_2", name: "Asset Maintenance Log", tableName: "custom_asset_maintenance", fieldCount: 12, isPublished: true, createdAt: "2026-07-22" },
  { id: "ent_3", name: "Employee Training Feedback", tableName: "custom_training_feedbacks", fieldCount: 6, isPublished: false, createdAt: "2026-07-28" },
];

export default function EntityBuilderPage() {
  const [entities, setEntities] = useState<EntityRow[]>(SEED_ENTITIES);
  const [search, setSearch] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityRow | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [tableName, setTableName] = useState("");

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEnt: EntityRow = {
      id: `ent_${Date.now()}`,
      name: name.trim(),
      tableName: tableName.trim().toLowerCase() || `custom_${name.trim().toLowerCase().replace(/\s+/g, "_")}`,
      fieldCount: 3,
      isPublished: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setEntities((prev) => [newEnt, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setTableName("");
    notifySuccess(`Low-Code Entity "${newEnt.name}" published to database schema.`);
  };

  const filteredEntities = entities.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.name.toLowerCase().includes(q) || e.tableName.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Low-Code Entities", value: entities.length, tone: "info", icon: <Code2 className="h-3.5 w-3.5" />, subtext: "Entities" },
    { label: "Published Schemas", value: entities.filter((e) => e.isPublished).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Active Tables" },
    { label: "Total Custom Fields", value: entities.reduce((acc, e) => acc + e.fieldCount, 0), tone: "warning", icon: <Database className="h-3.5 w-3.5" />, subtext: "Fields" },
    { label: "No-Code Engine", value: "Active", tone: "positive", icon: <Sparkles className="h-3.5 w-3.5" />, subtext: "Dynamic DB" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Low-Code Entity & Form Builder Engine"
      subtitle="Visually model database entities, dynamic forms, validation rules, and relational schemas without writing code."
      categoryTag="Low-Code Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter entity name or database table..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Build New Entity"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedEntity}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedEntity(null);
      }}
      inspectorTitle={selectedEntity ? `Entity: ${selectedEntity.name}` : "Build Low-Code Entity"}
      inspectorSubTitle={selectedEntity ? `DB Table ${selectedEntity.tableName}` : "Configure entity fields and table constraints."}
      inspectorContent={
        selectedEntity ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Entity Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedEntity.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physical DB Table:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedEntity.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Field Count:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedEntity.fieldCount} Fields</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedEntity(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateEntity} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Entity Display Name *</Label>
              <Input placeholder="Vendor Inspection Audit" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Physical Table Name</Label>
              <Input placeholder="custom_vendor_inspections" value={tableName} onChange={(e) => setTableName(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Publish Entity
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
              <th className="erp-th">Entity Name</th>
              <th className="erp-th">Physical Database Table</th>
              <th className="erp-th">Fields</th>
              <th className="erp-th">Created</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntities.map((e) => (
              <tr key={e.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-indigo-500" />
                  {e.name}
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{e.tableName}</td>
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{e.fieldCount} Fields</td>
                <td className="erp-td text-xs text-slate-500">{e.createdAt}</td>
                <td className="erp-td">
                  <span className={e.isPublished ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {e.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedEntity(e)}>
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
