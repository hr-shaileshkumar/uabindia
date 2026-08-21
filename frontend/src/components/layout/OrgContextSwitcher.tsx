"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, CalendarRange, ChevronDown, FolderKanban } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { appApi, orgApi } from "@/services/modules";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { cn } from "@/lib/utils";
import type { FinancialYear } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ALL_FINANCIAL_YEARS_KEY = "all";

type CompanyOption = { id: string; name: string };
type ProjectOption = { id: string; name: string; companyId?: string };

const triggerClass = (active: boolean) =>
  cn(
    "inline-flex h-8 max-w-[9.5rem] items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium outline-none transition lg:max-w-[12rem]",
    "focus-visible:ring-2 focus-visible:ring-slate-300",
    active
      ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
  );

const itemClass = (selected: boolean) =>
  cn(
    "cursor-pointer text-xs",
    selected ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-700",
  );

export function OrgContextSwitcher() {
  const { user } = useAuth();
  const {
    companyId,
    companyName,
    projectId,
    projectName,
    financialYearKey,
    financialYearLabel,
    setContext,
    setFinancialYear,
  } = useOrgContext();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFinancialYears, setLoadingFinancialYears] = useState(false);
  const financialYearKeyRef = useRef(financialYearKey);
  financialYearKeyRef.current = financialYearKey;

  const isSuperAdmin = (() => {
    const roles = Array.isArray((user as { roles?: unknown[] } | null)?.roles)
      ? ((user as { roles?: unknown[] }).roles as unknown[])
      : [];
    return [...roles, (user as { role?: unknown } | null)?.role].some((role) => isSuperAdminRole(role));
  })();

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = isSuperAdmin
        ? await orgApi.company.getAllForSuperAdmin()
        : await orgApi.company.getAll(1, 200);
      const list = (response.data as { companies?: CompanyOption[] })?.companies;
      setCompanies(Array.isArray(list) ? list.map((c) => ({ id: c.id, name: c.name })) : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [isSuperAdmin]);

  const loadProjects = useCallback(async (activeCompanyId: string | null) => {
    try {
      setLoadingProjects(true);
      const response = activeCompanyId
        ? await orgApi.project.getByCompany(activeCompanyId)
        : await orgApi.project.getAll();
      const list = (response.data as { projects?: Array<ProjectOption & { companyId?: string }> })?.projects;
      setProjects(
        Array.isArray(list)
          ? list.map((p) => ({ id: p.id, name: p.name, companyId: p.companyId }))
          : [],
      );
    } catch {
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadFinancialYears = useCallback(async () => {
    try {
      setLoadingFinancialYears(true);
      const response = await appApi.system.financialYears();
      const payload = response.data as FinancialYear[] | { financialYears?: FinancialYear[] } | undefined;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.financialYears)
          ? payload.financialYears
          : [];
      setFinancialYears(list);
      if (!financialYearKeyRef.current) {
        const current = list.find((year) => year.isCurrent) ?? list[0];
        if (current) setFinancialYear(current.key, current.label);
      }
    } catch {
      setFinancialYears([]);
    } finally {
      setLoadingFinancialYears(false);
    }
  }, [setFinancialYear]);

  useEffect(() => {
    if (!user) return;
    void loadCompanies();
    void loadFinancialYears();
  }, [user, loadCompanies, loadFinancialYears]);

  useEffect(() => {
    void loadProjects(companyId);
  }, [companyId, loadProjects]);

  const companyLabel = companyId
    ? companyName || companies.find((c) => c.id === companyId)?.name || "Select company"
    : "All companies";
  const projectLabel = projectId
    ? projectName || projects.find((p) => p.id === projectId)?.name || "Select project"
    : "All projects";
  const isAllDates = !financialYearKey || financialYearKey === ALL_FINANCIAL_YEARS_KEY;
  const fyLabel = isAllDates
    ? "All dates"
    : financialYearLabel || financialYears.find((year) => year.key === financialYearKey)?.label || "All dates";

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <DropdownMenu
        onOpenChange={(nextOpen) => {
          if (nextOpen) void loadCompanies();
        }}
      >
        <DropdownMenuTrigger asChild>
          <button type="button" className={triggerClass(Boolean(companyId))} title="Switch company">
            <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate">{companyLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[80] max-h-80 w-72 overflow-y-auto p-1">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Company
          </DropdownMenuLabel>
          <DropdownMenuItem
            className={itemClass(!companyId)}
            onSelect={() => setContext({ companyId: null, companyName: null, projectId: null, projectName: null })}
          >
            All companies
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loadingCompanies ? (
            <div className="px-2 py-3 text-xs text-slate-400">Loading…</div>
          ) : companies.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400">No companies available.</div>
          ) : (
            companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                className={itemClass(company.id === companyId)}
                onSelect={() =>
                  setContext({
                    companyId: company.id,
                    companyName: company.name,
                    projectId: null,
                    projectName: null,
                  })
                }
              >
                {company.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu
        onOpenChange={(nextOpen) => {
          if (nextOpen) void loadProjects(companyId);
        }}
      >
        <DropdownMenuTrigger asChild>
          <button type="button" className={triggerClass(Boolean(projectId))} title="Switch project">
            <FolderKanban className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate">{projectLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[80] max-h-80 w-72 overflow-y-auto p-1">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Project
          </DropdownMenuLabel>
          <DropdownMenuItem
            className={itemClass(!projectId)}
            onSelect={() => setContext({ projectId: null, projectName: null })}
          >
            All projects
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loadingProjects ? (
            <div className="px-2 py-3 text-xs text-slate-400">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400">
              {companyId ? "No projects for this company." : "No projects available."}
            </div>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                className={itemClass(project.id === projectId)}
                onSelect={() => {
                  const nextCompanyId = companyId || project.companyId || null;
                  const nextCompanyName = nextCompanyId
                    ? companyName || companies.find((c) => c.id === nextCompanyId)?.name || null
                    : null;
                  setContext({
                    companyId: nextCompanyId,
                    companyName: nextCompanyName,
                    projectId: project.id,
                    projectName: project.name,
                  });
                }}
              >
                {project.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu
        onOpenChange={(nextOpen) => {
          if (nextOpen) void loadFinancialYears();
        }}
      >
        <DropdownMenuTrigger asChild>
          <button type="button" className={triggerClass(!isAllDates)} title="Financial year">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate">{fyLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[80] max-h-80 w-72 overflow-y-auto p-1">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Date range
          </DropdownMenuLabel>
          <DropdownMenuItem
            className={itemClass(isAllDates)}
            onSelect={() => setFinancialYear(ALL_FINANCIAL_YEARS_KEY, "All dates")}
          >
            All dates
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loadingFinancialYears ? (
            <div className="px-2 py-3 text-xs text-slate-400">Loading…</div>
          ) : financialYears.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400">No financial years configured.</div>
          ) : (
            financialYears.map((year) => (
              <DropdownMenuItem
                key={year.key}
                className={itemClass(year.key === financialYearKey)}
                onSelect={() => setFinancialYear(year.key, year.label)}
              >
                <span className="flex flex-col">
                  <span>{year.label}</span>
                  {year.isCurrent ? <span className="text-[10px] font-medium text-slate-400">Current</span> : null}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
