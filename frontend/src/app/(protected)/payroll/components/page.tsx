"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Components", value: components.length, helper: "total" },
            {
              label: "Earnings",
              value: components.filter((component) => (component.type || "").toLowerCase() === "earning").length,
              tone: "positive",
            },
            {
              label: "Deductions",
              value: components.filter((component) => (component.type || "").toLowerCase() === "deduction").length,
              tone: "danger",
            },
            {
              label: "Statutory",
              value: components.filter((component) => component.isStatutory).length,
              tone: "info",
            },
          ]}
        />
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
