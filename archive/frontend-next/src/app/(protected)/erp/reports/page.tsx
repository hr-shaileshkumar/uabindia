"use client";

import Link from "next/link";

export default function ReportsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Access HR, Payroll, and Compliance reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/erp/reports/hr" className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-gray-900">HR Reports</h3>
          <p className="text-sm text-gray-600 mt-2">Headcount, attendance, and leave insights</p>
        </Link>
        <Link href="/erp/reports/payroll" className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-gray-900">Payroll Reports</h3>
          <p className="text-sm text-gray-600 mt-2">Salary, deductions, and payout summaries</p>
        </Link>
        <Link href="/erp/reports/compliance" className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Reports</h3>
          <p className="text-sm text-gray-600 mt-2">Statutory and audit-ready reports</p>
        </Link>
      </div>
    </div>
  );
}
