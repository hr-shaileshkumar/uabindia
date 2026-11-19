import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Search,
  LogOut,
  ChevronLeft,
  Users,
} from "lucide-react";
import {
  NAVIGATION_SECTIONS,
  resolveNavIcon,
} from "../metadata/navigation";
import { useAuth } from "../context/AuthContext";
import hrmsService from "../services/hrmsService";

export const Sidebar = ({
  isMobileOpen,
  onMobileClose,
  onOpenCommandPalette,
  isSidebarCompact: controlledCompact,
  onToggleCompact,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [internalCompact, setInternalCompact] = useState(false);
  const isSidebarCompact = controlledCompact !== undefined ? controlledCompact : internalCompact;
  const toggleCompact = onToggleCompact || (() => setInternalCompact((prev) => !prev));

  const [collapsedSections, setCollapsedSections] = useState({});
  const [navSections, setNavSections] = useState(NAVIGATION_SECTIONS);

  // Fetch dynamic HRMS module & submodule schema directly from database API
  useEffect(() => {
    let isMounted = true;

    const loadDatabaseNavigation = async () => {
      try {
        const hrmsData = await hrmsService.getHrmsNavigation();
        if (!isMounted || !hrmsData) return;

        // If returned rich groups from /api/v1/ui-shell/navigation
        if (Array.isArray(hrmsData.groups) && hrmsData.groups.length > 0) {
          const dynamicSections = [];

          // Retain Executive Overview at the top
          const overviewSection = NAVIGATION_SECTIONS.find((s) => s.id === "overview");
          if (overviewSection) {
            dynamicSections.push(overviewSection);
          }

          hrmsData.groups.forEach((group, index) => {
            if (!group.items || group.items.length === 0) return;

            dynamicSections.push({
              id: `db-hrms-${index}`,
              title: group.label || "HRMS Section",
              items: group.items.map((item) => ({
                id: item.key || item.path,
                title: item.name,
                path: item.path?.startsWith("/hrms/")
                  ? item.path.replace(/^\/hrms/, "") || "/dashboard"
                  : item.path || "/dashboard",
                icon: resolveNavIcon(item.icon),
                pageKey: item.key,
              })),
            });
          });

          if (dynamicSections.length > 0) {
            setNavSections(dynamicSections);
          }
        }
      } catch (e) {
        // Fallback safely to canonical database-aligned NAVIGATION_SECTIONS
      }
    };

    loadDatabaseNavigation();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/80 flex flex-col transition-all duration-200 ${
          isSidebarCompact ? "w-16" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand / Logo Header: Uabindia HRMS Enterprise */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Uabindia Sapphire Monogram */}
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-2xs shadow-blue-500/30 shrink-0">
              U
            </div>
            {!isSidebarCompact && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[13px] text-slate-900 tracking-tight">
                    UABINDIA
                  </span>
                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 uppercase">
                    HRMS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  Enterprise Client Suite
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleCompact}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title={isSidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={`w-3.5 h-3.5 transition-transform ${
                isSidebarCompact ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Quick Search Trigger */}
        {!isSidebarCompact && (
          <div className="px-3 pt-2.5 pb-1">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200/70 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-slate-400 text-[11px]">Quick search...</span>
              </span>
              <kbd className="px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Categories & Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3 sidebar-nav-scroll">
          {navSections.map((section) => {
            const isCollapsed = collapsedSections[section.id];

            return (
              <div key={section.id} className="space-y-0.5">
                {/* Category Header */}
                {!isSidebarCompact && (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-700 transition-colors text-left group"
                  >
                    <span className="text-left flex-1 min-w-0 truncate">{section.title}</span>
                    <ChevronDown
                      className={`w-3 h-3 shrink-0 ml-1.5 transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90 text-slate-300" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                  </button>
                )}

                {/* Nav Links */}
                {(!isCollapsed || isSidebarCompact) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon || Users;
                      const isActive =
                        location.pathname === item.path ||
                        (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));

                      return (
                        <NavLink
                          key={item.id || item.path}
                          to={item.path}
                          onClick={onMobileClose}
                          title={item.title}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all group ${
                            isActive
                              ? "bg-blue-50/90 text-blue-700 font-semibold ring-1 ring-blue-500/20"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                          } ${isSidebarCompact ? "justify-center px-1.5" : ""}`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                              isActive
                                ? "text-blue-600"
                                : "text-slate-400 group-hover:text-slate-700 group-hover:scale-105"
                            }`}
                          />

                          {!isSidebarCompact && (
                            <span className="truncate flex-1 min-w-0 text-left">{item.title}</span>
                          )}

                          {!isSidebarCompact && item.badge && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-semibold shrink-0 ml-auto ${
                                item.badgeVariant === "emerald"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : item.badgeVariant === "amber"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Card / Footer */}
        <div className="p-2.5 border-t border-slate-100 bg-white">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 ${
              isSidebarCompact ? "justify-center p-1.5" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
              {user?.fullName?.charAt(0) || "P"}
            </div>
            {!isSidebarCompact && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {user?.fullName || "Pooja Verma"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.department || "Human Resources"}
                </div>
              </div>
            )}
            {!isSidebarCompact && (
              <button
                onClick={logout}
                title="Log out"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
