"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Users, ShieldCheck, Award, Building2, ChevronDown, ChevronRight, UserCheck } from "lucide-react";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { Badge } from "@/components/ui/badge";
import { useOrgContext } from "@/context/OrgContext";
import { useOrgStructureList } from "@/features/administration/hooks/useOrgStructure";
import { hrmsApi } from "@/services/modules";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { Employee } from "@/types";

function employeeName(e: Employee) {
  return e.fullName || [e.firstName, e.lastName].filter(Boolean).join(" ") || e.employeeCode || "Employee";
}

export default function OrgChartPage() {
  const { companyId, companyName } = useOrgContext();
  const departments = useOrgStructureList("departments", companyId);
  const designations = useOrgStructureList("designations", companyId);
  const branches = useOrgStructureList("branches", companyId);
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  const employeesQuery = useQuery({
    queryKey: ["org-chart", "employees", companyId ?? "all"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.employees.list(1, 100, { companyId: companyId ?? undefined });
      const list: Employee[] = Array.isArray(data) ? data : Array.isArray(data?.employees) ? data.employees : [];
      return list;
    },
    staleTime: 30_000,
  });

  const employees = employeesQuery.data ?? [];
  const deptRows = departments.data ?? [];
  const desigRows = designations.data ?? [];
  const branchRows = branches.data ?? [];

  const byDepartment = useMemo(() => {
    const map = new Map<string, Employee[]>();
    for (const emp of employees) {
      const key = emp.departmentId || emp.departmentName || "_unassigned";
      const list = map.get(key) ?? [];
      list.push(emp);
      map.set(key, list);
    }
    return map;
  }, [employees]);

  const isLoading = departments.isLoading || employeesQuery.isLoading;
  const loadError = departments.isError
    ? getApiErrorMessage(departments.error, "Failed to load organization.")
    : employeesQuery.isError
      ? getApiErrorMessage(employeesQuery.error, "Failed to load employees.")
      : null;

  const toggleDept = (deptId: string) => {
    setCollapsedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const kpis: KpiMetricItem[] = [
    { label: "Employees", value: employees.length, tone: "info", icon: <Users className="h-3.5 w-3.5" />, subtext: "Active headcount" },
    { label: "Departments", value: deptRows.length, tone: "positive", icon: <Award className="h-3.5 w-3.5" />, subtext: "Org structure" },
    { label: "Designations", value: desigRows.length, tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Roles" },
    { label: "Branches", value: branchRows.length, tone: "warning", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Locations" },
  ];

  return (
    <AdministrationGlobalPageShell
      title="Visual Organization Tree & Hierarchy"
      subtitle="Interactive tree architecture mapping legal entity to departments, designations, and employee nodes."
      categoryTag="Organization Architecture"
      kpiMetrics={kpis}
      onRefresh={() => {
        void departments.refetch();
        void designations.refetch();
        void branches.refetch();
        void employeesQuery.refetch();
      }}
      isLoading={isLoading}
    >
      {loadError ? (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-slate-200">{loadError}</p>
      ) : null}

      <div className="p-6 space-y-8">
        {/* Level 1: Root Entity Card */}
        <div className="relative mx-auto max-w-md rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/80 to-white p-5 text-center shadow-md">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">{companyName || "Organization Root"}</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Parent Entity Node</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-white text-[10px] font-mono">
              {deptRows.length} Departments
            </Badge>
            <Badge variant="outline" className="bg-white text-[10px] font-mono">
              {employees.length} Employees
            </Badge>
          </div>

          {/* Connector Line */}
          <div className="absolute -bottom-8 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-slate-300" />
        </div>

        {/* Level 2: Horizontal Branch Header */}
        <div className="pt-2">
          {deptRows.length === 0 && !isLoading ? (
            <div className="mx-auto max-w-lg rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No departments defined yet. Create them under{" "}
              <Link href="/platform/departments" className="font-semibold text-slate-800 underline">
                Departments Manager
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {deptRows.map((dept) => {
                const members =
                  byDepartment.get(dept.id) ??
                  employees.filter((e) => (e.departmentName || "").toLowerCase() === dept.name.toLowerCase());
                const isCollapsed = Boolean(collapsedDepts[dept.id]);

                return (
                  <div
                    key={dept.id}
                    className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    {/* Top Connector Line */}
                    <div className="absolute -top-6 left-1/2 h-6 w-0.5 -translate-x-1/2 bg-slate-200" />

                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                          {dept.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">{dept.name}</h3>
                          <p className="text-[11px] text-slate-500">{members.length} members</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDept(dept.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white"
                      >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {!isCollapsed ? (
                      <div className="mt-3 space-y-2">
                        {members.length === 0 ? (
                          <p className="py-2 text-center text-xs text-slate-400">No employees assigned</p>
                        ) : (
                          members.map((emp) => (
                            <div
                              key={emp.id}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:bg-blue-50/40"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                  {employeeName(emp).slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-900">{employeeName(emp)}</p>
                                  <p className="truncate text-[10px] text-slate-500">{emp.designationName || "Team Member"}</p>
                                </div>
                              </div>
                              <UserCheck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Level 3: Summary Metadata Badges */}
        <div className="grid gap-4 md:grid-cols-2">
          {branchRows.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Branch Locations</p>
              <div className="flex flex-wrap gap-2">
                {branchRows.map((b) => (
                  <Badge key={b.id} variant="outline" className="bg-slate-50 text-xs">
                    {b.name}
                    {b.city ? ` · ${b.city}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {desigRows.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Role Designations</p>
              <div className="flex flex-wrap gap-2">
                {desigRows.map((d) => (
                  <Badge key={d.id} variant="outline" className="bg-slate-50 text-xs">
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdministrationGlobalPageShell>
  );
}
