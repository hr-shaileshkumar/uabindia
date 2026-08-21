"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Users, ShieldCheck, Award, Building2 } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { Badge } from "@/components/ui/badge";
import { useOrgContext } from "@/context/OrgContext";
import { useOrgStructureList } from "@/features/platform/hooks/useOrgStructure";
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

  const kpis: KpiMetricItem[] = [
    { label: "Employees", value: employees.length, tone: "info", icon: <Users className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Departments", value: deptRows.length, tone: "positive", icon: <Award className="h-3.5 w-3.5" />, subtext: "Org structure" },
    { label: "Designations", value: desigRows.length, tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Roles" },
    { label: "Branches", value: branchRows.length, tone: "warning", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Locations" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Visual Organization Chart & Reporting Hierarchy"
      subtitle="Live hierarchy from departments, designations, and employees for the selected company."
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
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">{loadError}</p>
      ) : null}

      <div className="p-6 space-y-6">
        <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 max-w-xl mx-auto shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-600" />
              {companyName || "Company"}
            </span>
            <Badge className="bg-slate-900 text-white font-mono text-[10px]">Root</Badge>
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Legal entity</p>
          <p className="text-xs text-slate-500">
            {deptRows.length} departments · {employees.length} employees
            {!companyId ? " · select a company in /context for a tighter view" : ""}
          </p>
        </div>

        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mx-auto" />

        {deptRows.length === 0 && !isLoading ? (
          <div className="mx-auto max-w-lg rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No departments yet. Create them under{" "}
            <Link href="/platform/departments" className="font-semibold text-slate-800 underline">
              Departments
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {deptRows.map((dept) => {
              const members =
                byDepartment.get(dept.id) ??
                employees.filter((e) => (e.departmentName || "").toLowerCase() === dept.name.toLowerCase());
              return (
                <div key={dept.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{dept.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {dept.code}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{members.length} people</p>
                  <ul className="space-y-1">
                    {members.slice(0, 5).map((emp) => (
                      <li key={emp.id} className="text-xs text-slate-700">
                        {employeeName(emp)}
                        {emp.designationName ? <span className="text-slate-400"> · {emp.designationName}</span> : null}
                      </li>
                    ))}
                    {members.length > 5 ? (
                      <li className="text-[11px] text-slate-400">+{members.length - 5} more</li>
                    ) : null}
                    {members.length === 0 ? <li className="text-[11px] text-slate-400">No employees mapped</li> : null}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {branchRows.length > 0 ? (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Branches</p>
            <div className="flex flex-wrap gap-2">
              {branchRows.map((b) => (
                <Badge key={b.id} variant="outline" className="text-xs">
                  {b.name}
                  {b.city ? ` · ${b.city}` : ""}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {desigRows.length > 0 ? (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Designations</p>
            <div className="flex flex-wrap gap-2">
              {desigRows.map((d) => (
                <Badge key={d.id} variant="outline" className="text-xs">
                  {d.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PlatformGlobalPageShell>
  );
}
