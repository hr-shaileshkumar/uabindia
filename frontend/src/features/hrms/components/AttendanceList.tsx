"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

type AttendanceRecord = {
  id: string;
  date?: string;
  employeeName?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
};

type AttendanceListProps = {
  fetchAttendance: () => Promise<AttendanceRecord[]>;
};

export default function AttendanceList({ fetchAttendance }: AttendanceListProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
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
    };

    void run();
  }, [fetchAttendance]);

  return (
    <StandardPageLayout
      title="Attendance"
      subtitle="Track employee attendance and mark daily presence"
      actions={
        <button className="erp-action-btn erp-action-btn-primary">
          Mark Attendance
        </button>
      }
    >
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
          {/* KPI summary cards */}
          <div className="erp-kpi-grid mb-4">
            <div className="erp-kpi-card"><p className="erp-kpi-label">Total Records</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">Loaded attendance entries</p></div>
            <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Present</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === 'present').length}</p><p className="erp-kpi-meta">Attended</p></div>
            <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Absent</p><p className="erp-kpi-value erp-kpi-value-danger">{records.filter(r => r.status === 'absent').length}</p><p className="erp-kpi-meta">Not attended</p></div>
            <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Late / Other</p><p className="erp-kpi-value">{records.filter(r => r.status !== 'present' && r.status !== 'absent').length}</p><p className="erp-kpi-meta">Other status</p></div>
          </div>
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Employee</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Check-in</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Check-out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="transition hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-900">{record.date || "N/A"}</td>
                      <td className="px-6 py-3 text-gray-600">{record.employeeName || "N/A"}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                            record.status === "present"
                              ? "bg-green-100 text-green-700"
                              : record.status === "absent"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {record.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{record.checkIn || "—"}</td>
                      <td className="px-6 py-3 text-gray-600">{record.checkOut || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </StandardPageLayout>
  );
}
