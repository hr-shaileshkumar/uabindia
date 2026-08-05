"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell,
  Moon,
  Search,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Settings,
  LogOut,
  Plus,
  Building2,
  Users,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { useNavigationStore } from "@/store/navigationStore";
import { useUiSchema } from "@/context/UiSchemaContext";
import { buildWorkspaceModules, findWorkspaceModuleByPath } from "@/lib/erp/navigation";
import { cn } from "@/lib/utils";

type HeaderProps = {
  onMenuClick?: () => void;
};

/** Active Context Pill (Company / Project) */
function OrgContextPill() {
  const { companyName, projectName } = useOrgContext();
  const displayName = companyName || projectName || "Platform Workspace";

  return (
    <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300">
      <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
      <span className="truncate max-w-[120px]">{displayName}</span>
    </div>
  );
}

/** Quick Action Creation Dropdown (+ New Action in Zoho / SAP) */
function QuickActionDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const quickItems = [
    { label: "Provision Tenant", href: "/platform/tenants/create", icon: Layers, desc: "Add new SaaS tenant" },
    { label: "Create User", href: "/platform/users", icon: Users, desc: "Create system user" },
    { label: "Manage Roles", href: "/platform/roles", icon: Shield, desc: "Role & permissions" },
    { label: "Website Pages", href: "/platform/website/pages", icon: Sparkles, desc: "Manage CMS pages" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
        title="Quick Action"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden py-1"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Actions</p>
            </div>
            {quickItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Breadcrumb generated from current pathname + workspace module label */
function ActiveBreadcrumb() {
  const pathname = usePathname();
  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const dynamicModules = buildWorkspaceModules(schemaNav.modules, enabledModules);
  const matched = findWorkspaceModuleByPath(dynamicModules, pathname);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg) => {
    return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-semibold min-w-0">
      {matched && (
        <>
          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[7rem]">{matched.label}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        </>
      )}
      <span className="text-slate-900 dark:text-slate-100 truncate max-w-[9rem]">
        {crumbs[crumbs.length - 1]}
      </span>
    </nav>
  );
}

/** Profile dropdown in the topbar */
function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
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
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Open user menu"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white ring-2 ring-indigo-500/20">
          {initials}
        </div>
        <span className="hidden lg:block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
          {user?.fullName || user?.email || "User"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.fullName || "User"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>

            {/* Navigation links */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                  <Users className="h-3.5 w-3.5" />
                </div>
                My Profile
              </Link>
              <Link
                href="/platform/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Settings className="h-3.5 w-3.5" />
                </div>
                Settings
              </Link>
            </div>

            {/* Theme toggle */}
            {mounted && (
              <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {theme === "dark" ? (
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </div>
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            )}

            {/* Sign out */}
            <div className="py-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Notification bell with badge */
function NotificationBell() {
  return (
    <Link
      href="/platform/notification-templates"
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
    </Link>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  const isSidebarCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useNavigationStore((state) => state.toggleSidebar);
  const setSearchOpen = useNavigationStore((state) => state.setSearchOpen);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex shrink-0 items-center gap-x-3 border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs",
        "h-[var(--erp-topbar-height)] px-3 sm:px-4"
      )}
    >
      {/* ─── Left: Brand Logo + Sidebar Toggle ──────────────────────────── */}
      <div className="flex shrink-0 items-center gap-x-2">
        <Link href="/context" className="flex items-center">
          <Image
            src="/logo.png"
            alt="ERP Logo"
            width={96}
            height={24}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
        <button
          onClick={onMenuClick ?? toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {/* ─── Divider ──────────────────────────────────────────────────── */}
      <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

      {/* ─── Active Context & Breadcrumb ──────────────────────────────── */}
      <ActiveBreadcrumb />

      {/* ─── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ─── Center: Command Search Bar ───────────────────────────────── */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-full max-w-[20rem] items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-400 dark:text-slate-500 shadow-2xs transition-colors hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 focus:outline-none"
      >
        <Search className="h-3.5 w-3.5 shrink-0 opacity-60 text-indigo-500" />
        <span className="truncate">Search modules, actions & records...</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          ⌘K
        </span>
      </button>

      {/* ─── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ─── Right: Actions & User Controls ───────────────────────────── */}
      <div className="flex items-center gap-2">
        <OrgContextPill />
        <QuickActionDropdown />
        <NotificationBell />
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" aria-hidden="true" />
        <ProfileDropdown />
      </div>
    </header>
  );
}
