"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PlatformGlobalPageShell } from "@/components/platform/PlatformGlobalPageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ERPFormGrid, ERPFormField } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { erpButtonClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { platformApi } from "@/services/modules/platform";
import { Globe, Palette, Code, CheckCircle2, Building2, Upload } from "lucide-react";

type TenantConfigPayload = {
  configJson: string;
  uiSchemaJson: string;
  workflowJson: string;
  brandingJson: string;
  notes?: string | null;
};

interface VisualBrandingState {
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  supportEmail: string;
  supportPhone: string;
  customDomain: string;
  footerText: string;
}

const defaultVisualBranding: VisualBrandingState = {
  brandName: "UabIndia ERP",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  primaryColor: "#4f46e5",
  supportEmail: "support@uabindia.in",
  supportPhone: "+91 98765 43210",
  customDomain: "",
  footerText: "© 2026 UabIndia. All rights reserved.",
};

const emptyConfig = (): TenantConfigPayload => ({
  configJson: "{}",
  uiSchemaJson: "{}",
  workflowJson: "{}",
  brandingJson: "{}",
  notes: "",
});

const readConfig = (raw: Record<string, unknown> | null | undefined): TenantConfigPayload => {
  if (!raw) return emptyConfig();
  const str = (a: unknown, b: unknown, fallback = "{}") => String(a ?? b ?? fallback);
  return {
    configJson: str(raw.configJson, raw.ConfigJson),
    uiSchemaJson: str(raw.uiSchemaJson, raw.UiSchemaJson),
    workflowJson: str(raw.workflowJson, raw.WorkflowJson),
    brandingJson: str(raw.brandingJson, raw.BrandingJson),
    notes: String(raw.notes ?? raw.Notes ?? ""),
  };
};

export default function WebsiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");
  const [form, setForm] = useState<TenantConfigPayload>(emptyConfig());
  const [visual, setVisual] = useState<VisualBrandingState>(defaultVisualBranding);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformApi.admin.tenantConfig.get();
      const cfg = readConfig(res.data as Record<string, unknown>);
      setForm(cfg);

      try {
        const parsedBranding = JSON.parse(cfg.brandingJson || "{}");
        setVisual({
          brandName: parsedBranding.brandName || parsedBranding.companyName || defaultVisualBranding.brandName,
          logoUrl: parsedBranding.logoUrl || defaultVisualBranding.logoUrl,
          faviconUrl: parsedBranding.faviconUrl || defaultVisualBranding.faviconUrl,
          primaryColor: parsedBranding.primaryColor || defaultVisualBranding.primaryColor,
          supportEmail: parsedBranding.supportEmail || defaultVisualBranding.supportEmail,
          supportPhone: parsedBranding.supportPhone || defaultVisualBranding.supportPhone,
          customDomain: parsedBranding.customDomain || defaultVisualBranding.customDomain,
          footerText: parsedBranding.footerText || defaultVisualBranding.footerText,
        });
      } catch {
        setVisual(defaultVisualBranding);
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load tenant website config."));
      setForm(emptyConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const syncVisualToBrandingJson = (updatedVisual: VisualBrandingState) => {
    setVisual(updatedVisual);
    setForm((f) => ({
      ...f,
      brandingJson: JSON.stringify(updatedVisual, null, 2),
    }));
  };

  const handleSave = async () => {
    for (const [label, value] of [
      ["Config JSON", form.configJson],
      ["UI schema JSON", form.uiSchemaJson],
      ["Workflow JSON", form.workflowJson],
      ["Branding JSON", form.brandingJson],
    ] as const) {
      try {
        JSON.parse(value || "{}");
      } catch {
        notifyError(`${label} is invalid JSON.`);
        return;
      }
    }
    try {
      setSaving(true);
      await platformApi.admin.tenantConfig.update({
        configJson: form.configJson,
        uiSchemaJson: form.uiSchemaJson,
        workflowJson: form.workflowJson,
        brandingJson: form.brandingJson,
        notes: form.notes || null,
      });
      notifySuccess("Website branding & tenant configuration saved.");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save config."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlatformGlobalPageShell
      title="Website & branding settings"
      subtitle="Customize your white-labeled portal branding, logo, colors, support contacts, and custom domain."
      categoryTag="Platform / CMS"
      icon="globe"
      kpiMetrics={[
        { label: "Brand entity", value: visual.brandName || "UabIndia", tone: "info", icon: <Building2 className="h-3.5 w-3.5" /> },
        { label: "Theme color", value: visual.primaryColor, tone: "positive", icon: <Palette className="h-3.5 w-3.5" /> },
        { label: "CMS Status", value: "Live Synced", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
      ]}
      onRefresh={() => void load()}
      isLoading={loading}
      primaryActionLabel={saving ? "Saving…" : "Save configuration"}
      onPrimaryAction={() => void handleSave()}
    >
      <div className="space-y-6 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Visual Branding
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Advanced JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-5 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                  Brand Identity & Identity Details
                </h3>

                <ERPFormGrid columns={2}>
                  <ERPFormField label="Brand / Company Display Name" required>
                    <Input
                      value={visual.brandName}
                      onChange={(e) =>
                        syncVisualToBrandingJson({ ...visual, brandName: e.target.value })
                      }
                      placeholder="e.g. Tata Consultancy Services"
                    />
                  </ERPFormField>

                  <ERPFormField label="Logo URL or Asset Path">
                    <Input
                      value={visual.logoUrl}
                      onChange={(e) =>
                        syncVisualToBrandingJson({ ...visual, logoUrl: e.target.value })
                      }
                      placeholder="/logo.png or https://cdn.company.com/logo.svg"
                    />
                  </ERPFormField>

                  <ERPFormField label="Support Email">
                    <Input
                      type="email"
                      value={visual.supportEmail}
                      onChange={(e) =>
                        syncVisualToBrandingJson({ ...visual, supportEmail: e.target.value })
                      }
                      placeholder="support@company.com"
                    />
                  </ERPFormField>

                  <ERPFormField label="Support Hotline Phone">
                    <Input
                      value={visual.supportPhone}
                      onChange={(e) =>
                        syncVisualToBrandingJson({ ...visual, supportPhone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                    />
                  </ERPFormField>

                  <ERPFormField label="Primary Brand Color">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={visual.primaryColor}
                        onChange={(e) =>
                          syncVisualToBrandingJson({ ...visual, primaryColor: e.target.value })
                        }
                        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                      />
                      <Input
                        value={visual.primaryColor}
                        onChange={(e) =>
                          syncVisualToBrandingJson({ ...visual, primaryColor: e.target.value })
                        }
                        placeholder="#4f46e5"
                        className="font-mono"
                      />
                    </div>
                  </ERPFormField>

                  <ERPFormField label="Custom White-label Domain">
                    <Input
                      value={visual.customDomain}
                      onChange={(e) =>
                        syncVisualToBrandingJson({ ...visual, customDomain: e.target.value })
                      }
                      placeholder="portal.clientcompany.com"
                    />
                  </ERPFormField>

                  <div className="col-span-2">
                    <ERPFormField label="Footer Copyright Notice">
                      <Input
                        value={visual.footerText}
                        onChange={(e) =>
                          syncVisualToBrandingJson({ ...visual, footerText: e.target.value })
                        }
                        placeholder="© 2026 Acme Corp. All rights reserved."
                      />
                    </ERPFormField>
                  </div>
                </ERPFormGrid>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Live Public Header Preview
                </h3>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs"
                        style={{ backgroundColor: visual.primaryColor }}
                      >
                        {visual.brandName.charAt(0) || "U"}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{visual.brandName}</span>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: visual.primaryColor }}
                    >
                      Workspace
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <p>📧 {visual.supportEmail}</p>
                    <p>📞 {visual.supportPhone}</p>
                    {visual.customDomain ? (
                      <p className="font-mono text-[11px] text-indigo-600">🌐 {visual.customDomain}</p>
                    ) : null}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    {visual.footerText}
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-900 leading-relaxed">
                  💡 <strong>Enterprise White-Labeling:</strong> जब आप सेटिंग्स सेव करेंगे, तो पब्लिक पेजेस (Careers, Contact, Login, Header/Footer) तुरंत आपकी ब्रांडिंग और लोगो में अपडेट हो जाएँगे।
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-5 space-y-4">
            <p className="text-xs text-slate-500">
              Direct JSON editor for low-code schema managers, workflow engines, and core ERP tenant configurations.
            </p>
            {(
              [
                ["brandingJson", "Branding JSON"],
                ["configJson", "Config JSON"],
                ["uiSchemaJson", "UI schema JSON"],
                ["workflowJson", "Workflow JSON"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">{label}</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={4}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            className={erpButtonClassName.secondary}
            onClick={() => void load()}
            disabled={loading || saving}
          >
            Reset
          </button>
          <button
            type="button"
            className={erpButtonClassName.primary}
            onClick={() => void handleSave()}
            disabled={loading || saving}
          >
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
