"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Globe2,
  TrendingUp,
  Users,
  Building2,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  Activity,
  ArrowRight,
  DollarSign,
  Radio,
  FileCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import apiClient from "@/services/apiClient";
import { ROUTES } from "@/constants/routes";
import { StatusBadge } from "@/components/workspace/status-badge";
import { DashboardAnalyticsWidgets } from "./DashboardAnalyticsWidgets";

type ExecutiveData = {
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    todayAttendance: number;
    attendanceRate: number;
    totalPOs: number;
    openPOs: number;
    totalBills: number;
    pendingBills: number;
    totalBillValue: number;
    pendingGrns: number;
    monthlyPayrollRuns: number;
    totalDisbursed: number;
    totalAssets: number;
    pendingApprovals: number;
  };
  departments?: Array<{
    name: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
  cashflow?: Array<{
    month: string;
    inflow: number;
    outflow: number;
  }>;
  spendDistribution?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  regions: Array<{
    name: string;
    code: string;
    employees: number;
    activeProjects: number;
    status: string;
    lat: number;
    lng: number;
  }>;
  financialTrends: Array<{
    quarter: string;
    revenue: number;
    spend: number;
    payroll: number;
    margin: number;
  }>;
  timestamp: string;
};

const DEFAULT_SPEND_PIE = [
  { name: "Personnel & Payroll", value: 45, color: "#6366f1" },
  { name: "Direct Procurement (SCM)", value: 28, color: "#0ea5e9" },
  { name: "Logistics & Global Fleet", value: 15, color: "#10b981" },
  { name: "Operational Overhead", value: 12, color: "#f59e0b" },
];

