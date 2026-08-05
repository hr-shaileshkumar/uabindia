"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeInfo,
  Bell,
  Building2,
  CalendarRange,
  ChevronDown,
  FolderTree,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  User,
  LogOut,
  HelpCircle,
  CheckCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { cn } from "@/lib/utils";
import { ArcLoader } from "@/components/erp/arc-loader";
import { buildClientProfile } from "@/lib/publicProfile";
import type { ERPRole } from "@/lib/erp/types";
import type { AppVersion, Company, FinancialYear, Project } from "@/types";
import { appApi, orgApi } from "@/services/modules";
import { hrApi } from "@/services/hrApi";
import { publicApi } from "@/services/publicApi";
import { notifySuccess } from "@/lib/notifications";

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
  "absolute left-0 top-[calc(100%+0.45rem)] z-50 w-[min(22rem,90vw)] overflow-hidden rounded-[1.1rem] border border-slate-200/80 bg-white/97 dark:bg-slate-900/97 dark:border-slate-800 shadow-[0_24px_64px_rgba(15,23,42,0.16)] backdrop-blur-xl";

const contextButtonClass =
  "inline-flex h-9 min-w-[8.5rem] max-w-[11rem] items-center gap-1.5 rounded-[0.9rem] border border-slate-200/80 bg-white/88 dark:bg-slate-900/88 dark:border-slate-800 px-3 text-[0.8rem] font-medium text-slate-700 dark:text-slate-200 shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800";

const formatVersionLabel = (version?: AppVersion | null): string => {
  if (!version?.version) return "v1.0.0";
  const numeric = Number(version.version);
  if (Number.isFinite(numeric)) {
    return `v${numeric.toFixed(2)}`;
  }
  return `v${version.version}`;
};

const titleize = (value: string) =>
  value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getInitials = (value?: string | null) => {
  const source = (value || "").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
};

