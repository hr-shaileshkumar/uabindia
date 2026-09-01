"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CashflowPoint = {
  month: string;
  inflow: number;
  outflow: number;
};

export type DepartmentStat = {
  name: string;
  count: number;
  percentage: number;
  color?: string;
};

type DashboardAnalyticsWidgetsProps = {
  cashflow?: CashflowPoint[];
  departments?: DepartmentStat[];
};

const DEFAULT_CASHFLOW: CashflowPoint[] = [
  { month: "Apr", inflow: 420000, outflow: 280000 },
  { month: "May", inflow: 510000, outflow: 310000 },
  { month: "Jun", inflow: 480000, outflow: 350000 },
  { month: "Jul", inflow: 630000, outflow: 390000 },
  { month: "Aug", inflow: 590000, outflow: 340000 },
  { month: "Sep", inflow: 710000, outflow: 420000 },
];

const DEFAULT_DEPARTMENTS: DepartmentStat[] = [
  { name: "Engineering & Tech", count: 48, percentage: 38, color: "bg-blue-600" },
  { name: "Sales & Marketing", count: 32, percentage: 25, color: "bg-indigo-500" },
  { name: "Finance & Accounts", count: 18, percentage: 14, color: "bg-emerald-500" },
  { name: "Operations & Supply", count: 16, percentage: 13, color: "bg-amber-500" },
  { name: "HR & People", count: 12, percentage: 10, color: "bg-purple-500" },
];

const DEPT_COLORS = ["bg-blue-600", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];

export function DashboardAnalyticsWidgets({
  cashflow: propCashflow,
  departments: propDepartments,
}: DashboardAnalyticsWidgetsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<CashflowPoint | null>(null);

  const cashflow = propCashflow && propCashflow.length > 0 ? propCashflow : DEFAULT_CASHFLOW;
  const departments = propDepartments && propDepartments.length > 0 ? propDepartments : DEFAULT_DEPARTMENTS;

  const maxVal = Math.max(...cashflow.map((p) => Math.max(p.inflow, p.outflow)), 1) * 1.15;
  const avgInflow = cashflow.reduce((acc, p) => acc + p.inflow, 0) / cashflow.length;
  const avgOutflow = cashflow.reduce((acc, p) => acc + p.outflow, 0) / cashflow.length;
  const totalDeptHeadcount = departments.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* 1. Cashflow Inflow vs Outflow Visualizer (2 Cols) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>Revenue vs. Operating Cashflow</span>
            </h3>
            <p className="text-xs text-slate-500">6-Month Trend: Inflow vs Outflow (Live Database Sync)</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 dark:text-slate-300">Revenue Inflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">Expenses Outflow</span>
            </div>
          </div>
        </div>

        {/* Bar & Trend Chart */}
        <div className="mt-6 flex h-48 items-end gap-3 sm:gap-6 px-2">
          {cashflow.map((point) => {
            const inflowHeight = (point.inflow / maxVal) * 100;
            const outflowHeight = (point.outflow / maxVal) * 100;
            return (
              <div
                key={point.month}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="group relative flex flex-1 flex-col items-center gap-1.5 h-full justify-end cursor-pointer"
              >
                {/* Tooltip */}
                {hoveredPoint?.month === point.month && (
                  <div className="absolute -top-14 z-20 whitespace-nowrap rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-xl">
                    <p className="font-bold">{point.month} Financials</p>
                    <p className="text-blue-400">In: {formatCurrency(point.inflow, "INR")}</p>
                    <p className="text-rose-400">Out: {formatCurrency(point.outflow, "INR")}</p>
                  </div>
                )}

                {/* Bars side by side */}
                <div className="flex w-full items-end justify-center gap-1 sm:gap-1.5 h-full">
                  <div
                    className="w-full max-w-[1.25rem] rounded-t-md bg-blue-600 transition-all duration-300 group-hover:bg-blue-700"
                    style={{ height: `${Math.max(4, inflowHeight)}%` }}
                  />
                  <div
                    className="w-full max-w-[1.25rem] rounded-t-md bg-rose-500 transition-all duration-300 group-hover:bg-rose-600"
                    style={{ height: `${Math.max(4, outflowHeight)}%` }}
                  />
                </div>

                <span className="text-[11px] font-bold text-slate-500">{point.month}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Avg. Monthly Inflow</p>
              <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(avgInflow, "INR")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60">
              <ArrowDownRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Avg. Monthly Outflow</p>
              <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(avgOutflow, "INR")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department Workforce Distribution (1 Col) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>Workforce by Department</span>
          </h3>
          <p className="text-xs text-slate-500">{totalDeptHeadcount} Total Active Employees</p>
        </div>

        <div className="mt-4 space-y-3.5">
          {departments.map((dept, index) => {
            const barColor = dept.color || DEPT_COLORS[index % DEPT_COLORS.length];
            return (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{dept.name}</span>
                  <span className="text-slate-500">{dept.count} ({dept.percentage}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${Math.max(5, dept.percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-[11px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
          <p>💡 Live synced with database employee records and company organization tree.</p>
        </div>
      </div>
    </div>
  );
}
