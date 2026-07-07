"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { StatusBadge } from "@/components/erp/status-badge";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  getModuleDescription,
  getModuleEyebrow,
  getModuleLabel,
} from "@/lib/erp/module-registry";
import { buildWorkspaceModules, findWorkspaceModuleByKey } from "@/lib/erp/navigation";

type ModuleHubPageProps = {
  moduleKey: string;
  title?: string;
  subtitle?: string;
};

const humanizeModuleKey = (value: string) =>
  value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toSentenceCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");

const getGroupDescription = (groupLabel: string, moduleLabel: string) => {
  const normalized = groupLabel.toLowerCase();

  if (normalized.includes("overview")) return `Start here for the main ${moduleLabel} workspace entry points.`;
  if (normalized.includes("core")) return `Foundational ${moduleLabel} pages used most frequently by operators.`;
  if (normalized.includes("lifecycle")) return "Workflows that move records through each operational stage.";
  if (normalized.includes("attendance")) return "Daily time tracking, shifts, leave, and workforce control pages.";
  if (normalized.includes("acquisition")) return "Hiring and candidate pipeline pages grouped in one section.";
  if (normalized.includes("learning")) return "Training, assessments, and capability development pages.";
  if (normalized.includes("performance")) return "Performance review and outcome tracking pages.";
  if (normalized.includes("session")) return "Session activity, login monitoring, and access tracking pages.";
  if (normalized.includes("policy")) return "Security and policy configuration pages for controlled access.";
  if (normalized.includes("authentication")) return "Authentication, sign-in, and identity verification pages.";
  if (normalized.includes("device")) return "Managed devices and endpoint access pages.";

  return `${toSentenceCase(groupLabel)} pages for the ${moduleLabel} workspace.`;
};

const getPageDescription = (pageName: string, groupLabel: string, moduleLabel: string) => {
  const source = `${pageName} ${groupLabel} ${moduleLabel}`.toLowerCase();

  if (source.includes("employee")) return "Manage people records, ownership, and employee master details.";
  if (source.includes("dashboard")) return `See the main ${moduleLabel} summary and operational shortcuts.`;
  if (source.includes("certificate")) return "Track employee documents, proofs, and issued certificates.";
  if (source.includes("asset")) return "Manage allocation, handover, and asset accountability.";
  if (source.includes("onboarding")) return "Coordinate new joiner setup and activation workflows.";
  if (source.includes("offboarding")) return "Handle exits, clearances, and employee release actions.";
  if (source.includes("probation")) return "Review probation timelines, checkpoints, and outcomes.";
  if (source.includes("attendance")) return "Track presence, exceptions, and workforce time entries.";
  if (source.includes("shift")) return "Configure and monitor rosters, timing, and shift coverage.";
  if (source.includes("overtime")) return "Review additional hours, approvals, and extra duty records.";
  if (source.includes("leave")) return "Manage leave requests, balances, and approval decisions.";
  if (source.includes("recruitment")) return "Run candidate sourcing, openings, and hiring workflows.";
  if (source.includes("screening")) return "Review candidate screening plans, schedules, and results.";
  if (source.includes("training")) return "Manage learning plans, sessions, and capability building.";
  if (source.includes("assessment")) return "Track evaluations, scores, and learning outcomes.";
  if (source.includes("performance")) return "Review goals, ratings, and periodic performance outcomes.";
  if (source.includes("payroll")) return "Open payroll operations and employee payout-related workflows.";
  if (source.includes("mfa")) return "Configure multi-factor authentication for stronger sign-in security.";
  if (source.includes("sso")) return "Set up single sign-on and external identity provider access.";
  if (source.includes("device")) return "Review trusted devices and endpoint access visibility.";
  if (source.includes("session")) return "Inspect active sessions and recent sign-in activity.";
  if (source.includes("access log")) return "Audit access events, review history, and investigate activity.";
  if (source.includes("password")) return "Control password standards, expiry, and policy enforcement.";
  if (source.includes("ip restriction")) return "Manage network rules and trusted access boundaries.";

  return `Open ${pageName} in the ${toSentenceCase(groupLabel)} section of ${moduleLabel}.`;
};

