"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Check,
  ChevronDown,
  Search,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import {
  getTenantSubdomain,
  persistTenantSubdomain,
  clearTenantSubdomain,
} from "@/services/apiClient";
import { platformApi } from "@/services/modules/administration";
import { tenantApi } from "@/features/tenants/services/tenant.api";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const TENANT_CACHE_KEY = "erp.cached.tenants";

export interface TenantSummary {
  id: string;
  name: string;
  subdomain: string;
  subscriptionPlan?: string;
  isActive?: boolean;
  logoUrl?: string;
}

export function TenantSubdomainSwitcher() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const { clearContext } = useOrgContext();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeSubdomain, setActiveSubdomain] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = window.localStorage.getItem(TENANT_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [customSubdomainInput, setCustomSubdomainInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const syncActiveSubdomain = useCallback(() => {
    const current = getTenantSubdomain();
    setActiveSubdomain(current);
  }, []);

  useEffect(() => {
    syncActiveSubdomain();

    const handleTenantChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ subdomain: string | null }>;
      setActiveSubdomain(customEvent.detail?.subdomain ?? getTenantSubdomain());
    };

    window.addEventListener("erp:tenant-changed", handleTenantChange);
    window.addEventListener("storage", syncActiveSubdomain);

    return () => {
      window.removeEventListener("erp:tenant-changed", handleTenantChange);
      window.removeEventListener("storage", syncActiveSubdomain);
    };
  }, [syncActiveSubdomain]);

  // If user has a specific tenant subdomain and activeSubdomain is not set, initialize it
  useEffect(() => {
    if (!activeSubdomain && (user as any)?.tenantSubdomain) {
      const sub = String((user as any).tenantSubdomain).toLowerCase().trim();
      if (sub) {
        persistTenantSubdomain(sub);
        setActiveSubdomain(sub);
      }
    }
  }, [user, activeSubdomain]);

  const loadTenants = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingTenants(true);
      setLoadError(null);

      // Non-superadmin users are bound strictly to their authenticated tenant
      if (!isSuperAdmin) {
        const currentSubdomain = getTenantSubdomain() || (user as { tenantSubdomain?: string })?.tenantSubdomain || "";
        const userTenantId = (user as { tenantId?: string })?.tenantId || "";
        const userTenantName = (user as { tenantName?: string })?.tenantName || (currentSubdomain ? `Tenant (${currentSubdomain})` : "Organization");
        setTenants([
          {
            id: userTenantId || "current-tenant",
            name: userTenantName,
            subdomain: currentSubdomain,
            subscriptionPlan: "Standard",
            isActive: true,
          },
        ]);
        return;
      }

      let dataList: Record<string, unknown>[] = [];
      try {
        const res = await platformApi.superadmin.tenants(1, 200);
        dataList = (res.data?.data || res.data?.tenants || []) as Record<string, unknown>[];
      } catch {
        try {
          const adminRes = await platformApi.admin.tenants();
          const rawAdmin = adminRes.data as { data?: Record<string, unknown>[]; tenants?: Record<string, unknown>[] } | Record<string, unknown>[];
          dataList = (Array.isArray(rawAdmin) ? rawAdmin : (rawAdmin?.data || rawAdmin?.tenants || [])) as Record<string, unknown>[];
        } catch {
          try {
            const fallbackRes = await tenantApi.getTenants({ page: 1, limit: 100 });
            const raw = fallbackRes as unknown as { data?: Record<string, unknown>[]; tenants?: Record<string, unknown>[] };
            dataList = (raw?.data || raw?.tenants || []) as Record<string, unknown>[];
          } catch {
            dataList = [];
          }
        }
      }

      if (Array.isArray(dataList) && dataList.length > 0) {
        const mapped: TenantSummary[] = dataList.map((item: Record<string, unknown>, idx: number) => ({
          id: String(item.id || item.tenantId || item._id || `tenant-${idx}`),
          name: String(item.name || item.companyName || item.subdomain || `Tenant ${idx + 1}`),
          subdomain: String(item.subdomain || "").toLowerCase(),
          subscriptionPlan: String(item.subscriptionPlan || item.planTier || "Enterprise"),
          isActive: typeof item.isActive === "boolean" ? item.isActive : item.status === "active",
          logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : (typeof item.LogoUrl === "string" ? item.LogoUrl : undefined),
        })).filter((t) => Boolean(t.subdomain));

        if (mapped.length > 0) {
          setTenants(mapped);
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(TENANT_CACHE_KEY, JSON.stringify(mapped));
            } catch {
              // ignore storage errors
            }
          }
          return;
        }
      }

      // Fallback if superadmin tenant query returned no rows
      const fallbackSub = (user as { tenantSubdomain?: string })?.tenantSubdomain;
      if (fallbackSub) {
        setTenants([
          {
            id: (user as { tenantId?: string })?.tenantId || "user-tenant",
            name: (user as { tenantName?: string })?.tenantName || fallbackSub,
            subdomain: fallbackSub.toLowerCase(),
            subscriptionPlan: "Enterprise",
            isActive: true,
          },
        ]);
      }
    } catch {
      const fallbackSub = (user as { tenantSubdomain?: string })?.tenantSubdomain;
      if (fallbackSub && tenants.length === 0) {
        setTenants([
          {
            id: (user as { tenantId?: string })?.tenantId || "user-tenant",
            name: (user as { tenantName?: string })?.tenantName || fallbackSub,
            subdomain: fallbackSub.toLowerCase(),
            subscriptionPlan: "Enterprise",
            isActive: true,
          },
        ]);
      } else if (tenants.length === 0) {
        setLoadError("Could not reach tenant registry.");
      }
    } finally {
      setLoadingTenants(false);
    }
  }, [user, isSuperAdmin, tenants.length]);

  // Load tenants on initial mount or when dropdown opens, only if user is authenticated
  useEffect(() => {
    if (!user || authLoading) return;
    if (open || tenants.length === 0) {
      void loadTenants();
    }
  }, [open, loadTenants, tenants.length, user, authLoading]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTenant = (subdomain: string | null, tenantName?: string) => {
    // 1. Clear org context and storage first so stale IDs don't conflict with the new tenant
    clearContext();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("activeCompanyId");
      window.localStorage.removeItem("activeCompanyName");
      window.localStorage.removeItem("activeProjectId");
      window.localStorage.removeItem("activeProjectName");
    }

    // 2. Persist new tenant and dispatch 'erp:tenant-changed'
    if (subdomain) {
      const clean = subdomain.trim().toLowerCase();
      persistTenantSubdomain(clean);
      notifySuccess(`Tenant switched to "${tenantName || clean}". Context reloaded.`);
    } else {
      clearTenantSubdomain();
      notifySuccess("Tenant scope reset to Default / Platform.");
    }

    // 3. Invalidate active queries
    void queryClient.invalidateQueries();
    setOpen(false);
    setSearch("");
    setCustomSubdomainInput("");
  };

  const handleCustomSubdomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubdomainInput.trim()) return;
    const trimmed = customSubdomainInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!trimmed) {
      notifyError("Please enter a valid subdomain (letters, numbers, hyphens).");
      return;
    }

    // Check if known
    const match = tenants.find((t) => t.subdomain.toLowerCase() === trimmed);
    handleSelectTenant(trimmed, match?.name);
  };

  const activeTenantObj = useMemo(() => {
    if (!activeSubdomain) return null;
    return tenants.find(
      (t) => t.subdomain.toLowerCase() === activeSubdomain.toLowerCase()
    );
  }, [activeSubdomain, tenants]);

  const filteredTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subdomain.toLowerCase().includes(q) ||
        (t.subscriptionPlan && t.subscriptionPlan.toLowerCase().includes(q))
    );
  }, [tenants, search]);

  const userTenantName = (user as any)?.tenantName?.trim();
  const displayLabel =
    activeTenantObj?.name ||
    (userTenantName && userTenantName.length > 0 ? userTenantName : null) ||
    (activeSubdomain ? `Tenant (${activeSubdomain})` : null) ||
    "UabIndia Workspace";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className={cn(
          "inline-flex h-8 max-w-[8.5rem] sm:max-w-[10rem] lg:max-w-[12rem] items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium outline-none transition cursor-pointer",
          "focus-visible:ring-2 focus-visible:ring-blue-500",
          activeSubdomain
            ? "border-blue-200 bg-blue-50/80 text-blue-800 hover:bg-blue-100/70 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        )}
        title={
          activeSubdomain
            ? `Active Organization: ${displayLabel} (${activeSubdomain})`
            : `Organization: ${displayLabel}`
        }
        aria-label="Tenant Scope"
      >
        {activeTenantObj?.logoUrl ? (
          <img
            src={activeTenantObj.logoUrl}
            alt=""
            className="h-3.5 w-3.5 rounded-xs object-contain"
          />
        ) : (
          <Globe
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              activeSubdomain
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            )}
          />
        )}
        <span className="truncate font-medium">{displayLabel}</span>
        {activeSubdomain ? (
          <span className="hidden xl:inline-block rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            {activeSubdomain}
          </span>
        ) : null}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50 ml-auto" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-50 mt-1.5 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Tenant & Subdomain
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Switch company workspace context
                  </p>
                </div>
              </div>

              {activeSubdomain && (
                <button
                  type="button"
                  onClick={() => handleSelectTenant(null)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Clear Scope
                </button>
              )}
            </div>

            {!isSuperAdmin ? (
              <div className="mt-2.5 space-y-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                      {displayLabel.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayLabel}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {activeSubdomain ? `${activeSubdomain}.uabindia.com` : "Enterprise Workspace"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-blue-100/80 pt-2 text-[10px] text-slate-500 dark:border-blue-900/40 dark:text-slate-400">
                    <span>Scope: <strong className="text-slate-700 dark:text-slate-200">Organization Bound</strong></span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Your account is securely bound to this organization workspace.
                </p>
              </div>
            ) : (
              <>
                {/* Subdomain Input Form */}
                <form onSubmit={handleCustomSubdomainSubmit} className="mt-2.5">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Direct Subdomain Navigation
                  </label>
                  <div className="mt-1 flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        id="custom-subdomain-input"
                        name="custom_subdomain"
                        type="text"
                        value={customSubdomainInput}
                        onChange={(e) => setCustomSubdomainInput(e.target.value)}
                        placeholder="e.g. acme, globex"
                        className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition cursor-pointer"
                    >
                      <span>Go</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </form>

                {/* Filter Search */}
                {tenants.length > 5 && (
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="tenant-search-input"
                      name="tenant_search"
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search registered tenants..."
                      className="h-7 w-full rounded-md border border-slate-100 bg-slate-50/70 pl-7 pr-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                    />
                  </div>
                )}

                {/* Default / Platform Option */}
                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTenant(null)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition cursor-pointer",
                      !activeSubdomain
                        ? "bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                      <div>
                        <p className="font-semibold">Platform Scope (Default)</p>
                        <p className="text-[10px] text-slate-400">All tenants / standard root host</p>
                      </div>
                    </div>
                    {!activeSubdomain && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                </div>

                {/* Tenant Registry List */}
                <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                  <div className="flex items-center justify-between px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Available Tenants ({tenants.length})</span>
                    <button
                      type="button"
                      onClick={() => void loadTenants()}
                      title="Reload tenants list"
                      className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      <RefreshCw className={cn("h-3 w-3", loadingTenants && "animate-spin text-blue-600")} />
                    </button>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                    {loadingTenants && tenants.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                        <span>Loading tenants…</span>
                      </div>
                    ) : filteredTenants.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 space-y-1">
                        <p>{search ? "No tenants match your search." : "No registered tenants found in registry."}</p>
                        {activeSubdomain && (
                          <button
                            type="button"
                            onClick={() => handleSelectTenant(null)}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Reset to Default Scope
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredTenants.map((t) => {
                        const isSelected =
                          activeSubdomain?.toLowerCase() === t.subdomain.toLowerCase();

                        return (
                          <div
                            key={t.id || t.subdomain}
                            className={cn(
                              "group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition",
                              isSelected
                                ? "bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950/60 dark:text-blue-200"
                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectTenant(t.subdomain, t.name)}
                              className="flex flex-1 items-center gap-2 text-left cursor-pointer min-w-0"
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 overflow-hidden">
                                {t.logoUrl ? (
                                  <img src={t.logoUrl} alt="" className="h-5 w-5 object-contain" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                                    {t.name}
                                  </p>
                                  {t.subscriptionPlan && (
                                    <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                      {t.subscriptionPlan}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  {t.subdomain}.{typeof window !== "undefined" && !window.location.hostname.includes("localhost") ? window.location.host.split(".").slice(-2).join(".") : "tenant.workspace"}
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              )}
                              {typeof window !== "undefined" && (
                                <a
                                  href={
                                    window.location.hostname.includes("localhost")
                                      ? `${window.location.protocol}//${window.location.host}${window.location.pathname}?tenant=${t.subdomain}`
                                      : `${window.location.protocol}//${t.subdomain}.${window.location.host.split(".").slice(-2).join(".")}${window.location.pathname}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Open ${t.subdomain} directly`}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Footer Notice */}
            <div className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500 flex items-center justify-between">
              <span>Attaches <code>X-Tenant</code> header to workspace.</span>
              {activeSubdomain && (
                <button
                  type="button"
                  onClick={() => handleSelectTenant(null)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TenantSubdomainSwitcher;
