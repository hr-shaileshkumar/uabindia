"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type ModuleRow = {
  key: string;
  name: string;
  isEnabled: boolean;
  version: string;
};

export default function ModuleCatalogPage() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.modules.catalog();
        setModules(res.data.modules || []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <ModuleTablePage
      title="Module Catalog"
      subtitle="Review all available ERP modules, versions, and availability state."
      eyebrow="Licensing / Product Catalog"
      icon="settings"
      toolbarTitle="Module inventory"
      toolbarSubtitle="Browse product modules, current versioning, and release availability from a single catalog grid."
      loading={loading}
      rows={modules}
      countLabel={(count) => `${count} modules`}
      emptyMessage="No modules found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Modules</p><p className="erp-kpi-value">{modules.length}</p><p className="erp-kpi-meta">Licensed modules</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Enabled</p><p className="erp-kpi-value erp-kpi-value-success">{modules.filter(m => m.isEnabled).length}</p><p className="erp-kpi-meta">Active modules</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Disabled</p><p className="erp-kpi-value">{modules.filter(m => !m.isEnabled).length}</p><p className="erp-kpi-meta">Inactive modules</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Enable Rate</p><p className="erp-kpi-value">{modules.length > 0 ? Math.round(modules.filter(m => m.isEnabled).length / modules.length * 100) : 0}%</p><p className="erp-kpi-meta">Activation percentage</p></div>
        </div>
      }
      columns={[
        { label: "Key" },
        { label: "Name" },
        { label: "Version" },
        { label: "Status" },
      ]}
      renderRow={(module) => (
        <tr key={module.key} className="erp-tr">
          <td className="erp-td text-xs text-slate-500">{module.key}</td>
          <td className="erp-td">
            <div className="erp-row-title">{module.name}</div>
            <div className="erp-row-meta">ERP module</div>
          </td>
          <td className="erp-td">{module.version}</td>
          <td className="erp-td">
            <span className={module.isEnabled ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {module.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
