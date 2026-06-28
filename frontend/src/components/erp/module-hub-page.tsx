"use client";

import Link from "next/link";
import { ArrowRight, LayoutGrid, Sparkles } from "lucide-react";
import { useMemo } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { StatusBadge } from "@/components/erp/status-badge";
import { WorkspaceStatusPanel } from "@/components/erp/workspace-status-panel";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useUiSchema } from "@/context/UiSchemaContext";
import { buildWorkspaceModules, findWorkspaceModuleByKey } from "@/lib/erp/navigation";

type ModuleHubPageProps = {
  moduleKey: string;
  title?: string;
  subtitle?: string;
};

const MODULE_EYEBROWS: Record<string, string> = {
  platform: "Platform / Control Center",
  hrms: "HRMS / Workspace",
  payroll: "Payroll / Workspace",
  reports: "Reports / Workspace",
  helpdesk: "Helpdesk / Workspace",
  communication: "Communication / Workspace",
  integrations: "Integrations / Workspace",
  licensing: "Licensing / Workspace",
  security: "Security / Workspace",
};

export function ModuleHubPage({ moduleKey, title, subtitle }: ModuleHubPageProps) {
  const {
    navigation,
    routeRules,
    dashboard,
    enabledModules,
    loading,
    schemaError,
    refresh,
  } = useUiSchema();

  const modules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [enabledModules, navigation.modules]
  );

  const workspaceModule = useMemo(
    () => findWorkspaceModuleByKey(modules, moduleKey),
    [moduleKey, modules]
  );

  const routeCount = useMemo(
    () => routeRules.rules.filter((rule) => rule.moduleKey === moduleKey).length,
    [moduleKey, routeRules.rules]
  );

  const widgetCount = useMemo(
    () =>
      dashboard.sections.reduce(
        (count, section) =>
          count + section.widgets.filter((widget) => widget.moduleKey === moduleKey).length,
        0
      ),
    [dashboard.sections, moduleKey]
  );

  const firstChildPage = workspaceModule?.groups.flatMap((group) => group.items).find((item) => item.path !== workspaceModule.homeHref) ?? null;
  const resolvedTitle = title || workspaceModule?.label || "Workspace Module";
  const resolvedSubtitle =
    subtitle ||
    workspaceModule?.description ||
    "This module groups related workspace pages into one clean control surface.";

  return (
    <StandardPageLayout
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      eyebrow={MODULE_EYEBROWS[moduleKey] || "Workspace / Module"}
      icon={workspaceModule?.icon || "layers"}
      actions={
        <div className="flex flex-wrap gap-2">
          {firstChildPage ? (
            <Link href={firstChildPage.path} className="erp-action-btn erp-action-btn-primary">
              Open {firstChildPage.name}
            </Link>
          ) : null}
          <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary">
            Refresh module
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="erp-loading">Loading module navigation...</div>
      ) : !workspaceModule ? (
        <WorkspaceStatusPanel
          tone={schemaError ? "critical" : "warning"}
          title={schemaError ? "Module navigation is unavailable" : "Module routing is not configured"}
          description={
            schemaError
              ? "The frontend could not load backend workspace navigation for this module."
              : "No backend navigation records were returned for this module root."
          }
          detail={schemaError || "Review backend navigation, route rules, and enabled module metadata for this tenant."}
          onRetry={() => void refresh()}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="erp-kpi-card">
              <p className="erp-kpi-label">Pages</p>
              <p className="erp-kpi-value">{workspaceModule.pageCount}</p>
              <p className="erp-kpi-meta">Linked workspace destinations</p>
            </div>
            <div className="erp-kpi-card erp-kpi-card-info">
              <p className="erp-kpi-label">Groups</p>
              <p className="erp-kpi-value">{workspaceModule.groups.length}</p>
              <p className="erp-kpi-meta">Navigation clusters</p>
            </div>
            <div className="erp-kpi-card erp-kpi-card-success">
              <p className="erp-kpi-label">Route Rules</p>
              <p className="erp-kpi-value erp-kpi-value-success">{routeCount}</p>
              <p className="erp-kpi-meta">Protected path policies</p>
            </div>
            <div className="erp-kpi-card erp-kpi-card-warning">
              <p className="erp-kpi-label">Widgets</p>
              <p className="erp-kpi-value">{widgetCount}</p>
              <p className="erp-kpi-meta">Dashboard entry points</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module Map</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    All linked pages open from here
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    Each group below mirrors backend navigation so operators can enter the right page from one clear content-area hub.
                  </p>
                </div>
                <StatusBadge tone={workspaceModule.enabled ? "positive" : "warning"}>
                  {workspaceModule.enabled ? "Enabled module" : "Disabled module"}
                </StatusBadge>
              </div>

              <div className="mt-5 space-y-5">
                {workspaceModule.groups.map((group) => (
                  <section key={`${workspaceModule.key}-${group.label}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {group.items.length} linked page{group.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                        <LayoutGrid className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 transition group-hover:bg-sky-50 group-hover:text-sky-700">
                              <ModuleIcon name={item.icon || workspaceModule.icon} className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                                  <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                    {item.path}
                                  </p>
                                </div>
                                <ArrowRight className="mt-0.5 h-4 w-4 text-slate-300 transition group-hover:text-sky-700" />
                              </div>
                              <p className="mt-3 text-xs leading-6 text-slate-500">
                                {item.requiredPermissions.length > 0
                                  ? `${item.requiredPermissions.length} permission key${item.requiredPermissions.length === 1 ? "" : "s"}`
                                  : "No explicit permission keys returned"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module Summary</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">{workspaceModule.label}</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Module Home</p>
                    <p className="mt-2 font-mono text-xs text-slate-700">{workspaceModule.homeHref || "Not derived"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Coverage</p>
                    <p className="mt-2 leading-7">
                      This hub is intentionally narrow: enter the module here, then branch to the exact child page you need.
                    </p>
                  </div>
                </div>
              </section>

              {firstChildPage ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended Entry</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{firstChildPage.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Use the most direct operational page when you want to skip the module map and continue work immediately.
                  </p>
                  <Link href={firstChildPage.path} className="erp-action-btn erp-action-btn-primary mt-4">
                    Open {firstChildPage.name}
                  </Link>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
