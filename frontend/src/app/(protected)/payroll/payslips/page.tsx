"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type Payslip = {
  id: string;
  employeeName?: string;
  month?: string;
  netSalary?: number;
  status?: string;
};

export default function PayrollPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.payslips.list();
        setPayslips(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load payslips");
      } finally {
        setLoading(false);
      }
    };

    void fetchPayslips();
  }, []);

  return (
    <ModuleTablePage
      title="Payslips"
      subtitle="Employee payslips and salary details."
      eyebrow="Payroll / Output"
      icon="file"
      toolbarTitle="Payslip ledger"
      toolbarSubtitle="Review employee payroll outputs, salary values, and slip status from the same reporting surface."
      loading={loading}
      error={error}
      rows={payslips}
      countLabel={(count) => `${count} payslips`}
      emptyMessage="No payslips found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Payslips</p><p className="erp-kpi-value">{payslips.length}</p><p className="erp-kpi-meta">All generated payslips</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Paid</p><p className="erp-kpi-value erp-kpi-value-success">{payslips.filter(p => (p.status || '').toLowerCase() === 'paid').length}</p><p className="erp-kpi-meta">Disbursed payslips</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{payslips.filter(p => !p.status || (p.status || '').toLowerCase() === 'pending').length}</p><p className="erp-kpi-meta">Awaiting payment</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Net Salary</p><p className="erp-kpi-value">{payslips.reduce((s, p) => s + (p.netSalary || 0), 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of net salaries</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Month" },
        { label: "Net Salary" },
        { label: "Status" },
      ]}
      renderRow={(payslip) => (
        <tr key={payslip.id} className="erp-tr">
          <td className="erp-td text-slate-900">{payslip.employeeName || "Employee"}</td>
          <td className="erp-td text-slate-600">{payslip.month || "-"}</td>
          <td className="erp-td text-slate-900 font-medium">{payslip.netSalary || 0}</td>
          <td className="erp-td text-slate-600">{payslip.status || "Pending"}</td>
        </tr>
      )}
    />
  );
}
