"use client";

import React, { useMemo, useState } from "react";
import { GitBranch, CheckCircle2, ShieldCheck } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapWorkflowDefinition, useWorkflowDefinitions } from "@/features/platform/hooks/useWorkflowDefinitions";

export default function WorkflowConfigPage() {
  const { data = [], isLoading, isError, error, refetch } = useWorkflowDefinitions();
  const [search, setSearch] = useState("");

  const workflows = useMemo(() => data.map(mapWorkflowDefinition), [data]);
  const filtered = workflows.filter((w) => {
    const q = search.toLowerCase();
    return !q || w.name.toLowerCase().includes(q) || w.workflowKey.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Workflows", value: workflows.length, tone: "info", icon: <GitBranch className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Active", value: workflows.filter((w) => w.status === "Active").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Running" },
    { label: "Total Steps", value: workflows.reduce((acc, w) => acc + w.steps, 0), tone: "warning", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Approvals" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Workflows"
      icon="git-branch"
      kpiMetrics={kpis}
      searchPlaceholder="Filter workflow name or key..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-workflows"
      listRows={filtered}
      listColumns={[
        { key: "workflowKey", label: "Workflow key" },
        { key: "name", label: "Name" },
        { key: "steps", label: "Steps", dataType: "number" },
        { key: "approvalRoles", label: "Approval roles" },
        { key: "status", label: "Status" },
      ]}
      getRowId={(row) => row.id}
      emptyMessage="No workflow definitions configured."
      renderListRow={(w) => (
        <tr key={w.id} className="erp-tr">
          <td className="erp-td font-mono text-xs">{w.workflowKey}</td>
          <td className="erp-td font-semibold">{w.name}</td>
          <td className="erp-td">{w.steps}</td>
          <td className="erp-td text-slate-500">{w.approvalRoles}</td>
          <td className="erp-td">
            <span className={w.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{w.status}</span>
          </td>
        </tr>
      )}
    >
      {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load workflow definitions.")}</div> : null}
    </PlatformGlobalPageShell>
  );
}
