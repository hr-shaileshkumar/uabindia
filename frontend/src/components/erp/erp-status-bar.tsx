"use client";

import * as React from "react";
import { Activity, ShieldCheck, Layers, Cpu, Globe } from "lucide-react";

export type ErpStatusBarProps = {
  tenantName?: string;
  activeModulesCount?: number;
  environment?: "Production" | "Staging" | "Development";
  isConnected?: boolean;
  latencyMs?: number;
};

export function ErpStatusBar({
  tenantName = "UabIndia Enterprise",
  activeModulesCount = 12,
  environment = "Production",
  isConnected = true,
  latencyMs = 24,
}: ErpStatusBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 flex h-7 items-center justify-between border-t border-slate-200/90 bg-white/95 px-4 text-[11px] font-semibold text-slate-600 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-400">
      {/* Left side: System Connection & Environment */}
      <div className="flex items-center gap-4">
        {/* Connection Pulse Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                isConnected ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {isConnected ? "System Synced" : "Disconnected"}
          </span>
        </div>

        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500 border-l border-slate-200 pl-3 dark:border-slate-800">
          <Cpu className="h-3 w-3 text-slate-400" />
          <span>Env: <strong className="text-slate-700 dark:text-slate-300">{environment}</strong></span>
        </div>

        {/* Latency */}
        <div className="hidden md:flex items-center gap-1 text-slate-500 border-l border-slate-200 pl-3 dark:border-slate-800">
          <Activity className="h-3 w-3 text-emerald-500" />
          <span>{latencyMs}ms</span>
        </div>
      </div>

      {/* Right side: Tenant & Modules count */}
      <div className="flex items-center gap-4">
        {/* Active Modules */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500">
          <Layers className="h-3 w-3 text-blue-500" />
          <span>Modules: <strong className="text-slate-700 dark:text-slate-300">{activeModulesCount} Active</strong></span>
        </div>

        {/* Active Tenant Workspace */}
        <div className="flex items-center gap-1 text-slate-500 border-l border-slate-200 pl-3 dark:border-slate-800">
          <Globe className="h-3 w-3 text-indigo-500" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            Tenant: <strong className="text-slate-800 dark:text-slate-200">{tenantName}</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
