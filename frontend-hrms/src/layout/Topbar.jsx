import React, { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  Plus,
  Headphones,
  Moon,
  Sun,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  Building2,
  LogOut,
  UserCheck,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Breadcrumbs from "../components/common/Breadcrumbs";

export const Topbar = ({
  onMobileMenuToggle,
  onOpenCommandPalette,
  onOpenQuickAction,
}) => {
  const { user, logout, switchPersona, demoPersonas } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const notifications = [
    {
      id: "nt-1",
      title: "Biometric Gateway Synchronized",
      desc: "Gate #01 & Gate #04 ingested 184 punches cleanly",
      time: "10m ago",
      icon: Clock,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "nt-2",
      title: "Leave Sanction Request",
      desc: "Vikramaditya Singh requested 2 days Casual Leave",
      time: "35m ago",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "nt-3",
      title: "Statutory PF/ESI Filing",
      desc: "November attendance muster roll ready for sign-off",
      time: "2h ago",
      icon: ShieldCheck,
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Left: Mobile Toggle & Quick Search Bar */}
      <div className="flex items-center gap-2.5 flex-1 max-w-xl">
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Global Search Bar with Ctrl+K shortcut */}
        <div
          onClick={onOpenCommandPalette}
          className="w-full max-w-sm hidden sm:flex items-center justify-between px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 text-xs cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-slate-400 text-[11px] font-normal">
              Search staff, attendance, policies (⌘K)...
            </span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Mobile search icon */}
        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Live Biometric Gateway Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Biometric Gateway: Live</span>
        </div>
      </div>

      {/* Right Area: Utility Icons, Notifications, User profile card */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs shadow-blue-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Action</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications & Alerts</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="p-2.5 hover:bg-slate-50/80 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-lg ${n.color} shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 leading-snug">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {n.desc}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-800 leading-none">
                {user?.fullName || "HR Administrator"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
                {user?.roleTitle || "Uabindia Enterprise"}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">{user?.fullName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{user?.email}</div>
                <div className="mt-1 inline-block px-1.5 py-0.5 text-[9.5px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {user?.role}
                </div>
              </div>

              {/* Persona Switcher for Evaluation */}
              <div className="py-1 border-b border-slate-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Role Persona
                </div>
                {demoPersonas?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchPersona(p.id);
                      setProfileOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user?.id === p.id ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"
                    }`}
                  >
                    <span>{p.fullName}</span>
                    <span className="text-[10px] text-slate-400">{p.role}</span>
                  </button>
                ))}
              </div>

              <div className="py-1">
                <button
                  onClick={logout}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
