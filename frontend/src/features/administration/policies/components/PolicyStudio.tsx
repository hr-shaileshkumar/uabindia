"use client";

import { useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpCreateButton, ErpRefreshButton } from "@/components/workspace/page-kit";
import {
  erpTableRowHoverClassName,
  erpTableTdClassName,
} from "@/components/workspace/styles";
import {
  POLICY_CATEGORIES,
  type PolicyCategory,
  type PolicyMaster,
} from "../types/policy-matrix.types";
import { usePolicyStudio } from "../hooks/usePolicyStudio";
import { PolicyMasterDrawer } from "./PolicyMasterDrawer";
import { PolicyVersionDrawer } from "./PolicyVersionDrawer";
import { PolicySimulatorModal } from "./PolicySimulatorModal";
import { PolicyInspectorDrawer } from "./PolicyInspectorDrawer";
import { RuleDefinitionsManager } from "./RuleDefinitionsManager";
import {
  Search,
  Sparkles,
  Layers,
  ShieldCheck,
  Plus,
  Sliders,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
} from "lucide-react";

export default function PolicyStudio() {
  const {
    policies,
    rawPolicies,
    uiSchema,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activePolicy,
    setActivePolicy,
    loading,
    saving,
    categoryCounts,
    simulationResult,
    isSimulating,
    fetchPolicies,
    createPolicyMaster,
    createNewVersion,
    runImpactSimulation,
  } = usePolicyStudio();

  const [masterDrawerOpen, setMasterDrawerOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedForVersion, setSelectedForVersion] = useState<PolicyMaster | null>(null);
  const [inspectingPolicy, setInspectingPolicy] = useState<PolicyMaster | null>(null);
  const [activeStudioTab, setActiveStudioTab] = useState<"POLICIES" | "DEFINITIONS">("POLICIES");

  // Filter categories by backend-driven UI Schema visibility
  const visibleCategories = useMemo(() => {
    if (!uiSchema?.categories || uiSchema.categories.length === 0) return POLICY_CATEGORIES;
    const allowedMap = new Map(uiSchema.categories.map((c) => [c.code, c.visible]));
    return POLICY_CATEGORIES.filter((c) => allowedMap.get(c.code) !== false);
  }, [uiSchema]);

  const mandatoryCount = rawPolicies.filter((p) => p.isMandatoryAcknowledgment).length;
  const criticalCount = rawPolicies.filter((p) => p.isSystemCritical).length;
  const activeCount = rawPolicies.filter((p) => p.status === "Active").length;

  const handleOpenNewVersion = (p: PolicyMaster) => {
    setSelectedForVersion(p);
    setVersionDrawerOpen(true);
  };

  return (
    <>
      <StandardPageLayout
        title="Universal Policy Management Studio"
        subtitle="Unified configuration studio across 14 enterprise policy categories for Bavya Health Services Pvt. Ltd."
        eyebrow={uiSchema?.authority ? `Administration / ${uiSchema.authority}` : "Administration / Security & Policies"}
        icon="sliders"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Total Policies", value: rawPolicies.length, tone: "info" },
              { label: "Active in Database", value: activeCount, tone: "positive" },
              { label: "Mandatory E-Sign", value: mandatoryCount, tone: "warning" },
              { label: "Statutory Critical", value: criticalCount, tone: "info" },
            ]}
          />
        }
        actions={
          <>
            {uiSchema?.permissions?.canSimulate !== false && (
              <button
                type="button"
                onClick={() => setSimulatorOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Impact Simulator
              </button>
            )}
            <ErpRefreshButton onClick={() => void fetchPolicies()} loading={loading} />
            {uiSchema?.permissions?.canCreatePolicy !== false && (
              <ErpCreateButton label="New Policy Master" onClick={() => setMasterDrawerOpen(true)} />
            )}
          </>
        }
      >
        {/* Studio View Mode Switcher */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveStudioTab("POLICIES")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
              activeStudioTab === "POLICIES"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Enterprise Policies Registry & Simulation
          </button>
          <button
            type="button"
            onClick={() => setActiveStudioTab("DEFINITIONS")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
              activeStudioTab === "DEFINITIONS"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Database Rule Definitions & Statutory Ratios (Admin)
          </button>
        </div>

        {activeStudioTab === "DEFINITIONS" ? (
          <RuleDefinitionsManager />
        ) : (
          <>
            {/* Category Filter Pills (Server Governed) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors border ${
              selectedCategory === "ALL"
                ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            All Categories ({rawPolicies.length})
          </button>
          {visibleCategories.map((cat) => {
            const count = categoryCounts[cat.code] || 0;
            const isSelected = selectedCategory === cat.code;
            return (
              <button
                key={cat.code}
                type="button"
                onClick={() => setSelectedCategory(cat.code)}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors border ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Overview Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by policy name, code (e.g. ATT_LATE), or rule keywords..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing {policies.length} of {rawPolicies.length} policies</span>
          </div>
        </div>

        {/* Policy Explorer Table */}
        <CrudCard
          title={
            selectedCategory === "ALL"
              ? "All Configured Policies"
              : POLICY_CATEGORIES.find((c) => c.code === selectedCategory)?.name || "Policies"
          }
          description={
            selectedCategory === "ALL"
              ? "Live policy definitions consumed across Attendance, Payroll, Leave, Travel, Assets, and Security engines."
              : POLICY_CATEGORIES.find((c) => c.code === selectedCategory)?.description
          }
        >
          {policies.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No policies found matching the selected filter. Click <strong>New Policy Master</strong> to add one.
            </div>
          ) : (
            <div className="erp-table-wrap">
              <table className="erp-table">
                <thead className="erp-thead">
                  <tr>
                    <th className="erp-th">Policy Code & Name</th>
                    <th className="erp-th">Category</th>
                    <th className="erp-th">Active Version</th>
                    <th className="erp-th">Effective Period</th>
                    <th className="erp-th">Scope & Applicability</th>
                    <th className="erp-th">E-Sign</th>
                    <th className="erp-th">Status</th>
                    <th className="erp-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((pol) => {
                    const activeVer = pol.activeVersion;
                    const catMeta = POLICY_CATEGORIES.find((c) => c.code === pol.category);

                    return (
                      <tr key={pol.id} className={erpTableRowHoverClassName}>
                        <td className={erpTableTdClassName}>
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingPolicy(pol);
                              setInspectorOpen(true);
                            }}
                            className="text-left group cursor-pointer focus:outline-none"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded group-hover:bg-indigo-100 transition-colors">
                                {pol.code}
                              </span>
                              {pol.isSystemCritical && (
                                <span
                                  className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 uppercase"
                                  title="Statutory Critical Policy"
                                >
                                  Statutory
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {pol.name}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{pol.description}</p>
                          </button>
                        </td>

                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {catMeta?.name || pol.category}
                          </span>
                        </td>

                        <td className={erpTableTdClassName}>
                          {activeVer ? (
                            <div>
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
                                <Layers className="h-3 w-3 text-blue-600" />v{activeVer.version}
                              </span>
                              <p className="text-[10px] text-slate-400">{pol.totalVersions} version(s)</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No version</span>
                          )}
                        </td>

                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>
                          {activeVer ? (
                            <div>
                              <p className="font-medium text-slate-800">{activeVer.effectiveFrom}</p>
                              <p className="text-[10px] text-slate-400">
                                {activeVer.effectiveTo ? `to ${activeVer.effectiveTo}` : "Indefinite"}
                              </p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className={erpTableTdClassName}>
                          {activeVer?.applicability ? (
                            <div className="space-y-0.5 text-[11px]">
                              {activeVer.applicability.departmentIds && activeVer.applicability.departmentIds.length > 0 ? (
                                <p className="text-blue-700 font-medium">
                                  Depts: {activeVer.applicability.departmentIds.slice(0, 2).join(", ")}
                                  {activeVer.applicability.departmentIds.length > 2 && "..."}
                                </p>
                              ) : (
                                <p className="text-slate-600">All Departments</p>
                              )}
                              {activeVer.applicability.employmentTypes && activeVer.applicability.employmentTypes.length > 0 ? (
                                <p className="text-slate-500">
                                  {activeVer.applicability.employmentTypes.join(", ")}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Organization-Wide</span>
                          )}
                        </td>

                        <td className={erpTableTdClassName}>
                          {pol.isMandatoryAcknowledgment ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" /> Mandatory
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Optional</span>
                          )}
                        </td>

                        <td className={erpTableTdClassName}>
                          <span
                            className={
                              pol.status === "Active"
                                ? "erp-chip erp-chip-success"
                                : pol.status === "Draft"
                                  ? "erp-chip erp-chip-warning"
                                  : "erp-chip erp-chip-neutral"
                            }
                          >
                            {pol.status}
                          </span>
                        </td>

                        <td className={`${erpTableTdClassName} text-right space-x-1`}>
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingPolicy(pol);
                              setInspectorOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            title="Inspect configured rules and applicability"
                          >
                            <Eye className="h-3 w-3" />
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenNewVersion(pol)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            title="Publish new policy revision"
                          >
                            + Version
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CrudCard>
      </>
    )}
    </StandardPageLayout>

      {/* ── Create Policy Master Drawer ── */}
      <PolicyMasterDrawer
        open={masterDrawerOpen}
        onOpenChange={setMasterDrawerOpen}
        saving={saving}
        onSave={createPolicyMaster}
        categories={uiSchema?.categories}
      />

      {/* ── Publish New Version Drawer ── */}
      <PolicyVersionDrawer
        open={versionDrawerOpen}
        onOpenChange={setVersionDrawerOpen}
        policy={selectedForVersion}
        saving={saving}
        onSave={createNewVersion}
      />

      {/* ── Policy Impact Simulator Modal ── */}
      <PolicySimulatorModal
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        policies={rawPolicies}
        simulationResult={simulationResult}
        isSimulating={isSimulating}
        onRunSimulation={(code, config, dept) =>
          runImpactSimulation({
            policyCode: code,
            proposedRuleConfig: config,
            evaluationMonth: "2026-08",
            departmentFilter: dept,
          })
        }
      />

      {/* ── Policy Inspector Drawer ── */}
      <PolicyInspectorDrawer
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        policy={inspectingPolicy}
        onNewVersion={(p) => handleOpenNewVersion(p)}
        onSimulate={(p) => {
          setSimulatorOpen(true);
        }}
      />
    </>
  );
}
