"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { User, Company, Project, FinancialYear, Module } from "@/types";
import { hrApi } from "@/services/hrApi";
import apiClient from "@/services/apiClient";
import { useOrgContext } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

export interface TopbarProps {
  user: User;
  modules: Module[];
  appVersion?: string;
  variant?: "admin" | "user" | "superadmin";
  onRefresh?: () => void;
  onLogout?: () => void;
  onOpenSidebar?: () => void;
  onSearchChange?: (query: string) => void;
}

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
  readAt?: string;
  type?: string;
};

export function Topbar({
  user,
  modules,
  appVersion = "1.0.0",
  variant = "admin",
  onRefresh,
  onLogout,
  onOpenSidebar,
  onSearchChange,
}: TopbarProps) {
  const getCompanyDisplayName = useCallback((company?: Partial<Company> | null): string => {
    const candidateNames = [
      company?.name,
      (company as Partial<Company> & { legalName?: string })?.legalName,
      (company as Partial<Company> & { companyName?: string })?.companyName,
      company?.code,
    ];

    for (const candidate of candidateNames) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    const shortId = typeof company?.id === "string" && company.id.length > 8
      ? company.id.slice(0, 8)
      : company?.id || "Unknown";
    return `Unnamed Company (${shortId})`;
  }, []);

  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const { hasPermission } = usePermissions();
  const {
    companyId: ctxCompanyId,
    companyName: ctxCompanyName,
    projectId: ctxProjectId,
    projectName: ctxProjectName,
    setContext,
    financialYearKey: ctxFinancialYearKey,
    setFinancialYear,
  } = useOrgContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
  const [showMobileSearchDrawer, setShowMobileSearchDrawer] = useState(false);
  const [showMobileContextDrawer, setShowMobileContextDrawer] = useState(false);
  const [topbarSearch, setTopbarSearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(
    ctxCompanyId || user.companyId || ""
  );
  const [selectedProject, setSelectedProject] = useState<string>(
    ctxProjectId || ""
  );
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>(ctxFinancialYearKey || "");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingFinancialYears, setIsLoadingFinancialYears] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [_companiesError, setCompaniesError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [financialYearsError, setFinancialYearsError] = useState<string | null>(null);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showFYPicker, setShowFYPicker] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const quickActionsMenuRef = useRef<HTMLDivElement>(null);
  const manualProjectLoadRef = useRef<string | null>(null);
  const selectedProjectRef = useRef<string>(ctxProjectId || "");
  const contextRef = useRef({
    companyId: ctxCompanyId,
    projectId: ctxProjectId,
    companyName: ctxCompanyName,
  });
  const topbarNetworkToastAtRef = useRef<number>(0);
  const companyPickerRef = useRef<HTMLDivElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);
  const fyPickerRef = useRef<HTMLDivElement>(null);

  const notifyTopbarNetworkIssue = useCallback((error: unknown) => {
    const message = getApiErrorMessage(error, "Network error while syncing topbar context.");
    const normalized = message.toLowerCase();
    const looksLikeNetworkIssue = normalized.includes("network") || normalized.includes("failed to fetch");
    if (!looksLikeNetworkIssue) return;

    const now = Date.now();
    const COOLDOWN_MS = 15000;
    if (now - topbarNetworkToastAtRef.current < COOLDOWN_MS) return;

    topbarNetworkToastAtRef.current = now;
    notifyError("Network issue while loading company/project data. Retrying automatically.", "Connection");
  }, []);

  const closeAllMenus = useCallback(() => {
    setShowProfileMenu(false);
    setShowNotificationDropdown(false);
    setShowQuickActionsMenu(false);
    setShowMobileSearchDrawer(false);
    setShowMobileContextDrawer(false);
    setShowCompanyPicker(false);
    setShowProjectPicker(false);
    setShowFYPicker(false);
  }, []);

  useEffect(() => {
    const shouldLockScroll = showMobileSearchDrawer || showMobileContextDrawer;
    if (!shouldLockScroll) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileSearchDrawer, showMobileContextDrawer]);

  useEffect(() => {
    setSelectedCompany(ctxCompanyId || user.companyId || "");
  }, [ctxCompanyId, user?.companyId]);

  useEffect(() => {
    setSelectedProject(ctxProjectId || "");
  }, [ctxProjectId]);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  useEffect(() => {
    contextRef.current = {
      companyId: ctxCompanyId,
      projectId: ctxProjectId,
      companyName: ctxCompanyName,
    };
  }, [ctxCompanyId, ctxProjectId, ctxCompanyName]);

  useEffect(() => {
    setSelectedFinancialYear(ctxFinancialYearKey || "");
  }, [ctxFinancialYearKey]);

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoadingCompanies(true);
      setCompaniesError(null);
      const res = isSuperAdmin
        ? await hrApi.company.getAllForSuperAdmin()
        : await hrApi.company.getAll(1, 200);

      const rawCompanies = Array.isArray(res.data?.companies) ? res.data.companies : [];
      const byId = new Map<string, Company>();
      for (const company of rawCompanies) {
        if (!company?.id) continue;
        if (byId.has(company.id)) continue;
        byId.set(company.id, {
          ...company,
          isActive: "isActive" in company ? company.isActive : true,
          name: getCompanyDisplayName(company),
        });
      }
      const nextCompanies = Array.from(byId.values());
      setCompanies(nextCompanies);

      setSelectedCompany((prev) => {
        if (prev) return prev;
        if (user.companyId) return user.companyId;
        return nextCompanies[0]?.id || "";
      });
    } catch (error) {
      setCompaniesError("Unable to load companies");
      notifyTopbarNetworkIssue(error);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [user.companyId, getCompanyDisplayName, isSuperAdmin, notifyTopbarNetworkIssue]);

  const loadProjects = useCallback(
    async (
      companyId: string,
      opts?: { companyName?: string; preferredProjectId?: string; syncContext?: boolean }
    ) => {
      if (!companyId) {
        setProjects([]);
        setSelectedProject("");
        return;
      }

      try {
        setIsLoadingProjects(true);
        setProjectsError(null);
        const res = await hrApi.project.getByCompany(companyId);
        const projectsList = res.data.projects || [];
        setProjects(projectsList);

        let nextProjectId = opts?.preferredProjectId ?? selectedProjectRef.current;
        if (nextProjectId && !projectsList.some((p) => p.id === nextProjectId)) {
          nextProjectId = "";
        }
        if (!nextProjectId && projectsList.length > 0) {
          nextProjectId = projectsList[0].id;
        }

        setSelectedProject(nextProjectId);

        const currentContext = contextRef.current;
        const shouldSync =
          (opts?.syncContext ?? true) &&
          (currentContext.companyId !== companyId || currentContext.projectId !== nextProjectId);

        if (shouldSync) {
          const resolvedCompany = companies.find((c) => c.id === companyId);
          const resolvedProject = projectsList.find((p) => p.id === nextProjectId);

          const resolvedCompanyName = resolvedCompany?.name || opts?.companyName || currentContext.companyName || null;
          const resolvedProjectName = nextProjectId ? (resolvedProject?.name || null) : null;

          setContext({
            companyId,
            companyName: resolvedCompanyName,
            projectId: nextProjectId || null,
            projectName: resolvedProjectName,
          });
        }
      } catch (error) {
        setProjects([]);
        setProjectsError("Unable to load projects");
        notifyTopbarNetworkIssue(error);
      } finally {
        setIsLoadingProjects(false);
      }
    },
    [
      companies,
      setContext,
      notifyTopbarNetworkIssue,
    ]
  );

  const loadFinancialYears = useCallback(async () => {
    try {
      setIsLoadingFinancialYears(true);
      setFinancialYearsError(null);
      const res = await hrApi.system.financialYears();
      const years: FinancialYear[] = res.data || [];
      setFinancialYears(years);
      const current = years.find((y: FinancialYear) => y.isCurrent);
      if (current) {
        setSelectedFinancialYear(current.key);
        if (!ctxFinancialYearKey) {
          setFinancialYear(current.key, current.label);
        }
      } else if (years.length > 0) {
        setSelectedFinancialYear(years[0].key);
        if (!ctxFinancialYearKey) {
          setFinancialYear(years[0].key, years[0].label);
        }
      }
    } catch (error) {
      setFinancialYearsError("Unable to load financial years");
      notifyError(getApiErrorMessage(error, "Failed to fetch financial years."), "Financial Year Selector");
    } finally {
      setIsLoadingFinancialYears(false);
    }
  }, [ctxFinancialYearKey, setFinancialYear]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await hrApi.notifications.unreadCount({ suppressGlobalError: true });
      setUnreadCount(Math.max(0, res.data?.unread || 0));
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      if (status === 403) {
        setUnreadCount(0);
        return;
      }
      // Optional UI only; keep silent to avoid noisy UX
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const res = await hrApi.notifications.listMine({ take: 12 }, { suppressGlobalError: true });
      const data = Array.isArray(res.data) ? (res.data as NotificationItem[]) : [];
      setNotifications(data);
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      if (status === 403) {
        setNotifications([]);
        setNotificationsError(null);
        return;
      }
      setNotificationsError("Unable to load notifications");
      // Suppress toast for notification load failures — non-critical
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]); // Only fetch on mount, not on user.companyId changes to prevent infinite loop

  // Fetch projects when company changes
  useEffect(() => {
    if (!selectedCompany) return;
    if (manualProjectLoadRef.current === selectedCompany) {
      manualProjectLoadRef.current = null;
      return;
    }
    loadProjects(selectedCompany);
  }, [selectedCompany, loadProjects]);

  // Fetch financial years on mount
  useEffect(() => {
    loadFinancialYears();
  }, [loadFinancialYears]);

  useEffect(() => {
    void loadUnreadCount();
    const id = window.setInterval(() => {
      void loadUnreadCount();
    }, 30000);

    return () => {
      window.clearInterval(id);
    };
  }, [loadUnreadCount]);

  // Handle click outside profile/admin menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setShowNotificationDropdown(false);
      }

      if (quickActionsMenuRef.current && !quickActionsMenuRef.current.contains(target)) {
        setShowQuickActionsMenu(false);
      }

      if (companyPickerRef.current && !companyPickerRef.current.contains(target)) {
        setShowCompanyPicker(false);
      }
      if (projectPickerRef.current && !projectPickerRef.current.contains(target)) {
        setShowProjectPicker(false);
      }
      if (fyPickerRef.current && !fyPickerRef.current.contains(target)) {
        setShowFYPicker(false);
      }
    };

    const handleEscClose = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscClose);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscClose);
    };
  }, [closeAllMenus]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await hrApi.notifications.markRead(id, { suppressGlobalError: true });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      // Suppress toast — unread badge is non-critical
      void error;
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        apiClient.get("/auth/me"),
        hrApi.modules.getEnabled(),
        loadCompanies(),
        loadFinancialYears(),
      ]);
      if (selectedCompany) {
        await loadProjects(selectedCompany);
      }
      onRefresh?.();
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Refresh failed."), "Refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Ignore logout API failures — proceed to login
      void error;
    } finally {
      onLogout?.();
      router.replace("/login");
    }
  };

  const updateContextForProject = useCallback(
    (projectId: string) => {
      if (!projectId || !selectedCompany) return;
      if (ctxCompanyId === selectedCompany && ctxProjectId === projectId) return;
      const company = companies.find((c) => c.id === selectedCompany);
      const project = projects.find((p) => p.id === projectId);
      if (!company || !project) return;

      setContext({
        companyId: company.id,
        companyName: company.name,
        projectId: project.id,
        projectName: project.name,
      });
    },
    [companies, projects, selectedCompany, ctxCompanyId, ctxProjectId, setContext]
  );

  const clearProjectSelection = useCallback(() => {
    setSelectedProject("");

    if (!selectedCompany) return;
    const company = companies.find((item) => item.id === selectedCompany);
    if (!company) return;

    setContext({
      companyId: company.id,
      companyName: company.name,
      projectId: "",
      projectName: "",
    });
  }, [companies, selectedCompany, setContext]);

  const clearCompanySelection = useCallback(() => {
    setSelectedCompany("");
    setSelectedProject("");
    setContext({ companyId: null, companyName: null, projectId: null, projectName: null });
  }, [setContext]);

  const roles = (user as { roles?: string[] } | null)?.roles || [];
  const canAccessAdminConsole =
    (variant === "admin" || variant === "superadmin") &&
    hasPermission([
    PERMISSIONS.PLATFORM_VIEW,
    PERMISSIONS.PLATFORM_COMPANIES_VIEW,
    PERMISSIONS.PLATFORM_USERS_VIEW,
    PERMISSIONS.PLATFORM_ROLES_VIEW,
    PERMISSIONS.PLATFORM_TENANTS_VIEW,
    "module:platform",
    "platform.*",
    ]);
  const primaryRole = user.role || roles[0] || "User";

  const displayName =
    user.fullName?.trim() && user.fullName.trim() !== "Admin User"
      ? user.fullName.trim()
      : primaryRole;

  const initials = (displayName || "User")
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part?.[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  // Prefer the name from the loaded companies list (freshest), then fall back to ctx.
  // Never display a raw UUID — the UUID-looking value means the name hasn't resolved yet.
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const resolvedNameFromList = companies.find((c) => c.id === selectedCompany)?.name;
  const resolvedNameFromCtx =
    ctxCompanyId &&
    ctxCompanyId === selectedCompany &&
    ctxCompanyName &&
    !uuidPattern.test(ctxCompanyName)
      ? ctxCompanyName
      : null;
  const selectedCompanyName = !selectedCompany
    ? (isLoadingCompanies ? "Loading…" : "All Companies")
    : (resolvedNameFromList || resolvedNameFromCtx || "All Companies");
  const resolvedProjectNameFromList = selectedProject
    ? projects.find((p) => p.id === selectedProject)?.name
    : null;
  const resolvedProjectNameFromCtx =
    selectedProject && ctxProjectId === selectedProject && ctxProjectName
      ? ctxProjectName
      : null;
  const selectedProjectName = isLoadingProjects
    ? "Loading…"
    : selectedProject
      ? (resolvedProjectNameFromList || resolvedProjectNameFromCtx || "Select Project")
      : "All Projects";

  const selectedFinancialYearLabel =
    financialYears.find((y) => y.key === selectedFinancialYear)?.label || "Financial Year";
  const getControlClass = (active = false) =>
    active ? "erp-shell-control erp-shell-control-active" : "erp-shell-control";
  const getIconControlClass = (active = false) =>
    `${getControlClass(active)} erp-shell-control-icon`;
  const getContextOptionClass = (active = false) =>
    active ? "erp-shell-context-option erp-shell-context-option-active" : "erp-shell-context-option";

  const getPlatformShortcutPath = useCallback(
    (keywords: string[], fallbackPath: string) => {
      const platformModule = modules.find((module) => module.key === "platform");
      const subModules = platformModule?.subModules || [];

      const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
      for (const subModule of subModules) {
        const haystack = `${subModule.key} ${subModule.name} ${subModule.path}`.toLowerCase();
        if (normalizedKeywords.some((keyword) => haystack.includes(keyword))) {
          return subModule.path;
        }
      }

      return fallbackPath;
    },
    [modules]
  );

  const platformCompaniesPath = getPlatformShortcutPath(["company", "companies"], ROUTES.PLATFORM_COMPANIES);
  const platformProjectsPath = getPlatformShortcutPath(["project", "projects"], ROUTES.PLATFORM_PROJECTS);
  const platformUsersPath = getPlatformShortcutPath(["user", "users"], ROUTES.PLATFORM_USERS);
  const platformRolesPath = getPlatformShortcutPath(["role", "roles"], ROUTES.PLATFORM_ROLES);
  const platformTenantsPath = getPlatformShortcutPath(["tenant", "tenants"], ROUTES.PLATFORM_TENANTS);
  const platformRecycleBinPath = getPlatformShortcutPath(["recycle", "bin", "deleted"], ROUTES.PLATFORM_RECYCLE_BIN);

  const quickActions = [
    {
      key: "create-sales-order",
      label: "Create Sales Order",
      description: "Sales > Orders",
      path: ROUTES.SALES_ORDERS,
      visible:
        variant === "admin" || variant === "superadmin" ||
        hasPermission([PERMISSIONS.SALES_ORDERS_VIEW, "erp.sales_orders.create", "salesorders.create", "erp.*"]),
    },
    {
      key: "add-customer",
      label: "Add Customer",
      description: "Operations > Customers",
      path: ROUTES.CUSTOMERS,
      visible:
        variant === "admin" || variant === "superadmin" ||
        hasPermission([PERMISSIONS.CUSTOMER_VIEW, "customer.create", "erp.*"]),
    },
    {
      key: "create-purchase-order",
      label: "Create Purchase Order",
      description: "Operations > Purchase",
      path: ROUTES.PURCHASE_ORDERS,
      visible:
        variant === "admin" || variant === "superadmin" ||
        hasPermission([PERMISSIONS.PURCHASE_ORDERS_VIEW, "purchaseorders.create", "erp.*"]),
    },
    {
      key: "add-employee",
      label: "Add Employee",
      description: "HRMS > Employees",
      path: ROUTES.EMPLOYEES,
      visible:
        variant === "admin" || variant === "superadmin" ||
        hasPermission([PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_VIEW, "hrms.*"]),
    },
    {
      key: "run-payroll",
      label: "Run Payroll",
      description: "Payroll > Runs",
      path: ROUTES.PAYROLL_RUNS,
      visible:
        variant === "admin" || variant === "superadmin" ||
        hasPermission([PERMISSIONS.PAYROLL_RUNS_VIEW, "payroll.run", "payroll.*"]),
    },
  ].filter((action) => action.visible);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-1.5 backdrop-blur-sm sm:px-4">
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden items-center justify-center rounded-lg px-2 py-1 md:flex">
            {(() => {
              const selectedCompanyData = selectedCompany ? companies.find((c) => c.id === selectedCompany) : null;
              const logoUrl = selectedCompanyData?.logoUrl;
              const defaultBrandAlt = "Uabindia ERP Tenant Portal";
              if (logoUrl && logoUrl !== "/logo.png") {
                return (
                  <img
                    src={logoUrl}
                    alt={getCompanyDisplayName(selectedCompanyData) || "Tenant Logo"}
                    className="h-6 w-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      setLogoLoadFailed(true);
                    }}
                  />
                );
              }
              if (logoLoadFailed) {
                return (
                  <img
                    src="/logo.png?v=uabindia-20260205"
                    alt={defaultBrandAlt}
                    className="h-6 w-auto object-contain"
                  />
                );
              }
              return (
                <img
                  src="/logo.png?v=uabindia-20260205"
                  alt={defaultBrandAlt}
                  className="h-6 w-auto object-contain"
                />
              );
            })()}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
          <label htmlFor="topbar-search" className="sr-only">
            Search modules
          </label>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="topbar-search"
            name="topbar-search"
            type="text"
            value={topbarSearch}
            onChange={(event) => {
              setTopbarSearch(event.target.value);
              onSearchChange?.(event.target.value);
            }}
            placeholder="Search..."
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {/* ── Context switcher pills (desktop) ── */}
        <div className="hidden shrink-0 items-center gap-1.5 lg:flex">

          {/* Company picker */}
          <div ref={companyPickerRef} className="relative">
            <button
              type="button"
              onClick={() => { setShowCompanyPicker((v) => !v); setShowProjectPicker(false); setShowFYPicker(false); }}
              disabled={isLoadingCompanies}
              className={`flex h-7 max-w-37.5 items-center gap-1.5 rounded-lg border px-2 text-xs shadow-sm transition
                ${showCompanyPicker ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}
                text-slate-700 disabled:opacity-60`}
              aria-label="Select company"
            >
              {/* building icon */}
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M11 21v-4h2v4" />
              </svg>
              <span className="min-w-0 truncate font-medium">{isLoadingCompanies ? "Loading…" : selectedCompanyName}</span>
              <svg className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${showCompanyPicker ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCompanyPicker && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Company</p>
                </div>
                <div className="max-h-60 w-full overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => { setShowCompanyPicker(false); clearCompanySelection(); }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50
                      ${!selectedCompany ? "font-semibold text-sky-700" : "text-slate-500"}`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {!selectedCompany && (
                        <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    All Companies
                  </button>
                  {companies.length === 0 && (
                    <p className="px-3 py-3 text-xs text-slate-400">{isLoadingCompanies ? "Loading…" : "No companies found"}</p>
                  )}
                  {companies.map((company, ci) => (
                    <button
                      key={company.id ? `co-${company.id}` : `co-idx-${ci}`}
                      type="button"
                      onClick={() => {
                        setShowCompanyPicker(false);
                        const id = company.id;
                        setSelectedCompany(id);
                        setSelectedProject("");
                        manualProjectLoadRef.current = id;
                        // Immediately push context so the page refreshes now, before projects load
                        setContext({ companyId: id, companyName: getCompanyDisplayName(company), projectId: null, projectName: null });
                        void loadProjects(id, { companyName: getCompanyDisplayName(company), preferredProjectId: "", syncContext: true });
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50
                        ${selectedCompany === company.id ? "font-semibold text-sky-700" : "text-slate-700"}`}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {selectedCompany === company.id && (
                          <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{getCompanyDisplayName(company)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project picker */}
          <div ref={projectPickerRef} className="relative">
            <button
              type="button"
              onClick={() => { setShowProjectPicker((v) => !v); setShowCompanyPicker(false); setShowFYPicker(false); }}
              disabled={!selectedCompany || isLoadingProjects}
              className={`flex h-7 max-w-37.5 items-center gap-1.5 rounded-lg border px-2 text-xs shadow-sm transition
                ${showProjectPicker ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}
                text-slate-700 disabled:opacity-60`}
              aria-label="Select project"
            >
              {/* folder icon */}
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="min-w-0 truncate font-medium">{isLoadingProjects ? "Loading…" : selectedProjectName}</span>
              <svg className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${showProjectPicker ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showProjectPicker && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Project</p>
                </div>
                {projectsError && <p className="px-3 py-2 text-xs text-red-500">{projectsError}</p>}
                <div className="max-h-60 w-full overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => { setShowProjectPicker(false); clearProjectSelection(); }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50
                      ${!selectedProject ? "font-semibold text-sky-700" : "text-slate-500"}`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {!selectedProject && (
                        <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    All Projects
                  </button>
                  {projects.length === 0 && !isLoadingProjects && (
                    <p className="px-3 py-2 text-xs text-slate-400">No projects found</p>
                  )}
                  {projects.map((project, pi) => (
                    <button
                      key={project.id ? `pr-${project.id}` : `pr-idx-${pi}`}
                      type="button"
                      onClick={() => {
                        setShowProjectPicker(false);
                        setSelectedProject(project.id);
                        updateContextForProject(project.id);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50
                        ${selectedProject === project.id ? "font-semibold text-sky-700" : "text-slate-700"}`}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {selectedProject === project.id && (
                          <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{project.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Year picker */}
          <div ref={fyPickerRef} className="relative">
            <button
              type="button"
              onClick={() => { setShowFYPicker((v) => !v); setShowCompanyPicker(false); setShowProjectPicker(false); }}
              disabled={isLoadingFinancialYears}
              className={`flex h-7 items-center gap-1.5 rounded-lg border px-2 text-xs shadow-sm transition
                ${showFYPicker ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}
                text-slate-700 disabled:opacity-60`}
              aria-label="Select financial year"
            >
              {/* calendar icon */}
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <rect x="3" y="4" width="18" height="17" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="font-semibold tabular-nums text-slate-800">
                {isLoadingFinancialYears ? "Loading…" : (selectedFinancialYearLabel === "Financial Year" ? "Select FY" : selectedFinancialYearLabel)}
              </span>
              <svg className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${showFYPicker ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFYPicker && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Financial Year</p>
                </div>
                {financialYearsError && <p className="px-3 py-2 text-xs text-red-500">{financialYearsError}</p>}
                <div className="max-h-60 w-full overflow-y-auto py-1">
                  {financialYears.length === 0 && (
                    <p className="px-3 py-3 text-xs text-slate-400">{isLoadingFinancialYears ? "Loading…" : "No financial years"}</p>
                  )}
                  {financialYears.map((fy, fi) => (
                    <button
                      key={fy.key ? `fy-${fy.key}` : `fy-idx-${fi}`}
                      type="button"
                      onClick={() => {
                        setShowFYPicker(false);
                        setSelectedFinancialYear(fy.key);
                        setFinancialYear(fy.key || null, fy.label || null);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50
                        ${selectedFinancialYear === fy.key ? "font-semibold text-sky-700" : "text-slate-700"}`}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {selectedFinancialYear === fy.key && (
                          <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1">{fy.label}</span>
                      {fy.isCurrent && (
                        <span className="ml-1 shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Current</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Refresh page"
            title="Refresh"
          >
            <svg className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => alert("Notifications feature coming soon")}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Notifications"
            title="Notifications"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 items-center justify-center rounded-full bg-red-500"></span>
          </button>

          <div ref={profileMenuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              aria-label="Open profile menu"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: "#0b4f8c" }}
              >
                {initials}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              </div>
              <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {/* User info */}
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: "#0b4f8c" }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
                    <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>

                {/* Context panel */}
                <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 space-y-2">
                  {/* Company */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M11 21v-4h2v4" />
                      </svg>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Company</p>
                    </div>
                    <div className="relative min-w-0 max-w-45">
                      <select
                        value={selectedCompany}
                        disabled={isLoadingCompanies}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) { clearCompanySelection(); return; }
                          setSelectedCompany(id);
                          setSelectedProject("");
                          manualProjectLoadRef.current = id;
                          const co = companies.find((c) => c.id === id);
                          // Immediately push context so page refreshes before projects load
                          setContext({ companyId: id, companyName: getCompanyDisplayName(co), projectId: null, projectName: null });
                          void loadProjects(id, { companyName: getCompanyDisplayName(co), preferredProjectId: "", syncContext: true });
                        }}
                        className="h-7 w-full max-w-45 truncate rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="">{isLoadingCompanies ? "Loading…" : "All Companies"}</option>
                        {companies.map((c, ci) => <option key={`co-opt-${c.id ?? "na"}-${ci}`} value={c.id}>{getCompanyDisplayName(c)}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Project</p>
                    </div>
                    <div className="relative min-w-0 max-w-45">
                      <select
                        value={selectedProject}
                        disabled={!selectedCompany || isLoadingProjects}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) { clearProjectSelection(); return; }
                          setSelectedProject(id);
                          updateContextForProject(id);
                        }}
                        className="h-7 w-full max-w-45 truncate rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="">All Projects</option>
                        {projects.map((p, pi) => <option key={`pr-opt-${p.id ?? "na"}-${pi}`} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Financial Year */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <rect x="3" y="4" width="18" height="17" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Fin. Year</p>
                    </div>
                    <div className="relative min-w-0 max-w-45">
                      <select
                        value={selectedFinancialYear}
                        disabled={isLoadingFinancialYears}
                        onChange={(e) => {
                          const key = e.target.value;
                          setSelectedFinancialYear(key);
                          const fy = financialYears.find((f) => f.key === key);
                          setFinancialYear(key || null, fy?.label || null);
                        }}
                        className="h-7 w-full max-w-45 truncate rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      >
                        {!selectedFinancialYear && <option value="">{isLoadingFinancialYears ? "Loading…" : "Select FY"}</option>}
                        {financialYears.map((fy, fi) => <option key={`fy-opt-${fy.key ?? "na"}-${fi}`} value={fy.key}>{fy.label}{fy.isCurrent ? " ✓" : ""}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canAccessAdminConsole && (
                  <div className="border-b border-slate-100 px-3 py-0.5">
                    <Link
                      href={platformUsersPath}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      Manage Users
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setShowProfileMenu(false); void handleLogout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
