"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton, ErpTabBar, ErpTabPanel } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { reportsApi } from "@/services/modules";

type HeadcountRow = {
  companyId?: string;
  companyName?: string;
  totalEmployees?: number;
  activeEmployees?: number;
  inactiveEmployees?: number;
};
type AttendanceSummary = {
  totalRecords?: number;
  presentDays?: number;
  attendancePct?: number;
  daily?: { date: string; total: number }[];
};
type LeaveSummary = {
  totalRequests?: number;
  approvedDays?: number;
  pendingRequests?: number;
  byStatus?: { status: string; count: number }[];
};
type TurnoverSummary = {
  year?: number;
  joiners?: number;
  exits?: number;
  averageHeadcount?: number;
  turnoverRatePct?: number;
};

type TabKey = "headcount" | "attendance" | "leave" | "turnover";

function LegacyHrReportsPage() {
  const [headcount, setHeadcount] = useState<HeadcountRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [turnover, setTurnover] = useState<TurnoverSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("headcount");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalEmployees = headcount.reduce((sum, row) => sum + (row.totalEmployees || 0), 0);
  const activeEmployees = headcount.reduce((sum, row) => sum + (row.activeEmployees || 0), 0);
  const attendanceDailyRows = useMemo(
    () => (attendance?.daily ?? []).slice(0, 20),
    [attendance?.daily],
  );
  const leaveStatusRows = useMemo(() => leaveSummary?.byStatus ?? [], [leaveSummary?.byStatus]);

  const headcountList = useErpListView({
    listKey: "reports-hr-headcount",
    rows: headcount,
    loading: loading && activeTab === "headcount",
    emptyMessage: "No headcount data available.",
    getRowId: (row) => row.companyId || row.companyName || "headcount-unknown",
    onRefresh: () => void load(),
    columns: [
      { key: "companyName", label: "Company", dataType: "string" },
      { key: "totalEmployees", label: "Total", dataType: "number" },
      { key: "activeEmployees", label: "Active", dataType: "number" },
      { key: "inactiveEmployees", label: "Inactive", dataType: "number" },
      { key: "activePct", label: "Active %", dataType: "number" },
    ],
    renderRow: (row) => {
      const activePct = row.totalEmployees
        ? Math.round(((row.activeEmployees || 0) / row.totalEmployees) * 100)
        : 0;
      return (
        <>
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
        </>
      );
    },
  });

  const attendanceList = useErpListView({
    listKey: "reports-hr-attendance",
    rows: attendanceDailyRows,
    loading: loading && activeTab === "attendance",
    emptyMessage: "No daily attendance data available.",
    getRowId: (row) => row.date,
    onRefresh: () => void load(),
    columns: [
      { key: "date", label: "Date", dataType: "string" },
      { key: "total", label: "Total Punches", dataType: "number" },
    ],
    renderRow: (day) => (
      <>
        <td className="erp-td text-slate-700">{new Date(day.date).toLocaleDateString("en-IN")}</td>
        <td className="erp-td text-slate-600">{day.total}</td>
      </>
    ),
  });

  const leaveList = useErpListView({
    listKey: "reports-hr-leave",
    rows: leaveStatusRows,
    loading: loading && activeTab === "leave",
    emptyMessage: "No leave status breakdown available.",
    getRowId: (row) => row.status,
    onRefresh: () => void load(),
    columns: [
      { key: "status", label: "Status", dataType: "string" },
      { key: "count", label: "Count", dataType: "number" },
    ],
    renderRow: (status) => (
      <>
        <td className="erp-td text-slate-700">{status.status}</td>
        <td className="erp-td text-slate-600">{status.count}</td>
      </>
    ),
  });

  const tabItems = [
    { key: "headcount", label: "Headcount", count: headcount.length },
    { key: "attendance", label: "Attendance", count: attendanceDailyRows.length },
    { key: "leave", label: "Leave Analysis", count: leaveStatusRows.length },
    { key: "turnover", label: "Turnover" },
  ];

  const activeListTools =
    activeTab === "headcount"
      ? headcountList.headerTools
      : activeTab === "attendance"
        ? attendanceList.headerTools
        : activeTab === "leave"
          ? leaveList.headerTools
          : null;

  const activeFilterBar =
    activeTab === "headcount"
      ? headcountList.filterBar
      : activeTab === "attendance"
        ? attendanceList.filterBar
        : activeTab === "leave"
          ? leaveList.filterBar
          : undefined;

  return (
    <StandardPageLayout
      title="HR Analytics"
      subtitle="Workforce headcount, attendance trends, and leave analysis across your organization."
      eyebrow="Reports / People Analytics"
      icon="bar-chart"
      meta={
        <HeaderSummary
          items={[
            { label: "Employees", value: totalEmployees, tone: "info" },
            { label: "Active", value: activeEmployees, tone: "success" },
            { label: "Attendance", value: attendance?.totalRecords ?? "-", tone: "info" },
            { label: "Leave Pending", value: leaveSummary?.pendingRequests ?? "-", tone: "warning" },
            { label: "Turnover", value: turnover ? `${turnover.turnoverRatePct ?? 0}%` : "-", tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {activeListTools}
        </>
      }
      filters={activeFilterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      <ErpTabPanel hidden={activeTab !== "headcount"}>
        <CrudCard>{headcountList.table}</CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "attendance"}>
        <CrudCard>
          <div className="space-y-4 p-4">
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
            {attendanceList.table}
          </div>
        </CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "leave"}>
        <CrudCard>
          <div className="space-y-4 p-4">
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
            {leaveStatusRows.length > 0 ? leaveList.table : null}
          </div>
        </CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "turnover"}>
        <CrudCard>
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading report data...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
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
        </CrudCard>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}

export default function HrReportsPage() {
  return (
    <DynamicPage
      pageKey="reports.hr"
      fallback={<LegacyHrReportsPage />}
      renderMode="auto"
    />
  );
}
