"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeInfo,
  Bell,
  Building2,
  CalendarRange,
  ChevronDown,
  FolderTree,
  Menu,
  RefreshCcw,
  Search,
  UserCircle2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { cn } from "@/lib/utils";
import { buildClientProfile } from "@/lib/publicProfile";
import type { ERPRole } from "@/lib/erp/types";
import type { AppVersion, Company, FinancialYear, Project } from "@/types";
import { appApi, orgApi } from "@/services/modules";
import { hrApi } from "@/services/hrApi";
import { publicApi } from "@/services/publicApi";

type WorkspaceStatusTone = "positive" | "warning" | "critical";

type TopbarNotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string;
  status?: string;
  createdAt?: string;
};

type HeaderMenu = "company" | "project" | "financialYear" | "notifications" | "profile" | null;

const toShortDateTime = (iso?: string): string => {
  if (!iso) return "Just now";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const toCount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
  return 0;
};

const normalizeNotification = (item: unknown): TopbarNotificationItem | null => {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : typeof raw.notificationId === "string" ? raw.notificationId : null;
  if (!id) return null;

  return {
    id,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : "Notification",
    message: typeof raw.message === "string" && raw.message.trim() ? raw.message : "New workspace update.",
    isRead: Boolean(raw.isRead),
    type: typeof raw.type === "string" ? raw.type : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
};

const panelClass =
  "absolute left-0 top-[calc(100%+0.45rem)] z-50 w-[min(22rem,90vw)] overflow-hidden rounded-[1.1rem] border border-slate-200/80 bg-white/97 shadow-[0_24px_64px_rgba(15,23,42,0.16)] backdrop-blur-xl";

const contextButtonClass =
  "inline-flex h-8 min-w-[7rem] max-w-[10rem] items-center gap-1.5 rounded-[0.9rem] border border-slate-200/80 bg-white/88 px-2.5 text-[0.8rem] font-medium text-slate-700 shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white";

const formatVersionLabel = (version?: AppVersion | null): string => {
  if (!version?.version) return "Loading version";
  const numeric = Number(version.version);
  if (Number.isFinite(numeric)) {
    return `v${numeric.toFixed(2)}`;
  }
  return `v${version.version}`;
};

function MenuList({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="max-h-80 overflow-y-auto p-2">{children}</div>
    </div>
  );
}

function MenuOptionButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl px-3 py-2.5 text-left transition",
        active ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium">{label}</span>
        {active ? (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">
            Active
          </span>
        ) : null}
      </div>
      {description ? <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p> : null}
    </button>
  );
}

function MenuActionLink({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
    >
      <span className="block font-medium">{label}</span>
      {note ? <span className="mt-0.5 block text-xs text-slate-500">{note}</span> : null}
    </Link>
  );
}

