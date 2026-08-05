"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  X,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useAuth } from "@/context/AuthContext";
import { buildWorkspaceModules } from "@/lib/erp/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import type { WorkspaceModule } from "@/lib/erp/navigation";

/** Platform admin module keys — shown in top section with violet accent */
const PLATFORM_MODULE_KEYS = new Set(["platform", "superadmin", "licensing", "security"]);

/** Tooltip for collapsed icon-only mode */
function SidebarTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#1e2235] px-3 py-1.5 text-xs font-semibold text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
      {label}
    </span>
  );
}

/** Section divider label shown between platform and business modules */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pb-1 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
        {label}
      </p>
    </div>
  );
}

type SidebarNavItemProps = {
  mod: WorkspaceModule;
  isCollapsed: boolean;
  pathname: string;
  isPlatformMod: boolean;
};

function SidebarNavItem({ mod, isCollapsed, pathname, isPlatformMod }: SidebarNavItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = mod.groups.some((g) => g.items.length > 0);
  const isModActive = mod.homeHref
    ? pathname === mod.homeHref || pathname.startsWith(mod.homeHref + "/")
    : mod.groups.some((g) => g.items.some((item) => pathname.startsWith(item.path)));

  // Auto-expand when a sub-item is active
  useEffect(() => {
    if (isModActive && hasChildren) setExpanded(true);
  }, [isModActive, hasChildren]);

  const accentColor = isPlatformMod ? "var(--portal-platform-accent)" : "var(--sidebar-active-border)";
  const accentBg = isPlatformMod ? "var(--portal-platform-accent-muted)" : "var(--sidebar-active-bg)";

  return (
    <li className="list-none">
      {!hasChildren ? (
        <Link
          href={mod.homeHref || "#"}
          className={cn(
            "group relative flex items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
            isModActive
              ? "text-white"
              : "text-slate-400 hover:text-slate-200"
          )}
          style={isModActive ? { background: accentBg } : undefined}
        >
          {/* Active left bar */}
          {isModActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
              style={{ background: accentColor }}
            />
          )}
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
            )}
            style={
              isModActive
                ? { background: accentBg, color: accentColor }
                : undefined
            }
          >
            <ModuleIcon name={mod.icon as string} className="h-4 w-4 shrink-0" />
          </span>
          {!isCollapsed && <span className="flex-1 truncate">{mod.label}</span>}
          {isCollapsed && <SidebarTooltip label={mod.label} />}
        </Link>
      ) : (
        <div>
          <button
            onClick={() => isCollapsed ? undefined : setExpanded((v) => !v)}
            className={cn(
              "group relative flex w-full items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
              isModActive
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            )}
            style={isModActive && !expanded ? { background: accentBg } : undefined}
          >
            {isModActive && !expanded && (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                style={{ background: accentColor }}
              />
            )}
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
              style={
                isModActive
                  ? { background: accentBg, color: accentColor }
                  : { color: "inherit" }
              }
            >
              <ModuleIcon name={mod.icon as string} className="h-4 w-4 shrink-0" />
            </span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate">{mod.label}</span>
                <motion.span
                  animate={{ rotate: expanded ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="shrink-0 text-slate-500"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </motion.span>
              </>
            )}
            {isCollapsed && <SidebarTooltip label={mod.label} />}
          </button>

          <AnimatePresence initial={false}>
            {!isCollapsed && expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {mod.groups.map((group) => (
                  <div key={group.label} className="mt-0.5 ml-3.5 border-l border-white/10 pl-3">
                    {/* Group label if there are multiple groups */}
                    {mod.groups.length > 1 && (
                      <p className="mt-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none px-1">
                        {group.label}
                      </p>
                    )}
                    <ul className="space-y-0.5 py-1">
                      {group.items.map((item) => {
                        const isItemActive = pathname === item.path || pathname.startsWith(item.path + "/");
                        return (
                          <li key={item.key}>
                            <Link
                              href={item.path}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors",
                                isItemActive
                                  ? "font-semibold text-white"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                              )}
                              style={isItemActive ? { color: accentColor } : undefined}
                            >
                              {isItemActive && (
                                <span
                                  className="h-1.5 w-1.5 rounded-full shrink-0"
                                  style={{ background: accentColor }}
                                />
                              )}
                              {!isItemActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-slate-600" />}
                              <span className="truncate">{item.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </li>
  );
}

/** Bottom user profile pill in the sidebar */
function SidebarUserProfile({ isCollapsed }: { isCollapsed: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logout?.();
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/5",
          isCollapsed && "justify-center"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white ring-2 ring-white/10">
          {initials}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-[12.5px] font-semibold text-slate-200 leading-tight">
                {user?.fullName || "User"}
              </p>
              <p className="truncate text-[11px] text-slate-500 leading-tight">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          </>
        )}
        {isCollapsed && <SidebarTooltip label={user?.fullName || user?.email || "Profile"} />}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full mb-2 left-0 w-56 rounded-xl border border-white/10 bg-[#161929] shadow-2xl shadow-black/40 z-50 overflow-hidden",
              isCollapsed && "left-14"
            )}
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-[12px] font-semibold text-slate-200 truncate">{user?.fullName || "User"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-[12.5px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                My Profile
              </Link>
              <Link
                href="/platform/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-[12.5px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </Link>
            </div>
            <div className="py-1 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-[12.5px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const isCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);

  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const dynamicModules = buildWorkspaceModules(schemaNav.modules, enabledModules);

  // Separate platform admin modules from business modules
  const platformModules = dynamicModules.filter((m) => PLATFORM_MODULE_KEYS.has(m.key));
  const businessModules = dynamicModules.filter((m) => !PLATFORM_MODULE_KEYS.has(m.key));
  const hasBoth = platformModules.length > 0 && businessModules.length > 0;

  const navContent = (
    <nav className="flex flex-1 flex-col overflow-y-auto py-3 px-2 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
      <ul role="list" className="flex flex-1 flex-col gap-y-0.5">

        {/* Platform admin section */}
        {platformModules.length > 0 && (
          <>
            {!isCollapsed && hasBoth && <SectionLabel label="Platform Admin" />}
            {platformModules.map((mod) => (
              <SidebarNavItem
                key={mod.key}
                mod={mod}
                isCollapsed={isCollapsed}
                pathname={pathname}
                isPlatformMod
              />
            ))}
          </>
        )}

        {/* Divider between sections */}
        {hasBoth && !isCollapsed && (
          <li className="my-2 border-t border-white/[0.06]" />
        )}
        {hasBoth && isCollapsed && <li className="my-1 mx-1 border-t border-white/[0.06]" />}

        {/* Business modules section */}
        {businessModules.length > 0 && (
          <>
            {!isCollapsed && hasBoth && <SectionLabel label="Workspace" />}
            {businessModules.map((mod) => (
              <SidebarNavItem
                key={mod.key}
                mod={mod}
                isCollapsed={isCollapsed}
                pathname={pathname}
                isPlatformMod={false}
              />
            ))}
          </>
        )}
      </ul>
    </nav>
  );

  const sidebarClasses = "flex flex-col bg-sidebar border-r border-sidebar-border";
  const desktopWidth = isCollapsed
    ? "w-[var(--erp-sidebar-collapsed-width)]"
    : "w-[var(--erp-sidebar-width)]";

  const userProfileSection = (
    <div className="border-t border-white/[0.06] px-2 py-2">
      <SidebarUserProfile isCollapsed={isCollapsed} />
    </div>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn("fixed inset-y-0 left-0 z-50 flex flex-col w-[var(--erp-sidebar-width)] lg:hidden", sidebarClasses)}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
              <span className="text-sm font-bold text-slate-200 tracking-tight">Navigation</span>
              <button
                onClick={onMobileClose}
                aria-label="Close sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              {navContent}
            </div>
            {userProfileSection}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
          sidebarClasses,
          desktopWidth
        )}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          {navContent}
        </div>
        {userProfileSection}
      </div>
    </>
  );
}
