"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PERMISSIONS } from "@/constants/permissions";
import { useUiSchema } from "@/context/UiSchemaContext";

type RegistryItem = {
  key: string;
  name: string;
  path: string;
  permissions: string[];
  order: number;
};

type RegistryGroup = {
  label: string;
  items: RegistryItem[];
  order: number;
};

type RegistryModule = {
  key: string;
  label: string;
  groups: RegistryGroup[];
  routeRules: Array<{ pathPattern: string; permissionKeys: string[] }>;
  dashboardWidgets: Array<{ key: string; title: string; href?: string | null }>;
  enabled: boolean;
  order: number;
};

const filterModule = (module: RegistryModule | undefined, query: string): RegistryModule | null => {
  if (!module) return null;

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return module;
  }

  const groups = module.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = `${item.name} ${item.path} ${item.permissions.join(" ")}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const routeRules = module.routeRules.filter((rule) =>
    `${rule.pathPattern} ${rule.permissionKeys.join(" ")}`.toLowerCase().includes(normalizedQuery)
  );

  const dashboardWidgets = module.dashboardWidgets.filter((widget) =>
    `${widget.title} ${widget.href || ""}`.toLowerCase().includes(normalizedQuery)
  );

  if (groups.length === 0 && routeRules.length === 0 && dashboardWidgets.length === 0) {
    return null;
  }

  return {
    ...module,
    groups,
    routeRules,
    dashboardWidgets,
  };
};

export default function ModuleMappingPage() {
  const {
    navigation,
    routeRules,
    dashboard,
    enabledModules,
    loading: schemaLoading,
    refresh,
    state,
    usingCache,
    lastSuccessfulAt,
  } = useUiSchema();
  const [selectedModule, setSelectedModule] = useState<string>("platform");
  const [search, setSearch] = useState("");

  const modules = useMemo<RegistryModule[]>(() => {
    const enabledMap = new Map(
      enabledModules.map((module, index) => [
        module.key,
        {
          key: module.key,
          label: module.displayName || module.name || module.key,
          enabled: module.isEnabled !== false,
          order: typeof module.order === "number" ? module.order : index,
        },
      ])
    );

    const navigationMap = new Map(
      navigation.modules.map((module, index) => [
        module.key,
        {
          key: module.key,
          label: module.displayName,
          enabled: true,
          order: typeof module.sortOrder === "number" ? module.sortOrder : index,
          groups: module.groups
            .slice()
            .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label))
            .map((group, groupIndex) => ({
              label: group.label?.trim() || "Pages",
              order: typeof group.sortOrder === "number" ? group.sortOrder : groupIndex,
              items: group.items
                .slice()
                .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
                .map((item, itemIndex) => ({
                  key: item.key,
                  name: item.name,
                  path: item.path,
                  permissions: item.requiredPermissions,
                  order: typeof item.sortOrder === "number" ? item.sortOrder : itemIndex,
                })),
            })),
        },
      ])
    );

    const dashboardWidgetsByModule = new Map<string, RegistryModule["dashboardWidgets"]>();
    for (const section of dashboard.sections) {
      for (const widget of section.widgets) {
        const moduleKey = widget.moduleKey?.trim();
        if (!moduleKey) continue;
        const bucket = dashboardWidgetsByModule.get(moduleKey) ?? [];
        bucket.push({
          key: widget.key,
          title: widget.title,
          href: widget.href,
        });
        dashboardWidgetsByModule.set(moduleKey, bucket);
      }
    }

    const routeRulesByModule = new Map<string, RegistryModule["routeRules"]>();
    for (const rule of routeRules.rules) {
      const bucket = routeRulesByModule.get(rule.moduleKey) ?? [];
      bucket.push({
        pathPattern: rule.pathPattern,
        permissionKeys: rule.permissionKeys,
      });
      routeRulesByModule.set(rule.moduleKey, bucket);
    }

    const keys = new Set<string>([
      ...enabledMap.keys(),
      ...navigationMap.keys(),
      ...routeRulesByModule.keys(),
      ...dashboardWidgetsByModule.keys(),
    ]);

    return [...keys]
      .map((key) => {
        const enabled = enabledMap.get(key);
        const nav = navigationMap.get(key);
        return {
          key,
          label: nav?.label || enabled?.label || key,
          enabled: enabled?.enabled ?? !!nav,
          order: nav?.order ?? enabled?.order ?? Number.MAX_SAFE_INTEGER,
          groups: nav?.groups ?? [],
          routeRules: (routeRulesByModule.get(key) ?? []).sort((left, right) =>
            left.pathPattern.localeCompare(right.pathPattern)
          ),
          dashboardWidgets: (dashboardWidgetsByModule.get(key) ?? []).sort((left, right) =>
            left.title.localeCompare(right.title)
          ),
        };
      })
      .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
  }, [dashboard.sections, enabledModules, navigation.modules, routeRules.rules]);

  useEffect(() => {
    if (modules.length === 0) return;
    if (modules.some((module) => module.key === selectedModule)) return;
    setSelectedModule(modules[0]?.key ?? "platform");
  }, [modules, selectedModule]);

  const selectedModuleData = useMemo(
    () => filterModule(modules.find((module) => module.key === selectedModule), search),
    [modules, search, selectedModule]
  );

  const totalNavItems = useMemo(
    () => navigation.modules.reduce((count, module) => count + module.groups.reduce((sum, group) => sum + group.items.length, 0), 0),
    [navigation.modules]
  );

  const totalDashboardWidgets = useMemo(
    () => dashboard.sections.reduce((count, section) => count + section.widgets.length, 0),
    [dashboard.sections]
  );

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_SETTINGS_VIEW}>
      <StandardPageLayout
        title="Navigation Registry"
        subtitle="Backend-authoritative workspace registry. Frontend fallback page maps and role menu forks have been removed."
        eyebrow="Administration / UI Shell"
        icon="grid"
      >
        <div className="grid gap-4 xl:grid-cols-[280px,1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Backend State</p>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Enabled modules</span>
                  <span className="font-semibold text-slate-900">{enabledModules.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Navigation items</span>
                  <span className="font-semibold text-slate-900">{totalNavItems}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Route rules</span>
                  <span className="font-semibold text-slate-900">{routeRules.rules.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Dashboard widgets</span>
                  <span className="font-semibold text-slate-900">{totalDashboardWidgets}</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                Current schema state: <span className="font-semibold uppercase">{state}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label htmlFor="registry-search" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Search
              </label>
              <input
                id="registry-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find page, rule, widget..."
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2">
              <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modules</p>
              <div className="space-y-1">
                {modules.map((module) => {
                  const active = module.key === selectedModule;
                  const navCount = module.groups.reduce((count, group) => count + group.items.length, 0);
                  return (
                    <button
                      key={module.key}
                      type="button"
                      onClick={() => setSelectedModule(module.key)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">{module.label}</span>
                        <span className="block text-xs text-slate-500">
                          {module.enabled ? "enabled" : "disabled"} | {navCount} pages
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              Sidebar visibility, protected route access, and dashboard entry points now come only from backend UI shell responses.
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Module</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {selectedModuleData?.label || modules.find((module) => module.key === selectedModule)?.label || "Module"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="erp-action-btn erp-action-btn-secondary"
                >
                  Refresh backend schema
                </button>
              </div>

              {schemaLoading ? (
                <div className="py-6">
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-6 w-full animate-pulse rounded bg-slate-200" />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-40 animate-pulse rounded bg-slate-200" />
                      <div className="h-40 animate-pulse rounded bg-slate-200" />
                      <div className="h-40 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ) : !selectedModuleData ? (
                <p className="py-6 text-sm text-slate-500">No backend records matched the current module and search filter.</p>
              ) : (
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Navigation</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedModuleData.groups.reduce((count, group) => count + group.items.length, 0)}
                      </span>
                    </div>
                    <div className="mt-4 space-y-4">
                      {selectedModuleData.groups.length > 0 ? (
                        selectedModuleData.groups.map((group) => (
                          <div key={`${selectedModuleData.key}-${group.label}`}>
                            {selectedModuleData.groups.length > 1 ? (
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
                            ) : null}
                            <div className="mt-2 space-y-2">
                              {group.items.map((item) => (
                                <div key={item.path} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                  <p className="mt-1 font-mono text-xs text-slate-500">{item.path}</p>
                                  <p className="mt-2 text-xs text-slate-500">
                                    {item.permissions.length > 0 ? item.permissions.join(", ") : "No explicit permissions"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No navigation items were returned for this module.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Route Rules</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedModuleData.routeRules.length}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedModuleData.routeRules.length > 0 ? (
                        selectedModuleData.routeRules.map((rule) => (
                          <div key={`${selectedModuleData.key}-${rule.pathPattern}`} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <p className="font-mono text-xs text-slate-600">{rule.pathPattern}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              {rule.permissionKeys.length > 0 ? rule.permissionKeys.join(", ") : "No explicit permissions"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No route rules were returned for this module.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Dashboard Widgets</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedModuleData.dashboardWidgets.length}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedModuleData.dashboardWidgets.length > 0 ? (
                        selectedModuleData.dashboardWidgets.map((widget) => (
                          <div key={`${selectedModuleData.key}-${widget.key}`} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-sm font-semibold text-slate-900">{widget.title}</p>
                            <p className="mt-1 font-mono text-xs text-slate-500">{widget.href || "No link target"}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No dashboard widgets were returned for this module.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </section>
            {usingCache ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                <span>
                  Showing cached navigation and registry data (last known good: {lastSuccessfulAt ? new Date(lastSuccessfulAt).toLocaleString() : "unknown"}).
                </span>
                <button onClick={() => void refresh()} className="ml-3 font-semibold underline">Retry</button>
              </div>
            ) : null}
          </div>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
