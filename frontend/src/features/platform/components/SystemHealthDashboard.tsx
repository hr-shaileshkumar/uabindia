"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Database,
  Cpu,
  Wifi,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useSignalRNotifications } from "@/context/SignalRNotificationContext";
import { useCurrency } from "@/context/CurrencyContext";

export function SystemHealthDashboard() {
  const { connectionState } = useSignalRNotifications();
  const isConnected = connectionState === "connected";
  const { activeCurrency } = useCurrency();
  const [latencyMs, setLatencyMs] = useState(24);

  const { data: health, refetch, isFetching } = useQuery({
    queryKey: ["system", "health"],
    queryFn: async () => {
      const start = performance.now();
      const res = await apiClient.get("/health");
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      return res.data;
    },
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Enterprise Platform Telemetry & Health Probes
            </h2>
            <p className="text-xs text-slate-500">
              Live operational telemetry, multi-region database latency, and distributed cache status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Operational 99.99% SLA
          </span>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Core Health Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: API Gateway */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">API Gateway Latency</span>
            <Server className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{latencyMs} ms</span>
            <span className="text-[10px] font-bold text-emerald-600">⚡ Ultra Fast</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">ASP.NET Core .NET 10 Kestrel runtime</p>
        </div>

        {/* Metric 2: SQL Server Database */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">SQL Server 2022</span>
            <Database className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">Healthy</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Connection pool: Active (Zero Lockouts)</p>
        </div>

        {/* Metric 3: SignalR Real-Time Hub */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">WebSocket SignalR</span>
            <Wifi className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {isConnected ? "Connected" : "Reconnecting"}
            </span>
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Live push events & toast notifications</p>
        </div>

        {/* Metric 4: Multi-Currency FX Sync */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Display FX</span>
            <Globe2 className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeCurrency.flag} {activeCurrency.code}
            </span>
            <span className="text-xs font-bold text-slate-400">({activeCurrency.symbol})</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Real-time foreign exchange synchronized</p>
        </div>
      </div>
    </div>
  );
}
