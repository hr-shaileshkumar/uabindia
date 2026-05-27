"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.runs.list();
        const runs = Array.isArray(res.data) ? res.data : [];
        setSummary({ runs, total: runs.length });
      } catch (err: any) {
        setError(err.message || "Failed to load payroll summary");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview of payroll runs and processing status</p>
      </div>

      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading payroll summary...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {!loading && !error && (
        <div className="grid gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Payroll Runs</h2>
            {summary?.runs?.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {summary.runs.map((run: any) => (
                  <li key={run.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                    <span className="font-medium text-gray-900">
                      {run.runDate ? new Date(run.runDate).toLocaleDateString() : "Payroll Run"}
                    </span>
                    <span className="text-gray-600">{run.status || "Pending"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-600">No payroll runs available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
