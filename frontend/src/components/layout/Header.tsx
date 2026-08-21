"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  Sun,
  UserRound,
  Users,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { useNavigationStore } from "@/store/navigationStore";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  findWorkspaceModuleByPath,
  findWorkspacePageByPath,
} from "@/lib/erp/navigation";
import { OrgContextSwitcher } from "@/components/layout/OrgContextSwitcher";
import { WorkspaceBrand } from "@/components/layout/WorkspaceBrand";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { appApi } from "@/services/modules";

type HeaderProps = {
  onMenuClick?: () => void;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, ref]);
}

function ActiveBreadcrumb() {
  const pathname = usePathname();
  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const modules = buildWorkspaceModules(schemaNav.modules, enabledModules);
  const page = findWorkspacePageByPath(modules, pathname);
  const matched = page?.module ?? findWorkspaceModuleByPath(modules, pathname);

  if (pathname === ROUTES.DASHBOARD) {
    return (
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs font-medium md:flex">
        <span className="truncate text-slate-900">Dashboard</span>
      </nav>
    );
  }

  const crumb = page?.item.name
    ?? pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  if (!crumb) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500 md:flex">
      {matched ? (
        <>
          <Link href={matched.homeHref || ROUTES.DASHBOARD} className="max-w-[8rem] truncate hover:text-slate-800">
            {matched.label}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
        </>
      ) : null}
      <span className="max-w-[12rem] truncate text-slate-900">{crumb}</span>
    </nav>
  );
}

function NotificationBell() {
  const { user, loading } = useAuth();
  const { companyId, projectId, financialYearKey } = useOrgContext();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const load = async () => {
    try {
      const [unreadResult, listResult] = await Promise.allSettled([
        appApi.notifications.unreadCount({ suppressGlobalError: true }),
        appApi.notifications.listMine({ take: 8 }, { suppressGlobalError: true }),
      ]);

      if (unreadResult.status === "fulfilled") {
        const value = unreadResult.value.data as { unread?: number } | number;
        setUnreadCount(typeof value === "number" ? value : Number(value?.unread ?? 0));
      }

      if (listResult.status === "fulfilled") {
        const payload = listResult.value.data as { items?: NotificationRow[] } | NotificationRow[];
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
        setItems(
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Notification",
            message: row.message || "",
            isRead: Boolean(row.isRead),
            createdAt: row.createdAt,
          })),
        );
      }
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (loading || !user) {
      setUnreadCount(0);
      setItems([]);
      return;
    }

    void load();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, [loading, user, companyId, projectId, financialYearKey]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open && user) void load();
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
            {Math.min(unreadCount, 99)}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,92vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Notifications</p>
              <Link
                href={ROUTES.NOTIFICATIONS}
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications yet.</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void appApi.notifications.markRead(item.id, { suppressGlobalError: true });
                      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)));
                      setUnreadCount((count) => Math.max(0, count - (item.isRead ? 0 : 1)));
                    }}
                    className={cn(
                      "flex w-full flex-col gap-0.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-0",
                      item.isRead ? "hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/70",
                    )}
                  >
                    <span className="truncate text-xs font-semibold text-slate-900">{item.title}</span>
                    {item.message ? (
                      <span className="line-clamp-2 text-[11px] leading-4 text-slate-500">{item.message}</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => setMounted(true), []);

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    await logout?.();
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-md p-0.5 text-sm transition hover:bg-slate-100"
        aria-label="Open user menu"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
          {initials}
        </div>
        <span className="hidden max-w-[110px] truncate text-xs font-semibold text-slate-800 xl:block">
          {user?.fullName || user?.email || "User"}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-xs font-semibold text-slate-900">{user?.fullName || "User"}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </div>
            <div className="py-1">
              <Link
                href={ROUTES.ADMINISTRATION_PROFILE}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserRound className="h-3.5 w-3.5 text-slate-500" />
                My profile
              </Link>
              <Link
                href={ROUTES.ESS_HOME}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Users className="h-3.5 w-3.5 text-slate-500" />
                Self-service
              </Link>
              <Link
                href={ROUTES.SECURITY_HOME}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Shield className="h-3.5 w-3.5 text-slate-500" />
                Security
              </Link>
              <Link
                href={ROUTES.PLATFORM_SETTINGS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500" />
                Workspace settings
              </Link>
            </div>
            {mounted ? (
              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-slate-500" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
              </div>
            ) : null}
            <div className="border-t border-slate-100 py-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  const isSidebarCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useNavigationStore((state) => state.toggleSidebar);
  const setSearchOpen = useNavigationStore((state) => state.setSearchOpen);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex shrink-0 items-center gap-x-3 overflow-visible border-b border-slate-200 bg-white/95 backdrop-blur",
        "h-[var(--erp-topbar-height)] px-3 sm:px-4",
      )}
    >
      <div className="flex shrink-0 items-center gap-x-2">
        <WorkspaceBrand />
        <button
          type="button"
          onClick={onMenuClick ?? toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />
      <ActiveBreadcrumb />

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto hidden h-8 min-w-[10rem] max-w-[18rem] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-white focus:outline-none xl:flex"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">Search modules and records…</span>
        <span className="ml-auto flex shrink-0 items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          Ctrl K
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 xl:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <OrgContextSwitcher />
        <NotificationBell />
        <div className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden="true" />
        <ProfileDropdown />
      </div>
    </header>
  );
}
