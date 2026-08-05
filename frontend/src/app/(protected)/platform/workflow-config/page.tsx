"use client";

import React, { useState } from "react";
import { GitBranch, Plus, Eye, Play, Layers, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface WorkflowRow {
  id: string;
  name: string;
  triggerEvent: string;
  stepsCount: number;
  status: "Active" | "Draft" | "Disabled";
  executionCount: number;
  lastRunAt?: string;
}

const SEED_WORKFLOWS: WorkflowRow[] = [
  { id: "wf_101", name: "High-Value Sales Order Approval", triggerEvent: "SalesOrder.Created", stepsCount: 3, status: "Active", executionCount: 142, lastRunAt: "2026-07-29 14:20" },
  { id: "wf_102", name: "New Tenant Onboarding & Provisioning", triggerEvent: "Tenant.Created", stepsCount: 5, status: "Active", executionCount: 24, lastRunAt: "2026-07-28 09:15" },
  { id: "wf_103", name: "Payroll Execution Sign-Off", triggerEvent: "Payroll.Calculated", stepsCount: 2, status: "Active", executionCount: 12, lastRunAt: "2026-07-01 18:00" },
  { id: "wf_104", name: "Stock Threshold Alert & Reorder", triggerEvent: "Inventory.LowStock", stepsCount: 2, status: "Draft", executionCount: 0, lastRunAt: "Never" },
];

export default function WorkflowConfigPage() {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>(SEED_WORKFLOWS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRow | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("SalesOrder.Created");

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWf: WorkflowRow = {
      id: `wf_${Date.now()}`,
      name: name.trim(),
      triggerEvent,
      stepsCount: 2,
      status: "Active",
      executionCount: 0,
      lastRunAt: "Just now",
    };

    setWorkflows((prev) => [newWf, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    notifySuccess(`Workflow rule "${newWf.name}" provisioned.`);
  };

  const filteredWorkflows = workflows.filter((wf) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || wf.name.toLowerCase().includes(q) || wf.triggerEvent.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || wf.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Total Workflows", value: workflows.length, tone: "info", icon: <GitBranch className="h-3.5 w-3.5" />, subtext: "Automations" },
    { label: "Active Rules", value: workflows.filter((w) => w.status === "Active").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Enforced" },
    { label: "Total Runs", value: workflows.reduce((acc, w) => acc + w.executionCount, 0), tone: "warning", icon: <Zap className="h-3.5 w-3.5" />, subtext: "Executions" },
    { label: "Draft Workflows", value: workflows.filter((w) => w.status === "Draft").length, tone: "info", icon: <Clock className="h-3.5 w-3.5" />, subtext: "In Setup" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Workflow Automation Rules & Approval Engines"
      subtitle="Define multi-step approval chains, event triggers, condition branches, and action handlers."
      categoryTag="BPMN Automation Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter workflow name, event trigger, or status..."
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
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      primaryActionLabel="New Workflow Rule"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedWorkflow}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedWorkflow(null);
      }}
      inspectorTitle={selectedWorkflow ? `Workflow Details: ${selectedWorkflow.name}` : "Configure Approval Workflow Rule"}
      inspectorSubTitle={selectedWorkflow ? `Trigger ${selectedWorkflow.triggerEvent}` : "Map event triggers to multi-stage approval steps."}
      inspectorContent={
        selectedWorkflow ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Workflow Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedWorkflow.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event Trigger:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedWorkflow.triggerEvent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Configured Steps:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedWorkflow.stepsCount} Stages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Executions:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedWorkflow.executionCount} Runs</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => notifySuccess("Triggered test execution run.")}>
                <Play className="h-3.5 w-3.5 mr-1" />
                Test Run
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Workflow Name *</Label>
              <Input placeholder="Purchase Order Multi-Level Approval" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Event Trigger</Label>
              <select className="erp-select text-xs" value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)}>
                <option value="SalesOrder.Created">SalesOrder.Created</option>
                <option value="Tenant.Created">Tenant.Created</option>
                <option value="Payroll.Calculated">Payroll.Calculated</option>
                <option value="Inventory.LowStock">Inventory.LowStock</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Workflow
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
              <th className="erp-th">Workflow Name</th>
              <th className="erp-th">Event Trigger</th>
              <th className="erp-th">Stages</th>
              <th className="erp-th">Total Runs</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkflows.map((wf) => (
              <tr key={wf.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-indigo-500" />
                    {wf.name}
                  </span>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{wf.triggerEvent}</td>
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{wf.stepsCount} Steps</td>
                <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{wf.executionCount}</td>
                <td className="erp-td">
                  <span className={wf.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {wf.status}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedWorkflow(wf)}>
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
