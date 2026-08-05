"use client";

import { useState } from "react";
import { Award, Plus, Edit2, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/design-system";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Designation {
  id: string;
  name: string;
  code: string;
  departmentName?: string;
  level: string;
  isActive: boolean;
}

const INITIAL_DESIGNATIONS: Designation[] = [
  { id: "1", name: "Senior Software Engineer", code: "SSE", departmentName: "Engineering & Tech", level: "L3", isActive: true },
  { id: "2", name: "Product Manager", code: "PM", departmentName: "Engineering & Tech", level: "L4", isActive: true },
  { id: "3", name: "HR Executive", code: "HRE", departmentName: "Human Resources", level: "L2", isActive: true },
  { id: "4", name: "Financial Analyst", code: "FA", departmentName: "Finance & Accounting", level: "L3", isActive: true },
  { id: "5", name: "Sales Operations Lead", code: "SOL", departmentName: "Sales & Marketing", level: "L4", isActive: true },
];

export function DesignationList() {
  const [designations, setDesignations] = useState<Designation[]>(INITIAL_DESIGNATIONS);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);

  const [formData, setFormData] = useState({ name: "", code: "", departmentName: "", level: "L1" });

  const filtered = designations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDrawer = (desig?: Designation) => {
    if (desig) {
      setEditingDesig(desig);
      setFormData({ name: desig.name, code: desig.code, departmentName: desig.departmentName || "", level: desig.level });
    } else {
      setEditingDesig(null);
      setFormData({ name: "", code: "", departmentName: "", level: "L1" });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    if (editingDesig) {
      setDesignations((prev) =>
        prev.map((d) => (d.id === editingDesig.id ? { ...d, ...formData } : d))
      );
    } else {
      const newDesig: Designation = {
        id: String(Date.now()),
        name: formData.name,
        code: formData.code,
        departmentName: formData.departmentName,
        level: formData.level,
        isActive: true,
      };
      setDesignations((prev) => [...prev, newDesig]);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designations & Job Titles"
        subtitle="Manage job titles, seniority levels, and department designations."
        eyebrow="HRMS / Organization"
        icon="award"
        stats={[
          { label: "Designations", value: designations.length },
          { label: "Active", value: designations.filter((d) => d.isActive).length, tone: "success" },
        ]}
        actions={
          <Button size="sm" onClick={() => handleOpenDrawer()} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm gap-1.5">
            <Plus className="h-4 w-4" />
            Add Designation
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search designation name or code..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((desig) => (
          <Card key={desig.id} className="relative overflow-hidden hover:border-indigo-500/50 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">{desig.name}</CardTitle>
                <CardDescription className="text-xs font-mono">{desig.code}</CardDescription>
              </div>
              <Badge variant="outline">{desig.level}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium text-foreground">{desig.departmentName || "General"}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="ghost" onClick={() => handleOpenDrawer(desig)} className="h-8 px-2 text-xs">
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
        title={editingDesig ? "Edit Designation" : "Create Designation"}
        subtitle="Configure job title details and level"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Designation</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desigName">Designation Title *</Label>
            <Input
              id="desigName"
              placeholder="e.g. Senior Product Designer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desigCode">Short Code *</Label>
            <Input
              id="desigCode"
              placeholder="e.g. SPD"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desigDept">Department</Label>
            <Input
              id="desigDept"
              placeholder="Department name"
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desigLevel">Seniority Level</Label>
            <Input
              id="desigLevel"
              placeholder="e.g. L3 or Senior"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
