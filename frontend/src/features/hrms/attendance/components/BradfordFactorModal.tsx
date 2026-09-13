"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { hrmsApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";

interface BradfordRecord {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  absenceSpells: number;
  totalDaysAbsent: number;
  bradfordScore: number;
  riskCategory: "Low" | "Moderate" | "Significant" | "Severe";
  recommendedAction: string;
}

interface BradfordFactorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BradfordFactorModal({ open, onOpenChange }: BradfordFactorModalProps) {
  const [records, setRecords] = useState<BradfordRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const res = await hrmsApi.hrms.attendance.getBradfordScores();
      if (res?.data?.records) {
        setRecords(res.data.records);
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to calculate Bradford Factor scores.", "Analytics Offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchScores();
    }
  }, [open]);

  const severeCount = records.filter((r) => r.riskCategory === "Severe").length;
  const significantCount = records.filter((r) => r.riskCategory === "Significant").length;
  const moderateCount = records.filter((r) => r.riskCategory === "Moderate").length;
  const lowCount = records.filter((r) => r.riskCategory === "Low").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:rounded-2xl">
        <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Bradford Factor Absenteeism Index (CIPD / SAP)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Formula: Score = (Absence Spells)² × Total Days Absent. Unplanned frequent short absences impact teams more than rare planned leaves.
                </DialogDescription>
              </div>
            </div>
          </div>
          <button
            onClick={() => void fetchScores()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Recalculate
          </button>
        </DialogHeader>

        {/* Risk Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Low Risk (0-50)</div>
            <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">{lowCount}</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Normal attendance</div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase">Moderate (51-125)</div>
            <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">{moderateCount}</div>
            <div className="text-[10px] text-blue-600/80 mt-0.5">Informal check-in</div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Significant (126-400)</div>
            <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">{significantCount}</div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">Written warning review</div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">Severe (401+)</div>
            <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">{severeCount}</div>
            <div className="text-[10px] text-rose-600/80 mt-0.5">Formal disciplinary hearing</div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-3 max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Spells (S)</th>
                <th className="py-2.5 px-3 text-center">Days (D)</th>
                <th className="py-2.5 px-3 text-center">Bradford Score (S² × D)</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Prescribed HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {records.length > 0 ? (
                records.map((rec, idx) => {
                  const badgeColor =
                    rec.riskCategory === "Severe"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : rec.riskCategory === "Significant"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : rec.riskCategory === "Moderate"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {rec.employeeName}
                        <span className="block text-[10px] text-slate-400 font-mono">{rec.employeeCode}</span>
                      </td>
                      <td className="py-2 px-3">{rec.department || "General"}</td>
                      <td className="py-2 px-3 text-center font-mono">{rec.absenceSpells}</td>
                      <td className="py-2 px-3 text-center font-mono">{rec.totalDaysAbsent}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {rec.bradfordScore}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                          {rec.riskCategory}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                        {rec.recommendedAction}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                    No absenteeism spells recorded for active personnel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
