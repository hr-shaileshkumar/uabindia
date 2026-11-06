"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { hrmsApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { Users, Radio, Building, MapPin, Clock, RefreshCw, Activity } from "lucide-react";

interface Occupant {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  branch: string;
  checkInTime: string;
  source: string;
  deviceId?: string;
}

interface OccupancyData {
  totalInside: number;
  totalCheckedInToday: number;
  currentlyCheckedOut: number;
  departmentDistribution: { department: string; count: number }[];
  branchDistribution: { branch: string; count: number }[];
  activeOccupants: Occupant[];
  asOfUtc: string;
}

interface AttendanceOccupancyRadarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceOccupancyRadarModal({ open, onOpenChange }: AttendanceOccupancyRadarModalProps) {
  const [data, setData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRadar = async () => {
    try {
      setLoading(true);
      const res = await hrmsApi.hrms.attendance.getOccupancyRadar();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to load floor occupancy radar telemetry.", "Radar Offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchRadar();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:rounded-2xl">
        <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Live Floor Occupancy Radar
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time on-premises biometric presence, department density, and site occupancy telemetry.
            </DialogDescription>
          </div>
          <button
            onClick={() => void fetchRadar()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Sync Radar
          </button>
        </DialogHeader>

        {/* Hero Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Currently Inside Premises
              </span>
              <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-950 dark:text-emerald-200">
              {data?.totalInside ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              Active biometric IN punches with no checkout
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Total Check-Ins Today
              </span>
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-950 dark:text-indigo-200">
              {data?.totalCheckedInToday ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
              Unique staff reporting across all shifts today
            </p>
          </div>

          <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Off-Site / Checked Out
              </span>
              <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-amber-950 dark:text-amber-200">
              {data?.currentlyCheckedOut ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80">
              Punched OUT or departed premises
            </p>
          </div>
        </div>

        {/* Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {/* Department Density */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-4 w-4 text-indigo-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Department Density Distribution
              </h4>
            </div>
            <div className="space-y-2.5">
              {data?.departmentDistribution && data.departmentDistribution.length > 0 ? (
                data.departmentDistribution.map((d, idx) => {
                  const pct = data.totalInside > 0 ? Math.round((d.count / data.totalInside) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>{d.department || "General / Unassigned"}</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{d.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No active department check-ins today</div>
              )}
            </div>
          </div>

          {/* Branch / Facility Density */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Branch & Facility Distribution
              </h4>
            </div>
            <div className="space-y-2.5">
              {data?.branchDistribution && data.branchDistribution.length > 0 ? (
                data.branchDistribution.map((b, idx) => {
                  const pct = data.totalInside > 0 ? Math.round((b.count / data.totalInside) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>{b.branch || "Corporate HQ"}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{b.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No active branch telemetry today</div>
              )}
            </div>
          </div>
        </div>

        {/* Live Active Occupants Table */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Active On-Premises Occupants (Sample)
          </h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Punched In</th>
                  <th className="py-2.5 px-3">Terminal / Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {data?.activeOccupants && data.activeOccupants.length > 0 ? (
                  data.activeOccupants.map((occ, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {occ.employeeName}
                        <span className="block text-[10px] text-slate-400 font-mono">{occ.employeeCode}</span>
                      </td>
                      <td className="py-2 px-3">{occ.department}</td>
                      <td className="py-2 px-3">{occ.branch}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        {new Date(occ.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {occ.source || "Biometric"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                      No staff currently punched IN on site.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
