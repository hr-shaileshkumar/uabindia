"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sliders,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Building2,
  Briefcase,
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { policyApi } from "@/services/modules/policies";
import { orgApi } from "@/services/modules/org";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import {
  erpFormInputClassName,
  erpTableThClassName,
  erpTableTdClassName,
} from "@/components/workspace/styles";
import { POLICY_CATEGORIES, type PolicyCategory, type PolicyRuleDefinition } from "../types/policy-matrix.types";
import { RuleDefinitionDrawer } from "./RuleDefinitionDrawer";

export function RuleDefinitionsManager() {
  const [rules, setRules] = useState<PolicyRuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | "ALL">("ALL");
  const [selectedScope, setSelectedScope] = useState<"ALL" | "TENANT" | "COMPANY" | "PROJECT">("ALL");

  const [companyId, setCompanyId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [companiesList, setCompaniesList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PolicyRuleDefinition | null>(null);

  // Load companies
  useEffect(() => {
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  // Load projects when company changes
  useEffect(() => {
    orgApi.project.getAll(companyId || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [companyId]);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await policyApi.definitions.list({
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        companyId: companyId || undefined,
        projectId: projectId || undefined,
      });

      const list: PolicyRuleDefinition[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray((res?.data as any)?.items)
          ? (res.data as any).items
          : [];

      setRules(list);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load database rule definitions."), "Rules Engine");
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, companyId, projectId]);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const handleDeleteRule = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to deactivate/delete rule '${label}' from the database?`)) {
      return;
    }

    try {
      await policyApi.definitions.delete(id);
      notifySuccess(`Rule '${label}' removed from active database rules.`, "Rule Deleted");
      await fetchRules();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete rule definition."), "Delete Error");
    }
  };

  const handleOpenCreate = () => {
    setEditingRule(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (rule: PolicyRuleDefinition) => {
    setEditingRule(rule);
    setDrawerOpen(true);
  };

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // Scope filter
      if (selectedScope === "TENANT" && (r.companyId || r.projectId)) return false;
      if (selectedScope === "COMPANY" && (!r.companyId || r.projectId)) return false;
      if (selectedScope === "PROJECT" && !r.projectId) return false;

      // Category filter
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = r.policyCode?.toLowerCase().includes(q);
        const matchKey = r.fieldKey?.toLowerCase().includes(q);
        const matchLabel = r.fieldLabel?.toLowerCase().includes(q);
        const matchSection = r.section?.toLowerCase().includes(q);
        if (!matchCode && !matchKey && !matchLabel && !matchSection) return false;
      }

      return true;
    });
  }, [rules, selectedScope, selectedCategory, searchQuery]);

  // Scope counts
  const tenantBaselineCount = rules.filter((r) => !r.companyId && !r.projectId).length;
  const companyOverrideCount = rules.filter((r) => r.companyId && !r.projectId).length;
  const projectOverrideCount = rules.filter((r) => !!r.projectId).length;

  const companyMap = useMemo(() => new Map(companiesList.map((c) => [c.id, c.name])), [companiesList]);
  const projectMap = useMemo(() => new Map(projectsList.map((p) => [p.id, p.name])), [projectsList]);

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rules in DB</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{rules.length}</div>
          <p className="mt-1 text-xs text-slate-500">Universal rules stored in dbo.PolicyRuleDefinitions</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Tenant Baseline</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">{tenantBaselineCount}</div>
          <p className="mt-1 text-xs text-emerald-700">Global fallback rules across all entities</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Company Overrides</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-900">{companyOverrideCount}</div>
          <p className="mt-1 text-xs text-blue-700">Custom statutory ratios per subsidiary</p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Project Overrides</span>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-900">{projectOverrideCount}</div>
          <p className="mt-1 text-xs text-purple-700">Site-specific allowances & parameters</p>
        </div>
      </div>

      {/* Control Bar & Scope Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Scope Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Scope:
            </span>
            {(
              [
                { id: "ALL", label: "All Rules" },
                { id: "TENANT", label: "Tenant Baseline Only" },
                { id: "COMPANY", label: "Company Overrides" },
                { id: "PROJECT", label: "Project Overrides" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedScope(s.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedScope === s.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <ErpRefreshButton onClick={() => void fetchRules()} loading={loading} />
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Rule Definition
            </button>
          </div>
        </div>

        {/* Search & Scope Dropdowns */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule code, label, key..."
                className={`${erpFormInputClassName} pl-9 text-xs`}
              />
            </div>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className={`${erpFormInputClassName} text-xs`}
            >
              <option value="ALL">All Categories (14 Categories)</option>
              {POLICY_CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setProjectId("");
              }}
              className={`${erpFormInputClassName} text-xs`}
            >
              <option value="">Filter by Company (All)</option>
              {companiesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`${erpFormInputClassName} text-xs`}
            >
              <option value="">Filter by Project / Site (All)</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rules Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className={erpTableThClassName}>Rule Identity</th>
                <th className={erpTableThClassName}>Field Label & Section</th>
                <th className={erpTableThClassName}>Scope Override</th>
                <th className={erpTableThClassName}>Type & Unit</th>
                <th className={erpTableThClassName}>Default Value</th>
                <th className={erpTableThClassName}>Validation Limits</th>
                <th className={erpTableThClassName}>Status</th>
                <th className={`${erpTableThClassName} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      Loading active policy rules from database...
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No database rule definitions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const hasCompany = !!rule.companyId;
                  const hasProject = !!rule.projectId;

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Rule Identity */}
                      <td className={erpTableTdClassName}>
                        <div className="font-mono text-xs font-bold text-slate-900">{rule.policyCode}</div>
                        <div className="font-mono text-[11px] text-slate-500">{rule.fieldKey}</div>
                        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          {rule.category}
                        </span>
                      </td>

                      {/* Field Label & Section */}
                      <td className={erpTableTdClassName}>
                        <div className="text-xs font-semibold text-slate-900">{rule.fieldLabel}</div>
                        <div className="text-[11px] text-slate-500">{rule.section || "General"}</div>
                        {rule.helpText && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 italic">
                            <HelpCircle className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{rule.helpText}</span>
                          </div>
                        )}
                      </td>

                      {/* Scope Override */}
                      <td className={erpTableTdClassName}>
                        {hasProject ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                            <Briefcase className="h-3 w-3" />
                            {projectMap.get(rule.projectId!) || "Site Override"}
                          </span>
                        ) : hasCompany ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                            <Building2 className="h-3 w-3" />
                            {companyMap.get(rule.companyId!) || "Company Override"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Tenant Baseline
                          </span>
                        )}
                      </td>

                      {/* Type & Unit */}
                      <td className={erpTableTdClassName}>
                        <div className="text-xs font-medium text-slate-700 capitalize">{rule.fieldType}</div>
                        {rule.unit && (
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {rule.unit}
                          </span>
                        )}
                      </td>

                      {/* Default Value */}
                      <td className={erpTableTdClassName}>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {rule.defaultValue || "—"}
                        </span>
                      </td>

                      {/* Validation Limits */}
                      <td className={erpTableTdClassName}>
                        {rule.minValue !== undefined || rule.maxValue !== undefined ? (
                          <div className="text-xs text-slate-700">
                            <span className="font-mono">{rule.minValue ?? "—"}</span> to{" "}
                            <span className="font-mono">{rule.maxValue ?? "—"}</span>
                            {rule.step && rule.step !== 1 && (
                              <span className="text-[10px] text-slate-400 block">step: {rule.step}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unbounded</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className={erpTableTdClassName}>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            rule.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {rule.status === "Active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={`${erpTableTdClassName} text-right`}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(rule)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            title="Edit Database Rule Definition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => rule.id && handleDeleteRule(rule.id, rule.fieldLabel || rule.policyCode)}
                            className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete / Deactivate Rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Drawer */}
      <RuleDefinitionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        rule={editingRule}
        onSaved={() => void fetchRules()}
      />
    </div>
  );
}
