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

const DEPT_COLORS = ["bg-blue-600", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];

export function DashboardAnalyticsWidgets({
  cashflow: propCashflow,
  departments: propDepartments,
}: DashboardAnalyticsWidgetsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<CashflowPoint | null>(null);

  const cashflow = propCashflow && propCashflow.length > 0 ? propCashflow : [];
  const departments = propDepartments && propDepartments.length > 0 ? propDepartments : [];

  const maxVal = cashflow.length > 0 ? Math.max(...cashflow.map((p) => Math.max(p.inflow, p.outflow)), 1) * 1.15 : 1;
  const avgInflow = cashflow.length > 0 ? cashflow.reduce((acc, p) => acc + p.inflow, 0) / cashflow.length : 0;
  const avgOutflow = cashflow.length > 0 ? cashflow.reduce((acc, p) => acc + p.outflow, 0) / cashflow.length : 0;
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
            <p className="text-xs text-slate-500">Inflow vs Outflow Trend (Live Database Sync)</p>
          </div>

          {cashflow.length > 0 && (
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
          )}
        </div>

        {/* Bar & Trend Chart */}
        {cashflow.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400">
            No cashflow transactions recorded for this period.
          </div>
        ) : (
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

                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white">
                    {point.month}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Summary Stats */}
        {cashflow.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Average Inflow:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(avgInflow, "INR")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Average Burn:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(avgOutflow, "INR")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Net Cash Trajectory:</span>
              <span
                className={`font-bold inline-flex items-center gap-0.5 ${
                  avgInflow >= avgOutflow ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {avgInflow >= avgOutflow ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {formatCurrency(Math.abs(avgInflow - avgOutflow), "INR")}/mo
              </span>
            </div>
          </div>
        )}
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

        {departments.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400">
            No department headcount data recorded yet.
          </div>
        ) : (
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
        )}

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-[11px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
          <p>💡 Live synced with database employee records and company organization tree.</p>
        </div>
      </div>
    </div>
  );
}
