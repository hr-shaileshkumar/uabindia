"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { PERMISSIONS } from "@/constants/permissions";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { usePermissions } from "@/context/PermissionContext";
import { hrApi } from "@/services/hrApi";

type AttendanceRecord = {
  id: string;
  date?: string;
  employeeName?: string;
  employeeCode?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  punchType?: string;
  timestamp?: string;
  geoValidated?: boolean;
  deviceId?: string;
  source?: string;
};

type AttendanceListProps = {
  fetchAttendance: () => Promise<AttendanceRecord[]>;
  employeeId?: string;
};

const formatTimestamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function AttendanceList({ fetchAttendance, employeeId }: AttendanceListProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeValue, setEmployeeValue] = useState(employeeId ?? "");
  const [punchType, setPunchType] = useState<"IN" | "OUT">("IN");
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [deviceId, setDeviceId] = useState("");
  const [source, setSource] = useState("Web");

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canPunchAttendance = isSuperAdmin || hasPermission([PERMISSIONS.ATTENDANCE_CREATE]);

  useEffect(() => {
    setEmployeeValue(employeeId ?? "");
  }, [employeeId]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAttendance();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [fetchAttendance]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const punchStats = useMemo(() => {
    const inCount = records.filter((record) => (record.punchType ?? record.status ?? "").toUpperCase() === "IN").length;
    const outCount = records.filter((record) => (record.punchType ?? record.status ?? "").toUpperCase() === "OUT").length;
    const geoValidated = records.filter((record) => record.geoValidated).length;

    return { inCount, outCount, geoValidated };
  }, [records]);
  const latestPunch = records[0];

  const handlePunch = async () => {
    if (!employeeValue.trim()) {
      setError("Employee ID is required to mark attendance.");
      return;
    }

    try {
      setPunching(true);
      setError(null);
      await hrApi.hrms.attendance.markAttendance({
        employeeId: employeeValue.trim(),
        punchType,
        timestamp: new Date(timestamp).toISOString(),
        deviceId: deviceId.trim() || undefined,
        source: source.trim() || undefined,
      });
      notifySuccess(`Attendance ${punchType.toLowerCase()} recorded.`);
      await loadRecords();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to mark attendance");
      setError(message);
      notifyError(message, "Attendance");
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="erp-page space-y-5">
      <PageHeader
        title="Attendance Management"
        subtitle="Track employee punches and mark daily presence from the HRMS workspace."
        eyebrow="HRMS / Attendance"
        icon="clock"
        stats={[
          { label: "Punches", value: records.length },
          { label: "IN", value: punchStats.inCount, tone: "success" },
          { label: "OUT", value: punchStats.outCount, tone: "warning" },
          { label: "Geo Verified", value: punchStats.geoValidated, tone: "info" },
        ]}
        actions={
          canPunchAttendance ? (
            <button
              type="button"
              onClick={() => void handlePunch()}
              disabled={punching}
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm disabled:opacity-50"
            >
              {punching ? "Saving..." : "Mark Attendance"}
            </button>
          ) : null
        }
      />
      <section className="rounded-[1.1rem] border border-slate-200/85 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 shadow-[var(--erp-shadow-sm)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Attendance Focus
            </p>
            <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
              Capture punches cleanly and review check-in/check-out flow without leaving the page.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Attendance pages should show recent activity, validation status, and the fastest next action for HR, supervisors, and payroll teams.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[0.95rem] border border-slate-200 bg-white px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Latest punch</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{latestPunch?.employeeName || "No recent punch"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{latestPunch ? formatTimestamp(latestPunch.timestamp) : "Waiting for records"}</p>
            </div>
            <div className="rounded-[0.95rem] border border-slate-200 bg-white px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Validated</p>
              <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-slate-950">{punchStats.geoValidated}</p>
            </div>
            <div className="rounded-[0.95rem] border border-slate-200 bg-white px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Direction split</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{punchStats.inCount} IN / {punchStats.outCount} OUT</p>
            </div>
          </div>
        </div>
      </section>

      {canPunchAttendance ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <label className="erp-label">Employee ID</label>
              <input
                className="erp-input"
                value={employeeValue}
                onChange={(event) => setEmployeeValue(event.target.value)}
                placeholder="Employee UUID"
              />
            </div>
            <div>
              <label className="erp-label">Punch Type</label>
              <select
                className="erp-select"
                value={punchType}
                onChange={(event) => setPunchType(event.target.value === "OUT" ? "OUT" : "IN")}
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
            <div>
              <label className="erp-label">Timestamp</label>
              <input
                type="datetime-local"
                className="erp-input"
                value={timestamp}
                onChange={(event) => setTimestamp(event.target.value)}
              />
            </div>
            <div>
              <label className="erp-label">Source</label>
              <input
                className="erp-input"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Web, mobile, biometric..."
              />
            </div>
            <div>
              <label className="erp-label">Device ID</label>
              <input
                className="erp-input"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </section>
      ) : null}

      {loading && (
        <div className="p-8 text-center">
          <p className="text-gray-600">Loading attendance records...</p>
        </div>
      )}

      {error && (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Employee</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Punch Type</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Check-in</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Check-out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => {
                    const punch = (record.punchType ?? record.status ?? "").toUpperCase();
                    return (
                      <tr key={record.id} className="transition hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-900">{record.date || formatTimestamp(record.timestamp)}</td>
                        <td className="px-6 py-3 text-gray-600">
                          <div className="font-medium text-slate-900">{record.employeeName || "N/A"}</div>
                          {record.employeeCode ? <div className="text-xs text-slate-500">{record.employeeCode}</div> : null}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                              punch === "IN"
                                ? "bg-green-100 text-green-700"
                                : punch === "OUT"
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {punch || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {punch === "IN" ? formatTimestamp(record.timestamp) : "-"}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {punch === "OUT" ? formatTimestamp(record.timestamp) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
