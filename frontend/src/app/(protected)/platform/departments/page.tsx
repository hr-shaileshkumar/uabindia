"use client";

import React, { useState } from "react";
import { Layers, Plus, Eye, Users, DollarSign, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  costCenterCode: string;
  headOfDepartment?: string;
  employeeCount: number;
  status: "Active" | "Inactive";
}

const SEED_DEPARTMENTS: DepartmentRow[] = [
  { id: "dept_1", code: "ENG-01", name: "Software Engineering & Architecture", costCenterCode: "CC-1001", headOfDepartment: "Dr. Vikram Seth", employeeCount: 42, status: "Active" },
  { id: "dept_2", code: "FIN-02", name: "Corporate Finance & Treasury", costCenterCode: "CC-2001", headOfDepartment: "Ananya Roy", employeeCount: 18, status: "Active" },
  { id: "dept_3", code: "HR-03", name: "Human Capital & People Ops", costCenterCode: "CC-3001", headOfDepartment: "Priya Nair", employeeCount: 14, status: "Active" },
  { id: "dept_4", code: "SCM-04", name: "Supply Chain & Inventory Ops", costCenterCode: "CC-4001", headOfDepartment: "Karan Johar", employeeCount: 28, status: "Active" },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRow[]>(SEED_DEPARTMENTS);
  const [search, setSearch] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentRow | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [hod, setHod] = useState("");

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDept: DepartmentRow = {
      id: `dept_${Date.now()}`,
      code: code.trim().toUpperCase() || `DEPT-0${departments.length + 1}`,
      name: name.trim(),
      costCenterCode: costCenter.trim().toUpperCase() || "CC-5001",
      headOfDepartment: hod.trim() || "Unassigned",
      employeeCount: 0,
      status: "Active",
    };

    setDepartments((prev) => [newDept, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setCode("");
    notifySuccess(`Department "${newDept.name}" created successfully.`);
  };

  const filteredDepts = departments.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.costCenterCode.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Total Departments", value: departments.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Org Structure" },
    { label: "Allocated Cost Centers", value: new Set(departments.map((d) => d.costCenterCode)).size, tone: "positive", icon: <DollarSign className="h-3.5 w-3.5" />, subtext: "Financial Ledger" },
    { label: "Total Employees", value: departments.reduce((acc, d) => acc + d.employeeCount, 0), tone: "warning", icon: <Users className="h-3.5 w-3.5" />, subtext: "Staff Members" },
    { label: "Active Status", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Active" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Departments & Cost Center Hierarchy"
      subtitle="Organize departmental structures, General Ledger cost centers, and departmental leadership."
      categoryTag="Organization Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter department name, code, or cost center..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Department"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedDept}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedDept(null);
      }}
      inspectorTitle={selectedDept ? `Department: ${selectedDept.name}` : "Create Department"}
      inspectorSubTitle={selectedDept ? `Code ${selectedDept.code}` : "Configure cost center and HOD."}
      inspectorContent={
        selectedDept ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Department Code:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedDept.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GL Cost Center:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedDept.costCenterCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department Head:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDept.headOfDepartment || "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Count:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedDept.employeeCount} Staff Members</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedDept(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Department Code *</Label>
              <Input placeholder="MKT-05" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Department Name *</Label>
              <Input placeholder="Global Marketing & Growth" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">GL Cost Center Code</Label>
              <Input placeholder="CC-5001" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Department Head (HOD)</Label>
              <Input placeholder="Rajesh Kumar" value={hod} onChange={(e) => setHod(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Department
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
              <th className="erp-th">Code</th>
              <th className="erp-th">Department Title</th>
              <th className="erp-th">GL Cost Center</th>
              <th className="erp-th">Department Head</th>
              <th className="erp-th">Staff Strength</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepts.map((d) => (
              <tr key={d.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{d.code}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  {d.name}
                </td>
                <td className="erp-td font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{d.costCenterCode}</td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{d.headOfDepartment || "Unassigned"}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{d.employeeCount} Staff</td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedDept(d)}>
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
