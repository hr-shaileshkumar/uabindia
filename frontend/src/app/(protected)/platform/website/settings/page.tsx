"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";

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
  const [activeTab, setActiveTab] = useState<"config" | "ui" | "workflow" | "branding" | "domain" | "notes">("domain");
  const [platformDomainInput, setPlatformDomainInput] = useState("uabindia.com");
  const [testSubdomain, setTestSubdomain] = useState("client1");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.platform.tenantConfig.get();
      const data = response.data as Partial<TenantConfig> | null;
      
      const configJsonStr = data?.configJson || "{}";
      setConfig({
        configJson: configJsonStr,
        uiSchemaJson: data?.uiSchemaJson || "{}",
        workflowJson: data?.workflowJson || "{}",
        brandingJson: data?.brandingJson || "{}",
        notes: data?.notes || "",
      });

      // Extract platformDomain from configJson
      try {
        const parsed = JSON.parse(configJsonStr);
        if (parsed.platformDomain) {
          setPlatformDomainInput(parsed.platformDomain);
        }
      } catch {}
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

  const handleDomainChange = (newDomain: string) => {
    setPlatformDomainInput(newDomain);
    try {
      const parsed = JSON.parse(config.configJson || "{}");
      parsed.platformDomain = newDomain;
      setConfig((prev) => ({
        ...prev,
        configJson: JSON.stringify(parsed, null, 2),
      }));
    } catch {
      // If configJson is invalid JSON, initialize it with the domain key
      setConfig((prev) => ({
        ...prev,
        configJson: JSON.stringify({ platformDomain: newDomain }, null, 2),
      }));
    }
  };

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
      meta={
        <ErpHeaderSummary
          items={summary.map((item) => ({
            label: item.label.replace(" JSON", ""),
            value: item.value,
            tone: item.value === "Configured" || item.value === "Custom" ? "info" : "default",
          }))}
        />
      }
      actions={
        <button type="button" onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary">
          Refresh
        </button>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}
      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Platform & Domain Configuration</h2>
            <p className="mt-1 text-sm text-slate-500">Edit JSON payloads or setup primary domain settings driving wildcard routing.</p>
          </div>
        </div>
        <div className="erp-panel-body space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["domain", "Owner Domain Setup"],
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

          {activeTab === "domain" ? (
            <div className="space-y-6 rounded-xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/10">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Primary Platform Domain</h3>
                <p className="text-xs text-slate-500">
                  Configure your primary service provider domain. All tenant default subdomains will resolve on this base domain.
                </p>
                <div className="flex max-w-md items-center gap-2 mt-3">
                  <span className="text-sm font-medium text-slate-400">https://</span>
                  <input
                    type="text"
                    className="erp-input flex-1"
                    placeholder="uabindia.com"
                    value={platformDomainInput}
                    onChange={(e) => handleDomainChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Subdomain Resolution Simulator</h4>
                <p className="text-xs text-slate-500">
                  Type a tenant&apos;s subdomain below to preview how it will resolve under your primary platform domain.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 mt-2">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 block mb-1">Subdomain</label>
                    <input
                      type="text"
                      className="erp-input w-full"
                      placeholder="client1"
                      value={testSubdomain}
                      onChange={(e) => setTestSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 block mb-1">Resolved URL Preview</label>
                    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-md font-mono text-sm text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      <span>{testSubdomain || "subdomain"}.{platformDomainInput || "uabindia.com"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4" />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Wildcard DNS & SSL Integration Checklist</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">1</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Wildcard DNS Setup</span>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      Configure a wildcard DNS record in your registrar (e.g. Cloudflare, Route53) pointing to your platform load balancer:
                    </p>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      CNAME  *.{platformDomainInput || "uabindia.com"}  -&gt;  your-app-domain.com
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold">2</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Backend CORS Integration</span>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      Ensure your API CORS configuration permits incoming traffic from wildcard subdomains:
                    </p>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      &quot;Cors&quot;: &#123; &quot;AllowedOrigins&quot;: [ &quot;https://{platformDomainInput || "uabindia.com"}&quot;, &quot;https://*.{platformDomainInput || "uabindia.com"}&quot; ] &#125;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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
