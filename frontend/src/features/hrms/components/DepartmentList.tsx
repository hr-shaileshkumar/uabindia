"use client";

import { useState } from "react";
import { Building2, Plus, Edit2, Trash2, Users, Search } from "lucide-react";
import { PageHeader } from "@/design-system";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Department {
  id: string;
  name: string;
  code: string;
  managerName?: string;
  employeeCount: number;
  isActive: boolean;
}

const INITIAL_DEPARTMENTS: Department[] = [
  { id: "1", name: "Human Resources", code: "HR", managerName: "Sarah Jenkins", employeeCount: 14, isActive: true },
  { id: "2", name: "Engineering & Tech", code: "ENG", managerName: "Alex Rivera", employeeCount: 42, isActive: true },
  { id: "3", name: "Finance & Accounting", code: "FIN", managerName: "Michael Chen", employeeCount: 18, isActive: true },
  { id: "4", name: "Sales & Marketing", code: "SALES", managerName: "Priya Sharma", employeeCount: 29, isActive: true },
  { id: "5", name: "Operations & Fleet", code: "OPS", managerName: "David Miller", employeeCount: 22, isActive: true },
];

export function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [formData, setFormData] = useState({ name: "", code: "", managerName: "" });

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDrawer = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, code: dept.code, managerName: dept.managerName || "" });
    } else {
      setEditingDept(null);
      setFormData({ name: "", code: "", managerName: "" });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingDept.id ? { ...d, ...formData } : d))
      );
    } else {
      const newDept: Department = {
        id: String(Date.now()),
        name: formData.name,
        code: formData.code,
        managerName: formData.managerName,
        employeeCount: 0,
        isActive: true,
      };
      setDepartments((prev) => [...prev, newDept]);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Organize company structure, department heads, and team allocations."
        eyebrow="HRMS / Organization"
        icon="building"
        stats={[
          { label: "Departments", value: departments.length },
          { label: "Active", value: departments.filter((d) => d.isActive).length, tone: "success" },
          { label: "Total Members", value: departments.reduce((acc, curr) => acc + curr.employeeCount, 0), tone: "info" },
        ]}
        actions={
          <Button size="sm" onClick={() => handleOpenDrawer()} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm gap-1.5">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search departments by name or code..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dept) => (
          <Card key={dept.id} className="relative overflow-hidden hover:border-indigo-500/50 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">{dept.name}</CardTitle>
                <CardDescription className="text-xs font-mono">{dept.code}</CardDescription>
              </div>
              <Badge variant={dept.isActive ? "success" : "secondary"}>
                {dept.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Department Head</span>
                <span className="font-medium text-foreground">{dept.managerName || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Members
                </span>
                <span className="font-semibold text-foreground">{dept.employeeCount} Employees</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="ghost" onClick={() => handleOpenDrawer(dept)} className="h-8 px-2 text-xs">
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingDept ? "Edit Department" : "Create Department"}
        subtitle="Manage department code and department head"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Department</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deptName">Department Name *</Label>
            <Input
              id="deptName"
              placeholder="e.g. Engineering & Tech"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deptCode">Department Code *</Label>
            <Input
              id="deptCode"
              placeholder="e.g. ENG"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deptManager">Department Head / Manager</Label>
            <Input
              id="deptManager"
              placeholder="Manager full name"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
