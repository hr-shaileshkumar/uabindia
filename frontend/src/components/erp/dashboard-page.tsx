"use client";

import Link from "next/link";
import ModuleIcon from "@/components/ModuleIcon";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { StatusBadge } from "@/components/erp/status-badge";
import { WorkspaceStatusPanel } from "@/components/erp/workspace-status-panel";
import { useUiSchema } from "@/context/UiSchemaContext";

export function DashboardPage() {
  const {
    dashboard,
    dashboardReady,
    enabledModules,
    loading,
    schemaError,
    refresh,
  } = useUiSchema();

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

  const widgetCount = sections.reduce((count, section) => count + section.widgets.length, 0);
  const mappedModuleCount = new Set(
    sections.flatMap((section) =>
      section.widgets
        .map((widget) => widget.moduleKey)
        .filter((moduleKey): moduleKey is string => Boolean(moduleKey))
    )
  ).size;

  return (
    <StandardPageLayout
      title="Workspace overview"
      subtitle="A cleaner command center for your active modules, live dashboard widgets, and the day-to-day actions you actually need after login."
      eyebrow="Platform / Overview"
      icon="dashboard"
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/context" className="erp-action-btn erp-action-btn-primary">
            Open workspace
          </Link>
          <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary">
            Refresh schema
          </button>
        </div>
      }
    >
      <section className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,74,125,0.08),rgba(11,123,115,0.06),rgba(255,255,255,0.96))] p-5 shadow-[0_22px_56px_rgba(15,23,42,0.07)]">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr] xl:items-stretch">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/92 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Today at a glance
            </p>
            <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-slate-950">
              Start from the right module, not from a maze of screens.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              This overview highlights the current dashboard contract, visible module coverage, and the widgets that are actually useful after login.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge tone={schemaError ? "critical" : dashboardReady ? "positive" : "warning"}>
                {loading ? "Loading workspace" : schemaError ? "Schema issue" : dashboardReady ? "Dashboard ready" : "Dashboard partial"}
              </StatusBadge>
              <StatusBadge tone="info">{sections.length} sections</StatusBadge>
              <StatusBadge tone="info">{widgetCount} widgets</StatusBadge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              {
                label: "Dashboard State",
                value: loading ? "Loading" : dashboardReady ? "Ready" : "Partial",
                note: schemaError ? "Backend schema issue detected." : "Current dashboard contract loaded from the backend.",
              },
              {
                label: "Modules Covered",
                value: mappedModuleCount || enabledModules.length,
                note: "Module areas represented inside the current dashboard registry.",
              },
            ].map((card) => (
              <section key={card.label} className="rounded-[1.4rem] border border-slate-200/85 bg-white p-4 shadow-[var(--erp-shadow-sm)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.note}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <div className="space-y-5">
            {sections.map((section) => (
              <section
                key={section.key}
                className="overflow-hidden rounded-[1.6rem] border border-slate-200/85 bg-white p-5 shadow-[var(--erp-shadow-sm)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Dashboard Section
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Widget destinations filtered by backend permissions and enabled module access.
                    </p>
                  </div>
                  <StatusBadge tone="info">{section.widgets.length} widgets</StatusBadge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {section.widgets.map((widget) => {
                    const content = (
                      <div className="flex h-full flex-col rounded-[1.3rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(15,74,125,0.1),rgba(11,123,115,0.1))] text-[color:var(--erp-primary)] shadow-[var(--erp-shadow-sm)]">
                            <ModuleIcon name={widget.icon} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">{widget.title}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {widget.moduleKey === "erp" ? "Platform shell" : widget.moduleKey || "workspace"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {widget.props.summary || "Open this destination to continue the current workflow."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {widget.type}
                          </span>
                          {widget.dataEndpoint ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Live endpoint
                            </span>
                          ) : null}
                        </div>
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
            ))}
          </div>

          <aside className="space-y-4">
            <section className="rounded-[1.6rem] border border-slate-200/85 bg-white p-5 shadow-[var(--erp-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Registry Health
              </p>
              <div className="mt-3 flex items-center gap-3">
                <StatusBadge tone={schemaError ? "critical" : dashboardReady ? "positive" : "warning"}>
                  {loading ? "Loading dashboard..." : schemaError ? "Schema issue" : dashboardReady ? "Backend dashboard" : "Dashboard incomplete"}
                </StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {schemaError
                  ? "Resolve backend dashboard schema loading before relying on workspace shortcuts."
                  : "This landing page is populated from backend widget definitions instead of hardcoded frontend tiles."}
              </p>
            </section>

            <section className="rounded-[1.6rem] border border-slate-200/85 bg-white p-5 shadow-[var(--erp-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Enabled Modules
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {enabledModules.slice(0, 10).map((module) => (
                  <span
                    key={module.key}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    {module.displayName || module.name || module.key}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}
    </StandardPageLayout>
  );
}
