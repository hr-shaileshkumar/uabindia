"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ModuleIcon from "@/components/ModuleIcon";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpButtonClassName,
  erpFormInputClassName,
  erpSectionClassName,
  erpSectionEyebrowClassName,
  erpSectionTitleClassName,
  erpStatusBadgeTone,
} from "@/components/workspace/styles";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  getModuleDescription,
  getModuleEyebrow,
  getModuleLabel,
} from "@/lib/workspace/module-registry";
import { findFrontendModuleMap as findFrontendModuleDefinition, type FrontendPageStatus } from "@/lib/workspace/frontend-module-map";
import { buildWorkspaceModules, findWorkspaceModuleByKey } from "@/lib/workspace/navigation";

type ModuleHubPageProps = {
  moduleKey: string;
  title?: string;
  subtitle?: string;
};

type ModuleDisplayPage = {
  name: string;
  path: string;
  icon?: string | null;
  groupLabel: string;
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

const pageStatusClass = (status: ModuleDisplayPage["status"]) => {
  if (status === "Active") return erpStatusBadgeTone.success;
  if (status === "Partial") return erpStatusBadgeTone.warning;
  return erpStatusBadgeTone.neutral;
};

export function ModuleHubPage({ moduleKey, title, subtitle }: ModuleHubPageProps) {
  const { navigation, enabledModules, schemaError, refresh } = useUiSchema();

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

  const [pageQuery, setPageQuery] = useState("");
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
    getModuleDescription(moduleKey, `${fallbackTitle} workspace pages grouped by work area.`);

  const displayGroups = useMemo<ModuleDisplayGroup[]>(() => {
    if (!workspaceModule && !frontendModuleMap) {
      return [];
    }

    const backendPages =
      workspaceModule?.groups.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          groupLabel: group.label,
        }))
      ) ?? [];

    if (!frontendModuleMap) {
      return (workspaceModule?.groups ?? []).map((group) => ({
        label: group.label,
        purpose: getGroupDescription(group.label, resolvedTitle),
        items: group.items.map((item) => ({
          name: item.name,
          path: item.path,
          icon: item.icon,
          groupLabel: group.label,
          status: "Active" as const,
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
        items: submodule.pages.map((page) => {
          const backendPage = backendPageByRoute.get(page.route);

          return {
            name: backendPage?.name || page.label,
            path: page.route,
            icon: backendPage?.icon || workspaceModule?.icon || moduleMeta?.icon || "layers",
            groupLabel: submodule.label,
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
  }) ?? flattenedPages[0] ?? null;

  const visibleGroupLabel = useMemo(() => {
    if (!displayGroups.length) return null;
    if (selectedGroupLabel && displayGroups.some((group) => group.label === selectedGroupLabel)) {
      return selectedGroupLabel;
    }
    return null;
  }, [displayGroups, selectedGroupLabel]);

  const filteredPages = useMemo(() => {
    const query = pageQuery.trim().toLowerCase();
    const scopedPages = visibleGroupLabel
      ? flattenedPages.filter((item) => item.groupLabel === visibleGroupLabel)
      : flattenedPages;

    if (!query) return scopedPages;

    return scopedPages.filter((item) =>
      `${item.name} ${item.groupLabel} ${item.purpose}`.toLowerCase().includes(query)
    );
  }, [flattenedPages, pageQuery, visibleGroupLabel]);

  return (
    <StandardPageLayout
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      eyebrow={getModuleEyebrow(moduleKey)}
      icon={workspaceModule?.icon || moduleMeta?.icon || "layers"}
      meta={
        flattenedPages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {displayGroups.length} work areas
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              {flattenedPages.length} pages
            </span>
            <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {flattenedPages.filter((page) => page.status === "Active").length} live
            </span>
          </div>
        ) : null
      }
      actions={
        firstChildPage ? (
          <div className="flex flex-wrap gap-2">
            <Link href={firstChildPage.path} className={erpButtonClassName.primary}>
              Open {firstChildPage.name}
            </Link>
          </div>
        ) : null
      }
    >
      {displayGroups.length === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className={erpSectionEyebrowClassName}>Setup needed</p>
          <h2 className={erpSectionTitleClassName}>No navigation pages returned for this module</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {schemaError
              ? "The backend UI schema could not be loaded for this module."
              : "No navigation records were returned for the module root."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void refresh()} className={erpButtonClassName.secondary}>
              Retry
            </button>
            <Link href="/platform/module-mapping" className={erpButtonClassName.primary}>
              Open module registry
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          {/* Work Areas Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={pageQuery}
                onChange={(event) => setPageQuery(event.target.value)}
                placeholder="Search pages..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedGroupLabel(null)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                  visibleGroupLabel === null
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                }`}
              >
                All
              </button>
              {displayGroups.map((group) => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => setSelectedGroupLabel(group.label)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                    visibleGroupLabel === group.label
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submodule Boxes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayGroups
              .filter((grp) => !visibleGroupLabel || grp.label === visibleGroupLabel)
              .map((group, groupIdx) => {
                const matchingItems = pageQuery.trim()
                  ? group.items.filter((it) =>
                      it.name.toLowerCase().includes(pageQuery.trim().toLowerCase())
                    )
                  : group.items;

                if (matchingItems.length === 0) return null;

                return (
                  <div
                    key={group.label}
                    className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Submodule Box Header */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <ModuleIcon name={group.items[0]?.icon || "layers"} className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                        {group.label}
                      </h3>
                    </div>

                    {/* Sequential Pages List */}
                    <div className="mt-2.5 space-y-0.5">
                      {matchingItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className="group/page flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-400 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 group-hover/page:bg-blue-50 group-hover/page:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover/page:bg-blue-950/60 dark:group-hover/page:text-blue-400 transition-colors">
                              <ModuleIcon name={item.icon || "file-text"} className="h-3 w-3" />
                            </span>
                            <span className="truncate font-medium">{item.name}</span>
                          </div>
                          <span className="text-slate-300 opacity-0 group-hover/page:opacity-100 group-hover/page:translate-x-0.5 transition-all text-xs text-blue-600">&rarr;</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