export function ModuleHubPage({ moduleKey, title, subtitle }: ModuleHubPageProps) {
  const {
    navigation,
    routeRules,
    dashboard,
    enabledModules,
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

  const moduleMeta = useMemo(
    () => enabledModules.find((module) => module.key === moduleKey) ?? null,
    [enabledModules, moduleKey]
  );

  const moduleWidgets = useMemo(
    () =>
      dashboard.sections.flatMap((section) =>
        section.widgets
          .filter((widget) => widget.moduleKey === moduleKey)
          .map((widget) => ({
            ...widget,
            sectionTitle: section.title,
          }))
      ),
    [dashboard.sections, moduleKey]
  );

  const firstChildPage =
    workspaceModule?.groups
      .flatMap((group) => group.items)
      .find((item) => item.path !== workspaceModule.homeHref) ?? null;

  const recommendedPages = useMemo(
    () =>
      workspaceModule?.groups
        .flatMap((group) =>
          group.items.slice(0, 2).map((item) => ({
            ...item,
            groupLabel: group.label,
          }))
        )
        .slice(0, 4) ?? [],
    [workspaceModule]
  );

  const fallbackTitle =
    moduleMeta?.displayName ||
    getModuleLabel(moduleKey) ||
    humanizeModuleKey(moduleKey);

  const resolvedTitle = title || workspaceModule?.label || fallbackTitle;
  const resolvedSubtitle =
    subtitle ||
    moduleMeta?.description ||
    workspaceModule?.description ||
    getModuleDescription(moduleKey, `${fallbackTitle} workspace pages, route access, and module shortcuts are managed from backend schema.`);

  return (
    <StandardPageLayout
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      eyebrow={getModuleEyebrow(moduleKey)}
      icon={workspaceModule?.icon || moduleMeta?.icon || "layers"}
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
      <section className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,74,125,0.08),rgba(11,123,115,0.05),rgba(255,255,255,0.96))] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: "Pages",
              value: workspaceModule?.pageCount ?? 0,
              note: "All available pages in this module.",
            },
            {
              label: "Submodules",
              value: workspaceModule?.groups.length ?? 0,
              note: "Clean page groupings for easier navigation.",
            },
            {
              label: "Quick Start",
              value: firstChildPage?.name || "Ready",
              note: firstChildPage ? `Start with ${firstChildPage.name}.` : "Module is ready to use.",
            },
          ].map((card) => (
            <section key={card.label} className="rounded-[1.3rem] border border-slate-200/85 bg-white/92 p-4 shadow-[var(--erp-shadow-sm)] backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-slate-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.note}</p>
            </section>
          ))}
        </div>
      </section>

      {!workspaceModule ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <section className="rounded-[1.6rem] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.96))] p-5 shadow-[var(--erp-shadow-sm)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Navigation Missing
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              This module is enabled, but its navigation root is not configured yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {schemaError
                ? "The backend UI schema could not be loaded for this module."
                : "No navigation records were returned for the module root, so the shell cannot build the page directory from database data."}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Review backend navigation, route rules, and module metadata for this tenant. The module remains enabled, but operators do not have a clean page map yet.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary">
                Retry
              </button>
              <Link href="/platform/module-mapping" className="erp-action-btn erp-action-btn-primary">
                Open module registry
              </Link>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[1.6rem] border border-slate-200/85 bg-white p-4 shadow-[var(--erp-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Module Details</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Base Path</p>
                  <p className="mt-2 font-mono text-xs text-slate-700">
                    {moduleMeta?.basePath || "Not returned"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Module State</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {moduleMeta?.isEnabled === false ? "Disabled" : "Enabled"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-slate-200/85 bg-white p-4 shadow-[var(--erp-shadow-sm)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Widget Registry</p>
                <StatusBadge tone={moduleWidgets.length > 0 ? "info" : "warning"}>
                  {moduleWidgets.length} widgets
                </StatusBadge>
              </div>
              {moduleWidgets.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  No dashboard widgets are currently mapped to this module.
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {moduleWidgets.slice(0, 4).map((widget) => (
                    <div key={widget.key} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                      <p className="text-sm font-semibold text-slate-950">{widget.title}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {widget.sectionTitle}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      ) : (
        <div className="space-y-5">
          {recommendedPages.length > 0 ? (
            <section className="overflow-hidden rounded-[1.6rem] border border-slate-200/85 bg-white p-5 shadow-[var(--erp-shadow-sm)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Recommended Pages
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Start with the most useful pages first
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    These entry points help operators reach the key workflows without scanning the full module list.
                  </p>
                </div>
                <StatusBadge tone="positive">Focused navigation</StatusBadge>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {recommendedPages.map((item) => (
                  <Link
                    key={`recommended-${item.path}`}
                    href={item.path}
                    className="group rounded-[1.2rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(15,74,125,0.1),rgba(11,123,115,0.1))] text-[color:var(--erp-primary)]">
                        <ModuleIcon name={item.icon || workspaceModule.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.groupLabel}</p>
                        <div className="mt-1 flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {getPageDescription(item.name, item.groupLabel, resolvedTitle)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-[1.6rem] border border-slate-200/85 bg-white p-5 shadow-[var(--erp-shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Page Directory
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Browse pages by submodule
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Each section groups related pages together so the module feels organized, scannable, and easy to use.
                </p>
              </div>
              <StatusBadge tone={workspaceModule.enabled ? "positive" : "warning"}>
                {workspaceModule.enabled ? "Enabled module" : "Disabled module"}
              </StatusBadge>
            </div>

            <div className="mt-4 space-y-4">
              {workspaceModule.groups.map((group) => (
                <section key={`${workspaceModule.key}-${group.label}`} className="rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {getGroupDescription(group.label, resolvedTitle)}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {group.items.length} pages
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="group rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(15,74,125,0.1),rgba(11,123,115,0.1))] text-[color:var(--erp-primary)] transition group-hover:shadow-sm">
                            <ModuleIcon name={item.icon || workspaceModule.icon} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {getPageDescription(item.name, group.label, resolvedTitle)}
                                </p>
                              </div>
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
                            </div>
                            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Open page
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
        </div>
      )}
    </StandardPageLayout>
  );
}
