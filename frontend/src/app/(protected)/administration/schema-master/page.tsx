"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  Save,
  Send,
  RotateCcw,
  Eye,
  Code2,
  Layout,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Loader2,
  Columns3,
  Zap,
  Check,
} from "lucide-react";
import { UabLayoutStudio } from "@/components/dynamic/builder/UabLayoutStudio";
import { DynamicForm } from "@/components/dynamic/DynamicForm";
import { UniversalPageDispatcher } from "@/components/dynamic/UniversalPageDispatcher";
import { ARCHETYPE_OPTIONS } from "../page-builder/page";
import { pageSchemaToDynamicSchema } from "@/components/dynamic/DynamicPage";
import { masterSchemaCatalog, getCatalogSchema } from "@/lib/metadata/catalog";
import { platformApi } from "@/services/modules/administration";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { DynamicPageSchema } from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

export default function SchemaMasterPage() {
  const [selectedPageKey, setSelectedPageKey] = useState<string>("hrms.employees");
  const [schema, setSchema] = useState<DynamicPageSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"archetype" | "designer" | "preview" | "json">("archetype");
  const [previewSubTab, setPreviewSubTab] = useState<"full" | "form">("full");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbEntities, setDbEntities] = useState<any[]>([]);
  const [version, setVersion] = useState<number>(1);
  const [isDraft, setIsDraft] = useState(false);

  // Available catalog pages grouped by module
  const catalogPageKeys = useMemo(() => {
    return Object.keys(masterSchemaCatalog).sort();
  }, []);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return catalogPageKeys;
    const q = searchQuery.toLowerCase();
    return catalogPageKeys.filter((k) => {
      const cat = masterSchemaCatalog[k];
      return k.toLowerCase().includes(q) || (cat?.title && cat.title.toLowerCase().includes(q));
    });
  }, [catalogPageKeys, searchQuery]);

  // Load available entities from backend reflection
  useEffect(() => {
    platformApi.uiPages
      .getEntities()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        setDbEntities(raw);
      })
      .catch(() => setDbEntities([]));
  }, []);

  // Load Schema for selected page
  const loadSchema = useCallback(async (pageKey: string) => {
    setLoading(true);
    try {
      let loadedSchema: DynamicPageSchema | null = null;
      let loadedVersion = 1;
      let hasDraft = false;

      // 1. Try DB schema from API
      try {
        const res = await platformApi.uiPages.get(pageKey, { draft: true });
        const raw = res.data;
        if (raw && raw.schemaJson) {
          loadedSchema = typeof raw.schemaJson === "string" ? JSON.parse(raw.schemaJson) : raw.schemaJson;
          loadedVersion = raw.version || 1;
          hasDraft = raw.status === "Draft" || Boolean(raw.draftSchemaJson);
        }
      } catch {
        // Fallback to static catalog if not yet saved in DB
      }

      // 2. Fallback to Catalog Schema
      if (!loadedSchema) {
        const catalog = getCatalogSchema(pageKey);
        if (catalog) {
          loadedSchema = pageSchemaToDynamicSchema(catalog);
        }
      }

      setSchema(loadedSchema);
      setVersion(loadedVersion);
      setIsDraft(hasDraft);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load page schema."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPageKey) {
      void loadSchema(selectedPageKey);
    }
  }, [selectedPageKey, loadSchema]);

  // Save Draft to Backend
  const handleSaveDraft = async () => {
    if (!schema || !selectedPageKey) return;
    setSaving(true);
    try {
      const payload = {
        title: schema.title,
        subTitle: schema.subTitle,
        routePath: schema.apiEndpoint,
        schemaJson: JSON.stringify(schema),
        changeSummary: "Draft updated via Visual Schema Studio",
      };

      await platformApi.uiPages.saveDraft(selectedPageKey, payload);
      setIsDraft(true);
      notifySuccess(`Draft saved for '${schema.title || selectedPageKey}'.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save schema draft."));
    } finally {
      setSaving(false);
    }
  };

  // Publish Version to Live Database
  const handlePublish = async () => {
    if (!schema || !selectedPageKey) return;
    if (!confirm(`Are you sure you want to publish '${schema.title || selectedPageKey}' to all live users?`)) {
      return;
    }
    setPublishing(true);
    try {
      // 1. Save draft first to ensure latest edits are synced
      await platformApi.uiPages.saveDraft(selectedPageKey, {
        title: schema.title,
        subTitle: schema.subTitle,
        routePath: schema.apiEndpoint,
        schemaJson: JSON.stringify(schema),
        changeSummary: "Pre-publish sync",
      });

      // 2. Publish
      await platformApi.uiPages.publish(selectedPageKey, {
        changeSummary: "Published from Visual Schema Studio",
      });

      setIsDraft(false);
      setVersion((v) => v + 1);
      notifySuccess(`Version published successfully! All users will now see updated schema.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to publish schema."));
    } finally {
      setPublishing(false);
    }
  };

  // Reset to catalog default
  const handleReset = () => {
    const catalog = getCatalogSchema(selectedPageKey);
    if (!catalog) {
      notifyError("No default catalog schema found for this page.");
      return;
    }
    if (confirm("Reset current layout to standard system catalog defaults? Unsaved draft edits will be overwritten.")) {
      setSchema(pageSchemaToDynamicSchema(catalog));
      notifySuccess("Reset to catalog schema defaults.");
    }
  };

  const handleApplyArchetype = (archetypeKey: "master" | "dashboard" | "document" | "kanban" | "calendar" | "studio") => {
    if (!schema) return;
    setSchema((prev) => {
      if (!prev) return prev;
      const next = { ...prev, archetype: archetypeKey };
      if (archetypeKey === "dashboard") {
        next.viewType = "cards";
      } else if (archetypeKey === "document") {
        next.viewType = "table";
      } else if (archetypeKey === "kanban") {
        next.viewType = "kanban";
      } else if (archetypeKey === "calendar") {
        next.viewType = "calendar";
      } else if (archetypeKey === "studio") {
        next.viewType = "split";
      } else {
        next.viewType = "table";
      }
      return next;
    });
    notifySuccess(`Switched archetype to "${archetypeKey.toUpperCase()}".`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-slate-100/70 dark:bg-slate-950">
      {/* Studio Header Bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 bg-white px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Layout className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Schema & Custom Fields Master Studio
              </h1>
              {isDraft ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Draft
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Live v{version}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Customize form fields, layout sections, table columns, and lookups without touching code.
            </p>
          </div>
        </div>

        {/* Page Selector & Mode Tabs */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPageKey}
              onChange={(e) => setSelectedPageKey(e.target.value)}
              className="h-9 min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
            >
              {filteredPages.map((pageKey) => {
                const item = masterSchemaCatalog[pageKey];
                return (
                  <option key={pageKey} value={pageKey}>
                    {item?.title ? `${item.title} (${pageKey})` : pageKey}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab("archetype")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeTab === "archetype"
                  ? "bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-400 font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Archetype</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("designer")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeTab === "designer"
                  ? "bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Layout className="h-3.5 w-3.5" />
              <span>Layout Designer</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeTab === "preview"
                  ? "bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeTab === "json"
                  ? "bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>JSON Schema</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              title="Reset to standard catalog defaults"
              className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || !schema}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> : <Save className="h-3.5 w-3.5 text-blue-600" />}
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || !schema}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>Publish Live</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 overflow-hidden p-3 sm:p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">Loading page schema from database…</p>
            </div>
          </div>
        ) : !schema ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
              <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">Schema Not Found</p>
              <p className="text-xs text-slate-500">Please select a valid page from the dropdown.</p>
            </div>
          </div>
        ) : activeTab === "archetype" ? (
          <div className="h-full overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Select Page Archetype
                </h3>
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  UAB India Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Choose the architectural archetype for <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedPageKey}</span>. The dispatcher automatically switches layouts, features, and behaviors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ARCHETYPE_OPTIONS.map((opt) => {
                const isSelected = (schema.archetype || "master") === opt.key;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleApplyArchetype(opt.key)}
                    className={cn(
                      "relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/60"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("p-2.5 rounded-xl", opt.iconBg)}>
                          <Icon className={cn("h-5 w-5", opt.iconColor)} />
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{opt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.description}</p>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Included Features:</span>
                        <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                          {opt.features.map((feat, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">archetype: &quot;{opt.key}&quot;</span>
                      <button
                        type="button"
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-200"
                        )}
                      >
                        {isSelected ? "Selected" : "Apply Archetype"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === "designer" ? (
          <div className="h-full overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <UabLayoutStudio
              schema={schema}
              onChange={setSchema}
              availableDbFields={dbEntities}
            />
          </div>
        ) : activeTab === "preview" ? (
          <div className="h-full flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{schema.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {schema.archetype || "master"} archetype
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewSubTab("full")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold transition cursor-pointer",
                    previewSubTab === "full"
                      ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-900 dark:text-blue-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  )}
                >
                  Full Page View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSubTab("form")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold transition cursor-pointer",
                    previewSubTab === "form"
                      ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-900 dark:text-blue-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  )}
                >
                  Form Only View
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
              {previewSubTab === "full" ? (
                <UniversalPageDispatcher pageKey={selectedPageKey} schema={schema} />
              ) : (
                <div className="max-w-4xl mx-auto">
                  <DynamicForm
                    sections={schema.form?.sections || []}
                    onSubmit={(formData) => {
                      notifySuccess("Form validation passed! Form submission payload simulated successfully.");
                      console.log("Simulated form payload:", formData);
                    }}
                    onCancel={() => setActiveTab("designer")}
                    isSaving={false}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Raw JSON Definition ({selectedPageKey})
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
                  notifySuccess("Schema JSON copied to clipboard!");
                }}
                className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                Copy JSON
              </button>
            </div>
            <textarea
              readOnly
              value={JSON.stringify(schema, null, 2)}
              className="flex-1 w-full font-mono text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
            />
          </div>
        )}
      </main>
    </div>
  );
}
