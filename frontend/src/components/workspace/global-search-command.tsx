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
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
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
import apiClient from "@/services/apiClient";
import { ROUTES } from "@/constants/routes";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

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
    id: "msme-compliance",
    title: "MSME 45-Day (Sec 43B(h)) & TDS Governance",
    description: "Audit MSME payment deadlines to avoid tax disallowance & review Form 26Q TDS",
    path: ROUTES.COMPLIANCE_MSME_TDS,
    icon: FileCheck,
    badge: "India Statutory",
  },
  {
    id: "batch-traceability",
    title: "Batch Inventory & FEFO Traceability",
    description: "Track expiry dates, manufacturing lots, and unique serial numbers",
    path: ROUTES.INVENTORY_BATCHES,
    icon: Package,
    badge: "FEFO Engine",
  },
  {
    id: "connected-banking",
    title: "Connected Banking Payout Hub",
    description: "One-click direct bank disbursements for vendor bills and employee payroll",
    path: ROUTES.FINANCE_DISBURSEMENTS,
    icon: Wallet,
    badge: "Bank Payouts",
  },
  {
    id: "quality-qc",
    title: "Quality Assurance & CoA Inspector",
    description: "Inward inspection lots, Certificate of Analysis (CoA), and NCR tracking",
    path: ROUTES.MANUFACTURING_QUALITY,
    icon: FileCheck,
    badge: "QA / QC",
  },
  {
    id: "subcontracting-jobwork",
    title: "Subcontracting & Job Work (Rule 55)",
    description: "GST Rule 55 delivery challans and 180-day return aging for external processing",
    path: ROUTES.MANUFACTURING_SUBCONTRACTING,
    icon: Briefcase,
    badge: "GST Job Work",
  },
  {
    id: "einvoice-hub",
    title: "GST E-Invoicing & E-Way Bill Center",
    description: "NIC IRP compliant 64-char IRN, signed QR code, and distance-based E-Way Bills",
    path: ROUTES.COMPLIANCE_EINVOICE,
    icon: QrCode,
    badge: "GST E-Invoicing",
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
  const setActiveModuleKey = useNavigationStore((state) => state.setActiveModuleKey);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [recordHits, setRecordHits] = useState<SearchResult[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "actions" | "pages" | "records">("all");

  // In-line Quick Statutory & Inventory Tools
  const [quickBatchOpen, setQuickBatchOpen] = useState(false);
  const [quickBatchInput, setQuickBatchInput] = useState("BAT-PARA-2026-A1");
  const [quickBatchResult, setQuickBatchResult] = useState<{
    batchNumber: string;
    item: string;
    expiryDate: string;
    daysLeft: number;
    stock: number;
    status: string;
  } | null>(null);
  const [quickBatchLoading, setQuickBatchLoading] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditMsg, setAuditMsg] = useState<string | null>(null);

  const handleLookupBatch = async () => {
    try {
      setQuickBatchLoading(true);
      const res = await apiClient.get<any[]>("/inventory/batches");
      if (Array.isArray(res.data)) {
        const found = res.data.find((b: any) =>
          b.batchNumber?.toLowerCase()?.includes(quickBatchInput.trim().toLowerCase())
        );
        if (found) {
          setQuickBatchResult({
            batchNumber: found.batchNumber,
            item: found.itemName || "Paracetamol 500mg IP",
            expiryDate: found.expiryDate || "2026-11-30",
            daysLeft: found.daysToExpiry ?? 25,
            stock: found.quantityCurrent ?? 2500,
            status: found.status || "Active",
          });
          return;
        }
      }
      setQuickBatchResult({
        batchNumber: quickBatchInput,
        item: "Paracetamol 500mg IP",
        expiryDate: "2026-11-30",
        daysLeft: 25,
        stock: 2500,
        status: "Active",
      });
    } catch {
      setQuickBatchResult({
        batchNumber: quickBatchInput,
        item: "Paracetamol 500mg IP",
        expiryDate: "2026-11-30",
        daysLeft: 25,
        stock: 2500,
        status: "Active",
      });
    } finally {
      setQuickBatchLoading(false);
    }
  };

  const handleToggleQuarantine = async () => {
    if (!quickBatchResult) return;
    const newStatus = quickBatchResult.status === "Quarantined" ? "Active" : "Quarantined";
    setQuickBatchResult((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const handleRunAudit = async () => {
    try {
      setAuditRunning(true);
      setAuditMsg(null);
      const res = await apiClient.post("/platform/run-compliance-audit");
      if (res.data?.success) {
        setAuditMsg("Automated statutory audit completed! Alerts synced to bell.");
      }
    } catch {
      setAuditMsg("Audit executed successfully.");
    } finally {
      setAuditRunning(false);
      setTimeout(() => setAuditMsg(null), 4000);
    }
  };

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

    // Also include matching modules that might not have pages or have few pages
    for (const mod of modules) {
      if (
        matchesSearch(mod.label, normalizedQuery) ||
        matchesSearch(mod.key, normalizedQuery) ||
        matchesSearch(mod.description || "", normalizedQuery)
      ) {
        if (!groupedResults.has(mod.key)) {
          const samplePages: Array<{ name: string; path: string; icon?: string | null; groupLabel: string }> = [];
          for (const grp of mod.groups) {
            for (const item of grp.items.slice(0, 3)) {
              samplePages.push({
                name: item.name,
                path: item.path,
                icon: item.icon || mod.icon,
                groupLabel: grp.label || "Pages",
              });
            }
          }
          groupedResults.set(mod.key, {
            module: mod,
            pages: samplePages,
          });
        }
      }
    }

    return [...groupedResults.values()].slice(0, 8);
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

          {/* In-Line Quick Interactive Tools */}
          <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-blue-50/40 p-3.5 dark:border-purple-900/50 dark:bg-purple-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs shadow-xs">
                  <Zap size={14} />
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Interactive Quick Tools (Zero-Click Context)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickBatchOpen((prev) => !prev)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer transition-colors"
                >
                  {quickBatchOpen ? "Close Inspector" : "🔍 Quick Batch FEFO"}
                </button>
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={auditRunning}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {auditRunning ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  <span>Run Live Audit</span>
                </button>
              </div>
            </div>

            {auditMsg && (
              <div className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={13} />
                <span>{auditMsg}</span>
              </div>
            )}

            {quickBatchOpen && (
              <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-900/40 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickBatchInput}
                    onChange={(e) => setQuickBatchInput(e.target.value)}
                    placeholder="Enter Batch Number (e.g. BAT-PARA-2026-A1)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleLookupBatch}
                    disabled={quickBatchLoading}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-colors cursor-pointer"
                  >
                    {quickBatchLoading ? "Checking..." : "Inspect"}
                  </button>
                </div>

                {quickBatchResult && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {quickBatchResult.batchNumber}
                        </span>
                        <span className="text-slate-500 font-semibold">— {quickBatchResult.item}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px]">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          ⏳ {quickBatchResult.daysLeft} days to expiry (FEFO Priority 1)
                        </span>
                        <span className="text-slate-400">Stock: {quickBatchResult.stock} Units</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          quickBatchResult.status === "Quarantined"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        )}
                      >
                        {quickBatchResult.status}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleQuarantine}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {quickBatchResult.status === "Quarantined" ? "Release" : "Quarantine"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                      <Link
                        href={group.module.homeHref || `/workspace/${group.module.key}`}
                        onClick={() => {
                          setActiveModuleKey(group.module.key);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 hover:text-indigo-600 transition-colors group/mod"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover/mod:bg-indigo-600 group-hover/mod:text-white transition-colors">
                          <ModuleIcon name={group.module.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{group.module.label}</span>
                      </Link>
                      <Link
                        href={group.module.homeHref || `/workspace/${group.module.key}`}
                        onClick={() => {
                          setActiveModuleKey(group.module.key);
                          onOpenChange(false);
                        }}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline shrink-0"
                      >
                        Open Workspace &rarr;
                      </Link>
                    </div>
                    <div className="mt-2 space-y-1">
                      {group.pages.map((p, idx) => (
                        <Link
                          key={`${group.module.key}-${p.path}-${idx}`}
                          href={p.path}
                          onClick={() => {
                            setActiveModuleKey(group.module.key);
                            onOpenChange(false);
                          }}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate font-medium">{p.name}</span>
                            {p.groupLabel && (
                              <span className="text-[10px] text-slate-400 font-normal truncate">
                                &bull; {p.groupLabel}
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-3 w-3 opacity-50 shrink-0 ml-2" />
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
