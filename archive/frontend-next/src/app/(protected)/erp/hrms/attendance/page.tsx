"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const page = 1;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await hrApi.hrms.attendance.list(page);
        setRecords(res.data?.records || []);
      } catch (err: any) {
        setError(err.message || "Failed to load attendance");
        console.error("Error loading attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">Track employee attendance and mark attendance</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
          Mark Attendance
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Loading attendance records...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {records.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">No attendance records found</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Employee</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Check-in</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">Check-out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-900">{record.date || "N/A"}</td>
                      <td className="px-6 py-3 text-gray-600">{record.employeeName || "N/A"}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${record.status === "present" ? "bg-green-100 text-green-700" : record.status === "absent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
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
    </div>
  );
}
