"use client";

import { Layers } from "lucide-react";
import {
  formatTimeOnly,
  getInitials,
  type DailySummaryRow,
} from "../types/attendance.types";

interface AttendanceDailyRegisterTableProps {
  dailySummaryRows: DailySummaryRow[];
}

export function AttendanceDailyRegisterTable({
  dailySummaryRows,
}: AttendanceDailyRegisterTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Daily Staff Attendance Register
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated daily roll-up with net work hours, first check-in, last check-out, and roster status.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {dailySummaryRows.length} Daily Aggregations
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">First In</th>
              <th className="px-4 py-3">Last Out</th>
              <th className="px-4 py-3">Net Duration</th>
              <th className="px-4 py-3">Register Status</th>
              <th className="px-4 py-3">Geofence Compliance</th>
              <th className="px-4 py-3">Avg FRS Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {dailySummaryRows.length > 0 ? (
              dailySummaryRows.map((row) => {
                const isPresent = row.status.includes("Present");
                const isHalfDay = row.status.includes("Half Day");
                const isActive = row.status.includes("Active");

                return (
                  <tr key={row.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white shadow-xs">
                          {getInitials(row.employeeName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{row.employeeName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{row.employeeCode}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {row.dateStr}
                    </td>

                    <td className="px-4 py-3">
                      {row.firstIn ? (
                        <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          {formatTimeOnly(row.firstIn)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No In-Punch</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {row.lastOut ? (
                        <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                          {formatTimeOnly(row.lastOut)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No Out-Punch</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {row.durationStr}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                          isPresent
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isHalfDay
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : isActive
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {row.geoCompliance}% Verified
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.avgFrs}%
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                  No daily attendance roll-up records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
