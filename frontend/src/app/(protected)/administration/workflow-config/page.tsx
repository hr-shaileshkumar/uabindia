"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { GitBranch, CheckCircle2, ShieldCheck, Plus, Edit2, Play, Check } from "lucide-react";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ERPFormGrid, ERPFormField } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { erpButtonClassName } from "@/components/workspace/styles";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  mapWorkflowDefinition,
  useWorkflowDefinitions,
  useWorkflowMutations,
} from "@/features/administration/hooks/useWorkflowDefinitions";

function LegacyWorkflowConfigPage() {
  const { data = [], isLoading, isError, error, refetch } = useWorkflowDefinitions();
  const { upsertWorkflow } = useWorkflowMutations();
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    key: "leave-approval",
    name: "",
    isActive: true,
    stepRole1: "Manager",
    stepRole2: "HR Manager",
    twoStepApproval: false,
  });

  const workflows = useMemo(() => data.map(mapWorkflowDefinition), [data]);
  const filtered = workflows.filter((w) => {
    const q = search.toLowerCase();
    return !q || w.name.toLowerCase().includes(q) || w.workflowKey.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Workflows", value: workflows.length, tone: "info", icon: <GitBranch className="h-3.5 w-3.5" />, subtext: "Enterprise rules" },
    { label: "Active", value: workflows.filter((w) => w.status === "Active").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Running" },
    { label: "Total Steps", value: workflows.reduce((acc, w) => acc + w.steps, 0), tone: "warning", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Approvals" },
  ];

  const handleOpenCreate = () => {
    setForm({
      key: "leave-approval",
      name: "Standard Leave Approval",
      isActive: true,
      stepRole1: "Manager",
      stepRole2: "HR Manager",
      twoStepApproval: false,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (w: typeof workflows[0]) => {
    setForm({
      key: w.workflowKey,
      name: w.name,
      isActive: w.status === "Active",
      stepRole1: w.approvalRoles.split(",")[0]?.trim() || "Manager",
      stepRole2: w.approvalRoles.split(",")[1]?.trim() || "HR Manager",
      twoStepApproval: w.steps > 1,
    });
    setIsDrawerOpen(true);
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key || !form.name) {
      notifyError("Workflow key and name are required.");
      return;
    }

    try {
      setSubmitting(true);
      const steps = [
        { stepNumber: 1, roleRequired: form.stepRole1, conditionType: "Always" },
      ];
      if (form.twoStepApproval) {
        steps.push({ stepNumber: 2, roleRequired: form.stepRole2, conditionType: "AmountThreshold" });
      }

      await upsertWorkflow.mutateAsync({
        key: form.key,
        name: form.name,
        isActive: form.isActive,
        steps,
      });

      notifySuccess(`Workflow "${form.name}" saved successfully.`);
      setIsDrawerOpen(false);
      void refetch();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to save workflow definition");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Workflow rules & approval engine"
        subtitle="Configure multi-tier approval sequences, auto-routing, and governance triggers."
        categoryTag="Administration / Workflow"
        icon="git-branch"
        kpiMetrics={kpis}
        searchPlaceholder="Filter workflow name or key..."
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        primaryActionLabel="New workflow rule"
        primaryActionIcon={<Plus className="h-4 w-4" />}
        onPrimaryAction={handleOpenCreate}
        listKey="platform-workflows"
        listRows={filtered}
        listColumns={[
          { key: "workflowKey", label: "Workflow trigger key" },
          { key: "name", label: "Workflow name" },
          { key: "steps", label: "Approval steps", dataType: "number" },
          { key: "approvalRoles", label: "Approver sequence" },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
        getRowId={(row) => row.id}
        emptyMessage="No workflow definitions configured. Create your first approval workflow."
        renderListRow={(w) => (
          <tr key={w.id} className="erp-tr hover:bg-slate-50/80 transition-colors">
            <td className="erp-td font-mono text-xs font-semibold text-indigo-700">{w.workflowKey}</td>
            <td className="erp-td font-semibold text-slate-900">{w.name}</td>
            <td className="erp-td font-medium text-slate-700">{w.steps} tier{w.steps > 1 ? "s" : ""}</td>
            <td className="erp-td">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                {w.approvalRoles}
              </span>
            </td>
            <td className="erp-td">
              <span className={w.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                {w.status}
              </span>
            </td>
            <td className="erp-td text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                onClick={() => handleOpenEdit(w)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </td>
          </tr>
        )}
      >
        {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load workflow definitions.")}</div> : null}
      </AdministrationGlobalPageShell>

      <SideDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={form.name ? `Configure ${form.name}` : "Create workflow rule"}
        subtitle="Define triggers and multi-step approver hierarchy for operational transactions."
      >
        <form onSubmit={handleSaveWorkflow} className="space-y-5 p-1">
          <ERPFormGrid columns={1}>
            <ERPFormField label="Workflow Trigger Type" required>
              <Select
                value={form.key}
                onValueChange={(val) => {
                  setForm((f) => ({
                    ...f,
                    key: val,
                    name: f.name || `${val.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")} Process`,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave-approval">Leave Request (Employee $\to$ Manager)</SelectItem>
                  <SelectItem value="expense-approval">Expense Claim (Finance Outflow)</SelectItem>
                  <SelectItem value="purchase-order">Purchase Order (Procurement Review)</SelectItem>
                  <SelectItem value="invoice-approval">Sales Invoice (Commercial Release)</SelectItem>
                  <SelectItem value="attendance-correction">Attendance Regularization (HR Review)</SelectItem>
                  <SelectItem value="custom-workflow">Custom Operational Trigger</SelectItem>
                </SelectContent>
              </Select>
            </ERPFormField>

            <ERPFormField label="Display Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Standard Department Leave Approval"
              />
            </ERPFormField>

            <ERPFormField label="Tier 1 Approver Role" required helperText="The initial reviewer who must sign off.">
              <Select
                value={form.stepRole1}
                onValueChange={(val) => setForm((f) => ({ ...f, stepRole1: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approver role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Department Manager / Reporting Lead</SelectItem>
                  <SelectItem value="HR Manager">Human Resources Lead</SelectItem>
                  <SelectItem value="Accountant">Finance / Chief Accountant</SelectItem>
                  <SelectItem value="Admin">Tenant Organization Admin</SelectItem>
                </SelectContent>
              </Select>
            </ERPFormField>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.twoStepApproval}
                  onChange={(e) => setForm((f) => ({ ...f, twoStepApproval: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Enable Tier-2 Secondary Approval Escalation
              </label>

              {form.twoStepApproval && (
                <ERPFormField label="Tier 2 Executive Sign-off Role">
                  <Select
                    value={form.stepRole2}
                    onValueChange={(val) => setForm((f) => ({ ...f, stepRole2: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Tier-2 role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR Manager">Human Resources Lead</SelectItem>
                      <SelectItem value="Admin">Tenant Organization Admin</SelectItem>
                      <SelectItem value="Accountant">Head of Finance / CFO</SelectItem>
                    </SelectContent>
                  </Select>
                </ERPFormField>
              )}
            </div>

            <ERPFormField label="Active Status">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active (Rule is enforced on live operations)
              </label>
            </ERPFormField>
          </ERPFormGrid>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDrawerOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className={erpButtonClassName.primary} disabled={submitting}>
              {submitting ? "Saving rule…" : "Save workflow rule"}
            </Button>
          </div>
        </form>
      </SideDrawer>
    </>
  );
}

export default function WorkflowConfigPage() {
  return (
    <DynamicPage
      pageKey="administration.workflow-config"
      fallback={<LegacyWorkflowConfigPage />}
      renderMode="auto"
    />
  );
}
