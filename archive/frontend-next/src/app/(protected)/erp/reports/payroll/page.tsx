"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollReportsPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [overviewRes, componentsRes, structuresRes] = await Promise.all([
          hrApi.reports.payroll.overview(),
          hrApi.reports.payroll.components(),
          hrApi.reports.payroll.structures(),
        ]);
        setOverview(overviewRes.data ?? null);
        setComponents(Array.isArray(componentsRes.data) ? componentsRes.data : []);
        setStructures(Array.isArray(structuresRes.data) ? structuresRes.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load payroll reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Reports</h1>
        <p className="text-sm text-gray-600 mt-1">Salary, tax, and deduction analysis</p>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Loading payroll reports...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Total Runs</p>
              <p className="text-xl font-semibold text-gray-900">{overview?.totalRuns ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Completed Runs</p>
              <p className="text-xl font-semibold text-gray-900">{overview?.completedRuns ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Payslips</p>
              <p className="text-xl font-semibold text-gray-900">{overview?.totalPayslips ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase text-gray-500">Total Payout</p>
              <p className="text-xl font-semibold text-gray-900">{overview?.totalPayout ?? 0}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-800">Components Breakdown</h2>
              {components.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">No component data available.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {components.map((item: any, index: number) => (
                    <li key={`${item.type}-${index}`} className="flex items-center justify-between border-b border-gray-100 py-2">
                      <span className="font-medium text-gray-900">{item.type || "Component"}</span>
                      <span className="text-gray-600">{item.count ?? 0} items</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-800">Structures Report</h2>
              {structures.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">No structures data available.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {structures.map((item: any) => (
                    <li key={item.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                      <span className="font-medium text-gray-900">{item.name || "Structure"}</span>
                      <span className="text-gray-600">{item.componentsCount ?? 0} components</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
