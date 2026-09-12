"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sun,
  UserRound,
  Users,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNavigationStore } from "@/store/navigationStore";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  findWorkspaceModuleByPath,
  findWorkspacePageByPath,
} from "@/lib/workspace/navigation";
import { OrgContextSwitcher } from "@/components/layout/OrgContextSwitcher";
import { TenantSubdomainSwitcher } from "@/components/layout/TenantSubdomainSwitcher";
import { WorkspaceBrand } from "@/components/layout/WorkspaceBrand";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useSignalRNotifications } from "@/context/SignalRNotificationContext";
import { SecurityMfaModal } from "@/features/administration/components/SecurityMfaModal";

type HeaderProps = {
  onMenuClick?: () => void;
};

function GlobalRefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
      title="Refresh workspace data"
      aria-label="Refresh workspace"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <RefreshCw className={cn("h-3.5 w-3.5 transition-transform", refreshing && "animate-spin text-blue-600 dark:text-blue-400")} />
    </button>
  );
}

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
  const pathname = usePathname() || "";
  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const modules = buildWorkspaceModules(schemaNav.modules, enabledModules);
  const page = findWorkspacePageByPath(modules, pathname);
  const matched = page?.module ?? findWorkspaceModuleByPath(modules, pathname);

  if (pathname === ROUTES.DASHBOARD) {
    return (
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 sm:flex">
        <span>Dashboard</span>
      </nav>
    );
  }

  const rawCrumb = page?.item.name
    ?? pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  if (!rawCrumb) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:flex">
      <Link href={ROUTES.DASHBOARD} className="text-slate-400 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200">
        Home
      </Link>
      <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
      {matched && matched.homeHref !== pathname ? (
        <>
          <Link href={matched.homeHref || ROUTES.DASHBOARD} className="max-w-[8rem] truncate hover:text-slate-800 transition-colors dark:hover:text-slate-200">
            {matched.label}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
        </>
      ) : null}
      <span className="max-w-[14rem] truncate font-semibold text-slate-900 dark:text-slate-100">{rawCrumb}</span>
    </nav>
  );
}

function NotificationBell() {
  const {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useSignalRNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "approvals">("all");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const filteredItems = notifications.filter((item) => {
    if (filter === "unread") return !item.isRead;
    if (filter === "approvals") return item.type?.toLowerCase().includes("approval") || item.type?.toLowerCase().includes("workflow");
    return true;
  });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void refreshNotifications();
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Real-time Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-xs">
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
            className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,94vw)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Live Notifications</p>
                <span
                  title={connectionState === "connected" ? "Real-time Connected" : "Connecting..."}
                  className={`inline-block h-2 w-2 rounded-full ${
                    connectionState === "connected"
                      ? "bg-emerald-500 shadow-xs"
                      : "bg-amber-400 animate-pulse"
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  href={ROUTES.NOTIFICATIONS}
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  View all
                </Link>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 border-b border-slate-100 bg-slate-50/60 p-1.5 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-2.5 py-1 ${
                  filter === "all"
                    ? "bg-white text-blue-600 shadow-2xs font-bold dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`rounded-lg px-2.5 py-1 ${
                  filter === "unread"
                    ? "bg-white text-blue-600 shadow-2xs font-bold dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("approvals")}
                className={`rounded-lg px-2.5 py-1 ${
                  filter === "approvals"
                    ? "bg-white text-blue-600 shadow-2xs font-bold dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Approvals
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications in this filter.</p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void markAsRead(item.id);
                    }}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
                      item.isRead
                        ? "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        : "bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>
                    {item.message ? (
                      <span className="line-clamp-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.message}
                      </span>
                    ) : null}
                    {item.createdAt && (
                      <span className="font-mono text-[9px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
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
  const [mfaOpen, setMfaOpen] = useState(false);
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
        className="flex items-center gap-2 rounded-lg p-1 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Open user menu"
      >
        <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-blue-600 text-[11px] font-bold text-white shadow-2xs">
          {initials}
        </div>
        <span className="hidden max-w-[110px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200 xl:block">
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
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{user?.fullName || "User"}</p>
              <p className="truncate text-[11px] text-slate-500 font-mono">{user?.email}</p>
            </div>
            <div className="py-1">
              <Link
                href={ROUTES.ADMINISTRATION_PROFILE}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <UserRound className="h-3.5 w-3.5 text-slate-500" />
                <span>My Profile</span>
              </Link>
              <Link
                href={ROUTES.ESS_HOME}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>Self-Service (ESS)</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMfaOpen(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>2FA & SSO Security</span>
              </button>
              <Link
                href={ROUTES.PLATFORM_SETTINGS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>Workspace Settings</span>
              </Link>
            </div>
            {mounted ? (
              <div className="border-t border-slate-100 py-1 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-slate-500" />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
            ) : null}
            <div className="border-t border-slate-100 py-1 dark:border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SecurityMfaModal open={mfaOpen} onOpenChange={setMfaOpen} />
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
        "sticky top-0 z-40 flex shrink-0 items-center justify-between gap-x-3 overflow-visible border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95",
        "h-14 px-3 sm:px-4 lg:px-5",
      )}
    >
      {/* Left: Sidebar Toggle, Workspace Brand (Tenant Logo / Default) & Breadcrumb */}
      <div className="flex shrink-0 items-center gap-x-2.5 min-w-0">
        <button
          type="button"
          onClick={onMenuClick ?? toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <WorkspaceBrand />

        <div className="hidden h-4 w-px bg-slate-200 dark:bg-slate-800 sm:block" aria-hidden="true" />
        <ActiveBreadcrumb />
      </div>

      {/* Center: Command Palette Search */}
      <div className="flex flex-1 justify-center max-w-md mx-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-2xs focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 md:flex"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="truncate">Search modules, records & actions…</span>
          <kbd className="ml-auto inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Right Utility Cluster */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <TenantSubdomainSwitcher />
        <OrgContextSwitcher />
        <GlobalRefreshButton />
        <NotificationBell />
        <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" aria-hidden="true" />
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default Header;
