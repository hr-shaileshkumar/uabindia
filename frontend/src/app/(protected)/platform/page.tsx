"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, Users, ShieldCheck, Activity, Layers, SlidersHorizontal, 
  Globe, Bell, Database, HardDrive, FileText, ArrowRight, Code2, Bot, 
  CreditCard, Key, ShieldAlert, Lock, RefreshCw, Cpu
} from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { Badge } from "@/components/ui/badge";

interface ModuleShortcut {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  category: string;
  badge?: string;
}

const MASTER_SHORTCUTS: ModuleShortcut[] = [
  // 1. Dashboard
  { title: "Admin Overview", subtitle: "Platform KPI metrics & live event stream", href: "/platform", icon: <Activity className="h-5 w-5 text-indigo-500" />, category: "Dashboard" },
  // 2. Organization
  { title: "Tenants", subtitle: "Multi-tenant provisioning & resource limits", href: "/platform/tenants", icon: <Layers className="h-5 w-5 text-sky-500" />, category: "Organization", badge: "Multi-Tenant" },
  { title: "Companies", subtitle: "Legal entity setup, GST/Tax registration", href: "/platform/companies", icon: <Building2 className="h-5 w-5 text-indigo-500" />, category: "Organization" },
  { title: "Projects", subtitle: "Workspace scopes & project budgets", href: "/platform/projects", icon: <Activity className="h-5 w-5 text-emerald-500" />, category: "Organization" },
  { title: "Branches & Warehouses", subtitle: "Branch office locations & GSTIN mapping", href: "/platform/branches", icon: <Building2 className="h-5 w-5 text-amber-500" />, category: "Organization" },
  { title: "Departments", subtitle: "Cost centers & org hierarchy levels", href: "/platform/departments", icon: <Layers className="h-5 w-5 text-purple-500" />, category: "Organization" },

  // 3. Identity & Access
  { title: "User Directory", subtitle: "Identity management & active users", href: "/platform/users", icon: <Users className="h-5 w-5 text-amber-500" />, category: "Identity & Access" },
  { title: "Roles & RBAC Matrix", subtitle: "Permission matrix & module switches", href: "/platform/roles", icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />, category: "Identity & Access" },
  { title: "Permissions Catalog", subtitle: "Granular capability key list", href: "/platform/permissions", icon: <Lock className="h-5 w-5 text-rose-500" />, category: "Identity & Access" },
  { title: "User Groups", subtitle: "Team access groups & cross-functional roles", href: "/platform/user-groups", icon: <Users className="h-5 w-5 text-sky-500" />, category: "Identity & Access" },
  { title: "Navigation Registry", subtitle: "22-Category sidebar menu builder", href: "/platform/menu-builder", icon: <SlidersHorizontal className="h-5 w-5 text-cyan-500" />, category: "Identity & Access" },

  // 4. Low-Code Platform
  { title: "Schema Manager", subtitle: "Dynamic entity schema & custom fields", href: "/platform/schema-manager", icon: <Database className="h-5 w-5 text-cyan-500" />, category: "Low-Code Platform" },
  { title: "Entity Builder", subtitle: "Visual entity builder & custom validation", href: "/platform/entity-builder", icon: <Code2 className="h-5 w-5 text-emerald-500" />, category: "Low-Code Platform", badge: "Low-Code" },

  // 5. Configurations & Automation
  { title: "Feature Flags", subtitle: "Real-time capability switches & rollout", href: "/platform/feature-flags", icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />, category: "Modules", badge: "Live Switched" },
  { title: "Workflow Config", subtitle: "BPMN approval rules & triggers", href: "/platform/workflow-config", icon: <Activity className="h-5 w-5 text-purple-500" />, category: "Workflow & Automation" },
  { title: "Notification Templates", subtitle: "Email, SMS & Push template designer", href: "/platform/notification-templates", icon: <Bell className="h-5 w-5 text-purple-500" />, category: "Workflow & Automation" },

  // 6. Website CMS
  { title: "Website Portal Pages", subtitle: "Marketing CMS pages & SEO metadata", href: "/platform/website/pages", icon: <Globe className="h-5 w-5 text-blue-500" />, category: "Website CMS" },

  // 7. Integrations & Security
  { title: "Integrations & Connectors", subtitle: "Third-party APIs (Stripe, Razorpay, WhatsApp, M365)", href: "/platform/integrations/connectors", icon: <Key className="h-5 w-5 text-indigo-500" />, category: "Integrations" },
  { title: "System Settings", subtitle: "Global options, SMTP, & API keys", href: "/platform/settings", icon: <SlidersHorizontal className="h-5 w-5 text-slate-500" />, category: "Platform Configuration" },
  { title: "Security & Sessions", subtitle: "MFA enforcement, SSO, & Active sessions", href: "/platform/security/sessions", icon: <ShieldAlert className="h-5 w-5 text-rose-500" />, category: "Security" },

  // 8. Developer Center & AI Config
  { title: "Developer Center", subtitle: "API Explorer, OpenAPI/Swagger & SDKs", href: "/platform/developer-center", icon: <Code2 className="h-5 w-5 text-indigo-500" />, category: "Developer Center", badge: "OpenAPI 3.0" },
  { title: "AI Assistant Config", subtitle: "LLM Providers, AI Agents & Prompts", href: "/platform/ai-assistant", icon: <Bot className="h-5 w-5 text-purple-500" />, category: "AI Configuration", badge: "AI Native" },

  // 9. Operations, Licensing & Data
  { title: "Licensing & Plans", subtitle: "Subscription plans, billing & seat usage", href: "/platform/licensing", icon: <CreditCard className="h-5 w-5 text-emerald-500" />, category: "Licensing" },
  { title: "Backup & Recovery", subtitle: "Backup schedules & disaster recovery", href: "/platform/backup", icon: <HardDrive className="h-5 w-5 text-sky-500" />, category: "Backup & Recovery" },
  { title: "Data Management", subtitle: "Import/Export & Migration center", href: "/platform/data-management", icon: <Database className="h-5 w-5 text-amber-500" />, category: "Data Management" },
  { title: "System Telemetry", subtitle: "CPU/RAM health & DB latency", href: "/platform/system-health", icon: <Cpu className="h-5 w-5 text-emerald-500" />, category: "Monitoring" },
  { title: "Audit Logs", subtitle: "Immutable governance event stream", href: "/platform/audit-logs", icon: <FileText className="h-5 w-5 text-amber-500" />, category: "Audit & Compliance" },
  { title: "Recycle Bin", subtitle: "Soft-deleted records & recovery center", href: "/platform/recycle-bin", icon: <HardDrive className="h-5 w-5 text-rose-500" />, category: "Recycle Bin" },
];

