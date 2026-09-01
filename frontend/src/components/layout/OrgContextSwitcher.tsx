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
    "inline-flex h-8 max-w-[7.5rem] sm:max-w-[9rem] lg:max-w-[11rem] items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium outline-none transition",
    "focus-visible:ring-2 focus-visible:ring-blue-500",
    active
      ? "border-slate-200 bg-slate-50 text-slate-800 hover:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
  );

const itemClass = (selected: boolean) =>
  cn(
    "cursor-pointer text-xs",
    selected
      ? "bg-slate-50 font-semibold text-slate-900 dark:bg-slate-800 dark:text-blue-400"
      : "text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
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
  useEffect(() => {
    financialYearKeyRef.current = financialYearKey;
  }, [financialYearKey]);

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
      const rawList =
        (response.data as { companies?: any[] })?.companies ||
        (response.data as { data?: any[] })?.data ||
        (Array.isArray(response.data) ? response.data : []);
      const list: CompanyOption[] = Array.isArray(rawList)
        ? rawList.map((c: any, idx: number) => ({
            id: String(c.id || c._id || c.code || `company-${idx}`),
            name: String(c.name || c.company_name || c.title || `Company ${idx + 1}`),
          }))
        : [];
      setCompanies(list);
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
      const rawList =
        (response.data as { projects?: any[] })?.projects ||
        (response.data as { data?: any[] })?.data ||
        (Array.isArray(response.data) ? response.data : []);
      const list: ProjectOption[] = Array.isArray(rawList)
        ? rawList.map((p: any, idx: number) => ({
            id: String(p.id || p._id || p.code || `project-${idx}`),
            name: String(p.name || p.project_name || p.title || `Project ${idx + 1}`),
            companyId: p.companyId || p.company_id || undefined,
          }))
        : [];
      setProjects(list);
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
      const payload = response.data as any;
      const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.financialYears)
          ? payload.financialYears
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
      const list: FinancialYear[] = Array.isArray(rawList)
        ? rawList.map((year: any, idx: number) => ({
            key: String(year.key || year.id || year._id || `fy-${idx}`),
            label: String(year.label || year.name || year.year || year.title || `FY ${idx + 1}`),
            isCurrent: Boolean(year.isCurrent || year.is_current || year.current),
            startDate: year.startDate || year.start_date || "",
            endDate: year.endDate || year.end_date || "",
          }))
        : [];
      setFinancialYears(list);
      if (!financialYearKeyRef.current && list.length > 0) {
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
        <DropdownMenuContent align="start" className="z-[80] max-h-80 w-72 overflow-y-auto p-1 scrollbar-thin">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-slate-500">Loading…</div>
          ) : companies.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-slate-500">No companies available.</div>
          ) : (
            companies.map((company, index) => (
              <DropdownMenuItem
                key={company.id ? `comp-${company.id}` : `comp-idx-${index}`}
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
        <DropdownMenuContent align="start" className="z-[80] max-h-80 w-72 overflow-y-auto p-1 scrollbar-thin">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-slate-500">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-slate-500">
              {companyId ? "No projects for this company." : "No projects available."}
            </div>
          ) : (
            projects.map((project, index) => (
              <DropdownMenuItem
                key={project.id ? `proj-${project.id}` : `proj-idx-${index}`}
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
        <DropdownMenuContent align="end" className="z-[80] max-h-80 w-72 overflow-y-auto p-1 scrollbar-thin">
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-slate-500">Loading…</div>
          ) : financialYears.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-slate-500">No financial years configured.</div>
          ) : (
            financialYears.map((year, index) => (
              <DropdownMenuItem
                key={year.key ? `fy-${year.key}` : `fy-idx-${index}`}
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
