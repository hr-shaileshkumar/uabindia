"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { hrApi } from "@/services/hrApi";
import { brandingThemeToCssVars, type BrandingTheme } from "@/lib/branding";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TenantConfig = {
  configJson: string;
  uiSchemaJson: string;
  workflowJson: string;
  brandingJson: string;
  notes?: string | null;
};

const defaultTheme: BrandingTheme = {
  primaryColor: "#0f766e",
  primaryHoverColor: "#115e59",
  accentColor: "#f97316",
  accentSoftColor: "#ffedd5",
  surfaceColor: "#ffffff",
  surfaceMutedColor: "#f8fafc",
  canvasColor: "#f1f5f9",
  foregroundColor: "#0f172a",
  textColor: "#334155",
  backgroundColor: "#ffffff",
  legalTextColor: "#64748b",
};

const themePresets: Array<{ name: string; theme: BrandingTheme }> = [
  {
    name: "Teal Slate",
    theme: {
      primaryColor: "#0f766e",
      primaryHoverColor: "#115e59",
      accentColor: "#ea580c",
      accentSoftColor: "#ffedd5",
      canvasColor: "#f8fafc",
      surfaceColor: "#ffffff",
      surfaceMutedColor: "#f1f5f9",
      foregroundColor: "#0f172a",
      textColor: "#334155",
      backgroundColor: "#ffffff",
      legalTextColor: "#64748b",
    },
  },
  {
    name: "Indigo Steel",
    theme: {
      primaryColor: "#3730a3",
      primaryHoverColor: "#312e81",
      accentColor: "#0ea5e9",
      accentSoftColor: "#e0f2fe",
      canvasColor: "#eef2ff",
      surfaceColor: "#ffffff",
      surfaceMutedColor: "#e2e8f0",
      foregroundColor: "#111827",
      textColor: "#334155",
      backgroundColor: "#ffffff",
      legalTextColor: "#475569",
    },
  },
  {
    name: "Amber Graphite",
    theme: {
      primaryColor: "#b45309",
      primaryHoverColor: "#92400e",
      accentColor: "#4b5563",
      accentSoftColor: "#fef3c7",
      canvasColor: "#fffaf0",
      surfaceColor: "#ffffff",
      surfaceMutedColor: "#f3f4f6",
      foregroundColor: "#111827",
      textColor: "#374151",
      backgroundColor: "#ffffff",
      legalTextColor: "#6b7280",
    },
  },
];

export default function WebsiteThemesPage() {
  const [brandingJson, setBrandingJson] = useState("{}");
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>({
    configJson: "{}",
    uiSchemaJson: "{}",
    workflowJson: "{}",
    brandingJson: "{}",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.platform.tenantConfig.get();
      const data = response.data as Partial<TenantConfig> | null;
      const nextConfig = {
        configJson: data?.configJson || "{}",
        uiSchemaJson: data?.uiSchemaJson || "{}",
        workflowJson: data?.workflowJson || "{}",
        brandingJson: data?.brandingJson || "{}",
        notes: data?.notes || "",
      };
      setTenantConfig(nextConfig);
      setBrandingJson(nextConfig.brandingJson);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load theme settings.");
      setError(message);
      notifyError(message, "Themes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentTheme = useMemo(() => {
    try {
      const parsed = brandingJson ? (JSON.parse(brandingJson) as BrandingTheme) : {};
      return { ...defaultTheme, ...parsed };
    } catch {
      return defaultTheme;
    }
  }, [brandingJson]);

  const previewStyle = useMemo(() => brandingThemeToCssVars(currentTheme), [currentTheme]);

  const applyPreset = (theme: BrandingTheme) => {
    setBrandingJson(JSON.stringify(theme, null, 2));
  };

  const save = async () => {
    try {
      setSaving(true);
      await hrApi.platform.tenantConfig.update({
        configJson: tenantConfig.configJson,
        uiSchemaJson: tenantConfig.uiSchemaJson,
        workflowJson: tenantConfig.workflowJson,
        brandingJson,
        notes: tenantConfig.notes,
      });
      notifySuccess("Theme saved");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save theme settings.");
      setError(message);
      notifyError(message, "Themes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Themes"
      subtitle="Control the live branding JSON used by public pages and site chrome."
      eyebrow="Platform / Website"
      icon="palette"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Theme", value: brandingJson !== "{}" ? "Custom" : "Default" },
            { label: "Presets", value: themePresets.length, tone: "info" },
            { label: "Primary", value: currentTheme.primaryColor || "n/a", tone: "success" },
            { label: "Accent", value: currentTheme.accentColor || "n/a", tone: "warning" },
          ]}
        />
      }
      actions={
        <button type="button" onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary">
          Refresh
        </button>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Theme editor</h2>
              <p className="mt-1 text-sm text-slate-500">Edit the persisted branding payload used by public site shells.</p>
            </div>
          </div>
          <div className="erp-panel-body space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {themePresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.theme)}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.theme.primaryColor }} />
                    <span className="text-sm font-semibold text-slate-900">{preset.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{preset.theme.primaryColor} / {preset.theme.accentColor}</p>
                </button>
              ))}
            </div>

            <textarea
              className="erp-input min-h-80 font-mono text-sm"
              value={brandingJson}
              onChange={(e) => setBrandingJson(e.target.value)}
              placeholder='{"primaryColor":"#0f766e"}'
            />

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setBrandingJson("{}")} className="erp-action-btn erp-action-btn-secondary">
                Clear
              </button>
              <button type="button" onClick={() => void save()} disabled={saving || loading} className="erp-action-btn erp-action-btn-primary">
                {saving ? "Saving..." : "Save Theme"}
              </button>
            </div>
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Live preview</h2>
              <p className="mt-1 text-sm text-slate-500">Preview the active color system the public site will read.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" style={previewStyle}>
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Brand shell</p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">Website theme preview</h3>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: currentTheme.accentSoftColor, color: currentTheme.primaryColor }}>
                    Active palette
                  </span>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-2xl p-4" style={{ backgroundColor: currentTheme.surfaceMutedColor }}>
                  <p className="text-sm font-semibold" style={{ color: currentTheme.textColor }}>Primary button</p>
                  <button type="button" className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: currentTheme.primaryColor }}>
                    Sample CTA
                  </button>
                </div>
                <div className="rounded-2xl p-4" style={{ backgroundColor: currentTheme.surfaceColor }}>
                  <p className="text-sm font-semibold" style={{ color: currentTheme.textColor }}>Surface</p>
                  <p className="mt-2 text-sm" style={{ color: currentTheme.legalTextColor }}>Used by cards, headers, and system shells.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
