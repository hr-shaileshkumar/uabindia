"use client";

import { useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  MODULE_META,
  clearModuleMappingOverrides,
  normalizeModuleMappingOverrides,
  persistModuleMappingOverrides,
  readModuleMappingOverrides,
  resolvePageRegistry,
  type ModuleMappingOverrides,
  type PageRegistryItem,
} from "@/lib/platform/page-registry";
import type { ModuleKey } from "@/config/route-permissions.config";

type PanelView = ModuleKey | "unmapped";

const LOCKED_PATHS = new Set<string>([ROUTES.PLATFORM_MODULE_MAPPING]);

export default function ModuleMappingPage() {
  const [selectedView, setSelectedView] = useState<PanelView>("platform");
  const [search, setSearch] = useState("");
  const [savedOverrides, setSavedOverrides] = useState<ModuleMappingOverrides>(() => readModuleMappingOverrides());
  const [draftOverrides, setDraftOverrides] = useState<ModuleMappingOverrides>(() => readModuleMappingOverrides());
  const [saving, setSaving] = useState(false);

  const normalizedDraft = useMemo(() => normalizeModuleMappingOverrides(draftOverrides), [draftOverrides]);
  const normalizedSaved = useMemo(() => normalizeModuleMappingOverrides(savedOverrides), [savedOverrides]);

  const allPages = useMemo(
    () =>
      resolvePageRegistry(normalizedDraft).map((page) =>
        LOCKED_PATHS.has(page.path) ? { ...page, modules: ["platform" as ModuleKey] } : page
      ),
    [normalizedDraft]
  );

  const hasUnsavedChanges = JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedSaved);

  const unmappedPages = useMemo(() => allPages.filter((p) => p.modules.length === 0), [allPages]);

  const moduleCounts = useMemo(
    () =>
      Object.fromEntries(
        MODULE_META.map((m) => [m.key, allPages.filter((p) => p.modules.includes(m.key)).length])
      ) as Record<ModuleKey, number>,
    [allPages]
  );

  const visiblePages = useMemo(() => {
    const pool = selectedView === "unmapped" ? unmappedPages : allPages;
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? pool.filter(
          (p) =>
            p.name.toLowerCase().includes(keyword) ||
            p.path.toLowerCase().includes(keyword) ||
            (p.group ?? "").toLowerCase().includes(keyword)
        )
      : pool;

    if (selectedView === "unmapped") return filtered;

    // Sort: assigned to selected module first, then alphabetical
    return [...filtered].sort((a, b) => {
      const aHas = a.modules.includes(selectedView as ModuleKey) ? 1 : 0;
      const bHas = b.modules.includes(selectedView as ModuleKey) ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return a.name.localeCompare(b.name);
    });
  }, [selectedView, allPages, unmappedPages, search]);

  const sidebarPreview = useMemo(
    () => MODULE_META.map((m) => ({ ...m, pages: allPages.filter((p) => p.modules.includes(m.key)) })),
    [allPages]
  );

  const togglePage = (page: PageRegistryItem) => {
    if (LOCKED_PATHS.has(page.path) || selectedView === "unmapped") return;
    const moduleKey = selectedView as ModuleKey;
    const isAssigned = page.modules.includes(moduleKey);
    const nextModules = isAssigned
      ? page.modules.filter((m) => m !== moduleKey)
      : [...page.modules, moduleKey];
    setDraftOverrides((prev) => ({ ...prev, [page.path]: nextModules }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      persistModuleMappingOverrides(normalizedDraft);
      setSavedOverrides(normalizedDraft);
      notifySuccess("Module mappings saved. Sidebar updated immediately.");
    } catch {
      notifyError("Failed to save module mappings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    clearModuleMappingOverrides();
    setSavedOverrides({});
    setDraftOverrides({});
    notifySuccess("Reset to default navigation registry.");
  };

  const selectedLabel =
    selectedView === "unmapped"
      ? `Unmapped Pages (${unmappedPages.length})`
      : (MODULE_META.find((m) => m.key === selectedView)?.label ?? "");

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_SETTINGS_VIEW}>
      <StandardPageLayout
        title="Module Mapping"
        subtitle="Assign pages to modules. Sidebar auto-renders from this mapping — no hardcoding needed."
        eyebrow="Administration / Navigation Architecture"
        icon="grid"
        actions={
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="erp-action-btn erp-action-btn-primary"
            >
              {saving ? "Saving..." : "Save Mapping"}
            </button>
          </div>
        }
      >
        {/* 3-column layout: modules | page checklist | sidebar preview */}
        <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[200px,1fr,240px]">

          {/* ── Left: Module list ── */}
          <aside className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Modules</span>
            </div>
            <nav className="flex flex-col gap-0.5 p-2">
              {MODULE_META.map((m) => {
                const active = selectedView === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setSelectedView(m.key); setSearch(""); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-sky-50 text-sky-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className={`text-xs font-semibold ${active ? "text-sky-600" : "text-slate-400"}`}>
                      {moduleCounts[m.key]}
                    </span>
                  </button>
                );
              })}
              {/* Unmapped section */}
              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => { setSelectedView("unmapped"); setSearch(""); }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    selectedView === "unmapped"
                      ? "bg-amber-50 text-amber-800"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span>Unmapped</span>
                  {unmappedPages.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {unmappedPages.length}
                    </span>
                  )}
                </button>
              </div>
            </nav>
          </aside>

          {/* ── Centre: Page checklist ── */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* Header + search */}
            <div className="border-b border-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{selectedLabel}</span>
                {selectedView !== "unmapped" && (
                  <span className="text-xs text-slate-400">
                    {visiblePages.filter((p) => p.modules.includes(selectedView as ModuleKey)).length} assigned
                  </span>
                )}
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                className="erp-input"
              />
            </div>

            {/* Unmapped info banner */}
            {selectedView === "unmapped" && (
              <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                These pages are not assigned to any module. Select a module from the left panel and add them.
              </div>
            )}

            {/* Page rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {visiblePages.length === 0 ? (
                <div className="erp-empty">
                  {selectedView === "unmapped" ? "All pages are mapped." : "No pages found."}
                </div>
              ) : (
                visiblePages.map((page) => {
                  const locked = LOCKED_PATHS.has(page.path);
                  const isAssigned = selectedView !== "unmapped" && page.modules.includes(selectedView as ModuleKey);
                  const isShared = page.modules.length > 1;

                  return (
                    <label
                      key={page.path}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                        locked ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      {selectedView !== "unmapped" && (
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={locked}
                          onChange={() => togglePage(page)}
                          className="mt-0.5 h-4 w-4 cursor-pointer accent-sky-600"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{page.name}</span>
                          {page.group && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                              {page.group}
                            </span>
                          )}
                          {locked && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-600">locked</span>
                          )}
                          {isShared && !locked && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-600">
                              shared · {page.modules.length} modules
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-slate-400">{page.path}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: Sidebar preview ── */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sidebar Preview</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 text-xs">
              {sidebarPreview.map((m) => (
                <div key={m.key} className="mb-3">
                  <div className="mb-1 px-2 font-semibold text-slate-500">{m.label}</div>
                  {m.pages.length === 0 ? (
                    <div className="px-2 italic text-slate-300">No pages</div>
                  ) : (
                    m.pages.map((p) => (
                      <div key={p.path} className="flex items-center gap-1.5 px-2 py-0.5 text-slate-600">
                        <span className="text-slate-300">├</span>
                        <span>{p.name}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
