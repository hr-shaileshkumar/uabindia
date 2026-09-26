"use client";

import Link from "next/link";
import {
  ArrowRight,
  Search,
  X,
  Sparkles,
  Bot,
  Zap,
  Users,
  Building2,
  Receipt,
  ShoppingBag,
  FileCheck,
  Globe2,
  Clock,
  Wallet,
  CornerDownLeft,
  Star,
  Package,
  Briefcase,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useNavigationStore } from "@/store/navigationStore";
import {
  buildWorkspaceModules,
  flattenWorkspacePages,
  type WorkspaceModule,
} from "@/lib/workspace/navigation";
import { appApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";
import type { SearchResult } from "@/types";

type GlobalSearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SearchResultGroup = {
  module: WorkspaceModule;
  pages: Array<{
    name: string;
    path: string;
    icon?: string | null;
    groupLabel: string;
  }>;
};

type CopilotAction = {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: typeof Zap;
  badge: string;
};

function getCategoryIcon(category?: string) {
  const c = (category || "").toLowerCase();
  if (c.includes("customer") || c.includes("employee") || c.includes("user")) return Users;
  if (c.includes("vendor") || c.includes("company")) return Building2;
  if (c.includes("order") || c.includes("purchase")) return ShoppingBag;
  if (c.includes("project")) return Briefcase;
  if (c.includes("item") || c.includes("inventory")) return Package;
  if (c.includes("ledger") || c.includes("account")) return Wallet;
  if (c.includes("invoice") || c.includes("bill")) return Receipt;
  return Receipt;
}

const COPILOT_PRESETS: CopilotAction[] = [
  {
    id: "payroll",
    title: "Execute Global Payroll Run",
    description: "Launch the 10-step guided payroll computation & disbursement wizard",
    path: ROUTES.PAYROLL_RUNS,
    icon: Zap,
    badge: "Payroll Wizard",
  },
  {
    id: "approvals",
    title: "Review Governance Approvals Queue",
    description: "Review pending Leaves, Purchase Orders, Expense Claims & Invoices",
    path: ROUTES.APPROVALS,
    icon: FileCheck,
    badge: "Unified Queue",
  },
  {
    id: "executive-bi",
    title: "Global Executive Command & BI Dashboard",
    description: "Analyze multi-region attendance, cash flow runway, and SCM spend",
    path: ROUTES.DASHBOARD,
    icon: Globe2,
    badge: "Executive BI",
  },
  {
    id: "attendance",
    title: "Inspect Global Attendance & FRS Telemetry",
    description: "Review real-time facial recognition punches and GPS geofences",
    path: "/hrms/attendance",
    icon: Clock,
    badge: "HRMS Operations",
  },
  {
    id: "purchase-orders",
    title: "Manage SCM & Purchase Orders",
    description: "Track the 6-stage procurement lifecycle from PR to 3-Way Match GRN",
    path: ROUTES.PURCHASE_ORDERS,
    icon: ShoppingBag,
    badge: "SCM Lifecycle",
  },
  {
    id: "vendor-bills",
    title: "Inspect Vendor Bills & GL Postings",
    description: "Automated double-entry general ledger vouchers and 3-way match",
    path: "/vendor-bills",
    icon: Receipt,
    badge: "Finance & Accounts",
  },
];

const matchesSearch = (haystack: string, query: string) => haystack.toLowerCase().includes(query);

export function GlobalSearchCommand({
  open,
  onOpenChange,
}: GlobalSearchCommandProps) {
  const { navigation, enabledModules } = useUiSchema();
  const favorites = useNavigationStore((state) => state.favorites);
  const recent = useNavigationStore((state) => state.recent);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [recordHits, setRecordHits] = useState<SearchResult[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "actions" | "pages" | "records">("all");

  const modules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [enabledModules, navigation.modules]
  );

  // AI Copilot intent matching
  const matchingCopilotActions = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return COPILOT_PRESETS.slice(0, 3);

    return COPILOT_PRESETS.filter(
      (action) =>
        action.title.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.badge.toLowerCase().includes(q) ||
        (q.includes("pay") && action.id === "payroll") ||
        ((q.includes("appr") || q.includes("leave") || q.includes("claim")) && action.id === "approvals") ||
        ((q.includes("bi") || q.includes("kpi") || q.includes("exec") || q.includes("dash")) && action.id === "executive-bi") ||
        ((q.includes("att") || q.includes("punch") || q.includes("gps")) && action.id === "attendance") ||
        ((q.includes("po") || q.includes("order") || q.includes("procure")) && action.id === "purchase-orders") ||
        ((q.includes("bill") || q.includes("invoice") || q.includes("tax")) && action.id === "vendor-bills")
    );
  }, [deferredQuery]);

  const navResults = useMemo<SearchResultGroup[]>(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const pages = flattenWorkspacePages(modules);

    if (!normalizedQuery) {
      return modules.slice(0, 4).map((workspaceModule) => {
        const seenPaths = new Set<string>();
        const uniquePages: { name: string; path: string; icon?: string | null; groupLabel: string }[] = [];
        for (const group of workspaceModule.groups) {
          for (const item of group.items.slice(0, 3)) {
            if (!seenPaths.has(item.path)) {
              seenPaths.add(item.path);
              uniquePages.push({
                name: item.name,
                path: item.path,
                icon: item.icon || workspaceModule.icon,
                groupLabel: group.label || "Pages",
              });
            }
          }
        }
        return {
          module: workspaceModule,
          pages: uniquePages,
        };
      });
    }

    const groupedResults = new Map<string, SearchResultGroup>();

    for (const page of pages) {
      const searchableText = [
        page.module.label,
        page.module.key,
        page.group.label,
        page.item.name,
        page.item.path,
      ].join(" ");

      if (
        !matchesSearch(searchableText, normalizedQuery) &&
        !matchesSearch(page.module.description || "", normalizedQuery)
      ) {
        continue;
      }

      const existingGroup = groupedResults.get(page.module.key);
      const nextPage = {
        name: page.item.name,
        path: page.item.path,
        icon: page.item.icon || page.module.icon,
        groupLabel: page.group.label,
      };

      if (existingGroup) {
        if (!existingGroup.pages.some((p) => p.path === nextPage.path)) {
          existingGroup.pages.push(nextPage);
        }
      } else {
        groupedResults.set(page.module.key, {
          module: page.module,
          pages: [nextPage],
        });
      }
    }

    return [...groupedResults.values()].slice(0, 6);
  }, [deferredQuery, modules]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecordHits([]);
      setFilterTab("all");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    const q = deferredQuery.trim();
    if (!open || q.length < 2) {
      setRecordHits([]);
      setRecordsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setRecordsLoading(true);
      void appApi.search
        .query(q)
        .then((res) => {
          if (cancelled) return;
          const raw = res.data;
          const list = Array.isArray(raw?.results) ? raw.results : Array.isArray(raw) ? raw : [];
          setRecordHits(
            list.map((item: SearchResult) => ({
              title: item.title,
              subtitle: item.subtitle,
              path: item.path,
              module: item.module,
              category: item.category ?? "module",
              icon: item.icon,
            })),
          );
        })
        .catch(() => {
          if (!cancelled) setRecordHits([]);
        })
        .finally(() => {
          if (!cancelled) setRecordsLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredQuery, open]);

  const recordOnlyHits = recordHits.filter((hit) => hit.category !== "page");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {/* Top NLP Search Input */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Bot className="h-5 w-5" />
            </div>

            <div className="relative flex-1">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask AI Copilot or search records (e.g. 'run payroll', 'approved POs', 'employee code')…"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm font-medium text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterTab === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              All Matches
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("actions")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                filterTab === "actions"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              AI Actions ({matchingCopilotActions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("records")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterTab === "records"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Database Records ({recordOnlyHits.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("pages")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterTab === "pages"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Pages & Workspaces
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Pinned Favorites and Recent Jump */}
          {!deferredQuery && (filterTab === "all" || filterTab === "pages") && (favorites.length > 0 || recent.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {favorites.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>Pinned Shortcuts</span>
                  </div>
                  <div className="space-y-1">
                    {favorites.slice(0, 4).map((fav) => (
                      <Link
                        key={fav.id}
                        href={fav.href}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs font-medium text-amber-950 transition hover:bg-amber-100/60 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-200"
                      >
                        <span className="truncate">{fav.label}</span>
                        <ArrowRight className="h-3 w-3 text-amber-600" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {recent.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Recent History</span>
                  </div>
                  <div className="space-y-1">
                    {recent.slice(0, 4).map((rec) => (
                      <Link
                        key={rec.id}
                        href={rec.href}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                      >
                        <span className="truncate">{rec.label}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Copilot Recommended Actions */}
          {(filterTab === "all" || filterTab === "actions") && matchingCopilotActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Copilot Suggested Next Actions</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {matchingCopilotActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.id}
                      href={action.path}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5 transition hover:border-indigo-300 hover:bg-indigo-50/80 hover:shadow-md dark:border-indigo-950 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-xs group-hover:scale-105 transition dark:bg-slate-800 dark:text-indigo-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white">
                            {action.title}
                          </span>
                          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            {action.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-1">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Database Records Hits */}
          {(filterTab === "all" || filterTab === "records") && recordOnlyHits.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Database Records ({recordOnlyHits.length})</span>
                {recordsLoading && <span className="text-[10px] lowercase text-indigo-500 animate-pulse">Searching…</span>}
              </div>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {recordOnlyHits.map((hit, idx) => {
                  const ItemIcon = getCategoryIcon(hit.category);
                  return (
                    <Link
                      key={`${hit.path}-${idx}`}
                      href={hit.path}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{hit.title}</p>
                            {hit.category && (
                              <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                {hit.category}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-slate-500 mt-0.5">{hit.subtitle}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pages and Navigation Matches */}
          {(filterTab === "all" || filterTab === "pages") && navResults.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Workspace Pages & Modules</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {navResults.map((group) => (
                  <div
                    key={group.module.key}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                      <ModuleIcon name={group.module.icon} className="h-4 w-4 text-indigo-600" />
                      <span>{group.module.label}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {group.pages.map((p, idx) => (
                        <Link
                          key={`${group.module.key}-${p.path}-${idx}`}
                          href={p.path}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <span className="truncate">{p.name}</span>
                          <ArrowRight className="h-3 w-3 opacity-60" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingCopilotActions.length === 0 && recordOnlyHits.length === 0 && navResults.length === 0 && (
            <div className="py-12 text-center">
              <Bot className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">No direct matches found</p>
              <p className="text-xs text-slate-500">Try searching for &apos;payroll&apos;, &apos;leaves&apos;, &apos;PO&apos;, or employee names.</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 font-medium">
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                ↵
              </kbd>{" "}
              to select
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                esc
              </kbd>{" "}
              to exit
            </span>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            UabIndia Universal AI Search
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
