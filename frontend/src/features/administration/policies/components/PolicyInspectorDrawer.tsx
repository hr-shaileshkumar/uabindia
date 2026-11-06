"use client";

import { SideDrawer } from "@/components/ui/side-drawer";
import {
  POLICY_CATEGORIES,
  type PolicyMaster,
} from "../types/policy-matrix.types";
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  MapPin,
  GitCommit,
  ArrowRight,
  Sliders,
} from "lucide-react";

interface PolicyInspectorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: PolicyMaster | null;
  onNewVersion: (policy: PolicyMaster) => void;
  onSimulate: (policy: PolicyMaster) => void;
}

export function PolicyInspectorDrawer({
  open,
  onOpenChange,
  policy,
  onNewVersion,
  onSimulate,
}: PolicyInspectorDrawerProps) {
  if (!policy) return null;

  const activeVer = policy.activeVersion;
  const catMeta = POLICY_CATEGORIES.find((c) => c.code === policy.category);
  const ruleEntries = activeVer?.ruleConfig ? Object.entries(activeVer.ruleConfig) : [];
  const app = activeVer?.applicability;
  const workflow = activeVer?.approvalWorkflow;

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title={policy.name}
      subtitle={`Policy Code: ${policy.code} • Category: ${catMeta?.name || policy.category}`}
      width="2xl"
    >
      <div className="space-y-6 pb-8 text-slate-800">
        {/* Header Badges & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
            {policy.code}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {catMeta?.name || policy.category}
          </span>
          <span
            className={
              policy.status === "Active"
                ? "erp-chip erp-chip-success"
                : policy.status === "Draft"
                  ? "erp-chip erp-chip-warning"
                  : "erp-chip erp-chip-neutral"
            }
          >
            {policy.status}
          </span>
          {policy.isSystemCritical && (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wide">
              Statutory Critical
            </span>
          )}
          {policy.isMandatoryAcknowledgment && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              <AlertCircle className="h-3 w-3" /> Mandatory E-Sign
            </span>
          )}
          <span className="text-xs text-slate-500 ml-auto">
            Priority: <strong className="text-slate-800">#{policy.priority}</strong>
          </span>
        </div>

        {/* Description */}
        {policy.description && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs text-slate-700 leading-relaxed">
            {policy.description}
          </div>
        )}

        {/* Active Revision Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Active Revision: v{activeVer?.version || "1.0"}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {policy.totalVersions} revision(s) published in database
                </p>
              </div>
            </div>
            <span className="erp-chip erp-chip-success">Enforced Live</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Effective From</span>
              <p className="font-medium text-slate-800">{activeVer?.effectiveFrom || "Immediate"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Effective To</span>
              <p className="font-medium text-slate-800">{activeVer?.effectiveTo || "Indefinite / Permanent"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Revision Author</span>
              <p className="font-medium text-slate-800">{activeVer?.authorName || "System Administrator"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Approved By</span>
              <p className="font-medium text-slate-800">{activeVer?.approvedByName || "Chief HR Officer"}</p>
            </div>
          </div>

          {activeVer?.changeLogReason && (
            <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600">
              <strong className="text-slate-700">Changelog Reason:</strong> {activeVer.changeLogReason}
            </div>
          )}
        </div>

        {/* Rule Parameters Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              <span>Configured Rule Parameters</span>
            </div>
            <span className="text-[11px] text-slate-500">{ruleEntries.length} parameter(s)</span>
          </div>

          {ruleEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
              No specific key-value parameters configured for this revision.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ruleEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs flex flex-col justify-between"
                >
                  <span className="font-mono text-[11px] font-semibold text-slate-600 break-all">
                    {key}
                  </span>
                  <span className="mt-1 font-mono font-bold text-indigo-700 text-xs break-all">
                    {typeof value === "boolean"
                      ? value
                        ? "TRUE"
                        : "FALSE"
                      : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Target Scope & Applicability */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span>Scope & Organizational Applicability</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Target Departments</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {app?.departmentIds && app.departmentIds.length > 0 ? (
                  app.departmentIds.map((dept) => (
                    <span key={dept} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      {dept}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-600 font-medium">All Departments (Enterprise-Wide)</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Employment Types</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {app?.employmentTypes && app.employmentTypes.length > 0 ? (
                  app.employmentTypes.map((t) => (
                    <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-600 font-medium">All Employment Types</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-500">Applicable Grades:</span>{" "}
                <strong className="text-slate-800">
                  {app?.grades && app.grades.length > 0 ? app.grades.join(", ") : "All Grades"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Branch Locations:</span>{" "}
                <strong className="text-slate-800">
                  {app?.branchIds && app.branchIds.length > 0 ? app.branchIds.join(", ") : "All Branches"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Workflow & Dispute Governance */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <CheckCircle2 className="h-3.5 w-3.5 text-violet-600" />
            <span>Approval Workflow & SLA SLA Governance</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Workflow Type: {workflow?.workflowType || "SingleLevel"}
              </span>
              <span className="text-[11px] text-slate-500">
                Dispute Window: {workflow?.disputeWindowDays ?? 7} days
              </span>
            </div>

            {workflow?.levels && workflow.levels.length > 0 ? (
              <div className="space-y-2 pt-1">
                {workflow.levels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                        {lvl.level}
                      </span>
                      <span className="font-semibold text-slate-800">{lvl.role}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>SLA: <strong className="text-slate-700">{lvl.slaHours}h</strong></span>
                      <span>Can Reject: <strong className="text-slate-700">{lvl.canReject ? "Yes" : "No"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Drawer Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSimulate(policy);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Test In Impact Simulator
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onNewVersion(policy);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Publish New Version
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}
