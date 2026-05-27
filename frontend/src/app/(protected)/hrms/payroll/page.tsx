"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const page = 1;

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.payslips.list();
        setPayrolls(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load payroll");
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage employee salaries and payslips</p>
        </div>
        <button className="erp-action-btn erp-action-btn-primary">
          Process Payroll
        </button>
      </div>
      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading payroll records...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Records</p><p className="erp-kpi-value">{payrolls.length}</p><p className="erp-kpi-meta">Payroll entries</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Processed</p><p className="erp-kpi-value erp-kpi-value-success">{payrolls.filter(p => (p.status || '').toLowerCase() === 'processed').length}</p><p className="erp-kpi-meta">Finalized payrolls</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{payrolls.filter(p => (p.status || '').toLowerCase() === 'pending').length}</p><p className="erp-kpi-meta">Awaiting processing</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Net Salary</p><p className="erp-kpi-value">{payrolls.reduce((s, p) => s + (p.netSalary || 0), 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of net salaries</p></div>
      </div>

      {!loading && !error && (
        payrolls.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">No payroll records found</p></div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left font-medium text-gray-700">Employee</th><th className="px-6 py-3 text-left font-medium text-gray-700">Month</th><th className="px-6 py-3 text-left font-medium text-gray-700">Basic</th><th className="px-6 py-3 text-left font-medium text-gray-700">Earnings</th><th className="px-6 py-3 text-left font-medium text-gray-700">Deductions</th><th className="px-6 py-3 text-left font-medium text-gray-700">Net</th><th className="px-6 py-3 text-left font-medium text-gray-700">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {payrolls.map((payroll: any) => (
                  <tr key={payroll.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">{payroll.employeeName || "N/A"}</td>
                    <td className="px-6 py-3 text-gray-600">{payroll.month || "N/A"}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">{payroll.basicSalary || 0}</td>
                    <td className="px-6 py-3 text-green-700 font-medium">{payroll.totalEarnings || 0}</td>
                    <td className="px-6 py-3 text-red-700 font-medium">{payroll.totalDeductions || 0}</td>
                    <td className="px-6 py-3 text-gray-900 font-bold">{payroll.netSalary || 0}</td>
                    <td className="px-6 py-3"><span className={`inline-block px-2 py-1 rounded text-xs font-medium ${payroll.status === "processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{payroll.status || "N/A"}</span></td>
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
