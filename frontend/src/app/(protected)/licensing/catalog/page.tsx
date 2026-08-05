"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Modules", value: modules.length, helper: "catalog" },
            {
              label: "Enabled",
              value: modules.filter((module) => module.isEnabled).length,
              tone: "positive",
            },
            {
              label: "Disabled",
              value: modules.filter((module) => !module.isEnabled).length,
              tone: "warning",
            },
            {
              label: "Enable Rate",
              value: `${modules.length > 0 ? Math.round((modules.filter((module) => module.isEnabled).length / modules.length) * 100) : 0}%`,
              tone: "info",
            },
          ]}
        />
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
