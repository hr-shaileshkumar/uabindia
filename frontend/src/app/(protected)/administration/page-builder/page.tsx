"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Layout,
  Table,
  SlidersHorizontal,
  CheckCircle2,
  FileText,
  Shield,
  Eye,
  Save,
  Send,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  ExternalLink,
  Calculator,
  Calendar,
  Kanban,
  Check,
  Zap,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { UniversalPageDispatcher } from "@/components/dynamic/UniversalPageDispatcher";
import { platformApi } from "@/services/modules/administration";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { UabLayoutStudio } from "@/components/dynamic/builder/UabLayoutStudio";
import type {
  DynamicColumn,
  DynamicFilter,
  DynamicFormField,
  DynamicFormSection,
  DynamicLineItemColumn,
  DynamicLineItemSection,
  DynamicPageSchema,
  UiPageSummary,
} from "@/lib/dynamic-schema/types";

export const ARCHETYPE_OPTIONS = [
  {
    key: "master" as const,
    title: "Master Register & Catalog",
    description: "Tabular data registry with search, advanced filter AST, sorting, pagination, multi-select bulk operations, and slide-over drawer CRUD.",
    icon: Table,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    features: [
      "Responsive high-density data grid",
      "Slide-over create & edit drawer form",
      "Filter AST builder & quick presets",
      "Column show/hide and reordering",
    ],
  },
  {
    key: "dashboard" as const,
    title: "Module & Submodule Hub",
    description: "Operational launchpad with executive KPI stat tiles, sub-module quick navigation cards, telemetry feeds, and domain status overview.",
    icon: Layout,
    iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    features: [
      "Executive KPI summary cards with trends",
      "Submodule & register navigation grid",
      "Operational status and recent activity",
      "One-click quick create shortcuts",
    ],
  },
  {
    key: "document" as const,
    title: "Commercial Document Voucher",
    description: "Commercial transaction voucher with document metadata headers, itemized line items grid, GST taxation formulas, grand totals strip, and PDF print.",
    icon: FileText,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    features: [
      "Header details (Vendor/Customer, Date, Ref)",
      "Line items grid with SKU lookup & qty/rate",
      "GST taxes, discount & grand totals strip",
      "Direct printable PDF voucher export",
    ],
  },
  {
    key: "kanban" as const,
    title: "State Progression Pipeline",
    description: "Workflow board organizing records by lifecycle states. Move items seamlessly across stages with status badges and permission enforcement.",
    icon: Kanban,
    iconBg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    features: [
      "Lane-based workflow progression",
      "Card quick actions and summaries",
      "State transition rule validation",
      "Lead/Candidate/Task lifecycle tracking",
    ],
  },
  {
    key: "calendar" as const,
    title: "Roster & Calendar Scheduler",
    description: "Temporal scheduling view mapping business records across monthly and weekly date grids with click-to-create date binding.",
    icon: Calendar,
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    features: [
      "Month and week interactive calendars",
      "Direct click-to-add on date cells",
      "Shift, attendance, and expiry tracking",
      "Status-coded event badges",
    ],
  },
  {
    key: "studio" as const,
    title: "Executive Command Studio",
    description: "Telemetry dashboard designer featuring flexible analytical cards, system health monitors, and split-screen operational metrics.",
    icon: Sparkles,
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    features: [
      "Customizable metric widgets",
      "Real-time operational gauges",
      "Configurable split-view layouts",
      "Domain telemetry feeds",
    ],
  },
];

type BuilderTab =
  | "archetype"
  | "visual"
  | "basics"
  | "columns"
  | "filters"
  | "form"
  | "lineItems"
  | "addons"
  | "actions"
  | "preview"
  | "history";

