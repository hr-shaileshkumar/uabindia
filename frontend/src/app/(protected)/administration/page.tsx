"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Users,
  Grid,
  Database,
  GitBranch,
  Bell,
  Plug,
  ShieldCheck,
  Activity,
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
  KeyRound,
  FileCode2,
  SlidersHorizontal,
  Lock,
  Workflow,
  Server,
  FileText,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { findFrontendModuleMap } from "@/lib/workspace/frontend-module-map";
import { ROUTES } from "@/constants/routes";

interface PillarMeta {
  key: string;
  label: string;
  icon: any;
  color: string;
  bgLight: string;
  borderColor: string;
  accentBadge: string;
}

const PILLAR_CONFIGS: Record<string, PillarMeta> = {
  "tenant-org": {
    key: "tenant-org",
    label: "Tenant & Org Hierarchy",
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50/70 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/60",
    accentBadge: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  iam: {
    key: "iam",
    label: "Identity & Access (IAM)",
    icon: KeyRound,
    color: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50/70 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/60",
    accentBadge: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  "app-engine": {
    key: "app-engine",
    label: "Module & App Engine",
    icon: Grid,
    color: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50/70 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800/60",
    accentBadge: "bg-purple-100/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  "metadata-engine": {
    key: "metadata-engine",
    label: "Metadata & Schema Engine",
    icon: Database,
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50/70 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800/60",
    accentBadge: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  "workflow-engine": {
    key: "workflow-engine",
    label: "Workflow & State Machine",
    icon: GitBranch,
    color: "text-indigo-600 dark:text-indigo-400",
    bgLight: "bg-indigo-50/70 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800/60",
    accentBadge: "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  "communication-hub": {
    key: "communication-hub",
    label: "Communication Hub",
    icon: Bell,
    color: "text-sky-600 dark:text-sky-400",
    bgLight: "bg-sky-50/70 dark:bg-sky-950/30",
    borderColor: "border-sky-200 dark:border-sky-800/60",
    accentBadge: "bg-sky-100/80 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  "integrations-gateway": {
    key: "integrations-gateway",
    label: "API Gateway & Integrations",
    icon: Plug,
    color: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-50/70 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800/60",
    accentBadge: "bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  "audit-compliance": {
    key: "audit-compliance",
    label: "Security & Audit Vault",
    icon: ShieldCheck,
    color: "text-teal-600 dark:text-teal-400",
    bgLight: "bg-teal-50/70 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800/60",
    accentBadge: "bg-teal-100/80 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
  "system-ops": {
    key: "system-ops",
    label: "Operations & Telemetry",
    icon: Activity,
    color: "text-orange-600 dark:text-orange-400",
    bgLight: "bg-orange-50/70 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800/60",
    accentBadge: "bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  "digital-presence": {
    key: "digital-presence",
    label: "Digital Presence & CMS",
    icon: Globe,
    color: "text-cyan-600 dark:text-cyan-400",
    bgLight: "bg-cyan-50/70 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800/60",
    accentBadge: "bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
};

export default function AdministrationOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPillarKey, setSelectedPillarKey] = useState<string | null>(null);

  const platformDefinition = useMemo(() => findFrontendModuleMap("platform"), []);

  const allSubmodules = useMemo(() => platformDefinition?.submodules ?? [], [platformDefinition]);

  const totalPagesCount = useMemo(
    () => allSubmodules.reduce((acc, sub) => acc + sub.pages.length, 0),
    [allSubmodules]
  );

  const filteredSubmodules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allSubmodules
      .filter((sub) => {
        if (!selectedPillarKey) return true;
        return sub.key === selectedPillarKey;
      })
      .map((sub) => {
        if (!query) return sub;

        const filteredPages = sub.pages.filter(
          (p) =>
            p.label.toLowerCase().includes(query) ||
            p.purpose.toLowerCase().includes(query) ||
            sub.label.toLowerCase().includes(query)
        );

        return {
          ...sub,
          pages: filteredPages,
        };
      })
      .filter((sub) => sub.pages.length > 0);
  }, [allSubmodules, searchQuery, selectedPillarKey]);

  return (
    <StandardPageLayout
      title="Platform & Administration"
      subtitle="Multi-tenant infrastructure, identity governance, metadata architecture, and system telemetry."
      eyebrow="Enterprise Administration"
      icon="sliders"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.ADMINISTRATION_TENANTS}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
          >
            <Building2 className="h-3.5 w-3.5" />
            Tenants
          </Link>
          <Link
            href={ROUTES.ADMINISTRATION_USERS}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Users className="h-3.5 w-3.5" />
            Users
          </Link>
          <Link
            href={ROUTES.ADMINISTRATION_AUDIT_LOGS}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Audit Vault
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search administration pages..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedPillarKey(null)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                selectedPillarKey === null
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              All
            </button>
            {allSubmodules.map((sub) => {
              const isSelected = selectedPillarKey === sub.key;
              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setSelectedPillarKey(isSelected ? null : sub.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pillars & Submodules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubmodules.map((submodule, index) => {
            const config = PILLAR_CONFIGS[submodule.key] || {
              icon: Layers,
              color: "text-slate-600",
              bgLight: "bg-slate-50",
              borderColor: "border-slate-200",
              accentBadge: "bg-slate-100 text-slate-700",
            };
            const IconComponent = config.icon;

            return (
              <div
                key={submodule.key}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Pillar Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${config.bgLight} ${config.color}`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                    {submodule.label}
                  </h3>
                </div>

                {/* Submodule Pages List */}
                <div className="mt-2.5 space-y-0.5">
                  {submodule.pages.map((page) => (
                    <Link
                      key={page.route}
                      href={page.route}
                      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-400 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
                          <FileText className="h-3 w-3" />
                        </span>
                        <span className="truncate font-medium">{page.label}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-600" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StandardPageLayout>
  );
}
