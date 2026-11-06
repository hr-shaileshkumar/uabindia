"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNormalizedRoleSet } from "@/lib/auth/role-utils";
import { SuperAdminDashboard } from "@/features/dashboard/components/SuperAdminDashboard";
import { EmployeeDashboard } from "@/features/dashboard/components/EmployeeDashboard";
import { GlobalExecutiveDashboard } from "@/features/dashboard/components/GlobalExecutiveDashboard";
import { ModuleDashboardsHub } from "@/features/dashboard/components/ModuleDashboardsHub";
import { Globe2, UserCheck, LayoutDashboard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Unified Enterprise Adaptive Dashboard Engine
 * 
 * Centralized command center:
 * - Module Dashboards Hub (Primary showcase of all module dashboard launch buttons)
 * - Platform SaaS Telemetry (SuperAdmin cluster & tenant operations)
 * - Executive BI Center (Cross-region corporate metrics)
 * - My Self-Service / ESS (Workforce attendance & punch clock)
 */
export default function UnifiedEnterpriseDashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [lens, setLens] = useState<"modules" | "platform" | "executive" | "personal">("modules");
  const userRoleSet = getNormalizedRoleSet([...(user?.roles || []), user?.role]);

  // Individual Employee / ESS Persona (without administrative roles) -> Direct to Personal Workforce Portal
  const isEmployeeOnly =
    (userRoleSet.has("employee") || userRoleSet.has("ess")) &&
    !userRoleSet.has("admin") &&
    !userRoleSet.has("superadmin") &&
    !userRoleSet.has("manager") &&
    !userRoleSet.has("tenant_owner");

  if (isEmployeeOnly && lens === "personal") {
    return <EmployeeDashboard />;
  }

  return (
    <div className="space-y-3.5">
      {/* Universal Dashboard Lens Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="text-xs text-slate-500 font-medium">
          Enterprise Command Center • Active Role:{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {user?.role || "Administrator"}
          </span>
        </div>

        <div className="inline-flex rounded-xl bg-slate-200/75 p-1 text-xs font-semibold dark:bg-slate-800 sm:ml-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setLens("modules")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all shrink-0",
              lens === "modules"
                ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>All Module Dashboards</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setLens("platform")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all shrink-0",
                lens === "platform"
                  ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Platform SaaS Telemetry</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setLens("executive")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all shrink-0",
              lens === "executive"
                ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            )}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>Executive &amp; BI Center</span>
          </button>

          <button
            type="button"
            onClick={() => setLens("personal")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all shrink-0",
              lens === "personal"
                ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>My Self-Service (ESS)</span>
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {lens === "modules" ? (
        <ModuleDashboardsHub
          isSuperAdmin={Boolean(isSuperAdmin)}
          onSwitchToTelemetry={() => setLens("platform")}
        />
      ) : lens === "platform" ? (
        <SuperAdminDashboard onSwitchToModules={() => setLens("modules")} />
      ) : lens === "executive" ? (
        <GlobalExecutiveDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
