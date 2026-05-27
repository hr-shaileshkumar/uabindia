"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type PayrollComponent = {
  id: string;
  name?: string;
  type?: string;
  isStatutory?: boolean;
};

export default function PayrollComponentsPage() {
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.components.list();
        setComponents(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load components");
      } finally {
        setLoading(false);
      }
    };

    void fetchComponents();
  }, []);

  return (
    <ModuleTablePage
      title="Payroll Components"
      subtitle="Allowances, deductions, and benefits."
      eyebrow="Payroll / Engine"
      icon="settings"
      toolbarTitle="Component library"
      toolbarSubtitle="Standardize earnings, deductions, and statutory markers in a reusable payroll component grid."
      loading={loading}
      error={error}
      rows={components}
      countLabel={(count) => `${count} components`}
      emptyMessage="No components found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Components</p><p className="erp-kpi-value">{components.length}</p><p className="erp-kpi-meta">Payroll components</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Earnings</p><p className="erp-kpi-value erp-kpi-value-success">{components.filter(c => (c.type || '').toLowerCase() === 'earning').length}</p><p className="erp-kpi-meta">Earning components</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Deductions</p><p className="erp-kpi-value erp-kpi-value-danger">{components.filter(c => (c.type || '').toLowerCase() === 'deduction').length}</p><p className="erp-kpi-meta">Deduction components</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Statutory</p><p className="erp-kpi-value">{components.filter(c => c.isStatutory).length}</p><p className="erp-kpi-meta">Government-mandated</p></div>
        </div>
      }
      columns={[
        { label: "Name" },
        { label: "Type" },
        { label: "Taxable / Statutory" },
      ]}
      renderRow={(component) => (
        <tr key={component.id} className="erp-tr">
          <td className="erp-td text-slate-900">{component.name || "Component"}</td>
          <td className="erp-td text-slate-600">{component.type || "Earning"}</td>
          <td className="erp-td text-slate-600">{component.isStatutory ? "Yes" : "No"}</td>
        </tr>
      )}
    />
  );
}
