"use client";

import React, { useState } from "react";
import { RolePermissionMatrix } from "@/features/administration/components/RolePermissionMatrix";
import { UserPermissionManager } from "@/features/administration/components/UserPermissionManager";
import { ShieldCheck, Users, Sliders, Shield } from "lucide-react";

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Access Control & Permissions Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure role-based access policies and fine-grained individual user permission overrides.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "roles"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Role Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>User Overrides</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeTab === "roles" ? <RolePermissionMatrix /> : <UserPermissionManager />}
    </div>
  );
}