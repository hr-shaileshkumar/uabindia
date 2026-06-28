"use client";

import Link from "next/link";
import ModuleIcon from "@/components/ModuleIcon";
import { PageHeader } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { WorkspaceStatusPanel } from "@/components/erp/workspace-status-panel";
import { useUiSchema } from "@/context/UiSchemaContext";

export function DashboardPage() {
  const { dashboard, dashboardReady, loading, schemaError, refresh } = useUiSchema();

  const sections = dashboard.sections
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title))
    .map((section) => ({
      ...section,
      widgets: section.widgets
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title)),
    }))
    .filter((section) => section.widgets.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace landing"
        title="Dashboard"
        description="The default landing experience is rendered from backend dashboard schema, enabled modules, and current permission grants."
        crumbs={[{ label: "Workspace" }, { label: "Dashboard" }]}
        primaryAction="Open workspace"
        secondaryAction="Refresh access"
      />

      <div className="flex items-center gap-3">
        <StatusBadge tone={schemaError ? "critical" : dashboardReady ? "positive" : "warning"}>
          {loading ? "Loading dashboard..." : schemaError ? "Backend schema error" : dashboardReady ? "Backend dashboard" : "Dashboard incomplete"}
        </StatusBadge>
      </div>

      {sections.length === 0 ? (
        <WorkspaceStatusPanel
          tone={schemaError ? "critical" : "warning"}
          title={schemaError ? "Dashboard failed to load" : "Dashboard is not configured"}
          description={
            schemaError
              ? "The backend dashboard schema could not be loaded for this user."
              : "No dashboard widgets are currently available for your enabled modules and permissions."
          }
          detail={schemaError || "Publish dashboard sections from `/ui-shell/dashboard` or verify module and permission setup."}
          onRetry={() => void refresh()}
        />
      ) : (
        sections.map((section) => (
          <section key={section.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{section.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Backend-defined workspace shortcuts and module entry points for your current session.
                </p>
              </div>
              <StatusBadge tone="info">{section.widgets.length} widgets</StatusBadge>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.widgets.map((widget) => {
                const content = (
                  <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                        <ModuleIcon name={widget.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{widget.title}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{widget.moduleKey || "workspace"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {widget.props.summary || "Open this workspace area to continue with the current flow."}
                    </p>
                  </div>
                );

                return widget.href ? (
                  <Link key={widget.key} href={widget.href} className="block h-full">
                    {content}
                  </Link>
                ) : (
                  <div key={widget.key}>{content}</div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
