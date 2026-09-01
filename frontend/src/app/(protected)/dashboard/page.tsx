"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { SuperAdminDashboard } from "@/features/dashboard/components/SuperAdminDashboard";
import { EmployeeDashboard } from "@/features/dashboard/components/EmployeeDashboard";
import { GlobalExecutiveDashboard } from "@/features/dashboard/components/GlobalExecutiveDashboard";
import { Globe2, UserCheck } from "lucide-react";

/**
 * Unified Enterprise Adaptive Dashboard Engine
 * 
 * Auto-detects user role and serves the optimal Persona Hub:
 * - SuperAdmin: Multi-Tenant & Subscription Management Hub
 * - Employee / ESS: Personal Workforce & Punch Clock Portal
 * - Admin / Manager / Executive: Executive BI Center with instant toggle to My Self-Service
 */
export default function UnifiedEnterpriseDashboard() {
  const { user } = useAuth();
  const [lens, setLens] = useState<"executive" | "personal">("executive");
  const role = user?.role?.toLowerCase() || "";

  // 1. SuperAdmin Persona -> Direct to Platform Management Hub
  if (isSuperAdminRole(user?.role)) {
    return <SuperAdminDashboard />;
  }

  // 2. Individual Employee / ESS Persona -> Direct to Personal Workforce Portal
  if (role === "employee" || role === "ess") {
    return <EmployeeDashboard />;
  }

  // 3. Manager / Executive / Admin Persona -> Unified Dashboard with Lens Selector
  return (
    <div className="space-y-4">
      {/* Persona Lens Switcher */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Enterprise Command Dashboard • Active Context:{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {user?.role || "Administrator"}
          </span>
        </div>
        <div className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold dark:bg-slate-800 ml-auto">
          <button
            type="button"
            onClick={() => setLens("executive")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              lens === "executive"
                ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>Executive & Operations BI</span>
          </button>
          <button
            type="button"
            onClick={() => setLens("personal")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              lens === "personal"
                ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>My Self-Service (ESS)</span>
          </button>
        </div>
      </div>

      {lens === "executive" ? <GlobalExecutiveDashboard /> : <EmployeeDashboard />}
    </div>
  );
}
