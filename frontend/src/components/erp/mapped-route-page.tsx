"use client";

import Link from "next/link";
import { ArrowRight, LayoutList, Network } from "lucide-react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { WorkspaceStatusPanel } from "@/components/erp/workspace-status-panel";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  findWorkspaceModuleByPath,
  findWorkspacePageByPath,
} from "@/lib/erp/navigation";

type MappedRoutePageProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  notice?: string;
};

export function MappedRoutePage({
  eyebrow = "Workspace / Module Route",
  title,
  subtitle,
  notice,
}: MappedRoutePageProps) {
  const pathname = usePathname();
  const { navigation, enabledModules, loading, schemaError, refresh } = useUiSchema();

  const modules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [enabledModules, navigation.modules]
  );

  const pageMatch = useMemo(
    () => findWorkspacePageByPath(modules, pathname),
    [modules, pathname]
  );

  const moduleMatch = useMemo(
    () => findWorkspaceModuleByPath(modules, pathname),
    [modules, pathname]
  );

  const resolvedModule = pageMatch?.module || moduleMatch;
  const relatedPages = useMemo(() => {
    if (pageMatch) {
      return pageMatch.group.items.filter((item) => item.path !== pageMatch.item.path).slice(0, 6);
    }

    return resolvedModule?.groups.flatMap((group) => group.items).slice(0, 6) ?? [];
  }, [pageMatch, resolvedModule]);

  const resolvedTitle = title || pageMatch?.item.name || resolvedModule?.label || "Workspace Route";
  const resolvedSubtitle =
    subtitle ||
    (pageMatch
      ? `This route is mapped through centralized ${pageMatch.group.label.toLowerCase()} navigation for ${pageMatch.module.label}.`
      : resolvedModule
        ? "Use this workspace route as a clean module entry point while dedicated workflow screens are expanded."
        : "This route could not be resolved from the current backend navigation schema.");

  return (
    <StandardPageLayout
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      eyebrow={eyebrow}
      icon={resolvedModule?.icon || "layers"}
      meta={
        resolvedModule ? (
          <CrudHeaderStats
            items={[
              { label: "Module", value: resolvedModule.label, helper: "owner" },
              { label: "Group", value: pageMatch?.group.label || "Module home", tone: "info" },
              { label: "Pages", value: resolvedModule.pageCount, tone: "positive" },
              { label: "Related", value: relatedPages.length, tone: "warning" },
            ]}
          />
        ) : null
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {resolvedModule?.homeHref ? (
            <Link href={resolvedModule.homeHref} className="erp-action-btn erp-action-btn-primary">
              Open module home
            </Link>
          ) : null}
          <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary">
            Refresh route map
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="erp-loading">Loading route mapping...</div>
      ) : !resolvedModule ? (
        <WorkspaceStatusPanel
          tone={schemaError ? "critical" : "warning"}
          title={schemaError ? "Route metadata is unavailable" : "This route is not mapped yet"}
          description={
            schemaError
              ? "The frontend could not load backend navigation or route rules for this workspace."
              : "This protected page is reachable, but no matching module/page metadata was returned from the backend schema."
          }
          detail={schemaError || pathname}
          onRetry={() => void refresh()}
        />
      ) : (
        <div className="space-y-6">
          {notice ? <div className="erp-alert-info">{notice}</div> : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
            <section className="erp-panel erp-panel-body">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route Map</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Route summary
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    This page is now mapped inside the shared protected shell and linked to its closest operational routes.
                  </p>
                </div>
                <StatusBadge tone="info">{relatedPages.length} linked routes</StatusBadge>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(15,74,125,0.12),rgba(11,123,115,0.12))] text-[color:var(--erp-primary)] shadow-sm">
                      <Network className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Path</p>
                      <p className="mt-1 font-mono text-xs text-slate-700">{pathname}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white/95 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Module Home</p>
                      <p className="mt-2 font-mono text-xs text-slate-700">{resolvedModule.homeHref || "Not derived"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/95 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Resolved Group</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{pageMatch?.group.label || "Module home"}</p>
                    </div>
                  </div>
                </div>

                {relatedPages.length === 0 ? (
                  <div className="erp-empty min-h-[220px]">
                    No sibling routes were returned for this page from the current backend navigation schema.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-3">
                    <div className="flex items-center gap-3 px-1 pb-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(15,74,125,0.1),rgba(11,123,115,0.1))] text-[color:var(--erp-primary)]">
                        <LayoutList className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Related Pages</p>
                        <p className="text-sm text-slate-600">Open the closest workflow destination directly.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {relatedPages.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white/92 px-3 py-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(15,74,125,0.1),rgba(11,123,115,0.1))] text-[color:var(--erp-primary)] shadow-sm transition">
                            <ModuleIcon name={item.icon || resolvedModule.icon} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-950">{item.name}</span>
                            <span className="mt-0.5 block truncate text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                              {item.path}
                            </span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="erp-panel erp-panel-body">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(15,74,125,0.12),rgba(11,123,115,0.12))] text-[color:var(--erp-primary)]">
                    <Network className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mapped Through</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Central navigation</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Protected module pages now resolve through one route map, one sidebar, and one topbar instead of falling back to isolated mock layouts.
                </p>
              </section>

              <section className="erp-panel erp-panel-body">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(5,150,105,0.12),rgba(34,197,94,0.1))] text-emerald-700">
                    <LayoutList className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why this changed</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Shell aligned</h3>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Shared spacing now matches the rest of the protected app.</li>
                  <li>Module context stays visible without oversized filler panels.</li>
                  <li>Nearby task routes remain accessible from one compact view.</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
