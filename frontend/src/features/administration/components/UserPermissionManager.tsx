"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  Search,
  Check,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  Download,
  Award,
  Filter,
  CheckCircle2,
  XCircle,
  Sliders,
} from "lucide-react";
import {
  permissionsApi,
  type ModuleCatalogItem,
  type PageCatalogItem,
  type UserPermissionGrantItem,
} from "@/services/modules/permissions";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type UserItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
};

// Map action keys to friendly icons and colors
const ACTION_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  view: { label: "View", icon: Eye, color: "text-blue-500 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40" },
  create: { label: "Create", icon: PlusCircle, color: "text-emerald-500 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40" },
  edit: { label: "Edit", icon: Edit3, color: "text-amber-500 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/40" },
  delete: { label: "Delete", icon: Trash2, color: "text-rose-500 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/40" },
  export: { label: "Export", icon: Download, color: "text-cyan-500 border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/40" },
  approve: { label: "Approve", icon: Award, color: "text-purple-500 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/40" },
};

export function UserPermissionManager() {
  const [catalog, setCatalog] = useState<ModuleCatalogItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Set of granted keys formatted as `${module}:${pageKey}:${action}`
  const [grantedKeys, setGrantedKeys] = useState<Set<string>>(new Set());
  const [initialKeys, setInitialKeys] = useState<Set<string>>(new Set());

  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Search & Filter
  const [userSearch, setUserSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [matrixSearch, setMatrixSearch] = useState<string>("");

  // Accordion open modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // 1. Load Catalog & Users on mount
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoadingCatalog(true);
        const catRes = await permissionsApi.getCatalog();
        setCatalog(catRes.data.catalog || []);

        // Expand first 2 modules by default
        const initialExpanded: Record<string, boolean> = {};
        catRes.data.catalog.forEach((m, idx) => {
          initialExpanded[m.key] = idx < 2;
        });
        setExpandedModules(initialExpanded);
      } catch (err) {
        notifyError("Failed to load permission catalog: " + getApiErrorMessage(err));
      } finally {
        setLoadingCatalog(false);
      }

      try {
        setLoadingUsers(true);
        const usersRes = await permissionsApi.getUsers();
        const userList = usersRes.data.users || [];
        setUsers(userList);
        if (userList.length > 0) {
          setSelectedUser(userList[0]);
        }
      } catch (err) {
        notifyError("Failed to load users: " + getApiErrorMessage(err));
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchInitial();
  }, []);

  // 2. Load Permissions whenever selected user changes
  useEffect(() => {
    if (!selectedUser) {
      setGrantedKeys(new Set());
      setInitialKeys(new Set());
      return;
    }

    const fetchUserPermissions = async () => {
      setLoadingPermissions(true);
      try {
        const res = await permissionsApi.getUserPermissions(selectedUser.id);
        const keySet = new Set<string>();
        (res.data.permissions || []).forEach((p) => {
          if (p.isGranted) {
            keySet.add(`${p.module.toLowerCase()}:${p.pageKey.toLowerCase()}:${p.action.toLowerCase()}`);
          }
        });
        setGrantedKeys(new Set(keySet));
        setInitialKeys(new Set(keySet));
      } catch (err) {
        notifyError(getApiErrorMessage(err));
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchUserPermissions();
  }, [selectedUser]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (grantedKeys.size !== initialKeys.size) return true;
    for (const key of grantedKeys) {
      if (!initialKeys.has(key)) return true;
    }
    return false;
  }, [grantedKeys, initialKeys]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase();
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const matchQuery = !q || name.includes(q) || email.includes(q);
      const matchRole = userRoleFilter === "ALL" || (u.role || "").toUpperCase() === userRoleFilter;
      return matchQuery && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  // Filtered catalog based on matrixSearch
  const filteredCatalog = useMemo(() => {
    if (!matrixSearch.trim()) return catalog;
    const q = matrixSearch.toLowerCase();

    return catalog
      .map((mod) => {
        const modMatches = mod.title.toLowerCase().includes(q) || mod.key.toLowerCase().includes(q);
        const matchingPages = mod.pages.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q) ||
            p.route.toLowerCase().includes(q) ||
            (p.subGroup && p.subGroup.toLowerCase().includes(q))
        );

        if (modMatches) return mod;
        if (matchingPages.length > 0) {
          return { ...mod, pages: matchingPages };
        }
        return null;
      })
      .filter(Boolean) as ModuleCatalogItem[];
  }, [catalog, matrixSearch]);

  // Helper functions for hierarchy checks
  const isActionGranted = (mod: string, pageKey: string, action: string) => {
    return grantedKeys.has(`${mod.toLowerCase()}:${pageKey.toLowerCase()}:${action.toLowerCase()}`);
  };

  const toggleAction = (mod: string, pageKey: string, action: string) => {
    const key = `${mod.toLowerCase()}:${pageKey.toLowerCase()}:${action.toLowerCase()}`;
    const next = new Set(grantedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      // Auto-grant view if an edit/create/delete/export action is enabled
      if (action !== "view") {
        next.add(`${mod.toLowerCase()}:${pageKey.toLowerCase()}:view`);
      }
    }
    setGrantedKeys(next);
  };

  const isPageFullyGranted = (page: PageCatalogItem, modKey: string) => {
    return page.actions.every((a) => isActionGranted(modKey, page.key, a.key));
  };

  const isPagePartiallyGranted = (page: PageCatalogItem, modKey: string) => {
    const count = page.actions.filter((a) => isActionGranted(modKey, page.key, a.key)).length;
    return count > 0 && count < page.actions.length;
  };

  const togglePage = (page: PageCatalogItem, modKey: string) => {
    const fullyGranted = isPageFullyGranted(page, modKey);
    const next = new Set(grantedKeys);

    page.actions.forEach((a) => {
      const key = `${modKey.toLowerCase()}:${page.key.toLowerCase()}:${a.key.toLowerCase()}`;
      if (fullyGranted) {
        next.delete(key);
      } else {
        next.add(key);
      }
    });

    setGrantedKeys(next);
  };

  const isModuleFullyGranted = (mod: ModuleCatalogItem) => {
    return mod.pages.every((p) => isPageFullyGranted(p, mod.key));
  };

  const isModulePartiallyGranted = (mod: ModuleCatalogItem) => {
    const grantedInMod = mod.pages.flatMap((p) => p.actions).filter((a) => {
      // Find parent page
      const page = mod.pages.find((p) => p.actions.includes(a));
      return page ? isActionGranted(mod.key, page.key, a.key) : false;
    }).length;
    const totalInMod = mod.pages.flatMap((p) => p.actions).length;
    return grantedInMod > 0 && grantedInMod < totalInMod;
  };

  const toggleModule = (mod: ModuleCatalogItem) => {
    const fullyGranted = isModuleFullyGranted(mod);
    const next = new Set(grantedKeys);

    mod.pages.forEach((page) => {
      page.actions.forEach((a) => {
        const key = `${mod.key.toLowerCase()}:${page.key.toLowerCase()}:${a.key.toLowerCase()}`;
        if (fullyGranted) {
          next.delete(key);
        } else {
          next.add(key);
        }
      });
    });

    setGrantedKeys(next);
  };

  // Preset Handlers
  const applyPreset = (preset: "all" | "viewer" | "operator" | "approver" | "clear") => {
    const next = new Set<string>();

    if (preset === "clear") {
      setGrantedKeys(next);
      return;
    }

    catalog.forEach((mod) => {
      mod.pages.forEach((page) => {
        page.actions.forEach((action) => {
          const key = `${mod.key.toLowerCase()}:${page.key.toLowerCase()}:${action.key.toLowerCase()}`;
          if (preset === "all") {
            next.add(key);
          } else if (preset === "viewer" && action.key === "view") {
            next.add(key);
          } else if (preset === "operator" && ["view", "create", "edit"].includes(action.key)) {
            next.add(key);
          } else if (preset === "approver" && ["view", "create", "edit", "export", "approve"].includes(action.key)) {
            next.add(key);
          }
        });
      });
    });

    setGrantedKeys(next);
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload: UserPermissionGrantItem[] = Array.from(grantedKeys).map((k) => {
        const [module, pageKey, action] = k.split(":");
        return { module, pageKey, action };
      });

      const res = await permissionsApi.saveUserPermissions(selectedUser.id, payload);
      notifySuccess(res.data.message || `Permissions saved for ${selectedUser.email}!`);
      setInitialKeys(new Set(grantedKeys));
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic 3-Tier Security
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Auto-Discovery Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            User Permissions & Access Control Matrix
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Granularly grant user-level access across <strong>Modules</strong>, <strong>Pages/Submodules</strong>, and individual <strong>Functions</strong> (View, Create, Edit, Delete, Export, Approve).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
              Unsaved Changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !selectedUser || !hasUnsavedChanges}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg transition ${
              hasUnsavedChanges
                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-indigo-500/30 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Saving Changes..." : "Save Permissions"}
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANEL: User Directory (4 cols) ─────────────────────────── */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              Users Directory ({filteredUsers.length})
            </h2>
            <span className="text-xs text-slate-400">Select to assign</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
            {["ALL", "ADMIN", "SUPERADMIN", "MANAGER", "EMPLOYEE"].map((role) => (
              <button
                key={role}
                onClick={() => setUserRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                  userRoleFilter === role
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* User List */}
          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const initials = `${(u.firstName || "")[0] || ""}${(u.lastName || "")[0] || ""}`.toUpperCase() || "U";

              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-sm"
                      : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ml-2 ${
                      u.role?.toLowerCase().includes("admin")
                        ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {u.role || "USER"}
                  </span>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <p className="text-xs text-center text-slate-400 p-6">No users match your search.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: 3-Tier Cascading Permission Matrix (8 cols) ────── */}
        <div className="lg:col-span-8 space-y-4">
          {/* User Status Bar & Preset Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Managing Permissions for:</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : "Select a user"}
                    {selectedUser && (
                      <span className="text-xs font-normal text-slate-400 font-mono">({selectedUser.email})</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {grantedKeys.size} Permissions Active
                </span>
                {loadingPermissions && <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />}
              </div>
            </div>

            {/* Quick Action Presets & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
                  <Sliders className="w-3.5 h-3.5" /> Presets:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition"
                >
                  Full Admin
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("approver")}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950 transition"
                >
                  Manager / Approver
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("operator")}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 transition"
                >
                  Operator (CRUD)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("viewer")}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 transition"
                >
                  Read-Only
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                >
                  Clear All
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter pages or actions..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                />
              </div>
            </div>
          </div>

          {/* Module Cards Accordion */}
          <div className="space-y-4">
            {filteredCatalog.map((mod) => {
              const isExpanded = !!expandedModules[mod.key];
              const isFull = isModuleFullyGranted(mod);
              const isPartial = isModulePartiallyGranted(mod);

              const grantedCount = mod.pages.flatMap((p) => p.actions).filter((a) => {
                const page = mod.pages.find((p) => p.actions.includes(a));
                return page ? isActionGranted(mod.key, page.key, a.key) : false;
              }).length;
              const totalCount = mod.pages.flatMap((p) => p.actions).length;

              return (
                <div
                  key={mod.key}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* ── Tier 1: Module Header ────────────────────────────── */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className="text-indigo-600 dark:text-indigo-400 focus:outline-none"
                        title={isFull ? "Deselect entire module" : "Grant entire module"}
                      >
                        {isFull ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-100 dark:fill-indigo-950" />
                        ) : isPartial ? (
                          <MinusSquare className="w-5 h-5 text-indigo-500" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{mod.title}</h3>
                          <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {mod.key}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {grantedCount} / {totalCount} granted
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedModules({ ...expandedModules, [mod.key]: !isExpanded })
                        }
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* ── Tier 2 & 3: Pages & Actions List ─────────────────── */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {mod.pages.map((page) => {
                        const pageFull = isPageFullyGranted(page, mod.key);
                        const pagePartial = isPagePartiallyGranted(page, mod.key);

                        return (
                          <div key={page.key} className="p-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              {/* Page Checkbox & Title */}
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => togglePage(page, mod.key)}
                                  className="text-indigo-600 dark:text-indigo-400"
                                  title={pageFull ? "Deselect page" : "Grant all page actions"}
                                >
                                  {pageFull ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-100 dark:fill-indigo-950" />
                                  ) : pagePartial ? (
                                    <MinusSquare className="w-4 h-4 text-indigo-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                  )}
                                </button>
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {page.title}
                                  </span>
                                  {page.subGroup && (
                                    <span className="ml-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                      [{page.subGroup}]
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {page.route}
                              </span>
                            </div>

                            {/* Tier 3: Action Buttons / Chips */}
                            <div className="flex items-center gap-2 flex-wrap pl-6">
                              {page.actions.map((act) => {
                                const active = isActionGranted(mod.key, page.key, act.key);
                                const cfg = ACTION_CONFIG[act.key] || { label: act.label || act.key, icon: Check, color: "text-slate-600 bg-slate-100" };
                                const Icon = cfg.icon;

                                return (
                                  <button
                                    key={act.key}
                                    type="button"
                                    onClick={() => toggleAction(mod.key, page.key, act.key)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                                      active
                                        ? `${cfg.color} border-current shadow-sm`
                                        : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{act.label || cfg.label}</span>
                                    {active && <Check className="w-3 h-3 ml-0.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed text-slate-400">
                No modules or pages matched your filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
