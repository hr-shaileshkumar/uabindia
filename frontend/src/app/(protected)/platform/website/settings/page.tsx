"use client";

import React, { useState } from "react";
import { Globe, Shield, Activity, RefreshCw, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { notifySuccess } from "@/lib/notifications";

export default function WebsiteSettingsPage() {
  const [domain, setDomain] = useState("uabindia.com");
  const [gaId, setGaId] = useState("G-998201029");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    notifySuccess("Website domain & analytics settings saved.");
  };

  const kpis: KpiMetricItem[] = [
    { label: "Custom Domain", value: domain, tone: "positive", icon: <Globe className="h-3.5 w-3.5" />, subtext: "SSL Active" },
    { label: "Analytics", value: "GA4 Connected", tone: "info", icon: <Activity className="h-3.5 w-3.5" />, subtext: "Telemetry" },
    { label: "Maintenance", value: maintenanceMode ? "ON" : "OFF", tone: maintenanceMode ? "warning" : "positive", icon: <Shield className="h-3.5 w-3.5" />, subtext: "Status" },
    { label: "Sitemap Index", value: "Auto-Generated", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "SEO Ready" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Portal Website Settings & Domain Mapping"
      subtitle="Configure domain DNS mapping, Google Analytics tracking, robots.txt, and maintenance mode status."
      categoryTag="Website CMS Engine"
      kpiMetrics={kpis}
    >
      <div className="p-6 max-w-3xl space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="space-y-2">
            <Label className="text-xs">Primary Portal Custom Domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Google Analytics GA4 Measurement ID</Label>
            <Input value={gaId} onChange={(e) => setGaId(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</p>
              <p className="text-slate-500">Temporarily redirect public portal visitors to a maintenance screen.</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className={erpButtonClassName.primary}>
              Save Website Settings
            </button>
          </div>
        </form>
      </div>
    </PlatformGlobalPageShell>
  );
}
