"use client";

import Link from "next/link";
import { ExternalLink, LayoutGrid, List, Search } from "lucide-react";
import { useMemo, useState } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { ErpMotionBackdrop, ErpMotionItem, ErpMotionSection, ErpMotionStagger } from "@/components/erp/motion";
import { StatusBadge } from "@/components/erp/status-badge";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  getModuleDescription,
  getModuleEyebrow,
  getModuleLabel,
} from "@/lib/erp/module-registry";
import { findFrontendModuleMap as findFrontendModuleDefinition, type FrontendPageStatus } from "@/lib/erp/frontend-module-map";
import { buildWorkspaceModules, findWorkspaceModuleByKey } from "@/lib/erp/navigation";

type ModuleHubPageProps = {
  moduleKey: string;
  title?: string;
  subtitle?: string;
};

type ModuleDisplayPage = {
  name: string;
  path: string;
  icon?: string | null;
  requiredPermissions: string[];
  groupLabel: string;
  updatedLabel: string;
  status: "Active" | "Partial" | "Planned";
  purpose: string;
};

type ModuleDisplayGroup = {
  label: string;
  purpose: string;
  items: ModuleDisplayPage[];
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

const groupShortLabel = (value: string) =>
  value.length <= 18 ? value : `${value.slice(0, 18).trim()}...`;

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

  const frontendModuleMap = useMemo(
    () => findFrontendModuleDefinition(moduleKey),
    [moduleKey]
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

  const [pageQuery, setPageQuery] = useState("");
  const [submoduleView, setSubmoduleView] = useState<"grid" | "list">("grid");
  const [selectedGroupLabel, setSelectedGroupLabel] = useState<string | null>(null);

  const fallbackTitle =
    moduleMeta?.displayName ||
    getModuleLabel(moduleKey) ||
    humanizeModuleKey(moduleKey);

  const resolvedTitle = title || workspaceModule?.label || fallbackTitle;
  const resolvedSubtitle =
      subtitle ||
    frontendModuleMap?.purpose ||
    moduleMeta?.description ||
    workspaceModule?.description ||
    getModuleDescription(moduleKey, `${fallbackTitle} workspace with grouped actions, operational pages, and role-aware shortcuts.`);

  const displayGroups = useMemo<ModuleDisplayGroup[]>(() => {
    if (!workspaceModule && !frontendModuleMap) {
      return [];
    }

    const backendPages =
      workspaceModule?.groups.flatMap((group) =>
        group.items.map((item, index) => ({
          ...item,
          groupLabel: group.label,
          updatedLabel: index === 0 ? "Just now" : `${Math.min(index * 3 + 2, 28)}m ago`,
          status: "Active" as const,
        }))
      ) ?? [];

    if (!frontendModuleMap) {
      return (workspaceModule?.groups ?? []).map((group) => ({
        label: group.label,
        purpose: getGroupDescription(group.label, resolvedTitle),
        items: group.items.map((item, index) => ({
          name: item.name,
          path: item.path,
          icon: item.icon,
          requiredPermissions: item.requiredPermissions,
          groupLabel: group.label,
          updatedLabel: index === 0 ? "Just now" : `${Math.min(index * 3 + 2, 28)}m ago`,
          status: "Active",
          purpose: getPageDescription(item.name, group.label, resolvedTitle),
        })),
      }));
    }

    const backendPageByRoute = new Map(
      backendPages.map((page) => [page.path, page])
    );

    const mapStatusToBadge = (status: FrontendPageStatus) =>
      status === "implemented" ? "Active" : status === "partial" ? "Partial" : "Planned";

    return frontendModuleMap.submodules
      .map((submodule) => ({
        label: submodule.label,
        purpose: submodule.purpose,
        items: submodule.pages.map((page, index) => {
          const backendPage = backendPageByRoute.get(page.route);

          return {
            name: backendPage?.name || page.label,
            path: page.route,
            icon: backendPage?.icon || workspaceModule?.icon || moduleMeta?.icon || "layers",
            requiredPermissions: backendPage?.requiredPermissions || [],
            groupLabel: submodule.label,
            updatedLabel: backendPage?.updatedLabel || (index === 0 ? "Just now" : `${Math.min(index * 3 + 2, 28)}m ago`),
            status: backendPage ? "Active" : mapStatusToBadge(page.status),
            purpose: page.purpose,
          } satisfies ModuleDisplayPage;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [frontendModuleMap, moduleMeta?.icon, resolvedTitle, workspaceModule]);

  const flattenedPages = useMemo(
    () => displayGroups.flatMap((group) => group.items),
    [displayGroups]
  );

  const firstChildPage = flattenedPages.find((item) => {
    const homeHref = frontendModuleMap?.homeRoute || workspaceModule?.homeHref;
    return item.path !== homeHref;
  }) ?? null;

  const recommendedPages = useMemo(
    () => displayGroups.flatMap((group) => group.items.slice(0, 2)),
    [displayGroups]
  );

  const visibleGroupLabel = useMemo(() => {
    if (!displayGroups.length) return null;
    if (
      selectedGroupLabel &&
      displayGroups.some((group) => group.label === selectedGroupLabel)
    ) {
      return selectedGroupLabel;
    }
    return displayGroups[0]?.label ?? null;
  }, [displayGroups, selectedGroupLabel]);

  const visibleGroup = useMemo(
    () =>
      visibleGroupLabel
        ? displayGroups.find((group) => group.label === visibleGroupLabel) ?? null
        : null,
    [displayGroups, visibleGroupLabel]
  );

  const filteredPages = useMemo(() => {
    const query = pageQuery.trim().toLowerCase();
    const scopedPages = visibleGroupLabel
      ? flattenedPages.filter((item) => item.groupLabel === visibleGroupLabel)
      : flattenedPages;

    if (!query) return scopedPages;

    return scopedPages.filter((item) =>
      `${item.name} ${item.groupLabel}`.toLowerCase().includes(query)
    );
  }, [flattenedPages, pageQuery, visibleGroupLabel]);

  const quickActionPages = useMemo(() => {
    if (visibleGroupLabel) {
      return recommendedPages
        .filter((item) => item.groupLabel === visibleGroupLabel)
        .slice(0, 3);
    }

    return recommendedPages.slice(0, 3);
  }, [recommendedPages, visibleGroupLabel]);

  const primaryActionPage = visibleGroup?.items[0] ?? firstChildPage;

  const uniquePermissionKeyCount = useMemo(
    () =>
      new Set(
        displayGroups.flatMap((group) =>
          group.items.flatMap((item) => item.requiredPermissions)
        ) ?? []
      ).size,
    [displayGroups]
  );

  return (
    <StandardPageLayout
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      eyebrow={getModuleEyebrow(moduleKey)}
      icon={workspaceModule?.icon || moduleMeta?.icon || "layers"}
      meta={
        displayGroups.length > 0 ? (
          <ErpHeaderSummary
            items={[
              { label: "Pages", value: flattenedPages.length },
              { label: "Work Areas", value: displayGroups.length, tone: "info" },
              { label: "Actions", value: quickActionPages.length, tone: "success" },
              { label: "Permissions", value: uniquePermissionKeyCount, tone: "warning" },
            ]}
          />
        ) : null
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {primaryActionPage ? (
            <Link href={primaryActionPage.path} className="erp-action-btn erp-action-btn-primary !min-h-[2.7rem] !rounded-[0.95rem] !px-4 !py-2 !text-sm">
              Open {primaryActionPage.name}
            </Link>
          ) : null}
          <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary !min-h-[2.7rem] !rounded-[0.95rem] !px-4 !py-2 !text-sm">
            Refresh module
          </button>
        </div>
      }
    >
      {displayGroups.length === 0 ? (
        <ErpMotionSection className="relative overflow-hidden rounded-[1.3rem] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))] p-5 shadow-[var(--erp-shadow-sm)]">
          <ErpMotionBackdrop />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Module Setup Needed
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
            This module is enabled, but a usable workspace entry is still missing
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {schemaError
              ? "The backend UI schema could not be loaded for this module."
              : "No navigation records were returned for the module root, so the shell cannot build a clean page directory yet."}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Base Path</p>
              <p className="mt-2 font-mono text-xs text-slate-700">
                {moduleMeta?.basePath || "Not returned"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Module State</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {moduleMeta?.isEnabled === false ? "Disabled" : "Enabled"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mapped Widgets</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{moduleWidgets.length}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary">
              Retry
            </button>
            <Link href="/platform/module-mapping" className="erp-action-btn erp-action-btn-primary">
              Open module registry
            </Link>
          </div>
        </ErpMotionSection>
      ) : (
        <div className="space-y-5">
          <ErpMotionSection className="relative overflow-hidden rounded-[var(--erp-radius-panel)] border border-[var(--erp-border)] bg-white p-3.5 shadow-[var(--erp-shadow-sm)] sm:p-4">
            <ErpMotionBackdrop />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Work Areas
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Use one compact directory for grouped pages instead of separate module cards and duplicate KPI blocks.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {quickActionPages.map((item) => (
                  <Link
                    key={`inline-quick-${item.path}`}
                    href={item.path}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <ModuleIcon
                      name={item.icon || workspaceModule?.icon || moduleMeta?.icon || "layers"}
                      className="h-3.5 w-3.5 text-indigo-600"
                    />
                    {item.name}
                  </Link>
                ))}
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1">
                  <button
                    type="button"
                    onClick={() => setSubmoduleView("grid")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${submoduleView === "grid" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmoduleView("list")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${submoduleView === "list" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"}`}
                  >
                    <List className="h-3.5 w-3.5" />
                    List
                  </button>
                </div>
              </div>
            </div>

            <ErpMotionStagger className={`mt-4 grid gap-2 ${submoduleView === "grid" ? "md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"}`}>
              {displayGroups.map((group) => (
                <ErpMotionItem
                  key={`summary-${group.label}`}
                  className={`text-left rounded-[1rem] border px-3.5 py-3 transition ${
                    visibleGroupLabel === group.label
                      ? "border-indigo-200 bg-indigo-50/40 shadow-[0_10px_24px_rgba(79,70,229,0.04)]"
                      : "border-slate-200 bg-white hover:border-indigo-100 hover:bg-indigo-50/15"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGroupLabel(group.label)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-indigo-50 text-indigo-600">
                        <ModuleIcon name={group.items[0]?.icon || workspaceModule?.icon || moduleMeta?.icon || "layers"} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950">{group.label}</p>
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[10px] font-semibold text-indigo-700">
                            {group.items.length}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {group.purpose || getGroupDescription(group.label, resolvedTitle)}
                        </p>
                      </div>
                    </div>
                  </button>
                </ErpMotionItem>
              ))}
            </ErpMotionStagger>
          </ErpMotionSection>

          <ErpMotionSection className="relative overflow-hidden rounded-[var(--erp-radius-panel)] border border-[var(--erp-border)] bg-white p-3.5 shadow-[var(--erp-shadow-sm)] sm:p-4" delay={0.08}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Page Directory ({filteredPages.length})
                  </p>
                  <h3 className="mt-1 text-[1.2rem] font-semibold text-slate-950">
                    {visibleGroup ? `${visibleGroup.label} pages` : `${resolvedTitle} pages`}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {visibleGroup
                      ? `${visibleGroup.label} pages available for this work area`
                      : "All pages currently available in this module"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative w-full sm:w-auto">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={pageQuery}
                      onChange={(event) => setPageQuery(event.target.value)}
                      placeholder="Search pages..."
                      className="h-9 w-full rounded-[var(--erp-radius-control)] border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 sm:w-60"
                    />
                  </label>
                  <div className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    {visibleGroup ? visibleGroup.label : "All Work Areas"}
                  </div>
                </div>
              </div>

              {visibleGroup ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="info">{visibleGroup.label}</StatusBadge>
                  <StatusBadge tone="positive">{visibleGroup.items.length} Pages</StatusBadge>
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-[var(--erp-radius-panel)] border border-slate-200 bg-white">
                <div className="hidden grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_7rem_7rem_4rem] gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:grid">
                  <span>Page Name</span>
                  <span>Sub Module</span>
                  <span>Status</span>
                  <span>Updated</span>
                  <span>Action</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {filteredPages.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="grid gap-3 px-4 py-3 transition hover:bg-indigo-50/15 md:grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_7rem_7rem_4rem] md:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <ModuleIcon name={item.icon || workspaceModule?.icon || moduleMeta?.icon || "layers"} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{item.purpose || getPageDescription(item.name, item.groupLabel, resolvedTitle)}</p>
                        </div>
                      </div>
                      <div className="md:block">
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                          {groupShortLabel(item.groupLabel)}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          item.status === "Active"
                            ? "text-emerald-600"
                            : item.status === "Partial"
                              ? "text-amber-600"
                              : "text-slate-500"
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            item.status === "Active"
                              ? "bg-emerald-500"
                              : item.status === "Partial"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                          }`} />
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{item.updatedLabel}</div>
                      <div className="flex justify-end text-slate-400">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}

                  {filteredPages.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                      No pages match your search.
                    </div>
                  ) : null}
                </div>
              </div>
          </ErpMotionSection>
        </div>
      )}
    </StandardPageLayout>
  );
}
