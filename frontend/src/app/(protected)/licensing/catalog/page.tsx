"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ListSearchInput } from "@/components/workspace/list-toolbar";
import { erpButtonClassName } from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useUiSchema } from "@/context/UiSchemaContext";

type ModuleRow = {
  key: string;
  name: string;
  isEnabled: boolean;
  version: string;
};

function LegacyModuleCatalogPage() {
  const { refresh: refreshUiSchema } = useUiSchema();
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.modules.catalog();
      setModules(res.data.modules || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load catalog"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: ModuleRow) => {
    try {
      setToggling(row.key);
      await appApi.modules.updateSubscriptions({
        subscriptions: [{ moduleKey: row.key, isEnabled: !row.isEnabled }],
      });
      notifySuccess(row.isEnabled ? `${row.name} disabled` : `${row.name} enabled`);
      await Promise.all([load(), refreshUiSchema()]);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update module entitlement."));
    } finally {
      setToggling(null);
    }
  };

  const filtered = search.trim()
    ? modules.filter((m) => [m.key, m.name].some((v) => v.toLowerCase().includes(search.trim().toLowerCase())))
    : modules;

  return (
    <ModuleTablePage
      title="Module Catalog"
      subtitle="Review all available ERP modules, versions, and availability state."
      eyebrow="Licensing / Product Catalog"
      icon="settings"
      toolbarTitle="Module inventory"
      toolbarSubtitle="Browse product modules and toggle tenant entitlements from the catalog grid."
      loading={loading}
      error={error}
      onRetry={load}
      rows={filtered}
      countLabel={(count) => `${count} modules`}
      emptyMessage="No modules found."
      filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Filter module…" />}
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
        { label: "Actions", className: "text-right" },
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
          <td className="erp-td text-right">
            <button
              type="button"
              className={module.isEnabled ? erpButtonClassName.secondary : erpButtonClassName.primary}
              disabled={toggling === module.key}
              onClick={() => void toggle(module)}
            >
              {toggling === module.key ? "Saving…" : module.isEnabled ? "Disable" : "Enable"}
            </button>
          </td>
        </tr>
      )}
    />
  );
}

export default function ModuleCatalogPage() {
  return (
    <DynamicPage
      pageKey="licensing.catalog"
      fallback={<LegacyModuleCatalogPage />}
      renderMode="auto"
    />
  );
}
