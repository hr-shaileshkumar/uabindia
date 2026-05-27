"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

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
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
          Process Payroll
        </button>
      </div>
      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading payroll records...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}
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
