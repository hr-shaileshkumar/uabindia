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
import {
  getTenantSubdomain,
  persistTenantSubdomain,
  clearTenantSubdomain,
} from "@/services/apiClient";
import { platformApi } from "@/services/modules/platform";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const TENANT_CACHE_KEY = "erp.cached.tenants";

export interface TenantSummary {
  id: string;
  name: string;
  subdomain: string;
  subscriptionPlan?: string;
  isActive?: boolean;
}

export function TenantSubdomainSwitcher() {
  const { user: _user } = useAuth();
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

  const loadTenants = useCallback(async () => {
    try {
      setLoadingTenants(true);
      setLoadError(null);
      
      // Attempt to load from platform superadmin endpoint
      const res = await platformApi.superadmin.tenants(1, 200);
      const dataList = res.data?.data || res.data?.tenants || [];
      if (Array.isArray(dataList) && dataList.length > 0) {
        const mapped: TenantSummary[] = dataList.map((item: Record<string, unknown>, idx: number) => ({
          id: String(item.id || item.tenantId || item._id || `tenant-${idx}`),
          name: String(item.name || item.companyName || item.subdomain || `Tenant ${idx + 1}`),
          subdomain: String(item.subdomain || "").toLowerCase(),
          subscriptionPlan: String(item.subscriptionPlan || item.planTier || "Enterprise"),
          isActive: typeof item.isActive === "boolean" ? item.isActive : item.status === "active",
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
    } catch {
      // Fallback: Try admin tenants endpoint
      try {
        const fallbackRes = await platformApi.admin.tenants();
        const fallbackList = Array.isArray(fallbackRes.data)
          ? fallbackRes.data
          : fallbackRes.data?.tenants || fallbackRes.data?.data || [];
        if (Array.isArray(fallbackList) && fallbackList.length > 0) {
          const mapped: TenantSummary[] = fallbackList.map((item: Record<string, unknown>, idx: number) => ({
            id: String(item.id || item._id || `tenant-${idx}`),
            name: String(item.name || item.subdomain || `Tenant ${idx + 1}`),
            subdomain: String(item.subdomain || "").toLowerCase(),
            subscriptionPlan: String(item.subscriptionPlan || "Enterprise"),
            isActive: true,
          })).filter((t) => Boolean(t.subdomain));

          setTenants(mapped);
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(TENANT_CACHE_KEY, JSON.stringify(mapped));
            } catch {
              // ignore
            }
          }
          return;
        }
      } catch {
        // If both failed, retain any existing cached tenants
        if (tenants.length === 0) {
          setLoadError("Could not reach tenant registry.");
        }
      }
    } finally {
      setLoadingTenants(false);
    }
  }, [tenants.length]);

  // Load tenants on initial mount or when dropdown opens
  useEffect(() => {
    if (open || tenants.length === 0) {
      void loadTenants();
    }
  }, [open, loadTenants, tenants.length]);

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
    if (subdomain) {
      const clean = subdomain.trim().toLowerCase();
      persistTenantSubdomain(clean);
      notifySuccess(`Tenant switched to "${tenantName || clean}". Context reloaded.`);
    } else {
      clearTenantSubdomain();
      notifySuccess("Tenant scope reset to Default / Platform.");
    }

    // Clear stale company and project context in storage so stale IDs do not fail queries
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("activeCompanyId");
      window.localStorage.removeItem("activeCompanyName");
      window.localStorage.removeItem("activeProjectId");
      window.localStorage.removeItem("activeProjectName");
    }

    void queryClient.invalidateQueries({ refetchType: "active" });
    setOpen(false);
    setSearch("");
    setCustomSubdomainInput("");
  };

  const handleCustomSubdomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubdomainInput.trim().toLowerCase();
    if (!trimmed) return;
    
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

  const displayLabel = activeTenantObj?.name || activeSubdomain || "Default Tenant";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-8 max-w-[8.5rem] sm:max-w-[10rem] lg:max-w-[12rem] items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium outline-none transition cursor-pointer",
          "focus-visible:ring-2 focus-visible:ring-blue-500",
          activeSubdomain
            ? "border-blue-200 bg-blue-50/80 text-blue-800 hover:bg-blue-100/70 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        )}
        title={
          activeSubdomain
            ? `Active Subdomain: ${activeSubdomain} (Click to switch tenant)`
            : "Platform Default Tenant Scope (Click to switch)"
        }
        aria-label="Switch Tenant Subdomain"
      >
        <Globe
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            activeSubdomain
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 dark:text-slate-400"
          )}
        />
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
                    Switch tenant database & schema scope
                  </p>
                </div>
              </div>

              {activeSubdomain ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  {activeSubdomain}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Default / Root
                </span>
              )}
            </div>

            {/* Custom Subdomain Input Field */}
            <form
              onSubmit={handleCustomSubdomainSubmit}
              className="mt-2.5 flex items-center gap-1.5"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customSubdomainInput}
                  onChange={(e) => setCustomSubdomainInput(e.target.value)}
                  placeholder="Enter subdomain (e.g. acme, demo)..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={!customSubdomainInput.trim()}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
              >
                <span>Set</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </form>

            {/* Quick Filter */}
            {tenants.length > 0 && (
              <div className="mt-2 relative">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
                <input
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
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Sparkles className="h-3 w-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-semibold text-slate-900 dark:text-white">
                                {t.name}
                              </p>
                              {t.subscriptionPlan && (
                                <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {t.subscriptionPlan}
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[10px] text-slate-400 truncate">
                              subdomain: {t.subdomain}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                          {typeof window !== "undefined" && (
                            <a
                              href={`${window.location.protocol}//${t.subdomain}.${window.location.host.split(".").slice(-2).join(".") || "localhost:3000"}${window.location.pathname}`}
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
