"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { reportsApi } from "@/services/modules";
type HeadcountRow = { companyId?: string; companyName?: string; totalEmployees?: number; activeEmployees?: number; inactiveEmployees?: number };
type AttendanceSummary = { totalRecords?: number; presentDays?: number; attendancePct?: number; daily?: { date: string; total: number }[] };
type LeaveSummary = { totalRequests?: number; approvedDays?: number; pendingRequests?: number; byStatus?: { status: string; count: number }[] };
type TurnoverSummary = { year?: number; joiners?: number; exits?: number; averageHeadcount?: number; turnoverRatePct?: number };

export default function HrReportsPage() {
  const [headcount, setHeadcount] = useState<HeadcountRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [turnover, setTurnover] = useState<TurnoverSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"headcount" | "attendance" | "leave" | "turnover">("headcount");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [headRes, attRes, leaveRes, turnoverRes] = await Promise.all([
          reportsApi.hr.headcount(),
          reportsApi.hr.attendance(),
          reportsApi.hr.leave(),
          reportsApi.hr.turnover(),
        ]);
        setHeadcount(Array.isArray(headRes.data) ? headRes.data : []);
        setAttendance(attRes.data ?? null);
        setLeaveSummary(leaveRes.data ?? null);
        setTurnover(turnoverRes.data ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load HR reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalEmployees = headcount.reduce((sum, row) => sum + (row.totalEmployees || 0), 0);
  const activeEmployees = headcount.reduce((sum, row) => sum + (row.activeEmployees || 0), 0);

  return (
    <StandardPageLayout
      title="HR Analytics"
      subtitle="Workforce headcount, attendance trends, and leave analysis across your organization."
      eyebrow="Reports / People Analytics"
      icon="bar-chart"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Employees", value: totalEmployees, tone: "info" },
            { label: "Active", value: activeEmployees, tone: "success" },
            { label: "Attendance", value: attendance?.totalRecords ?? "-", tone: "info" },
            { label: "Leave Pending", value: leaveSummary?.pendingRequests ?? "-", tone: "warning" },
            { label: "Turnover", value: turnover ? `${turnover.turnoverRatePct ?? 0}%` : "-", tone: "info" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div className="erp-tabs-list">
            {(["headcount", "attendance", "leave", "turnover"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}
              >
                {tab === "headcount"
                  ? "Headcount"
                  : tab === "attendance"
                    ? "Attendance"
                    : tab === "leave"
                      ? "Leave Analysis"
                      : "Turnover"}
              </button>
            ))}
          </div>
        </div>

        <div className="erp-panel-body">
          {loading ? (
            <div className="erp-loading">Loading report data...</div>
          ) : (
            <>
              {activeTab === "headcount" && (
                <div className="overflow-x-auto">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Company</th>
                        <th className="erp-th">Total</th>
                        <th className="erp-th">Active</th>
                        <th className="erp-th">Inactive</th>
                        <th className="erp-th">Active %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headcount.length === 0 ? (
                        <tr><td colSpan={5} className="erp-td py-10 text-center text-slate-400">No headcount data available.</td></tr>
                      ) : (
                        headcount.map((row, index) => {
                          const activePct = row.totalEmployees ? Math.round(((row.activeEmployees || 0) / row.totalEmployees) * 100) : 0;
                          return (
                            <tr key={row.companyId || index} className="erp-tr">
                              <td className="erp-td font-medium text-slate-900">{row.companyName || "Company"}</td>
                              <td className="erp-td text-slate-700">{row.totalEmployees ?? "-"}</td>
                              <td className="erp-td font-medium text-emerald-700">{row.activeEmployees ?? "-"}</td>
                              <td className="erp-td text-slate-500">{row.inactiveEmployees ?? "-"}</td>
                              <td className="erp-td">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${activePct}%` }} />
                                  </div>
                                  <span className="text-xs text-slate-600">{activePct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Total Records</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{attendance?.totalRecords ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Present Days</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">{attendance?.presentDays ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Attendance %</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{attendance?.attendancePct ?? 0}%</p>
                    </div>
                  </div>
                  {attendance?.daily && attendance.daily.length > 0 ? (
                    <div className="overflow-x-auto bg-white/80">
                      <table className="erp-table">
                        <thead className="erp-thead">
                          <tr>
                            <th className="erp-th">Date</th>
                            <th className="erp-th">Total Punches</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.daily.slice(0, 20).map((day) => (
                            <tr key={day.date} className="erp-tr">
                              <td className="erp-td text-slate-700">{new Date(day.date).toLocaleDateString("en-IN")}</td>
                              <td className="erp-td text-slate-600">{day.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="erp-empty">No daily attendance data available.</div>
                  )}
                </div>
              )}

              {activeTab === "leave" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Total Requests</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{leaveSummary?.totalRequests ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Approved Days</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">{leaveSummary?.approvedDays ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">Pending</p>
                      <p className="mt-2 text-2xl font-bold text-amber-700">{leaveSummary?.pendingRequests ?? 0}</p>
                    </div>
                  </div>
                  {leaveSummary?.byStatus && leaveSummary.byStatus.length > 0 ? (
                    <div className="overflow-x-auto bg-white/80">
                      <table className="erp-table">
                        <thead className="erp-thead">
                          <tr>
                            <th className="erp-th">Status</th>
                            <th className="erp-th">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveSummary.byStatus.map((status) => (
                            <tr key={status.status} className="erp-tr">
                              <td className="erp-td text-slate-700">{status.status}</td>
                              <td className="erp-td text-slate-600">{status.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === "turnover" && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Year</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{turnover?.year ?? new Date().getFullYear()}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Joiners</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{turnover?.joiners ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Exits</p>
                    <p className="mt-2 text-2xl font-bold text-rose-700">{turnover?.exits ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Turnover</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{turnover?.turnoverRatePct ?? 0}%</p>
                    <p className="mt-1 text-xs text-slate-500">Avg headcount {turnover?.averageHeadcount ?? 0}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}