export function ERPTopbar({
  role,
  userName,
  tenantName,
  workspaceName,
  financialYearLabel,
  workspaceStatus: _workspaceStatus,
  onMenuClick,
  onLogout,
  onSearchOpen,
}: {
  role: ERPRole;
  userName: string;
  tenantName?: string;
  workspaceName?: string;
  financialYearLabel?: string;
  workspaceStatus: {
    label: string;
    tone: WorkspaceStatusTone;
  };
  onMenuClick: () => void;
  onLogout: () => void;
  onSearchOpen: () => void;
}) {
  const queryClient = useQueryClient();
  const { user, isSuperAdmin } = useAuth();
  const {
    companyId,
    companyName,
    projectId,
    projectName,
    financialYearKey,
    financialYearLabel: orgFinancialYearLabel,
    setContext,
    setFinancialYear,
  } = useOrgContext();

  const [menuOpen, setMenuOpen] = useState<HeaderMenu>(null);
  const [notifications, setNotifications] = useState<TopbarNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>(tenantName || workspaceName || "UabIndia ERP");
  const [brandSlogan, setBrandSlogan] = useState<string>("One platform for modern business operations.");
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const companyMenuRef = useRef<HTMLDivElement | null>(null);
  const projectMenuRef = useRef<HTMLDivElement | null>(null);
  const fyMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const currentCompanyLabel =
    companyName || companies.find((company) => company.id === companyId)?.name || "Select company";
  const currentProjectLabel =
    projectName || projects.find((project) => project.id === projectId)?.name || "Select project";
  const currentFinancialYearLabel =
    financialYearLabel ||
    orgFinancialYearLabel ||
    financialYears.find((fy) => fy.key === financialYearKey)?.label ||
    "Select FY";

  const contextTitle = workspaceName || tenantName || brandName;

  const loadBranding = useCallback(async () => {
    try {
      const response = await publicApi.getCompanyProfile("tenant");
      const profile = buildClientProfile(response.data);
      setBrandName(profile.brandName || profile.companyName || "UabIndia ERP");
      setBrandLogoUrl(profile.logoUrl || null);
      setBrandSlogan(profile.heroTitle || profile.heroSubtitle || profile.industry || "One platform for modern business operations.");
    } catch {
      setBrandName(tenantName || workspaceName || "UabIndia ERP");
      setBrandLogoUrl(null);
      setBrandSlogan("One platform for modern business operations.");
    }
  }, [tenantName, workspaceName]);

  const loadVersion = useCallback(async () => {
    try {
      const version = await appApi.system.getVersion();
      setAppVersion(version);
    } catch {
      setAppVersion(null);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    const [unreadResult, notificationsResult, approvalsResult] = await Promise.allSettled([
      hrApi.notifications.unreadCount({ suppressGlobalError: true }),
      hrApi.notifications.listMine({ take: 8, unreadOnly: false }, { suppressGlobalError: true }),
      hrApi.approvals.list("Pending"),
    ]);

    if (unreadResult.status === "fulfilled") {
      setUnreadCount(toCount((unreadResult.value.data as { unread?: unknown } | undefined)?.unread));
    }

    if (notificationsResult.status === "fulfilled") {
      const rows = Array.isArray(notificationsResult.value.data) ? notificationsResult.value.data : [];
      setNotifications(rows.map(normalizeNotification).filter((row): row is TopbarNotificationItem => Boolean(row)).slice(0, 8));
    }

    if (approvalsResult.status === "fulfilled") {
      const rows = Array.isArray(approvalsResult.value.data) ? approvalsResult.value.data : [];
      setPendingApprovalsCount(rows.length);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const response = isSuperAdmin ? await orgApi.company.getAllForSuperAdmin() : await orgApi.company.getAll(1, 200);
      const rows = Array.isArray((response.data as { companies?: unknown[] })?.companies)
        ? (response.data as { companies: Company[] }).companies
        : [];
      setCompanies(rows);
    } catch {
      setCompanies([]);
    }
  }, [isSuperAdmin]);

  const loadProjects = useCallback(async () => {
    if (!companyId) {
      setProjects([]);
      return;
    }

    try {
      const response = await orgApi.project.getByCompany(companyId);
      setProjects(Array.isArray(response.data?.projects) ? response.data.projects : []);
    } catch {
      setProjects([]);
    }
  }, [companyId]);

  const loadFinancialYears = useCallback(async () => {
    try {
      const response = await hrApi.system.financialYears();
      setFinancialYears(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFinancialYears([]);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadBranding(), loadVersion(), loadNotifications(), loadCompanies(), loadProjects(), loadFinancialYears()]);
  }, [loadBranding, loadCompanies, loadFinancialYears, loadNotifications, loadProjects, loadVersion]);

  useEffect(() => {
    let alive = true;
    const intervalId = window.setInterval(() => {
      if (!alive || (typeof document !== "undefined" && document.visibilityState !== "visible")) return;
      void loadNotifications();
    }, 60000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      alive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const refs = [companyMenuRef, projectMenuRef, fyMenuRef, notificationsMenuRef, profileMenuRef];
      if (refs.some((ref) => ref.current?.contains(target))) return;
      setMenuOpen(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await queryClient.invalidateQueries();
      await Promise.all([loadNotifications(), loadCompanies(), loadProjects(), loadFinancialYears(), loadVersion()]);
    } finally {
      setRefreshing(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await hrApi.notifications.markRead(id, { suppressGlobalError: true });
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      // Intentionally silent for shell ergonomics.
    }
  };

  return (
    <header className="sticky top-0 z-50 min-h-[var(--erp-topbar-height)] w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex min-h-[var(--erp-topbar-height)] w-full max-w-[1660px] items-center px-2.5 py-1 lg:px-3">
        <div className="flex min-h-[2.85rem] w-full flex-wrap items-center gap-1.5 xl:flex-nowrap">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-3.5 w-3.5" />
          </button>

          <Link
            href={ROUTES.DASHBOARD}
            className="flex min-w-0 items-center gap-2 rounded-[0.95rem] border border-transparent px-1 py-0.5 transition hover:border-slate-200/70 hover:bg-white/80"
          >
            <div className="flex h-9.5 w-[4.5rem] items-center justify-center overflow-hidden rounded-[0.9rem] bg-white">
              {brandLogoUrl ? (
                <Image src={brandLogoUrl} alt={brandName} width={78} height={40} className="h-full w-full object-contain" unoptimized />
              ) : (
                <span className="text-[0.68rem] font-black tracking-[0.24em] text-slate-900">UA</span>
              )}
            </div>
            <div className="min-w-0 max-w-[12rem] lg:max-w-[14rem] xl:max-w-[16rem]">
              <div className="flex items-center gap-2">
                <span className="truncate text-[0.92rem] font-semibold leading-none text-slate-950">{brandName}</span>
              </div>
              <div className="truncate pt-0.5 text-[0.7rem] font-medium leading-none text-slate-500">{brandSlogan}</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onSearchOpen}
            className="hidden min-w-0 flex-[0.9] items-center gap-2 rounded-[0.95rem] border border-slate-200/80 bg-slate-50/85 px-3 py-1.5 text-left text-[0.8rem] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-sky-200 hover:bg-white md:flex"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate">Search pages, modules, employees, transactions...</span>
            <span className="ml-auto inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="leading-none">Ctrl</span>
              <span className="mx-1 h-3.5 w-px bg-slate-200" />
              <span className="leading-none">K</span>
            </span>
          </button>

          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5 xl:flex-nowrap">
            <div ref={companyMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "company" ? null : "company"))}
                className={contextButtonClass}
                aria-expanded={menuOpen === "company"}
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="truncate">{currentCompanyLabel}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </button>
              {menuOpen === "company" ? (
                <div className={panelClass}>
                  <MenuList title="Company" subtitle="Switch the active company context.">
                    {companies.length > 0 ? (
                      companies.map((company) => (
                        <MenuOptionButton
                          key={company.id}
                          label={company.name}
                          description={company.logoUrl ? "Brand logo available" : company.isActive ? "Active company" : "Inactive company"}
                          active={company.id === companyId}
                          onClick={() => {
                            setContext({ companyId: company.id, companyName: company.name, projectId: null, projectName: null });
                            setMenuOpen(null);
                          }}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        No companies available.
                      </div>
                    )}
                  </MenuList>
                </div>
              ) : null}
            </div>

            <div ref={projectMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "project" ? null : "project"))}
                className={contextButtonClass}
                aria-expanded={menuOpen === "project"}
              >
                <FolderTree className="h-3.5 w-3.5 text-slate-500" />
                <span className="truncate">{currentProjectLabel}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </button>
              {menuOpen === "project" ? (
                <div className={panelClass}>
                  <MenuList title="Project" subtitle="Select a project within the active company.">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <MenuOptionButton
                          key={project.id}
                          label={project.name}
                          description={project.projectCode || "Workspace project"}
                          active={project.id === projectId}
                          onClick={() => {
                            setContext({ companyId, companyName: currentCompanyLabel, projectId: project.id, projectName: project.name });
                            setMenuOpen(null);
                          }}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        No projects found for the selected company.
                      </div>
                    )}
                  </MenuList>
                </div>
              ) : null}
            </div>

            <div ref={fyMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "financialYear" ? null : "financialYear"))}
                className={contextButtonClass}
                aria-expanded={menuOpen === "financialYear"}
              >
                <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
                <span className="truncate">{currentFinancialYearLabel}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </button>
              {menuOpen === "financialYear" ? (
                <div className={panelClass}>
                  <MenuList title="Financial year" subtitle="Update the reporting period for the workspace.">
                    {financialYears.length > 0 ? (
                      financialYears.map((financialYear) => (
                        <MenuOptionButton
                          key={financialYear.key}
                          label={financialYear.label}
                          description={financialYear.isCurrent ? "Current financial year" : `${financialYear.startDate} to ${financialYear.endDate}`}
                          active={financialYear.key === financialYearKey}
                          onClick={() => {
                            setFinancialYear(financialYear.key, financialYear.label);
                            setMenuOpen(null);
                          }}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        No financial years configured.
                      </div>
                    )}
                  </MenuList>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onSearchOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
              aria-label="Open search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <span className="hidden rounded-full border border-slate-200/80 bg-slate-50/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:inline-flex">
              <BadgeInfo className="mr-1.5 h-3.5 w-3.5" />
              {formatVersionLabel(appVersion)}
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="inline-flex h-8 items-center gap-1.5 rounded-[0.9rem] border border-slate-200 bg-white px-2.5 text-[0.8rem] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              <span className="hidden xl:inline">Refresh</span>
            </button>
            <div ref={notificationsMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "notifications" ? null : "notifications"))}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="Notifications"
                aria-expanded={menuOpen === "notifications"}
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] font-bold text-white">
                    {Math.min(unreadCount, 99)}
                  </span>
                ) : null}
              </button>
              {menuOpen === "notifications" ? (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(26rem,92vw)] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/97 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <MenuList
                    title="Notifications"
                    subtitle={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} approvals waiting | ${unreadCount} unread` : `${unreadCount} unread updates`}
                  >
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => void markNotificationAsRead(notification.id)}
                          className={cn(
                            "w-full rounded-xl px-3 py-3 text-left transition",
                            notification.isRead ? "text-slate-600 hover:bg-slate-50" : "bg-sky-50/70 text-slate-900 hover:bg-sky-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{notification.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
                            </div>
                            {!notification.isRead ? (
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                            ) : null}
                          </div>
                          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            {notification.type || notification.status || "Workspace"} | {toShortDateTime(notification.createdAt)}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    )}
                  </MenuList>
                </div>
              ) : null}
            </div>
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "profile" ? null : "profile"))}
                className="inline-flex h-8 items-center gap-1.5 rounded-[0.9rem] border border-slate-200 bg-white px-2.5 text-[0.8rem] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="Profile"
                aria-expanded={menuOpen === "profile"}
              >
                <UserCircle2 className="h-4 w-4" />
                <span className="hidden max-w-[8rem] truncate lg:block">{userName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {menuOpen === "profile" ? (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(20rem,90vw)] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/97 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <MenuList title={userName} subtitle={user?.email || role.replace(/_/g, " ")}>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Current workspace</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{contextTitle}</p>
                      <p className="truncate text-xs text-slate-500">{currentCompanyLabel}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      <MenuActionLink href={ROUTES.PROFILE} label="Profile settings" note="Manage your account and personal preferences." />
                      <MenuActionLink href={ROUTES.HELPDESK_FAQ} label="Help & documentation" note="Guides, walkthroughs, and support references." />
                    </div>
                    <div className="mt-2 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(null);
                          onLogout();
                        }}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </MenuList>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
