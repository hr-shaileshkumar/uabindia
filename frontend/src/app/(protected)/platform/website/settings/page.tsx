"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TenantConfig = {
  configJson: string;
  uiSchemaJson: string;
  workflowJson: string;
  brandingJson: string;
  notes?: string | null;
};

const EMPTY_CONFIG: TenantConfig = {
  configJson: "{}",
  uiSchemaJson: "{}",
  workflowJson: "{}",
  brandingJson: "{}",
  notes: "",
};

export default function WebsiteSettingsPage() {
  const [config, setConfig] = useState<TenantConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "ui" | "workflow" | "branding" | "notes">("config");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.platform.tenantConfig.get();
      const data = response.data as Partial<TenantConfig> | null;
      setConfig({
        configJson: data?.configJson || "{}",
        uiSchemaJson: data?.uiSchemaJson || "{}",
        workflowJson: data?.workflowJson || "{}",
        brandingJson: data?.brandingJson || "{}",
        notes: data?.notes || "",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load tenant settings.");
      setError(message);
      notifyError(message, "Website Settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(
    () => [
      { label: "Config JSON", value: config.configJson !== "{}" ? "Custom" : "Default" },
      { label: "UI schema", value: config.uiSchemaJson !== "{}" ? "Configured" : "Default" },
      { label: "Workflow JSON", value: config.workflowJson !== "{}" ? "Configured" : "Default" },
      { label: "Branding", value: config.brandingJson !== "{}" ? "Configured" : "Default" },
    ],
    [config]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      await hrApi.platform.tenantConfig.update(config);
      notifySuccess("Website settings saved");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save website settings.");
      setError(message);
      notifyError(message, "Website Settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Website Settings"
      subtitle="Manage the backend-stored tenant configuration, UI schema, workflow JSON, and branding payload from one control surface."
      eyebrow="Platform / Website"
      icon="settings"
      actions={
        <button type="button" onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary">
          Refresh
        </button>
      }
    >
      <div className="erp-kpi-grid">
        {summary.map((item) => (
          <div key={item.label} className="erp-kpi-card">
            <p className="erp-kpi-label">{item.label}</p>
            <p className="erp-kpi-value text-3xl">{item.value}</p>
            <p className="erp-kpi-meta">Backend persisted.</p>
          </div>
        ))}
      </div>

      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Tenant configuration</h2>
            <p className="mt-1 text-sm text-slate-500">Edit JSON payloads that drive the website, workflow definitions, and branding.</p>
          </div>
        </div>
        <div className="erp-panel-body space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["config", "Config JSON"],
              ["ui", "UI Schema"],
              ["workflow", "Workflow JSON"],
              ["branding", "Branding JSON"],
              ["notes", "Notes"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={activeTab === key ? "erp-action-btn erp-action-btn-primary" : "erp-action-btn erp-action-btn-secondary"}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "config" ? (
            <textarea className="erp-input min-h-72 font-mono text-sm" value={config.configJson} onChange={(e) => setConfig({ ...config, configJson: e.target.value })} />
          ) : null}
          {activeTab === "ui" ? (
            <textarea className="erp-input min-h-72 font-mono text-sm" value={config.uiSchemaJson} onChange={(e) => setConfig({ ...config, uiSchemaJson: e.target.value })} />
          ) : null}
          {activeTab === "workflow" ? (
            <textarea className="erp-input min-h-72 font-mono text-sm" value={config.workflowJson} onChange={(e) => setConfig({ ...config, workflowJson: e.target.value })} />
          ) : null}
          {activeTab === "branding" ? (
            <textarea className="erp-input min-h-72 font-mono text-sm" value={config.brandingJson} onChange={(e) => setConfig({ ...config, brandingJson: e.target.value })} />
          ) : null}
          {activeTab === "notes" ? (
            <textarea className="erp-input min-h-40 text-sm" value={config.notes || ""} onChange={(e) => setConfig({ ...config, notes: e.target.value })} />
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary">
              Reset
            </button>
            <button type="button" onClick={() => void handleSave()} disabled={saving || loading} className="erp-action-btn erp-action-btn-primary">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
