"use client";

import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { hrApi } from "@/services/hrApi";
import {
  parseDashboardSchema,
  parseNavigationSchema,
  parsePageSchema,
  parseRouteRules,
} from "@/lib/ui-schema/parser";
import type {
  DashboardSchemaDto,
  NavigationSchemaDto,
  PageSchemaDto,
  RouteRulesDto,
} from "@/lib/ui-schema/types";

type UiSchemaContextValue = {
  navigation: NavigationSchemaDto;
  routeRules: RouteRulesDto;
  dashboard: DashboardSchemaDto;
  loading: boolean;
  schemaError: string | null;
  usingFallback: boolean;
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
  const [navigation, setNavigation] = useState<NavigationSchemaDto>(EMPTY_NAV);
  const [routeRules, setRouteRules] = useState<RouteRulesDto>(EMPTY_RULES);
  const [dashboard, setDashboard] = useState<DashboardSchemaDto>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNavigation(EMPTY_NAV);
      setRouteRules(EMPTY_RULES);
      setDashboard(EMPTY_DASHBOARD);
      setSchemaError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setSchemaError(null);

      const [navRes, rulesRes, dashboardRes] = await Promise.allSettled([
        hrApi.uiShell.getNavigation(),
        hrApi.uiShell.getRouteRules(),
        hrApi.uiShell.getDashboard(),
      ]);

      const navValue = navRes.status === "fulfilled"
        ? parseNavigationSchema(navRes.value.data)
        : EMPTY_NAV;

      const rulesValue = rulesRes.status === "fulfilled"
        ? parseRouteRules(rulesRes.value.data)
        : EMPTY_RULES;

      const dashboardValue = dashboardRes.status === "fulfilled"
        ? parseDashboardSchema(dashboardRes.value.data)
        : EMPTY_DASHBOARD;

      setNavigation(navValue);
      setRouteRules(rulesValue);
      setDashboard(dashboardValue);

      const hadFailures = [navRes, rulesRes, dashboardRes].some((result) => result.status === "rejected");
      setSchemaError(hadFailures ? "Some UI schema endpoints failed; using fallback where needed." : null);
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Failed to load UI schema; using fallback configuration."), "UI Schema");
      setNavigation(EMPTY_NAV);
      setRouteRules(EMPTY_RULES);
      setDashboard(EMPTY_DASHBOARD);
      setSchemaError("Failed to load UI schema; using fallback configuration.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getPageSchema = useCallback(async (pageKey: string) => {
    try {
      const res = await hrApi.uiShell.getPageSchema(pageKey);
      return parsePageSchema(res.data);
    } catch {
      return null;
    }
  }, []);

  const usingFallback = useMemo(() => {
    return navigation.modules.length === 0 || routeRules.rules.length === 0;
  }, [navigation.modules.length, routeRules.rules.length]);

  const value = useMemo<UiSchemaContextValue>(() => ({
    navigation,
    routeRules,
    dashboard,
    loading,
    schemaError,
    usingFallback,
    refresh,
    getPageSchema,
  }), [navigation, routeRules, dashboard, loading, schemaError, usingFallback, refresh, getPageSchema]);

  return <UiSchemaContext.Provider value={value}>{children}</UiSchemaContext.Provider>;
};
