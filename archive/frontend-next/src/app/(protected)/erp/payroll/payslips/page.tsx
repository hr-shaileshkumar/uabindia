"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

export default function PayrollPayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.payslips.list();
        setPayslips(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load payslips");
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
        <p className="text-sm text-gray-600 mt-1">Employee payslips and salary details</p>
      </div>

      {loading && <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">Loading payslips...</p></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-red-700 font-medium">Error: {error}</p></div>}

      {!loading && !error && (
        payslips.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center"><p className="text-gray-600">No payslips found</p></div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-left font-medium text-gray-700">Employee</th><th className="px-6 py-3 text-left font-medium text-gray-700">Month</th><th className="px-6 py-3 text-left font-medium text-gray-700">Net Salary</th><th className="px-6 py-3 text-left font-medium text-gray-700">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {payslips.map((payslip: any) => (
                  <tr key={payslip.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900">{payslip.employeeName || "Employee"}</td>
                    <td className="px-6 py-3 text-gray-600">{payslip.month || "-"}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">{payslip.netSalary || 0}</td>
                    <td className="px-6 py-3 text-gray-600">{payslip.status || "Pending"}</td>
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