export default function PageBuilderStudio() {
  const [pages, setPages] = useState<UiPageSummary[]>([]);
  const [selectedPageKey, setSelectedPageKey] = useState<string>("hrms.employees");
  const [activeTab, setActiveTab] = useState<BuilderTab>("visual");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Entities & Field Discovery
  const [entities, setEntities] = useState<any[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Active Draft Schema State
  const [schema, setSchema] = useState<DynamicPageSchema>({
    schemaVersion: "1",
    pageKey: "hrms.employees",
    title: "Employee Master",
    subTitle: "Workforce records and organizational deployment.",
    entityName: "Employee",
    viewType: "table",
    apiEndpoint: "/api/v1/hrms/employees",
    columns: [],
    filters: [],
    form: { sections: [] },
    actions: [],
  });

  const [pageMetadata, setPageMetadata] = useState<{
    id?: string;
    status: string;
    publishedVersion?: number;
    draftVersion?: number;
    moduleKey: string;
    routePath: string;
    icon: string;
    navGroup?: string;
    navSortOrder: number;
    requiredPermission?: string;
    versions: any[];
  }>({
    status: "Draft",
    moduleKey: "hrms",
    routePath: "/hrms/employees",
    icon: "Users",
    navSortOrder: 1,
    versions: [],
  });

  // Load available entities and pages
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [pagesRes, entitiesRes] = await Promise.allSettled([
          platformApi.uiPages.list(),
          platformApi.uiPages.getEntities(),
        ]);

        if (pagesRes.status === "fulfilled") {
          const list = Array.isArray(pagesRes.value.data) ? pagesRes.value.data : [];
          setPages(list);
          if (list.length > 0 && !list.some((p: any) => p.pageKey === selectedPageKey)) {
            setSelectedPageKey(list[0].pageKey);
          }
        }

        if (entitiesRes.status === "fulfilled") {
          setEntities(Array.isArray(entitiesRes.value.data) ? entitiesRes.value.data : []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // Load selected page schema
  useEffect(() => {
    if (!selectedPageKey) return;
    const loadPage = async () => {
      try {
        setLoading(true);
        const res = await platformApi.uiPages.get(selectedPageKey, { draft: true });
        const raw = res.data;
        if (raw) {
          const parsed: DynamicPageSchema =
            typeof raw.schemaJson === "string" ? JSON.parse(raw.schemaJson) : raw.schemaJson;
          setSchema(parsed);
          setPageMetadata({
            id: raw.id,
            status: raw.status,
            publishedVersion: raw.publishedVersion,
            draftVersion: raw.draftVersion,
            moduleKey: raw.moduleKey,
            routePath: raw.routePath,
            icon: raw.icon,
            navGroup: raw.navGroup,
            navSortOrder: raw.navSortOrder,
            requiredPermission: raw.requiredPermission,
            versions: raw.versions || [],
          });
        }
      } catch (err) {
        notifyError(getApiErrorMessage(err, "Failed to load page schema."));
      } finally {
        setLoading(false);
      }
    };
    void loadPage();
  }, [selectedPageKey]);

  // Discover fields when entity changes
  useEffect(() => {
    if (!schema.entityName) return;
    const loadFields = async () => {
      try {
        setLoadingFields(true);
        const res = await platformApi.uiPages.getEntityFields(schema.entityName);
        setAvailableFields(Array.isArray(res.data) ? res.data : []);
      } catch {
        setAvailableFields([]);
      } finally {
        setLoadingFields(false);
      }
    };
    void loadFields();
  }, [schema.entityName]);

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await platformApi.uiPages.saveDraft(selectedPageKey, {
        title: schema.title,
        subTitle: schema.subTitle,
        routePath: pageMetadata.routePath,
        icon: pageMetadata.icon,
        navGroup: pageMetadata.navGroup,
        navSortOrder: pageMetadata.navSortOrder,
        requiredPermission: pageMetadata.requiredPermission,
        schemaJson: JSON.stringify(schema, null, 2),
        changeSummary: `Draft updated on ${new Date().toLocaleTimeString()}`,
      });
      notifySuccess("Draft schema saved successfully.");
      // Refresh page metadata
      const res = await platformApi.uiPages.get(selectedPageKey, { draft: true });
      if (res.data) {
        setPageMetadata((prev) => ({
          ...prev,
          status: res.data.status,
          draftVersion: res.data.draftVersion,
          versions: res.data.versions || [],
        }));
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save draft."));
    } finally {
      setSaving(false);
    }
  };

  // Publish Version
  const handlePublish = async () => {
    try {
      setPublishing(true);
      await handleSaveDraft();
      const res = await platformApi.uiPages.publish(selectedPageKey, {
        changeSummary: `Published version by Administrator`,
      });
      notifySuccess(res.data?.message || "Page published successfully!");
      setPageMetadata((prev) => ({
        ...prev,
        status: "Published",
        publishedVersion: res.data?.publishedVersion ?? (prev.publishedVersion || 1) + 1,
        draftVersion: undefined,
      }));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to publish page."));
    } finally {
      setPublishing(false);
    }
  };

  // Rollback
  const handleRollback = async (versionNum: number) => {
    try {
      setSaving(true);
      await platformApi.uiPages.rollback(selectedPageKey, versionNum);
      notifySuccess(`Rolled back to version ${versionNum}.`);
      // Reload schema
      const res = await platformApi.uiPages.get(selectedPageKey);
      if (res.data) {
        const parsed = typeof res.data.schemaJson === "string" ? JSON.parse(res.data.schemaJson) : res.data.schemaJson;
        setSchema(parsed);
        setPageMetadata((prev) => ({
          ...prev,
          publishedVersion: versionNum,
        }));
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Rollback failed."));
    } finally {
      setSaving(false);
    }
  };

  // Apply Archetype Preset Defaults
  const handleApplyArchetype = (archetypeKey: "master" | "dashboard" | "document" | "kanban" | "calendar" | "studio") => {
    setSchema((prev) => {
      const next = { ...prev, archetype: archetypeKey };
      if (archetypeKey === "dashboard") {
        next.viewType = "cards";
        if (!next.kpiMetrics || next.kpiMetrics.length === 0) {
          next.kpiMetrics = [
            { label: "Total Volume", value: "₹24.8 L", tone: "positive" },
            { label: "Active Records", value: "1,240", tone: "info" },
            { label: "Pending Approvals", value: "18", tone: "warning" },
            { label: "Processing SLA", value: "99.4%", tone: "positive" },
          ];
        }
      } else if (archetypeKey === "document") {
        next.viewType = "table";
        const sections = [...(prev.form?.sections || [])];
        if (sections.length === 0) {
          sections.push({ title: "Document Details", fields: [] });
        }
        if (!sections.some((s) => s.lineItems)) {
          sections[0] = {
            ...sections[0],
            lineItems: {
              key: "items",
              title: "Line Items & Commercials",
              allowAdd: true,
              allowDelete: true,
              totalComputedField: "totalAmount",
              columns: [
                { key: "itemCode", label: "Item / SKU", dataType: "lookup", required: true, width: "w-40" },
                { key: "description", label: "Description", dataType: "string", width: "w-56" },
                { key: "quantity", label: "Qty", dataType: "number", required: true, width: "w-24" },
                { key: "unitPrice", label: "Rate (₹)", dataType: "currency", required: true, width: "w-32" },
                { key: "taxRate", label: "GST %", dataType: "number", width: "w-24" },
                { key: "lineTotal", label: "Amount (₹)", dataType: "currency", formula: "quantity * unitPrice", readOnly: true, width: "w-36" },
              ],
            },
          };
        }
        next.form = { sections };
        if (!next.actions?.some((a) => a.key === "print")) {
          next.actions = [...(next.actions || []), { key: "print", label: "Print / PDF Voucher", actionType: "button" }];
        }
      } else if (archetypeKey === "kanban") {
        next.viewType = "kanban";
        if (!next.workflowConfig?.enabled) {
          next.workflowConfig = {
            enabled: true,
            workflowName: `${next.entityName} Pipeline`,
            stateField: "status",
            initialState: "Draft",
            states: [
              { name: "Draft", label: "Draft", tone: "neutral" },
              { name: "In Progress", label: "In Progress", tone: "info" },
              { name: "Under Review", label: "Under Review", tone: "warning" },
              { name: "Approved", label: "Approved", tone: "positive", isFinal: true },
            ],
            transitions: [
              { action: "submit", label: "Submit for Review", fromState: "Draft", toState: "Under Review" },
              { action: "approve", label: "Approve", fromState: "Under Review", toState: "Approved" },
              { action: "reject", label: "Return to Draft", fromState: "Under Review", toState: "Draft" },
            ],
          };
        }
      } else if (archetypeKey === "calendar") {
        next.viewType = "calendar";
      } else if (archetypeKey === "studio") {
        next.viewType = "split";
      } else {
        next.viewType = "table";
      }
      return next;
    });
    notifySuccess(`Archetype set to "${archetypeKey.toUpperCase()}". Defaults applied.`);
  };

  // Toggle Column inclusion
  const handleToggleColumn = (field: any) => {
    setSchema((prev) => {
      const exists = prev.columns.some((c) => c.key === field.key);
      if (exists) {
        return { ...prev, columns: prev.columns.filter((c) => c.key !== field.key) };
      } else {
        const newCol: DynamicColumn = {
          key: field.key,
          label: field.label,
          dataType:
            field.type === "currency"
              ? "currency"
              : field.type === "date"
              ? "date"
              : field.type === "status"
              ? "status"
              : field.type === "boolean"
              ? "boolean"
              : "string",
          sortable: true,
          filterable: true,
          sortOrder: prev.columns.length + 1,
          width: "150px",
        };
        return { ...prev, columns: [...prev.columns, newCol] };
      }
    });
  };

  // Move Column
  const handleMoveColumn = (index: number, direction: "up" | "down") => {
    setSchema((prev) => {
      const newCols = [...prev.columns];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= newCols.length) return prev;
      const temp = newCols[index];
      newCols[index] = newCols[targetIdx];
      newCols[targetIdx] = temp;
      newCols.forEach((c, idx) => (c.sortOrder = idx + 1));
      return { ...prev, columns: newCols };
    });
  };

  return (
    <StandardPageLayout
      title="No-Code Page Builder Studio"
      subtitle="Model and configure enterprise ERP pages, tables, forms, filters, and actions without writing frontend code."
      eyebrow="Platform / Architecture"
      icon="layers"
      meta={
        <HeaderSummary
          items={[
            { label: "Active Page", value: schema.title || selectedPageKey, tone: "info" },
            {
              label: "Status",
              value: `${pageMetadata.status} (v${pageMetadata.publishedVersion || 1})`,
              tone: pageMetadata.status === "Published" ? "success" : "warning",
            },
            { label: "Columns", value: schema.columns?.length || 0, tone: "default" },
            { label: "Form Fields", value: schema.form?.sections?.reduce((a, b) => a + b.fields.length, 0) || 0, tone: "default" },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || publishing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {publishing ? "Publishing…" : "Publish Live"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Selector & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Configure Page:</span>
            <select
              value={selectedPageKey}
              onChange={(e) => setSelectedPageKey(e.target.value)}
              className="erp-input text-xs font-semibold w-64"
            >
              {pages.map((p) => (
                <option key={p.pageKey} value={p.pageKey}>
                  {p.title} ({p.pageKey})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {pageMetadata.routePath && (
              <Link
                href={pageMetadata.routePath}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
              >
                <span>{pageMetadata.routePath}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
          {[
            { key: "archetype", label: "⚡ Archetype & Presets", icon: Zap, highlight: true },
            { key: "visual", label: "🎨 Visual Studio Designer", icon: Sparkles },
            { key: "basics", label: "1. Page & Entity", icon: Layout },
            { key: "columns", label: "2. Table Columns", icon: Table },
            { key: "filters", label: "3. Filters & KPIs", icon: SlidersHorizontal },
            { key: "form", label: "4. Form & Sections", icon: FileText },
            { key: "lineItems", label: "5. Line Items Grid", icon: Calculator },
            { key: "addons", label: "6. Universal Add-ons", icon: Shield, highlight: true },
            { key: "actions", label: "7. Actions & Security", icon: Shield },
            { key: "preview", label: "8. Interactive Live Preview", icon: Eye },
            { key: "history", label: "9. Versions & Rollback", icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as BuilderTab)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2",
                  isCurrent
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-300 dark:bg-indigo-950/20 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200",
                  tab.highlight && !isCurrent && "text-emerald-600 font-bold bg-emerald-50/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <CrudCard>
          <div className="p-6">
            {/* ─── TAB: Page Archetype & Presets ────────────────────────── */}
            {activeTab === "archetype" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Universal Page Archetype Engine
                    </h3>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                      UAB India Smart Presets
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select what kind of page this is. The engine automatically adapts the UI structure, behavior, features, and default addons to match the chosen archetype.
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
                            ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/60"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn("p-2.5 rounded-xl", opt.iconBg)}>
                              <Icon className={cn("h-5 w-5", opt.iconColor)} />
                            </div>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
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
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-200"
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
            )}

            {/* ─── TAB 0: UAB Visual Drag & Drop Studio ────────────────────────── */}
            {activeTab === "visual" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Visual Drag-and-Drop Page Designer
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Drag form controls from the component palette into section drop zones, reorder fields visually, and configure properties in real time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Test in Live Preview
                  </button>
                </div>

                <UabLayoutStudio
                  schema={schema}
                  onChange={setSchema}
                  availableDbFields={availableFields}
                />
              </div>
            )}

            {/* ─── TAB 1: Basics ──────────────────────────────────────────────── */}
            {activeTab === "basics" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Page Identity & Business Entity</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select the underlying data model and define page routing and titles.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="erp-field">
                    <label className="erp-label">Business Entity *</label>
                    <select
                      value={schema.entityName}
                      onChange={(e) => {
                        const ent = entities.find((x) => x.name === e.target.value);
                        setSchema((prev) => ({
                          ...prev,
                          entityName: e.target.value,
                          apiEndpoint: ent?.apiEndpoint || prev.apiEndpoint,
                        }));
                      }}
                      className="erp-input text-xs font-bold"
                    >
                      {entities.map((e) => (
                        <option key={e.name} value={e.name}>
                          {e.displayName} ({e.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="erp-field">
                    <label className="erp-label">Page Key (Unique Identifier) *</label>
                    <input
                      value={schema.pageKey}
                      onChange={(e) => setSchema((prev) => ({ ...prev, pageKey: e.target.value }))}
                      className="erp-input text-xs font-mono"
                    />
                  </div>

                  <div className="erp-field">
                    <label className="erp-label">Page Title *</label>
                    <input
                      value={schema.title}
                      onChange={(e) => setSchema((prev) => ({ ...prev, title: e.target.value }))}
                      className="erp-input text-xs font-semibold"
                    />
                  </div>

                  <div className="erp-field">
                    <label className="erp-label">Module Key *</label>
                    <input
                      value={pageMetadata.moduleKey}
                      onChange={(e) => setPageMetadata((prev) => ({ ...prev, moduleKey: e.target.value }))}
                      className="erp-input text-xs"
                    />
                  </div>

                  <div className="erp-field sm:col-span-2">
                    <label className="erp-label">Subtitle / Description</label>
                    <input
                      value={schema.subTitle || ""}
                      onChange={(e) => setSchema((prev) => ({ ...prev, subTitle: e.target.value }))}
                      className="erp-input text-xs"
                    />
                  </div>

                  <div className="erp-field">
                    <label className="erp-label">Route Path</label>
                    <input
                      value={pageMetadata.routePath}
                      onChange={(e) => setPageMetadata((prev) => ({ ...prev, routePath: e.target.value }))}
                      className="erp-input text-xs font-mono"
                    />
                  </div>

                  <div className="erp-field">
                    <label className="erp-label">Backend REST Endpoint</label>
                    <input
                      value={schema.apiEndpoint}
                      onChange={(e) => setSchema((prev) => ({ ...prev, apiEndpoint: e.target.value }))}
                      className="erp-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: Table Columns ───────────────────────────────────────── */}
            {activeTab === "columns" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Table Column Configuration ({schema.columns.length} columns active)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose which discovered entity fields appear in the dynamic data grid. Reorder and format them.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Discovered Entity Fields Checklist */}
                  <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Discovered {schema.entityName} Fields ({availableFields.length})
                      </span>
                      {loadingFields && <span className="text-[11px] text-slate-400">Introspecting…</span>}
                    </div>

                    <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                      {availableFields.map((f) => {
                        const isIncluded = schema.columns.some((c) => c.key === f.key);
                        return (
                          <label
                            key={f.key}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                              isIncluded
                                ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-950/30"
                                : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isIncluded}
                                onChange={() => handleToggleColumn(f)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{f.label}</span>
                                <span className="block font-mono text-[10px] text-slate-400">{f.key}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {f.type}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Table Columns Order & Config */}
                  <div className="lg:col-span-7 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Active Table Columns (Order from Left to Right)
                    </span>

                    {schema.columns.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        No columns selected yet. Check fields on the left to include them in this table.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {schema.columns.map((col, idx) => (
                          <div
                            key={col.key}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                              <div>
                                <input
                                  value={col.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSchema((prev) => ({
                                      ...prev,
                                      columns: prev.columns.map((c, i) => (i === idx ? { ...c, label: val } : c)),
                                    }));
                                  }}
                                  className="font-bold text-slate-800 dark:text-slate-200 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-hidden px-1"
                                />
                                <span className="block font-mono text-[10px] text-slate-400 px-1">{col.key}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={col.dataType}
                                onChange={(e) => {
                                  const dt = e.target.value as any;
                                  setSchema((prev) => ({
                                    ...prev,
                                    columns: prev.columns.map((c, i) => (i === idx ? { ...c, dataType: dt } : c)),
                                  }));
                                }}
                                className="erp-input text-[11px] py-1 px-2 w-28"
                              >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="currency">Currency (₹)</option>
                                <option value="date">Date</option>
                                <option value="badge">Badge</option>
                                <option value="status">Status</option>
                                <option value="boolean">Boolean</option>
                              </select>

                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveColumn(idx, "up")}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ChevronUp className="h-4 w-4 text-slate-600" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === schema.columns.length - 1}
                                onClick={() => handleMoveColumn(idx, "down")}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                              >
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSchema((prev) => ({
                                    ...prev,
                                    columns: prev.columns.filter((_, i) => i !== idx),
                                  }))
                                }
                                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: Filters & KPIs ──────────────────────────────────────── */}
            {activeTab === "filters" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dynamic Filters & Summary KPI Cards</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure search criteria and top dashboard summary metrics.</p>
                </div>

                {/* KPI Metrics */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary KPI Cards</span>
                  <div className="space-y-2">
                    {(schema.kpiMetrics || []).map((kpi, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs"
                      >
                        <input
                          value={kpi.label}
                          placeholder="KPI Label"
                          onChange={(e) => {
                            const val = e.target.value;
                            setSchema((prev) => ({
                              ...prev,
                              kpiMetrics: (prev.kpiMetrics || []).map((k, i) => (i === idx ? { ...k, label: val } : k)),
                            }));
                          }}
                          className="erp-input text-xs font-semibold flex-1"
                        />
                        <select
                          value={kpi.tone || "info"}
                          onChange={(e) => {
                            const tone = e.target.value as any;
                            setSchema((prev) => ({
                              ...prev,
                              kpiMetrics: (prev.kpiMetrics || []).map((k, i) => (i === idx ? { ...k, tone } : k)),
                            }));
                          }}
                          className="erp-input text-xs w-28"
                        >
                          <option value="info">Info</option>
                          <option value="positive">Positive</option>
                          <option value="warning">Warning</option>
                          <option value="neutral">Neutral</option>
                        </select>
                        <input
                          value={kpi.subtext || ""}
                          placeholder="Subtext"
                          onChange={(e) => {
                            const sub = e.target.value;
                            setSchema((prev) => ({
                              ...prev,
                              kpiMetrics: (prev.kpiMetrics || []).map((k, i) => (i === idx ? { ...k, subtext: sub } : k)),
                            }));
                          }}
                          className="erp-input text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSchema((prev) => ({
                              ...prev,
                              kpiMetrics: (prev.kpiMetrics || []).filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSchema((prev) => ({
                        ...prev,
                        kpiMetrics: [
                          ...(prev.kpiMetrics || []),
                          { label: "Metric Title", tone: "info", subtext: "Summary statistic" },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add KPI Card
                  </button>
                </div>
              </div>
            )}

            {/* ─── TAB 4: Form & Sections ─────────────────────────────────────── */}
            {activeTab === "form" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Form Layout & Field Sections</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Group fields into logical enterprise sections (Personal, Contract, Compliance).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSchema((prev) => ({
                        ...prev,
                        form: {
                          sections: [
                            ...(prev.form?.sections || []),
                            { title: "New Section", description: "Section description", fields: [] },
                          ],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Section
                  </button>
                </div>

                <div className="space-y-4">
                  {(schema.form?.sections || []).map((sec, secIdx) => (
                    <div
                      key={secIdx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={sec.title}
                            onChange={(e) => {
                              const t = e.target.value;
                              setSchema((prev) => {
                                const sections = [...(prev.form?.sections || [])];
                                sections[secIdx].title = t;
                                return { ...prev, form: { sections } };
                              });
                            }}
                            className="font-bold text-xs text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 px-1"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSchema((prev) => ({
                              ...prev,
                              form: {
                                sections: prev.form?.sections?.filter((_, i) => i !== secIdx) || [],
                              },
                            }))
                          }
                          className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Fields in Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sec.fields.map((f, fIdx) => (
                          <div
                            key={f.key || fIdx}
                            className="p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{f.label}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSchema((prev) => {
                                    const sections = [...(prev.form?.sections || [])];
                                    sections[secIdx].fields = sections[secIdx].fields.filter((_, i) => i !== fIdx);
                                    return { ...prev, form: { sections } };
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block">{f.key}</span>
                            <div className="flex items-center gap-2 pt-1">
                              <label className="flex items-center gap-1 text-[11px] text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={f.required}
                                  onChange={(e) => {
                                    const req = e.target.checked;
                                    setSchema((prev) => {
                                      const sections = [...(prev.form?.sections || [])];
                                      sections[secIdx].fields[fIdx].required = req;
                                      return { ...prev, form: { sections } };
                                    });
                                  }}
                                  className="h-3.5 w-3.5 rounded"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Field to Section dropdown */}
                      <div className="pt-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const fieldKey = e.target.value;
                            if (!fieldKey) return;
                            const fieldMeta = availableFields.find((f) => f.key === fieldKey);
                            if (!fieldMeta) return;
                            setSchema((prev) => {
                              const sections = [...(prev.form?.sections || [])];
                              sections[secIdx].fields.push({
                                key: fieldMeta.key,
                                label: fieldMeta.label,
                                fieldType: fieldMeta.type,
                                required: fieldMeta.isRequired,
                                placeholder: fieldMeta.placeholder,
                                options: fieldMeta.options,
                                optionsEndpoint: fieldMeta.lookupEndpoint,
                              });
                              return { ...prev, form: { sections } };
                            });
                          }}
                          className="erp-input text-xs w-56 font-semibold"
                        >
                          <option value="">+ Add Discovered Field…</option>
                          {availableFields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label} ({f.key})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB 5: Master-Detail Line Items ───────────────────────────── */}
            {activeTab === "lineItems" && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-indigo-600" />
                    Master-Detail Line Items Grid
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure document line-item tables (e.g., Quotation Lines, Purchase Request Items, Order Items) with auto-computed row totals and grand totals.
                  </p>
                </div>

                {(!schema.form?.sections || schema.form.sections.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                    Please create at least one form section in <strong>4. Form & Sections</strong> first before configuring line items.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {schema.form.sections.map((sec, sIdx) => {
                      const hasLineItems = Boolean(sec.lineItems);
                      return (
                        <div
                          key={sIdx}
                          className={cn(
                            "rounded-2xl border p-5 transition-all space-y-4",
                            hasLineItems
                              ? "border-indigo-200 bg-indigo-50/20 dark:border-indigo-900/50 dark:bg-indigo-950/10"
                              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                Section: {sec.title}
                              </span>
                              <p className="text-[11px] text-slate-500">
                                {hasLineItems
                                  ? `Configured with ${sec.lineItems?.columns?.length || 0} line columns`
                                  : "No line items grid attached to this section"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSchema((prev) => {
                                  const sections = [...(prev.form?.sections || [])];
                                  if (hasLineItems) {
                                    delete sections[sIdx].lineItems;
                                  } else {
                                    sections[sIdx].lineItems = {
                                      key: "items",
                                      title: `${sec.title} Items`,
                                      allowAdd: true,
                                      allowDelete: true,
                                      totalComputedField: "totalAmount",
                                      columns: [
                                        { key: "itemId", label: "Item / SKU", dataType: "lookup", required: true, optionsEndpoint: "/api/v1/inventory/items", width: "w-44" },
                                        { key: "description", label: "Description", dataType: "string", required: false, width: "w-56" },
                                        { key: "quantity", label: "Qty", dataType: "number", required: true, width: "w-24" },
                                        { key: "unitPrice", label: "Unit Price", dataType: "currency", required: true, width: "w-32" },
                                        { key: "lineTotal", label: "Total", dataType: "currency", formula: "quantity * unitPrice", readOnly: true, width: "w-32" },
                                      ],
                                    };
                                  }
                                  return { ...prev, form: { sections } };
                                });
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                                hasLineItems
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                              )}
                            >
                              {hasLineItems ? "Remove Line Grid" : "+ Attach Line Items Grid"}
                            </button>
                          </div>

                          {hasLineItems && sec.lineItems && (
                            <div className="space-y-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="erp-field">
                                  <label className="erp-label">Grid Header Title</label>
                                  <input
                                    value={sec.lineItems.title || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSchema((prev) => {
                                        const sections = [...(prev.form?.sections || [])];
                                        if (sections[sIdx].lineItems) {
                                          sections[sIdx].lineItems!.title = val;
                                        }
                                        return { ...prev, form: { sections } };
                                      });
                                    }}
                                    className="erp-input text-xs"
                                    placeholder="Order Items"
                                  />
                                </div>
                                <div className="erp-field">
                                  <label className="erp-label">Payload Array Field *</label>
                                  <input
                                    value={sec.lineItems.key}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSchema((prev) => {
                                        const sections = [...(prev.form?.sections || [])];
                                        if (sections[sIdx].lineItems) {
                                          sections[sIdx].lineItems!.key = val;
                                        }
                                        return { ...prev, form: { sections } };
                                      });
                                    }}
                                    className="erp-input text-xs font-mono"
                                    placeholder="items"
                                  />
                                </div>
                                <div className="erp-field">
                                  <label className="erp-label">Grand Total Field (Optional)</label>
                                  <input
                                    value={sec.lineItems.totalComputedField || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSchema((prev) => {
                                        const sections = [...(prev.form?.sections || [])];
                                        if (sections[sIdx].lineItems) {
                                          sections[sIdx].lineItems!.totalComputedField = val;
                                        }
                                        return { ...prev, form: { sections } };
                                      });
                                    }}
                                    className="erp-input text-xs font-mono"
                                    placeholder="totalAmount"
                                  />
                                </div>
                              </div>

                              {/* Columns Table */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Table Columns ({sec.lineItems.columns.length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSchema((prev) => {
                                        const sections = [...(prev.form?.sections || [])];
                                        if (sections[sIdx].lineItems) {
                                          sections[sIdx].lineItems!.columns.push({
                                            key: `col_${Date.now()}`,
                                            label: "New Column",
                                            dataType: "string",
                                            required: false,
                                          });
                                        }
                                        return { ...prev, form: { sections } };
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                  >
                                    <Plus className="h-3.5 w-3.5" /> Add Column
                                  </button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500">
                                        <th className="py-2 px-3">Key</th>
                                        <th className="py-2 px-3">Label</th>
                                        <th className="py-2 px-3">Data Type</th>
                                        <th className="py-2 px-3">Formula / Lookup Endpoint</th>
                                        <th className="py-2 px-3 text-center">Req?</th>
                                        <th className="py-2 px-3 text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {sec.lineItems.columns.map((c, cIdx) => (
                                        <tr key={cIdx}>
                                          <td className="py-2 px-3 font-mono">
                                            <input
                                              value={c.key}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setSchema((prev) => {
                                                  const sections = [...(prev.form?.sections || [])];
                                                  if (sections[sIdx].lineItems) {
                                                    sections[sIdx].lineItems!.columns[cIdx].key = val;
                                                  }
                                                  return { ...prev, form: { sections } };
                                                });
                                              }}
                                              className="erp-input text-xs py-1 px-2 w-28 font-mono"
                                            />
                                          </td>
                                          <td className="py-2 px-3">
                                            <input
                                              value={c.label}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setSchema((prev) => {
                                                  const sections = [...(prev.form?.sections || [])];
                                                  if (sections[sIdx].lineItems) {
                                                    sections[sIdx].lineItems!.columns[cIdx].label = val;
                                                  }
                                                  return { ...prev, form: { sections } };
                                                });
                                              }}
                                              className="erp-input text-xs py-1 px-2 w-32 font-semibold"
                                            />
                                          </td>
                                          <td className="py-2 px-3">
                                            <select
                                              value={c.dataType}
                                              onChange={(e) => {
                                                const val = e.target.value as any;
                                                setSchema((prev) => {
                                                  const sections = [...(prev.form?.sections || [])];
                                                  if (sections[sIdx].lineItems) {
                                                    sections[sIdx].lineItems!.columns[cIdx].dataType = val;
                                                  }
                                                  return { ...prev, form: { sections } };
                                                });
                                              }}
                                              className="erp-input text-xs py-1 px-2 w-24"
                                            >
                                              <option value="string">Text</option>
                                              <option value="number">Number</option>
                                              <option value="currency">Currency</option>
                                              <option value="lookup">Lookup</option>
                                              <option value="select">Select</option>
                                            </select>
                                          </td>
                                          <td className="py-2 px-3">
                                            {c.dataType === "lookup" ? (
                                              <input
                                                value={c.optionsEndpoint || ""}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setSchema((prev) => {
                                                    const sections = [...(prev.form?.sections || [])];
                                                    if (sections[sIdx].lineItems) {
                                                      sections[sIdx].lineItems!.columns[cIdx].optionsEndpoint = val;
                                                    }
                                                    return { ...prev, form: { sections } };
                                                  });
                                                }}
                                                placeholder="/api/v1/inventory/items"
                                                className="erp-input text-xs py-1 px-2 w-52 font-mono text-[11px]"
                                              />
                                            ) : (
                                              <input
                                                value={c.formula || ""}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setSchema((prev) => {
                                                    const sections = [...(prev.form?.sections || [])];
                                                    if (sections[sIdx].lineItems) {
                                                      sections[sIdx].lineItems!.columns[cIdx].formula = val;
                                                      if (val) sections[sIdx].lineItems!.columns[cIdx].readOnly = true;
                                                    }
                                                    return { ...prev, form: { sections } };
                                                  });
                                                }}
                                                placeholder="e.g. quantity * unitPrice"
                                                className="erp-input text-xs py-1 px-2 w-52 font-mono text-[11px]"
                                              />
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <input
                                              type="checkbox"
                                              checked={Boolean(c.required)}
                                              onChange={(e) => {
                                                const val = e.target.checked;
                                                setSchema((prev) => {
                                                  const sections = [...(prev.form?.sections || [])];
                                                  if (sections[sIdx].lineItems) {
                                                    sections[sIdx].lineItems!.columns[cIdx].required = val;
                                                  }
                                                  return { ...prev, form: { sections } };
                                                });
                                              }}
                                              className="h-3.5 w-3.5 rounded"
                                            />
                                          </td>
                                          <td className="py-2 px-3 text-right">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSchema((prev) => {
                                                  const sections = [...(prev.form?.sections || [])];
                                                  if (sections[sIdx].lineItems) {
                                                    sections[sIdx].lineItems!.columns = sections[sIdx].lineItems!.columns.filter((_, i) => i !== cIdx);
                                                  }
                                                  return { ...prev, form: { sections } };
                                                });
                                              }}
                                              className="text-rose-500 hover:text-rose-700 p-1"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: Universal Global Add-ons Manager ────────────────────── */}
            {activeTab === "addons" && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Universal Global Add-ons & Plugins
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Single-Point Configuration
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure modular capabilities for this page. Enabling any add-on here automatically binds all necessary UI controls, backend validations, and audit hooks.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* ADDON 1: Workflow & State Machine */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="addon-workflow"
                          checked={Boolean(schema.workflowConfig?.enabled)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSchema((prev) => ({
                              ...prev,
                              workflowConfig: checked
                                ? {
                                    enabled: true,
                                    workflowName: `${prev.entityName} Approval Workflow`,
                                    stateField: "status",
                                    initialState: "Draft",
                                    states: [
                                      { name: "Draft", label: "Draft", tone: "neutral" },
                                      { name: "Pending", label: "Pending Review", tone: "warning" },
                                      { name: "Approved", label: "Approved", tone: "positive", isFinal: true },
                                      { name: "Rejected", label: "Rejected", tone: "negative", isFinal: true },
                                    ],
                                    transitions: [
                                      { action: "submit", label: "Submit for Approval", fromState: "Draft", toState: "Pending" },
                                      { action: "approve", label: "Approve Record", fromState: "Pending", toState: "Approved" },
                                      { action: "reject", label: "Reject Record", fromState: "Pending", toState: "Rejected" },
                                    ],
                                  }
                                : undefined,
                            }));
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <label htmlFor="addon-workflow" className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                            State Machine & Multi-Stage Approval Workflow
                          </label>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Binds a visual workflow status bar, approval buttons, role-based transitions, and remarks collection to every record.
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        schema.workflowConfig?.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {schema.workflowConfig?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    {schema.workflowConfig?.enabled && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Configured States:</span>
                        <div className="flex flex-wrap gap-2">
                          {schema.workflowConfig.states.map((st) => (
                            <span key={st.name} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {st.label} {st.isFinal ? "✓" : "→"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ADDON 2: Audit Timeline */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="addon-timeline"
                        checked={schema.hasTimeline ?? true}
                        onChange={(e) => setSchema((prev) => ({ ...prev, hasTimeline: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <label htmlFor="addon-timeline" className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                          Audit Timeline & Historical Activity Trail
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Automatically captures who created or modified records, state transitions, comments, and field diffs in a chronological activity stream.
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      (schema.hasTimeline ?? true) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {(schema.hasTimeline ?? true) ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {/* ADDON 3: File & Document Attachments */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="addon-attachments"
                        checked={schema.hasAttachments ?? true}
                        onChange={(e) => setSchema((prev) => ({ ...prev, hasAttachments: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <label htmlFor="addon-attachments" className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                          Enterprise Document & Media Attachments
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Enables drag-and-drop document upload, file previews (PDFs, images, spreadsheets), file-size limits, and secure storage links.
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      (schema.hasAttachments ?? true) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {(schema.hasAttachments ?? true) ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {/* ADDON 4: Bulk Import & Export */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="addon-bulk"
                        checked={Boolean(schema.actions?.some((a) => a.key === "export"))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSchema((prev) => {
                            const nextActions = (prev.actions || []).filter((a) => a.key !== "export" && a.key !== "import");
                            if (checked) {
                              nextActions.push({ key: "export", label: "Export CSV / Excel", actionType: "button" });
                              nextActions.push({ key: "import", label: "Bulk Import", actionType: "button" });
                            }
                            return { ...prev, actions: nextActions };
                          });
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <label htmlFor="addon-bulk" className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                          Bulk Import & Universal Excel/CSV Export
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Generates downloadable schema templates for batch record creation and delivers filtered data exports in CSV and XLSX format.
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      schema.actions?.some((a) => a.key === "export") ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {schema.actions?.some((a) => a.key === "export") ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {/* ADDON 5: PDF Voucher & Print Engine */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="addon-print"
                        checked={Boolean(schema.actions?.some((a) => a.key === "print"))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSchema((prev) => {
                            const nextActions = (prev.actions || []).filter((a) => a.key !== "print");
                            if (checked) {
                              nextActions.push({ key: "print", label: "Print Voucher", actionType: "button" });
                            }
                            return { ...prev, actions: nextActions };
                          });
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <label htmlFor="addon-print" className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                          Document Print Engine & PDF Generator
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Produces standardized vouchers and printable documents with corporate branding, QR code validation, and tax summaries.
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      schema.actions?.some((a) => a.key === "print") ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {schema.actions?.some((a) => a.key === "print") ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 6: Actions & Security ──────────────────────────────────── */}
            {activeTab === "actions" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Actions & Role Permissions</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Control which action buttons appear and bind backend permissions to ensure server-side enforcement.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "create", label: "Create / New Record", defaultPerm: `${schema.entityName.toLowerCase()}.create` },
                    { key: "edit", label: "Edit Record", defaultPerm: `${schema.entityName.toLowerCase()}.edit` },
                    { key: "delete", label: "Delete Record", defaultPerm: `${schema.entityName.toLowerCase()}.delete` },
                    { key: "export", label: "Export to CSV", defaultPerm: `${schema.entityName.toLowerCase()}.view` },
                  ].map((act) => {
                    const current = schema.actions?.find((a) => a.key === act.key);
                    const isEnabled = Boolean(current);
                    return (
                      <div
                        key={act.key}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSchema((prev) => {
                                const nextActions = (prev.actions || []).filter((a) => a.key !== act.key);
                                if (checked) {
                                  nextActions.push({
                                    key: act.key,
                                    label: act.label,
                                    actionType: "button",
                                    requiredPermission: act.defaultPerm,
                                  });
                                }
                                return { ...prev, actions: nextActions };
                              });
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{act.label}</span>
                            <span className="block font-mono text-[10px] text-slate-400">Action: {act.key}</span>
                          </div>
                        </div>

                        {isEnabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-mono">Required Permission:</span>
                            <input
                              value={current?.requiredPermission || ""}
                              placeholder="e.g. employee.create"
                              onChange={(e) => {
                                const perm = e.target.value;
                                setSchema((prev) => ({
                                  ...prev,
                                  actions: (prev.actions || []).map((a) =>
                                    a.key === act.key ? { ...a, requiredPermission: perm } : a
                                  ),
                                }));
                              }}
                              className="erp-input text-xs font-mono w-48 py-1"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TAB 6: Interactive Live Preview ────────────────────────────── */}
            {activeTab === "preview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Interactive Preview</h3>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Active Draft Render
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      This is the actual UniversalPageDispatcher rendering your schema archetype with live data before you publish.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePublish}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Looks Great — Publish Live
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs bg-slate-50">
                  <UniversalPageDispatcher pageKey={selectedPageKey} schema={schema} />
                </div>
              </div>
            )}

            {/* ─── TAB 7: Versions & Changelog ────────────────────────────────── */}
            {activeTab === "history" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Version History & Rollback</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Every published schema is permanently versioned. Roll back with a single click if needed.
                  </p>
                </div>

                {pageMetadata.versions.length === 0 ? (
                  <p className="text-xs text-slate-400">No version history recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden text-xs">
                    {pageMetadata.versions.map((ver) => (
                      <div key={ver.id || ver.version} className="flex items-center justify-between p-4 hover:bg-slate-50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">Version {ver.version}</span>
                            {ver.isPublished && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Live Active Version
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{ver.changeSummary || "Schema configuration update"}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {ver.publishedAt ? `Published ${new Date(ver.publishedAt).toLocaleString()}` : "Draft"}
                          </span>
                        </div>

                        {!ver.isPublished && (
                          <button
                            type="button"
                            onClick={() => handleRollback(ver.version)}
                            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Rollback to v{ver.version}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CrudCard>
      </div>
    </StandardPageLayout>
  );
}