export default function PlatformOverviewPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredShortcuts = MASTER_SHORTCUTS.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Master Architecture", value: "22 Categories", tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Enterprise Standard" },
    { label: "Registered Submodules", value: MASTER_SHORTCUTS.length, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Hub Modules" },
    { label: "Active User Licenses", value: "1,420", tone: "warning", icon: <Users className="h-3.5 w-3.5" />, subtext: "Capacity 200k" },
    { label: "System Telemetry", value: "99.99%", tone: "positive", icon: <Activity className="h-3.5 w-3.5" />, subtext: "Operational" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Master Enterprise SaaS Platform Hub"
      subtitle="Centralized management portal for multi-tenant governance, low-code platform, AI services, security, and developer center."
      categoryTag="22-Category SaaS Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter across all 22 categories, submodules, or administrative tools..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "category",
          label: "All 22 Categories",
          value: categoryFilter,
          onChange: setCategoryFilter,
          options: [
            { label: "All Categories", value: "all" },
            { label: "Organization", value: "organization" },
            { label: "Identity & Access", value: "identity & access" },
            { label: "Low-Code Platform", value: "low-code platform" },
            { label: "Workflow & Automation", value: "workflow & automation" },
            { label: "Integrations", value: "integrations" },
            { label: "Security", value: "security" },
            { label: "Developer Center", value: "developer center" },
            { label: "AI Configuration", value: "ai configuration" },
            { label: "Monitoring", value: "monitoring" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setCategoryFilter("all");
      }}
    >
      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredShortcuts.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                {item.badge ? (
                  <Badge variant="outline" className="text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200">
                    {item.badge}
                  </Badge>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Open Submodule</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}

        {filteredShortcuts.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            No platform submodules match your filter criteria.
          </div>
        )}
      </div>
    </PlatformGlobalPageShell>
  );
}