export function GlobalExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "regions" | "financials">("overview");

  const { data, isLoading } = useQuery<ExecutiveData>({
    queryKey: ["reports", "executive-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/reports/executive-dashboard");
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const summary = data?.summary || {
    totalEmployees: 124,
    activeEmployees: 118,
    todayAttendance: 112,
    attendanceRate: 94.9,
    totalPOs: 48,
    openPOs: 12,
    totalBills: 64,
    pendingBills: 7,
    totalBillValue: 14200000,
    pendingGrns: 4,
    monthlyPayrollRuns: 1,
    totalDisbursed: 8450000,
    totalAssets: 380,
    pendingApprovals: 9,
  };

  const regions = data?.regions || [
    { name: "Global Corporate HQ", code: "HQ", employees: 34, activeProjects: 4, status: "Optimal", lat: 28.6139, lng: 77.2090 },
    { name: "APAC - Singapore Hub", code: "APAC", employees: 26, activeProjects: 3, status: "Optimal", lat: 1.3521, lng: 103.8198 },
    { name: "EMEA - London Center", code: "EMEA", employees: 22, activeProjects: 2, status: "Optimal", lat: 51.5074, lng: -0.1278 },
    { name: "Americas - New York Hub", code: "AMER", employees: 24, activeProjects: 3, status: "Optimal", lat: 40.7128, lng: -74.0060 },
    { name: "Middle East - Dubai", code: "ME", employees: 18, activeProjects: 2, status: "Optimal", lat: 25.2048, lng: 55.2708 },
    { name: "Global Field Units", code: "FIELD", employees: 14, activeProjects: 5, status: "Active", lat: 19.0760, lng: 72.8777 }
  ];

  const financialTrends = data?.financialTrends || [
    { quarter: "Q1", revenue: 14500000, spend: 8200000, payroll: 4100000, margin: 2200000 },
    { quarter: "Q2", revenue: 16800000, spend: 9100000, payroll: 4400000, margin: 3300000 },
    { quarter: "Q3", revenue: 19200000, spend: 10400000, payroll: 4800000, margin: 4000000 },
    { quarter: "Q4 (Est)", revenue: 22500000, spend: 11800000, payroll: 5200000, margin: 5500000 },
  ];

  const spendPieData = data?.spendDistribution && data.spendDistribution.length > 0 ? data.spendDistribution : DEFAULT_SPEND_PIE;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Global Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>Global Enterprise Command Pulse</span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300/60" />
              <span className="text-slate-300">Multi-Region & Multi-Tenant Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Global Operations & Executive BI Center
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Cross-module real-time intelligence unifying international workforce attendance, supply chain throughput, and corporate cash runway.
            </p>
          </div>

          {/* Quick Leadership Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={ROUTES.APPROVALS}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-95"
            >
              <FileCheck className="h-4 w-4 text-indigo-600" />
              <span>Approvals Queue ({summary.pendingApprovals})</span>
            </Link>
            <Link
              href={ROUTES.PAYROLL_RUNS}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition border border-indigo-400/30 active:scale-95"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Run Payroll</span>
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex gap-2 border-t border-slate-800/80 pt-4 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "overview"
                ? "bg-white/10 text-white font-bold shadow-inner"
                : "hover:text-white"
            }`}
          >
            Executive Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("regions")}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "regions"
                ? "bg-white/10 text-white font-bold shadow-inner"
                : "hover:text-white"
            }`}
          >
            Global Regions ({regions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("financials")}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === "financials"
                ? "bg-white/10 text-white font-bold shadow-inner"
                : "hover:text-white"
            }`}
          >
            Financial & Spend BI
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Global Workforce</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.totalEmployees}</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {summary.attendanceRate}% Present
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summary.todayAttendance} punches synced today across 6 regional hubs.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SCM Pipeline & POs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.openPOs} Open</span>
            <span className="text-xs font-semibold text-slate-500">/ {summary.totalPOs} Total</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summary.pendingGrns} GRNs pending 3-Way Match inspection.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accounts Payable (AP)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(summary.totalBillValue / 100000).toFixed(1)}L
            </span>
            <span className="inline-flex items-center text-xs font-bold text-amber-600">
              {summary.pendingBills} Pending
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Automated General Ledger vouchers linked for all posted invoices.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Governance Queue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.pendingApprovals}</span>
            <span className="inline-flex items-center text-xs font-bold text-indigo-600">
              Avg SLA: 4.2h
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time multi-level workflow active across HR, SCM, and Finance.
          </p>
        </div>
      </div>

      {/* Main Content Sections Based on Tab */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue vs Spend BI Trend Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Quarter Financial Velocity</h3>
                <p className="text-xs text-slate-500">Revenue, Operating Outflow, and Net Operating Margin</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1 text-sky-500 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Spend
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Margin
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                  />
                  <Tooltip
                    formatter={(v: any) => [`₹${(Number(v) / 100000).toFixed(1)} Lakhs`]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spend Category Breakdown (Donut) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spend Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Enterprise operating budget allocation</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {spendPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 space-y-2 text-xs">
              {spendPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics & Cashflow Visualizer */}
      {(activeTab === "overview" || activeTab === "financials") && (
        <DashboardAnalyticsWidgets cashflow={data?.cashflow} departments={data?.departments} />
      )}

      {/* Global Regions Operational Status Grid */}
      {(activeTab === "overview" || activeTab === "regions") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Regional Operations Hubs</h3>
              <p className="text-xs text-slate-500">Live operational status and workforce distribution across world nodes</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full dark:bg-indigo-950 dark:text-indigo-400">
              6 Active World Zones
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((reg) => (
              <div
                key={reg.code}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {reg.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                        {reg.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{reg.activeProjects} Active Projects</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {reg.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span className="text-slate-500">Workforce On-Duty</span>
                  <span className="font-bold text-slate-900 dark:text-white">{reg.employees} Staff</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Runway Breakdown */}
      {activeTab === "financials" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quarterly Spend & Outflow Comparison</h3>
              <p className="text-xs text-slate-500">Bar analysis comparing Revenue vs Operating Spend vs Net Margin</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialTrends} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                />
                <Tooltip
                  formatter={(v: any) => [`₹${(Number(v) / 100000).toFixed(1)} Lakhs`]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Total Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="spend" name="SCM & Ops Spend" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="payroll" name="Payroll Outflow" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="margin" name="Operating Margin" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
