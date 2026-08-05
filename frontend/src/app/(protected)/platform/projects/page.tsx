"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Plus, Eye, CheckCircle2, Clock, DollarSign, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { hrApi } from "@/services/hrApi";
import { notifySuccess } from "@/lib/notifications";

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  client?: string;
  budget?: number;
  status: "In Progress" | "Completed" | "On Hold" | "Planning";
  completion: number;
  updatedAt?: string;
}

const SEED_PROJECTS: ProjectRow[] = [
  { id: "prj_101", code: "PRJ-2026-01", name: "ERP Platform Migration V2", client: "UAB Internal", budget: 1500000, status: "In Progress", completion: 75, updatedAt: "2026-07-28" },
  { id: "prj_102", code: "PRJ-2026-02", name: "Automated Warehouse Scanner", client: "Acme Logistics", budget: 850000, status: "In Progress", completion: 40, updatedAt: "2026-07-25" },
  { id: "prj_103", code: "PRJ-2026-03", name: "Financial Audit Integration", client: "EuroTech Solutions", budget: 420000, status: "Completed", completion: 100, updatedAt: "2026-07-10" },
  { id: "prj_104", code: "PRJ-2026-04", name: "AI Procurement Optimizer", client: "Apex Retail", budget: 1200000, status: "Planning", completion: 10, updatedAt: "2026-07-29" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>(SEED_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("500000");

  const loadProjects = async () => {
    setLoading(true);
    try {
      if ("project" in hrApi && typeof (hrApi as unknown as { project: { getAll: () => Promise<{ data: ProjectRow[] }> } }).project?.getAll === "function") {
        const res = await (hrApi as unknown as { project: { getAll: () => Promise<{ data: ProjectRow[] }> } }).project.getAll();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setProjects(res.data);
        }
      }
    } catch {
      // Retain SEED_PROJECTS
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPrj: ProjectRow = {
      id: `prj_${Date.now()}`,
      code: code.trim().toUpperCase() || `PRJ-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      client: client.trim() || "Internal",
      budget: Number(budget) || 500000,
      status: "In Progress",
      completion: 0,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setProjects((prev) => [newPrj, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setCode("");
    setClient("");
    notifySuccess(`Project "${newPrj.name}" created successfully.`);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.client && p.client.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Active Projects", value: projects.length, tone: "info", icon: <FolderGit2 className="h-3.5 w-3.5" />, subtext: "Workspaces" },
    { label: "In Progress", value: projects.filter((p) => p.status === "In Progress").length, tone: "positive", icon: <Activity className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Completed", value: projects.filter((p) => p.status === "Completed").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Delivered" },
    {
      label: "Total Budget",
      value: `₹${(projects.reduce((acc, p) => acc + (p.budget || 0), 0) / 100000).toFixed(1)}L`,
      tone: "warning",
      icon: <DollarSign className="h-3.5 w-3.5" />,
      subtext: "Allocated",
    },
  ];

  return (
    <PlatformGlobalPageShell
      title="Project Workspaces & Project Governance"
      subtitle="Track project codes, client deliverables, budget allocations, and completion milestones across tenants."
      categoryTag="Project Portfolio Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter by project name, code, or client..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "status",
          label: "All Statuses",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All Statuses", value: "all" },
            { label: "In Progress", value: "in progress" },
            { label: "Completed", value: "completed" },
            { label: "Planning", value: "planning" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      primaryActionLabel="New Project"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      onRefresh={loadProjects}
      isLoading={loading}
      isInspectorOpen={isDrawerOpen || !!selectedProject}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedProject(null);
      }}
      inspectorTitle={selectedProject ? `Project Details: ${selectedProject.name}` : "Create Project Workspace"}
      inspectorSubTitle={selectedProject ? `Project Code ${selectedProject.code}` : "Define client, budget, and scope deliverables."}
      inspectorContent={
        selectedProject ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Project Code:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedProject.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedProject.client || "Internal"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Budget:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{(selectedProject.budget || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Completion:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedProject.completion}%</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Project Code *</Label>
              <Input placeholder="PRJ-2026-05" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Project Name *</Label>
              <Input placeholder="Supply Chain Integration Engine" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Client Name</Label>
              <Input placeholder="Acme Global Logistics" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Allocated Budget (₹)</Label>
              <Input type="number" placeholder="500000" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Project
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
              <th className="erp-th">Project Code</th>
              <th className="erp-th">Project Title</th>
              <th className="erp-th">Client</th>
              <th className="erp-th">Budget</th>
              <th className="erp-th">Completion %</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((prj) => (
              <tr key={prj.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{prj.code}</td>
                <td className="erp-td">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FolderGit2 className="h-4 w-4 text-indigo-500" />
                    {prj.name}
                  </span>
                </td>
                <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{prj.client || "Internal"}</td>
                <td className="erp-td font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ₹{(prj.budget || 0).toLocaleString()}
                </td>
                <td className="erp-td">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${prj.completion}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-slate-600">{prj.completion}%</span>
                  </div>
                </td>
                <td className="erp-td">
                  <span className={prj.status === "Completed" ? "erp-chip erp-chip-success" : prj.status === "In Progress" ? "erp-chip erp-chip-info" : "erp-chip erp-chip-warning"}>
                    {prj.status}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedProject(prj)}>
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
