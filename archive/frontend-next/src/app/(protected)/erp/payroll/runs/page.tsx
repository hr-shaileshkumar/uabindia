"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.runs.list();
        setRuns(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load payroll runs");
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
        <p className="text-sm text-gray-600 mt-1">Track payroll processing cycles</p>
      </div>

      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading payroll runs...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {!loading && !error && (
        runs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">No payroll runs found</p></div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left font-medium text-gray-700">Run</th><th className="px-6 py-3 text-left font-medium text-gray-700">Period</th><th className="px-6 py-3 text-left font-medium text-gray-700">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {runs.map((run: any) => (
                  <tr key={run.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">{run.id}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {run.runDate ? new Date(run.runDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{run.status || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
