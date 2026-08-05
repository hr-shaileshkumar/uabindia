"use client";

import { useState } from "react";
import { GitMerge, Plus, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WorkflowRule {
  id: string;
  name: string;
  module: "Purchase Orders" | "Expense Claims" | "Leave Requests" | "Journal Entries" | "Quotations";
  triggerCondition: string;
  approvalLevels: string[];
  slaHours: number;
  isActive: boolean;
}

const INITIAL_RULES: WorkflowRule[] = [
  { id: "1", name: "High-Value Purchase Order Approval (>₹1,00,000)", module: "Purchase Orders", triggerCondition: "Amount > ₹100,000", approvalLevels: ["Procurement Head", "Finance Director"], slaHours: 24, isActive: true },
  { id: "2", name: "Employee Expense Reimbursement Policy", module: "Expense Claims", triggerCondition: "All Employee Claims", approvalLevels: ["Reporting Manager", "Finance Manager"], slaHours: 48, isActive: true },
  { id: "3", name: "Long-Term Leave Request (>3 Days)", module: "Leave Requests", triggerCondition: "Duration > 3 Days", approvalLevels: ["Direct Manager", "HR Lead"], slaHours: 24, isActive: true },
  { id: "4", name: "Manual Journal Entry Auditing", module: "Journal Entries", triggerCondition: "Amount > ₹500,000", approvalLevels: ["Senior Accountant", "CFO"], slaHours: 12, isActive: true },
];

export function WorkflowRuleBuilder() {
  const [rules, setRules] = useState<WorkflowRule[]>(INITIAL_RULES);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    module: "Purchase Orders" as WorkflowRule["module"],
    triggerCondition: "",
    approver1: "",
    approver2: "",
    slaHours: 24,
  });

  const handleOpenDrawer = (rule?: WorkflowRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        module: rule.module,
        triggerCondition: rule.triggerCondition,
        approver1: rule.approvalLevels[0] || "",
        approver2: rule.approvalLevels[1] || "",
        slaHours: rule.slaHours,
      });
    } else {
      setEditingRule(null);
      setFormData({ name: "", module: "Purchase Orders", triggerCondition: "", approver1: "Department Lead", approver2: "Finance Manager", slaHours: 24 });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.triggerCondition) return;
    const levels = [formData.approver1, formData.approver2].filter(Boolean);

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? { ...r, name: formData.name, module: formData.module, triggerCondition: formData.triggerCondition, approvalLevels: levels, slaHours: formData.slaHours }
            : r
        )
      );
    } else {
      const newRule: WorkflowRule = {
        id: String(Date.now()),
        name: formData.name,
        module: formData.module,
        triggerCondition: formData.triggerCondition,
        approvalLevels: levels,
        slaHours: formData.slaHours,
        isActive: true,
      };
      setRules((prev) => [newRule, ...prev]);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Workflow & Approval Engine"
        subtitle="Configure multi-stage approval hierarchies, SLA deadlines, threshold triggers, and escalation rules"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Workflow Config" },
        ]}
        actions={
          <Button size="sm" onClick={() => handleOpenDrawer()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Workflow Rule
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {rules.map((rule) => (
          <Card key={rule.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{rule.name}</CardTitle>
                  <CardDescription className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Module: {rule.module}
                  </CardDescription>
                </div>
                <Badge variant={rule.isActive ? "success" : "secondary"}>
                  {rule.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs">
                <span className="text-muted-foreground">Trigger Condition: </span>
                <span className="font-mono font-semibold text-foreground">{rule.triggerCondition}</span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Approval Stages & Roles:</p>
                <div className="flex flex-wrap items-center gap-2">
                  {rule.approvalLevels.map((lvl, index) => (
                    <div key={index} className="flex items-center gap-1">
                      {index > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      <Badge variant="outline" className="text-xs bg-background">
                        Level {index + 1}: {lvl}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>SLA Resolution Window</span>
                <span className="font-semibold text-foreground">{rule.slaHours} Hours</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingRule ? "Edit Workflow Rule" : "Create Approval Workflow"}
        subtitle="Define threshold conditions and approver roles"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Workflow</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ruleName">Workflow Rule Name *</Label>
            <Input id="ruleName" placeholder="e.g. PO High-Value Approval" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger Condition *</Label>
            <Input id="trigger" placeholder="e.g. Amount > ₹50,000" value={formData.triggerCondition} onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app1">Level 1 Approver Role</Label>
            <Input id="app1" placeholder="e.g. Department Manager" value={formData.approver1} onChange={(e) => setFormData({ ...formData, approver1: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app2">Level 2 Approver Role (Optional)</Label>
            <Input id="app2" placeholder="e.g. Finance Director" value={formData.approver2} onChange={(e) => setFormData({ ...formData, approver2: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sla">SLA Timeout (Hours)</Label>
            <Input id="sla" type="number" value={formData.slaHours} onChange={(e) => setFormData({ ...formData, slaHours: Number(e.target.value) })} />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