function MenuList({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
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
        active ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium">{label}</span>
        {active ? (
          <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-300">
            Active
          </span>
        ) : null}
      </div>
      {description ? <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
    </button>
  );
}

function MenuActionLink({ href, label, note, icon: Icon }: { href: string; label: string; note?: string; icon?: React.ElementType }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
    >
      {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {note ? <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{note}</span> : null}
      </div>
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
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
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
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const companyMenuRef = useRef<HTMLDivElement | null>(null);
  const projectMenuRef = useRef<HTMLDivElement | null>(null);
  const fyMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedCompany = companies.find((company) => company.id === companyId) ?? null;

  const currentCompanyLabel =
    companyName || selectedCompany?.name || "Select company";
  const currentProjectLabel =
    projectName || projects.find((project) => project.id === projectId)?.name || "Select project";
  const currentFinancialYearLabel =
    financialYearLabel ||
    orgFinancialYearLabel ||
    financialYears.find((fy) => fy.key === financialYearKey)?.label ||
    "Select FY";

  const contextTitle = workspaceName || tenantName || brandName;
  const displayBrandName = selectedCompany?.name || companyName || brandName;
  const displayBrandLogoUrl = selectedCompany?.logoUrl || brandLogoUrl;
  const userAvatarUrl =
    (typeof user?.avatarUrl === "string" && user.avatarUrl) ||
    (typeof user?.profilePhotoUrl === "string" && user.profilePhotoUrl) ||
    (typeof user?.profileImageUrl === "string" && user.profileImageUrl) ||
    (typeof user?.photoUrl === "string" && user.photoUrl) ||
    (typeof user?.imageUrl === "string" && user.imageUrl) ||
    null;
  const userInitials = getInitials(user?.fullName || userName || user?.email || "");
  const breadcrumbLabel = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Workspace";
    return segments.slice(0, 2).map(titleize).join(" / ");
  }, [pathname]);

  const loadBranding = useCallback(async () => {
    try {
      const response = await publicApi.getCompanyProfile("tenant");
      const profile = buildClientProfile(response.data);
      setBrandName(profile.brandName || profile.companyName || "UabIndia ERP");
      setBrandLogoUrl(profile.logoUrl || null);
    } catch {
      setBrandName(tenantName || workspaceName || "UabIndia ERP");
      setBrandLogoUrl(null);
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
      notifySuccess("Workspace refreshed.");
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

  const markAllNotificationsAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      notifySuccess("All notifications marked as read.");
    } catch {
      // Intentionally silent.
    }
  };

  const formatRoleLabel = (r: string) => {
    if (!r) return "User";
    return r.split(/[-_]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <header className="erp-shell-topbar sticky top-0 z-50 h-[var(--erp-topbar-height)] w-full border-b border-slate-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md">
      <div className="flex h-[var(--erp-topbar-height)] w-full items-center px-4 py-2">
        <div className="flex w-full min-w-0 items-center gap-1.5">
          <Link
            href={ROUTES.DASHBOARD}
            className="flex min-w-0 flex-[0_1_auto] items-center gap-1 pr-1"
          >
            <span className="inline-flex shrink-0 items-center justify-center overflow-hidden">
              {displayBrandLogoUrl ? (
                <Image src={displayBrandLogoUrl} alt={displayBrandName} width={112} height={40} className="h-8 w-auto object-contain" unoptimized />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <BadgeInfo className="h-4.5 w-4.5" />
                </span>
              )}
            </span>
          </Link>

          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden min-w-0 max-w-[8rem] items-center gap-2 rounded-xl border border-transparent px-1 py-1 2xl:flex">
            <p className="truncate text-[0.8rem] font-semibold text-slate-500 dark:text-slate-400">{breadcrumbLabel}</p>
          </div>

          <button
            type="button"
            onClick={onSearchOpen}
            className="hidden h-10 min-w-[6.5rem] max-w-[9rem] flex-[0.42] items-center gap-2 rounded-[0.75rem] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-2.5 py-2 text-left text-[0.78rem] text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800 xl:flex"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate">Search...</span>
            <span className="ml-auto inline-flex h-6 shrink-0 items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="leading-none">Ctrl</span>
              <span className="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" />
              <span className="leading-none">K</span>
            </span>
          </button>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-[var(--erp-radius-control)] border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1 shadow-sm md:flex">
              <div ref={companyMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => (current === "company" ? null : "company"))}
                  className={`${contextButtonClass} min-w-[7.75rem]`}
                  aria-expanded={menuOpen === "company"}
                >
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
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
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
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
                  className={`${contextButtonClass} min-w-[7.75rem]`}
                  aria-expanded={menuOpen === "project"}
                >
                  <FolderTree className="h-3.5 w-3.5 text-indigo-600" />
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
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
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
                  className={`${contextButtonClass} min-w-[7.25rem]`}
                  aria-expanded={menuOpen === "financialYear"}
                >
                  <CalendarRange className="h-3.5 w-3.5 text-indigo-600" />
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
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
                          No financial years configured.
                        </div>
                      )}
                    </MenuList>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={onSearchOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
              aria-label="Open search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            {/* Version Badge */}
            <span className="hidden rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 xl:inline-flex">
              <BadgeInfo className="mr-1.5 h-3.5 w-3.5" />
              {formatVersionLabel(appVersion)}
            </span>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
                refreshing && "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/50"
              )}
              title="Refresh workspace data"
            >
              <ArcLoader
                size="sm"
                label={refreshing ? "Refreshing workspace" : "Refresh workspace"}
                className={cn("transition-transform", refreshing ? "scale-110 opacity-100" : "opacity-80")}
              />
            </button>

            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle dark/light theme"
              title="Toggle theme mode"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
            </button>

            {/* Notifications Bell & Dropdown */}
            <div ref={notificationsMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "notifications" ? null : "notifications"))}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Notifications"
                aria-expanded={menuOpen === "notifications"}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white shadow-sm">
                    {Math.min(unreadCount, 99)}
                  </span>
                ) : null}
              </button>

              {menuOpen === "notifications" ? (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(26rem,92vw)] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/97 dark:bg-slate-900/97 dark:border-slate-800 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <MenuList
                    title="Notifications"
                    subtitle={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} approvals waiting | ${unreadCount} unread` : `${unreadCount} unread updates`}
                    action={
                      unreadCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => void markAllNotificationsAsRead()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      ) : undefined
                    }
                  >
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => void markNotificationAsRead(notification.id)}
                          className={cn(
                            "w-full rounded-xl px-3 py-3 text-left transition border-b border-slate-100 dark:border-slate-800/60 last:border-0",
                            notification.isRead ? "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50" : "bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-900 dark:text-slate-100 hover:bg-indigo-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold">{notification.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.message}</p>
                            </div>
                            {!notification.isRead ? (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            {notification.type || notification.status || "Workspace"} • {toShortDateTime(notification.createdAt)}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    )}
                  </MenuList>
                </div>
              ) : null}
            </div>

            {/* Profile Avatar & Dropdown Menu */}
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => (current === "profile" ? null : "profile"))}
                className="inline-flex h-10 items-center gap-2 rounded-[1rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-[0.8rem] font-medium text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Profile"
                aria-expanded={menuOpen === "profile"}
              >
                {userAvatarUrl ? (
                  <Image src={userAvatarUrl} alt={userName} width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900" unoptimized />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow-sm">
                    {userInitials}
                  </span>
                )}
                <span className="hidden max-w-[9rem] truncate font-semibold text-slate-900 dark:text-slate-100 lg:block">{userName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {menuOpen === "profile" ? (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(22rem,90vw)] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/97 dark:bg-slate-900/97 dark:border-slate-800 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  {/* User Info Header Card */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-slate-50/50 to-white dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {userAvatarUrl ? (
                        <Image src={userAvatarUrl} alt={userName} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/20" unoptimized />
                      ) : (
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-extrabold text-white shadow-md">
                          {userInitials}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{userName}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || "User"}</p>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                          <Shield className="h-2.5 w-2.5 text-indigo-600" />
                          {formatRoleLabel(role)}
                        </div>
                      </div>
                    </div>

                    {/* Workspace Context Badge */}
                    <div className="mt-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 p-2.5 text-xs space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace Context</span>
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{contextTitle}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{currentCompanyLabel}</p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="p-2 space-y-1">
                    <MenuActionLink
                      href={ROUTES.ADMINISTRATION_PROFILE}
                      label="Profile Settings"
                      note="Manage account info & preferences"
                      icon={User}
                    />
                    <MenuActionLink
                      href={ROUTES.ADMINISTRATION_SECURITY}
                      label="Security & MFA"
                      note="Password, sessions & security logs"
                      icon={Shield}
                    />
                    <MenuActionLink
                      href={ROUTES.HELPDESK_FAQ}
                      label="Help & Documentation"
                      note="ERP guides & support ticket desk"
                      icon={HelpCircle}
                    />
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(null);
                        onLogout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-[0.99]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out of workspace
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
