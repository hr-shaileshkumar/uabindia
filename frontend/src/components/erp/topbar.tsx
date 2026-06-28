"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, Building2, CalendarRange, Moon, Search, Sun, UserCircle2 } from "lucide-react";
import type { ERPRole } from "@/lib/erp/types";
import { getPortalTheme } from "@/lib/erp/portals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ERPTopbar({
  role,
  userName,
  tenantName,
  workspaceName,
  financialYearLabel,
  onMenuClick,
  onLogout,
}: {
  role: ERPRole;
  userName: string;
  tenantName?: string;
  workspaceName?: string;
  financialYearLabel?: string;
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const portal = getPortalTheme(role);
  const isOwnerPortal = portal.id === "platform_owner";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("erp.theme");
    const nextTheme = stored === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("erp.theme", nextTheme);
  };

  const resolvedTenantName = tenantName || "Tenant workspace";
  const resolvedWorkspaceName = workspaceName || "Default workspace";
  const resolvedFinancialYear = financialYearLabel || "FY 2026-27";

  return (
    <header className={cn("sticky top-0 z-40 border-b backdrop-blur-xl", portal.topbarClassName)}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <Button variant="outline" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <span className="sr-only">Open menu</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </Button>

        <div className="relative min-w-[16rem] flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              isOwnerPortal ? "text-slate-500" : "text-slate-400"
            )}
          />
          <input
            className={cn(
              "erp-input h-11 rounded-2xl pl-10",
              isOwnerPortal
                ? "border-violet-900/40 bg-[#111827] text-slate-100 placeholder:text-slate-500"
                : "border-slate-200 bg-slate-50 text-slate-900"
            )}
            placeholder="Search modules, records, reports, tickets, and workspace actions..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              "hidden items-center gap-2 rounded-2xl border px-3 py-2 text-sm lg:flex",
              isOwnerPortal ? "border-violet-900/30 text-slate-300" : "border-slate-200 text-slate-600"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>{resolvedTenantName}</span>
          </div>
          <div
            className={cn(
              "hidden items-center gap-2 rounded-2xl border px-3 py-2 text-sm xl:flex",
              isOwnerPortal ? "border-violet-900/30 text-slate-300" : "border-slate-200 text-slate-600"
            )}
          >
            <BriefcaseBusiness className="h-4 w-4" />
            <span>{resolvedWorkspaceName}</span>
          </div>
          <div
            className={cn(
              "hidden items-center gap-2 rounded-2xl border px-3 py-2 text-sm lg:flex",
              isOwnerPortal ? "border-violet-900/30 text-slate-300" : "border-slate-200 text-slate-600"
            )}
          >
            <CalendarRange className="h-4 w-4" />
            <span>{resolvedFinancialYear}</span>
          </div>

          <span className={cn("hidden rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] sm:inline-flex", portal.badgeClassName)}>
            Shared workspace
          </span>

          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="outline" size="icon">
            <Link href="/erp/notifications" aria-label="Open notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon">
            <Link href="/erp/profile" aria-label="Open profile">
              <UserCircle2 className="h-4 w-4" />
            </Link>
          </Button>
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-3 py-2",
              isOwnerPortal ? "border-violet-900/30 bg-[#111827]" : "border-slate-200 bg-white"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold text-white",
                isOwnerPortal ? "bg-violet-600" : portal.id === "ess" ? "bg-emerald-700" : "bg-slate-950"
              )}
            >
              {userName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className={cn("text-sm font-semibold", isOwnerPortal ? "text-white" : "text-slate-900")}>{userName}</p>
              <p className={cn("text-xs uppercase tracking-[0.16em]", isOwnerPortal ? "text-slate-400" : "text-slate-400")}>
                Authenticated workspace
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
