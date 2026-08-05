"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, Users, ShieldCheck, Activity, Layers, SlidersHorizontal, 
  Globe, Bell, Database, HardDrive, RefreshCw, FileText, ArrowRight, ShieldAlert
} from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ModuleShortcut {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  category: string;
}

const MODULE_SHORTCUTS: ModuleShortcut[] = [
  { title: "Companies", subtitle: "Legal entity setup & tax registration", href: "/platform/companies", icon: <Building2 className="h-5 w-5 text-indigo-500" />, category: "Governance" },
  { title: "Tenants", subtitle: "Multi-tenant provisioning & licensing", href: "/platform/tenants", icon: <Layers className="h-5 w-5 text-sky-500" />, category: "Governance", badge: "Multi-Tenant" },
  { title: "Projects", subtitle: "Workspace scopes & project limits", href: "/platform/projects", icon: <Activity className="h-5 w-5 text-emerald-500" />, category: "Governance" },
  { title: "User Directory", subtitle: "Identity management & active users", href: "/platform/users", icon: <Users className="h-5 w-5 text-amber-500" />, category: "Access Control" },
  { title: "Roles & RBAC", subtitle: "Role-permission matrix & module switches", href: "/platform/roles", icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />, category: "Access Control" },
  { title: "Navigation Registry", subtitle: "Menu builder & router path mapper", href: "/platform/menu-builder", icon: <SlidersHorizontal className="h-5 w-5 text-rose-500" />, category: "Access Control" },
  { title: "Schema Manager", subtitle: "Dynamic entity schema & custom fields", href: "/platform/schema-manager", icon: <Database className="h-5 w-5 text-cyan-500" />, category: "Configuration" },
  { title: "System Settings", subtitle: "Global options, security, & API keys", href: "/platform/settings", icon: <SlidersHorizontal className="h-5 w-5 text-slate-500" />, category: "Configuration" },
  { title: "Feature Flags", subtitle: "Real-time capability switches", href: "/platform/feature-flags", icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />, category: "Configuration", badge: "Live Switched" },
  { title: "Notification Templates", subtitle: "Email & SMS notification designer", href: "/platform/notification-templates", icon: <Bell className="h-5 w-5 text-purple-500" />, category: "Communication" },
  { title: "Website Portal CMS", subtitle: "Pages, templates, themes & SEO settings", href: "/platform/website/pages", icon: <Globe className="h-5 w-5 text-blue-500" />, category: "CMS Portal" },
  { title: "System Telemetry", subtitle: "CPU/RAM health & database latency", href: "/platform/system-health", icon: <Activity className="h-5 w-5 text-emerald-500" />, category: "Operations" },
  { title: "Audit Logs", subtitle: "Immutable governance & payload stream", href: "/platform/audit-logs", icon: <FileText className="h-5 w-5 text-amber-500" />, category: "Operations" },
  { title: "Recycle Bin", subtitle: "Soft-deleted records & recovery center", href: "/platform/recycle-bin", icon: <HardDrive className="h-5 w-5 text-rose-500" />, category: "Operations" },
];

export default function PlatformOverviewPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredShortcuts = MODULE_SHORTCUTS.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Submodules", value: 14, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Platform Hub" },
    { label: "Registered Tenants", value: 24, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Live Tenants" },
    { label: "Active User Licenses", value: "1,420", tone: "warning", icon: <Users className="h-3.5 w-3.5" />, subtext: "Capacity 200k" },
    { label: "System Health", value: "99.98%", tone: "positive", icon: <Activity className="h-3.5 w-3.5" />, subtext: "Optimal" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Platform Administration Hub"
      subtitle="Centralized management portal for tenant governance, access control, system configurations, and telemetry."
      categoryTag="Platform Governance Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter platform submodules, capabilities, or administrative tools..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "category",
          label: "All Categories",
          value: categoryFilter,
          onChange: setCategoryFilter,
          options: [
            { label: "All Categories", value: "all" },
            { label: "Governance", value: "Governance" },
            { label: "Access Control", value: "Access Control" },
            { label: "Configuration", value: "Configuration" },
            { label: "Communication", value: "Communication" },
            { label: "CMS Portal", value: "CMS Portal" },
            { label: "Operations", value: "Operations" },
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
