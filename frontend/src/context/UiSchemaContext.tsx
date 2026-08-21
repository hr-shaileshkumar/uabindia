"use client";

import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { appApi } from "@/services/modules";
import type { Module } from "@/types";
import {
  parseDashboardSchema,
  parseNavigationSchema,
  parsePageSchema,
  parseRouteRules,
} from "@/lib/ui-schema/parser";
import { LEGACY_UI_SCHEMA_CACHE_KEY, resolveUiSchemaCacheKey, type UiSchemaCacheUser } from "@/lib/erp/ui-schema-cache";
import type {
  DashboardSchemaDto,
  NavigationSchemaDto,
  PageSchemaDto,
  RouteRulesDto,
} from "@/lib/ui-schema/types";

type UiSchemaState = "ready" | "incomplete" | "error";

type UiSchemaContextValue = {
  navigation: NavigationSchemaDto;
  routeRules: RouteRulesDto;
  dashboard: DashboardSchemaDto;
  enabledModules: Module[];
  loading: boolean;
  schemaError: string | null;
  usingCache: boolean;
  lastSuccessfulAt: number | null;
  state: UiSchemaState;
  navigationReady: boolean;
  routeRulesReady: boolean;
  dashboardReady: boolean;
  requiresSetup: boolean;
  refresh: () => Promise<void>;
  getPageSchema: (pageKey: string) => Promise<PageSchemaDto | null>;
};

const UiSchemaContext = createContext<UiSchemaContextValue | null>(null);

export const useUiSchema = () => {
  const ctx = useContext(UiSchemaContext);
  if (!ctx) throw new Error("useUiSchema must be used within UiSchemaProvider");
  return ctx;
};

const EMPTY_NAV: NavigationSchemaDto = { schemaVersion: "fallback", modules: [] };
const EMPTY_RULES: RouteRulesDto = { schemaVersion: "fallback", rules: [] };
const EMPTY_DASHBOARD: DashboardSchemaDto = { schemaVersion: "fallback", sections: [] };

export const UiSchemaProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;
  const cacheKey = useMemo(() => resolveUiSchemaCacheKey((user as UiSchemaCacheUser | null) ?? null), [user]);

  // Synchronously initialize state from localStorage cache for instant zero-latency page loads/refreshes
  const initialCache = useMemo(() => {
    if (typeof window === "undefined" || !user) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [cacheKey, user]);

  const [navigation, setNavigation] = useState<NavigationSchemaDto>(initialCache?.navigation ?? EMPTY_NAV);
  const [routeRules, setRouteRules] = useState<RouteRulesDto>(initialCache?.routeRules ?? EMPTY_RULES);
  const [dashboard, setDashboard] = useState<DashboardSchemaDto>(initialCache?.dashboard ?? EMPTY_DASHBOARD);
  const [enabledModules, setEnabledModules] = useState<Module[]>(initialCache?.enabledModules ?? []);
  const [loading, setLoading] = useState(!initialCache && !!user);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(!!initialCache);
  const [lastSuccessfulAt, setLastSuccessfulAt] = useState<number | null>(initialCache?.ts ?? null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setNavigation(EMPTY_NAV);
      setRouteRules(EMPTY_RULES);
      setDashboard(EMPTY_DASHBOARD);
      setEnabledModules([]);
      setSchemaError(null);
      setLoading(false);
      return;
    }

    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      setSchemaError(null);

      const [modulesRes, navRes, rulesRes, dashboardRes] = await Promise.allSettled([
        appApi.modules.getEnabled(),
        appApi.uiShell.getNavigation(),
        appApi.uiShell.getRouteRules(),
        appApi.uiShell.getDashboard(),
      ]);

      const moduleValue = modulesRes.status === "fulfilled" && Array.isArray(modulesRes.value.data?.modules)
        ? modulesRes.value.data.modules
        : [];

      const navValue = navRes.status === "fulfilled"
        ? parseNavigationSchema(navRes.value.data)
        : EMPTY_NAV;

      const rulesValue = rulesRes.status === "fulfilled"
        ? parseRouteRules(rulesRes.value.data)
        : EMPTY_RULES;

      const dashboardValue = dashboardRes.status === "fulfilled"
        ? parseDashboardSchema(dashboardRes.value.data)
        : EMPTY_DASHBOARD;

      if (modulesRes.status === "fulfilled") setEnabledModules(moduleValue);
      if (navValue.modules.length > 0) setNavigation(navValue);
      if (rulesValue.rules.length > 0) setRouteRules(rulesValue);
      if (dashboardValue.sections.length > 0) setDashboard(dashboardValue);

      // Persist successful result to localStorage
      try {
        const cache = {
          ts: Date.now(),
          enabledModules: moduleValue,
          navigation: navValue,
          routeRules: rulesValue,
          dashboard: dashboardValue,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cache));
        setLastSuccessfulAt(cache.ts);
        setUsingCache(false);
      } catch {
        // ignore localStorage errors
      }

      const navigationFailed = navRes.status === "rejected";
      const routeRulesFailed = rulesRes.status === "rejected";
      if (navigationFailed || routeRulesFailed) {
        setSchemaError("Backend navigation or route rules could not be loaded.");
      } else {
        setSchemaError(null);
      }
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Failed to load backend workspace schema."), "UI Schema");
    } finally {
      isRefreshingRef.current = false;
      setLoading(false);
    }
  }, [cacheKey, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LEGACY_UI_SCHEMA_CACHE_KEY);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getPageSchema = useCallback(async (pageKey: string) => {
    try {
      const res = await appApi.uiShell.getPageSchema(pageKey);
      return parsePageSchema(res.data);
    } catch {
      return null;
    }
  }, []);

  const navigationReady = useMemo(
    () => navigation.modules.some((module) => module.groups.some((group) => group.items.length > 0)),
    [navigation.modules]
  );

  const routeRulesReady = routeRules.rules.length > 0;
  const dashboardReady = useMemo(
    () => dashboard.sections.some((section) => section.widgets.length > 0),
    [dashboard.sections]
  );
  const requiresSetup = enabledModules.length > 0 && (!navigationReady || !routeRulesReady);
  const state = useMemo<UiSchemaState>(() => {
    if (schemaError) return "error";
    if (enabledModules.length === 0 || requiresSetup) return "incomplete";
    return "ready";
  }, [enabledModules.length, requiresSetup, schemaError]);

  const value = useMemo<UiSchemaContextValue>(() => ({
    navigation,
    routeRules,
    dashboard,
    enabledModules,
    loading,
    schemaError,
    usingCache,
    lastSuccessfulAt,
    state,
    navigationReady,
    routeRulesReady,
    dashboardReady,
    requiresSetup,
    refresh,
    getPageSchema,
  }), [
    navigation,
    routeRules,
    dashboard,
    enabledModules,
    loading,
    schemaError,
    usingCache,
    lastSuccessfulAt,
    state,
    navigationReady,
    routeRulesReady,
    dashboardReady,
    requiresSetup,
    refresh,
    getPageSchema,
  ]);

  return <UiSchemaContext.Provider value={value}>{children}</UiSchemaContext.Provider>;
};
