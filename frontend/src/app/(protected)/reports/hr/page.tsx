"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

export default function HrReportsPage() {
  const [headcount, setHeadcount] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [leaveSummary, setLeaveSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [headcountRes, attendanceRes, leaveRes] = await Promise.all([
          hrApi.reports.hr.headcount(),
          hrApi.reports.hr.attendance(),
          hrApi.reports.hr.leave(),
        ]);
        setHeadcount(Array.isArray(headcountRes.data) ? headcountRes.data : []);
        setAttendance(attendanceRes.data ?? null);
        setLeaveSummary(leaveRes.data ?? null);
      } catch (err: any) {
        setError(err.message || "Failed to load HR reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <StandardPageLayout title="HR Reports" subtitle="Headcount, attendance, and leave analytics.">

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">Loading HR reports...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Companies</p><p className="erp-kpi-value">{headcount.length}</p><p className="erp-kpi-meta">Reporting companies</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Total Employees</p><p className="erp-kpi-value erp-kpi-value-success">{headcount.reduce((s, h) => s + (h.totalEmployees || 0), 0)}</p><p className="erp-kpi-meta">Total headcount</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Attendance Days</p><p className="erp-kpi-value">{attendance?.daily?.length ?? 0}</p><p className="erp-kpi-meta">Days tracked</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Leave Summary</p><p className="erp-kpi-value">{Array.isArray(leaveSummary) ? leaveSummary.length : 0}</p><p className="erp-kpi-meta">Leave categories</p></div>
      </div>

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Headcount</h2>
            {headcount.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No headcount data.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {headcount.slice(0, 6).map((item: any) => (
                  <li key={item.companyId} className="flex items-center justify-between border-b border-gray-100 py-2">
                    <span className="text-gray-900">{item.companyName || "Company"}</span>
                    <span className="text-gray-600">{item.totalEmployees}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Attendance</h2>
            <p className="mt-2 text-sm text-gray-600">Total records: {attendance?.totalRecords ?? 0}</p>
            {attendance?.daily?.length ? (
              <ul className="mt-3 space-y-1 text-xs text-gray-600">
                {attendance.daily.slice(0, 5).map((day: any) => (
                  <li key={day.date}>
                    {new Date(day.date).toLocaleDateString()} - {day.total} punches
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Leave Summary</h2>
            <p className="mt-2 text-sm text-gray-600">Total requests: {leaveSummary?.totalRequests ?? 0}</p>
            <p className="text-sm text-gray-600">Approved days: {leaveSummary?.approvedDays ?? 0}</p>
            {leaveSummary?.byStatus?.length ? (
              <ul className="mt-3 space-y-1 text-xs text-gray-600">
                {leaveSummary.byStatus.map((item: any) => (
                  <li key={item.status}>
                    {item.status}: {item.count}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
