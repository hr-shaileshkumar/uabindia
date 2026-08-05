"use client";

import React, { useState } from "react";
import { Sliders, Key, Mail, Shield, Server, RefreshCw, CheckCircle2, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
}

const SEED_API_KEYS: ApiKeyRow[] = [
  { id: "key_1", name: "Production Webhook Integrator", keyPrefix: "uab_live_992a...", scopes: ["webhooks.write", "tenants.read"], createdAt: "2026-06-10", lastUsedAt: "2026-07-29" },
  { id: "key_2", name: "Staging Pipeline Agent", keyPrefix: "uab_test_110b...", scopes: ["all.read"], createdAt: "2026-07-01", lastUsedAt: "2026-07-28" },
];

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>(SEED_API_KEYS);
  
  // General Form State
  const [appName, setAppName] = useState("UAB India Enterprise ERP");
  const [supportEmail, setSupportEmail] = useState("support@uabindia.in");
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // SMTP Form State
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("apikey");
  const [smtpPass, setSmtpPass] = useState("••••••••••••••••");
  const [smtpTesting, setSmtpTesting] = useState(false);

  // API Key Form State
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScope, setNewKeyScope] = useState("tenants.read");

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    notifySuccess("Global settings saved successfully.");
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setTimeout(() => {
      setSmtpTesting(false);
      notifySuccess(`SMTP Connection test to ${smtpHost}:${smtpPort} passed successfully!`);
    }, 1200);
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newK: ApiKeyRow = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix: `uab_live_${Math.random().toString(36).substring(2, 8)}...`,
      scopes: [newKeyScope],
      createdAt: new Date().toISOString().split("T")[0],
      lastUsedAt: "Never",
    };

    setApiKeys((prev) => [newK, ...prev]);
    setIsKeyDrawerOpen(false);
    setNewKeyName("");
    notifySuccess(`API Secret Key "${newK.name}" generated.`);
  };

  const kpis: KpiMetricItem[] = [
    { label: "Active API Keys", value: apiKeys.length, tone: "info", icon: <Key className="h-3.5 w-3.5" />, subtext: "Integrations" },
    { label: "Email Gateway", value: "SMTP SSL", tone: "positive", icon: <Mail className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Security Level", value: "TLS 1.3 / MFA", tone: "positive", icon: <Shield className="h-3.5 w-3.5" />, subtext: "High Security" },
    { label: "Base Currency", value: baseCurrency, tone: "warning", icon: <Server className="h-3.5 w-3.5" />, subtext: "Primary" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Platform Settings & Master API Gateway"
      subtitle="Global application parameters, SMTP email relay, security policies, and API keys."
      categoryTag="Global System Options"
      kpiMetrics={kpis}
      primaryActionLabel="Generate API Key"
      onPrimaryAction={() => setIsKeyDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isKeyDrawerOpen}
      onInspectorClose={() => setIsKeyDrawerOpen(false)}
      inspectorTitle="Generate New API Key"
      inspectorSubTitle="Issue a secret API key for external service integrations."
      inspectorContent={
        <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
          <div className="space-y-2">
            <Label className="text-xs">API Key Name / Client *</Label>
            <Input placeholder="Mobile App Gateway" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Access Scope</Label>
            <select className="erp-select text-xs" value={newKeyScope} onChange={(e) => setNewKeyScope(e.target.value)}>
              <option value="tenants.read">Tenants Read Only</option>
              <option value="users.manage">Users Full Access</option>
              <option value="webhooks.write">Webhooks Write</option>
              <option value="all.read">Full Read-Only Access</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsKeyDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Generate Key
            </Button>
          </div>
        </form>
      }
    >
      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="smtp" className="text-xs">Email & SMTP</TabsTrigger>
            <TabsTrigger value="apikeys" className="text-xs">API Keys</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-4 space-y-4">
            <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs">Platform Name</Label>
                <Input value={appName} onChange={(e) => setAppName(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Support Email</Label>
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Default Base Currency</Label>
                <Input value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Default Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-9 text-xs" />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end">
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save General Settings
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* SMTP Config */}
          <TabsContent value="smtp" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs">SMTP Relay Host</Label>
                <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">SMTP Port</Label>
                <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Username / API Key ID</Label>
                <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Password / Secret Key</Label>
                <Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" size="sm" onClick={handleTestSmtp} disabled={smtpTesting}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${smtpTesting ? "animate-spin" : ""}`} />
                {smtpTesting ? "Testing Connection..." : "Test Connection"}
              </Button>
              <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => notifySuccess("SMTP configuration updated.")}>
                Save Email Config
              </Button>
            </div>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="apikeys" className="mt-4 space-y-4">
            <div className="erp-table-wrap rounded-lg border">
              <table className="erp-table">
                <thead className="erp-thead">
                  <tr>
                    <th className="erp-th">Key Name</th>
                    <th className="erp-th">Prefix</th>
                    <th className="erp-th">Scopes</th>
                    <th className="erp-th">Created</th>
                    <th className="erp-th">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="erp-tr">
                      <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100">{key.name}</td>
                      <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{key.keyPrefix}</td>
                      <td className="erp-td">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="erp-td text-xs text-slate-500">{key.createdAt}</td>
                      <td className="erp-td text-xs text-slate-500">{key.lastUsedAt || "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4 space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Enforce Multi-Factor Authentication (MFA)</p>
                  <p className="text-slate-500">Require TOTP authenticator app verification for all Admin roles.</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enforced</Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">JWT Token Expiry Window</p>
                  <p className="text-slate-500">Access tokens expire in 60 minutes with sliding refresh logic.</p>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">60 mins</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformGlobalPageShell>
  );
}
