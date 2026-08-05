"use client";

import React, { useState } from "react";
import { Layers, Plus, Eye, Globe, ShieldCheck, Cpu, HardDrive, DollarSign, LogIn, CheckCircle2, AlertTriangle, Lock, FileText, Bell, Activity, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface TenantRow {
  id: string;
  tenantCode: string;
  name: string;
  legalName: string;
  domain: string;
  plan: "Enterprise Scale" | "Business Pro" | "Starter";
  status: "Active" | "Suspended" | "Archived";
  storageUsed: string;
  storageLimit: string;
  userCount: number;
  userLimit: number;
  healthScore: number;
  createdAt: string;
  renewalDate: string;
}

const SEED_TENANTS: TenantRow[] = [
  { id: "ten_1", tenantCode: "TNT-APEX", name: "Apex Global Enterprises", legalName: "Apex Global Systems Corp", domain: "apex.uabindia.com", plan: "Enterprise Scale", status: "Active", storageUsed: "42.8 GB", storageLimit: "500 GB", userCount: 1420, userLimit: 2500, healthScore: 99, createdAt: "2024-01-15", renewalDate: "2027-01-15" },
  { id: "ten_2", tenantCode: "TNT-NEXUS", name: "Nexus Logistics Solutions", legalName: "Nexus Logistics Private Limited", domain: "nexus.uabindia.com", plan: "Business Pro", status: "Active", storageUsed: "18.2 GB", storageLimit: "100 GB", userCount: 380, userLimit: 500, healthScore: 96, createdAt: "2024-03-20", renewalDate: "2026-11-20" },
  { id: "ten_3", tenantCode: "TNT-ORION", name: "Orion Retail Networks", legalName: "Orion Retail India Ltd", domain: "orion.uabindia.com", plan: "Starter", status: "Active", storageUsed: "4.1 GB", storageLimit: "25 GB", userCount: 45, userLimit: 50, healthScore: 94, createdAt: "2025-06-10", renewalDate: "2026-06-10" },
];

export default function TenantsControlPlanePage() {
  const [tenants, setTenants] = useState<TenantRow[]>(SEED_TENANTS);
  const [search, setSearch] = useState("");

  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(SEED_TENANTS[0]);
  const [activeTab, setActiveTab] = useState("general");

  // Wizard Drawer State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizName, setWizName] = useState("");
  const [wizCode, setWizCode] = useState("");
  const [wizAdminEmail, setWizAdminEmail] = useState("");
  const [wizPlan, setWizPlan] = useState<"Enterprise Scale" | "Business Pro" | "Starter">("Business Pro");

  const handleNextStep = () => {
    if (wizardStep < 5) setWizardStep((prev) => prev + 1);
  };

  const handleCreateTenantFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizName.trim()) return;

    const newTen: TenantRow = {
      id: `ten_${Date.now()}`,
      tenantCode: wizCode.trim().toUpperCase() || `TNT-0${tenants.length + 1}`,
      name: wizName.trim(),
      legalName: `${wizName.trim()} Private Limited`,
      domain: `${wizName.trim().toLowerCase().replace(/\s+/g, "")}.uabindia.com`,
      plan: wizPlan,
      status: "Active",
      storageUsed: "0.1 GB",
      storageLimit: wizPlan === "Enterprise Scale" ? "500 GB" : "100 GB",
      userCount: 1,
      userLimit: wizPlan === "Enterprise Scale" ? 2500 : 500,
      healthScore: 100,
      createdAt: new Date().toISOString().split("T")[0],
      renewalDate: "2027-08-05",
    };

    setTenants((prev) => [newTen, ...prev]);
    setSelectedTenant(newTen);
    setIsWizardOpen(false);
    setWizardStep(1);
    setWizName("");
    setWizCode("");
    setWizAdminEmail("");
    notifySuccess(`Tenant "${newTen.name}" provisioned successfully with database schema isolation.`);
  };

  const handleImpersonateLogin = (tenantName: string) => {
    notifySuccess(`Generating secure admin session token... Logging in as Tenant Admin for "${tenantName}".`);
  };

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.tenantCode.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Tenants", value: tenants.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Multi-Tenant Cloud" },
    { label: "License Seats Provisioned", value: tenants.reduce((acc, t) => acc + t.userLimit, 0), tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Allocated Seats" },
    { label: "Total Storage Managed", value: "65.1 GB", tone: "warning", icon: <HardDrive className="h-3.5 w-3.5" />, subtext: "Encrypted S3 Vault" },
    { label: "Average Health Score", value: "96.3%", tone: "positive", icon: <Activity className="h-3.5 w-3.5" />, subtext: "Optimal Uptime" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Tenant Control Plane & Cloud Isolation Engine"
      subtitle="Enterprise Multi-Tenant SaaS Engine for provisioning tenant environments, database schema isolation, subscription limits, custom domains, and live health telemetry."
      categoryTag="Platform Admin: Tenant Control Plane"
      kpiMetrics={kpis}
      searchPlaceholder="Filter tenant code, business name, or domain..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Provision New Tenant (Wizard)"
      onPrimaryAction={() => {
        setWizardStep(1);
        setIsWizardOpen(true);
      }}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="p-6 grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        {/* Left: Tenant Directory Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Tenant Directory ({filteredTenants.length})</span>
          </h3>

          <div className="space-y-2">
            {filteredTenants.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTenant(t)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedTenant?.id === t.id
                    ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-1.5 truncate">
                    <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                    {t.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0">{t.tenantCode}</Badge>
                </div>
                <p className="mt-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 truncate">{t.domain}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.plan}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.userCount} / {t.userLimit} Users</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 12-Tab Tenant Master Profile */}
        {selectedTenant ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  {selectedTenant.name} ({selectedTenant.tenantCode})
                </h2>
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{selectedTenant.domain}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleImpersonateLogin(selectedTenant.name)}>
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Login as Tenant
                </Button>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{selectedTenant.status}</Badge>
              </div>
            </div>

            {/* 12 Master Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs gap-1">
                <TabsTrigger value="general" className="text-xs py-1.5 px-3">General</TabsTrigger>
                <TabsTrigger value="subscription" className="text-xs py-1.5 px-3">Subscription & Seats</TabsTrigger>
                <TabsTrigger value="modules" className="text-xs py-1.5 px-3">Modules</TabsTrigger>
                <TabsTrigger value="domains" className="text-xs py-1.5 px-3">Custom Domains</TabsTrigger>
                <TabsTrigger value="branding" className="text-xs py-1.5 px-3">Branding</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs py-1.5 px-3">Localization</TabsTrigger>
                <TabsTrigger value="security" className="text-xs py-1.5 px-3">Security & IP</TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs py-1.5 px-3">Integrations</TabsTrigger>
                <TabsTrigger value="data" className="text-xs py-1.5 px-3">Data & Backups</TabsTrigger>
                <TabsTrigger value="automation" className="text-xs py-1.5 px-3">Automation</TabsTrigger>
                <TabsTrigger value="telemetry" className="text-xs py-1.5 px-3">Telemetry</TabsTrigger>
                <TabsTrigger value="audit" className="text-xs py-1.5 px-3">Audit & Lifecycle</TabsTrigger>
              </TabsList>

              {/* Tab 1: General */}
              <TabsContent value="general" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <div><span className="text-slate-500">Legal Entity Name:</span> <p className="font-bold text-slate-900 dark:text-slate-100">{selectedTenant.legalName}</p></div>
                  <div><span className="text-slate-500">Tenant Code:</span> <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedTenant.tenantCode}</p></div>
                  <div><span className="text-slate-500">Primary Tenant Domain:</span> <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedTenant.domain}</p></div>
                  <div><span className="text-slate-500">Provisioning Date:</span> <p className="font-mono text-slate-700 dark:text-slate-300">{selectedTenant.createdAt}</p></div>
                </div>
              </TabsContent>

              {/* Tab 2: Subscription & Seats */}
              <TabsContent value="subscription" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <div><span className="text-slate-500">Assigned Plan Tier:</span> <p className="font-bold text-indigo-600 text-sm">{selectedTenant.plan}</p></div>
                  <div><span className="text-slate-500">User Seats Utilization:</span> <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedTenant.userCount} / {selectedTenant.userLimit} Seats ({Math.round((selectedTenant.userCount / selectedTenant.userLimit) * 100)}%)</p></div>
                  <div><span className="text-slate-500">Storage Storage Limit:</span> <p className="font-mono font-bold text-amber-600">{selectedTenant.storageUsed} / {selectedTenant.storageLimit}</p></div>
                  <div><span className="text-slate-500">Subscription Renewal:</span> <p className="font-mono text-emerald-600 font-bold">{selectedTenant.renewalDate}</p></div>
                </div>
              </TabsContent>

              {/* Tab 3: Modules */}
              <TabsContent value="modules" className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="font-bold">Core HRMS Suite</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="font-bold">Payroll & Statutory Compliance</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="font-bold">ATS Recruitment Pipeline</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-bold">AI Copilot Intelligence</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600">Enabled</Badge>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Custom Domains */}
              <TabsContent value="domains" className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Custom Domain CNAME Mapping</p>
                      <p className="font-mono text-indigo-600">hrms.{selectedTenant.name.toLowerCase().replace(/\s+/g, "")}.com</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">SSL Certificate Active</Badge>
                  </div>
                </div>
              </TabsContent>

              {/* Other Tabs */}
              <TabsContent value="branding" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Tenant Specific Custom Branding Logo & Dark Theme Color Palette enabled.
              </TabsContent>
              <TabsContent value="settings" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Timezone: Asia/Kolkata • Date Format: DD/MM/YYYY • Financial Year: April - March.
              </TabsContent>
              <TabsContent value="security" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                MFA Enforced • Allowed IP Whitelist: 203.0.113.0/24 • Session Timeout: 30 Minutes.
              </TabsContent>
              <TabsContent value="integrations" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Azure AD SSO Active • WhatsApp Gateway Connected • SendGrid SMTP API Ready.
              </TabsContent>
              <TabsContent value="data" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Daily Automated Database Snapshots • Point-in-time Recovery (PITR) enabled.
              </TabsContent>
              <TabsContent value="automation" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Workflow Approval Engine Active • Scheduled Cron Jobs: Daily 06:00 AM Sync.
              </TabsContent>
              <TabsContent value="telemetry" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Health Score: {selectedTenant.healthScore}% • CPU Usage: 4.2% • API Latency: 45ms.
              </TabsContent>
              <TabsContent value="audit" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Audit Stream: Immutable System Log Stream • Retention: 365 Days.
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            Select a tenant to view cloud control plane configuration.
          </div>
        )}
      </div>

      {/* 5-Step Provisioning Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Provision New Tenant — Step {wizardStep} of 5
              </h3>
              <Badge variant="outline">Step {wizardStep}</Badge>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-3 text-xs">
                <Label>Business Name</Label>
                <Input placeholder="e.g. Acme Global Industries" value={wizName} onChange={(e) => setWizName(e.target.value)} />
                <Label>Tenant Code</Label>
                <Input placeholder="e.g. TNT-ACME" value={wizCode} onChange={(e) => setWizCode(e.target.value)} />
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <Label>Primary Admin Email</Label>
                <Input placeholder="admin@acme.com" value={wizAdminEmail} onChange={(e) => setWizAdminEmail(e.target.value)} />
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3 text-xs">
                <Label>Select Subscription Plan</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={wizPlan === "Starter" ? "default" : "outline"} size="sm" onClick={() => setWizPlan("Starter")}>Starter</Button>
                  <Button variant={wizPlan === "Business Pro" ? "default" : "outline"} size="sm" onClick={() => setWizPlan("Business Pro")}>Business Pro</Button>
                  <Button variant={wizPlan === "Enterprise Scale" ? "default" : "outline"} size="sm" onClick={() => setWizPlan("Enterprise Scale")}>Enterprise Scale</Button>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">Default cloud branding & theme settings applied.</p>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-3 text-xs p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200">
                <p className="font-bold text-emerald-700 dark:text-emerald-400">Ready to provision database schema & environment!</p>
                <p className="text-slate-600 dark:text-slate-400">Name: {wizName} ({wizCode}) • Plan: {wizPlan}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setIsWizardOpen(false)}>Cancel</Button>
              {wizardStep < 5 ? (
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleNextStep}>
                  Next Step <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateTenantFinal}>
                  Provision Tenant Environment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PlatformGlobalPageShell>
  );
}
