"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type PayrollStructure = {
  id: string;
  name?: string;
  status?: string;
  createdAt?: string;
};

export default function PayrollStructuresPage() {
  const [structures, setStructures] = useState<PayrollStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCutoff] = useState(() => Date.now() - 30 * 86400000);

  useEffect(() => {
    const fetchStructures = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.structures.list();
        setStructures(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load structures");
      } finally {
        setLoading(false);
      }
    };

    void fetchStructures();
  }, []);

  return (
    <ModuleTablePage
      title="Payroll Structures"
      subtitle="Manage salary structures and components."
      eyebrow="Payroll / Master Setup"
      icon="settings"
      toolbarTitle="Structure registry"
      toolbarSubtitle="Maintain salary structures, status, and creation history from a standardized payroll catalog view."
      loading={loading}
      error={error}
      rows={structures}
      countLabel={(count) => `${count} structures`}
      emptyMessage="No structures found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Structures</p><p className="erp-kpi-value">{structures.length}</p><p className="erp-kpi-meta">Salary structures</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{structures.filter(s => !s.status || (s.status || '').toLowerCase() === 'active').length}</p><p className="erp-kpi-meta">In use</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Inactive</p><p className="erp-kpi-value">{structures.filter(s => (s.status || '').toLowerCase() === 'inactive').length}</p><p className="erp-kpi-meta">Archived structures</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Recently Added</p><p className="erp-kpi-value">{structures.filter(s => { const d = s.createdAt ? new Date(s.createdAt) : null; return d !== null && d.getTime() >= recentCutoff; }).length}</p><p className="erp-kpi-meta">Added in last 30 days</p></div>
        </div>
      }
      columns={[
        { label: "Name" },
        { label: "Status" },
        { label: "Created" },
      ]}
      renderRow={(structure) => (
        <tr key={structure.id} className="erp-tr">
          <td className="erp-td text-slate-900">{structure.name || "Structure"}</td>
          <td className="erp-td text-slate-600">{structure.status || "Active"}</td>
          <td className="erp-td text-slate-600">{structure.createdAt ? new Date(structure.createdAt).toLocaleDateString() : "-"}</td>
        </tr>
      )}
    />
  );
}
