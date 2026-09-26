"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  Search,
  Check,
  RefreshCw,
  Save,
  CheckSquare,
  Square,
  Sliders,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { platformApi } from "@/services/modules/administration";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

interface RoleItem {
  id: string;
  name: string;
  description?: string;
}

interface PermissionItem {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export function RolePermissionMatrix() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [assignedPermIds, setAssignedPermIds] = useState<Set<string>>(new Set());
  const [originalPermIds, setOriginalPermIds] = useState<Set<string>>(new Set());

  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [loadingPerms, setLoadingPerms] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Fetch all roles and all permissions
  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoadingRoles(true);
        const [rolesRes, permsRes] = await Promise.all([
          platformApi.admin.roles(),
          platformApi.admin.permissions(),
        ]);

        const rolesList: RoleItem[] = (rolesRes.data as any)?.roles || (rolesRes.data as any) || [];
        setRoles(rolesList);
        if (rolesList.length > 0) {
          setSelectedRole(rolesList[0]);
        }

        const permsList: PermissionItem[] =
          (permsRes.data as any)?.permissions || (permsRes.data as any) || [];
        setAllPermissions(permsList);
      } catch (err) {
        notifyError(getApiErrorMessage(err, "Failed to load roles or permissions"));
      } finally {
        setLoadingRoles(false);
      }
    };

    void fetchInit();
  }, []);

  // 2. Fetch permissions for selected role
  const fetchRolePermissions = useCallback(async (roleId: string) => {
    try {
      setLoadingPerms(true);
      const res = await platformApi.admin.rolePermissions(roleId);
      const perms: Array<{ permissionId?: string; id?: string }> =
        (res.data as any)?.permissions || [];
      const idSet = new Set(
        perms
          .map((p) => p.permissionId || p.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      );
      setAssignedPermIds(idSet);
      setOriginalPermIds(new Set(idSet));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load role permissions"));
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRole) {
      void fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole, fetchRolePermissions]);

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of allPermissions) {
      const mod = (p.module || "General").toUpperCase();
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    }
    return map;
  }, [allPermissions]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return permissionsByModule;

    const q = searchQuery.toLowerCase();
    const filtered = new Map<string, PermissionItem[]>();

    permissionsByModule.forEach((items, mod) => {
      const matchingItems = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.action.toLowerCase().includes(q) ||
          p.module.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
      if (matchingItems.length > 0) {
        filtered.set(mod, matchingItems);
      }
    });

    return filtered;
  }, [permissionsByModule, searchQuery]);

  // Toggle single permission
  const togglePermission = (id: string) => {
    setAssignedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all permissions in a module
  const toggleModuleAll = (moduleKey: string, grant: boolean) => {
    const items = permissionsByModule.get(moduleKey) || [];
    setAssignedPermIds((prev) => {
      const next = new Set(prev);
      items.forEach((p) => {
        if (grant) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  // Check dirty state
  const isDirty = useMemo(() => {
    if (assignedPermIds.size !== originalPermIds.size) return true;
    for (const id of assignedPermIds) {
      if (!originalPermIds.has(id)) return true;
    }
    return false;
  }, [assignedPermIds, originalPermIds]);

  // Save permissions
  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await platformApi.admin.updateRolePermissions(
        selectedRole.id,
        Array.from(assignedPermIds)
      );
      notifySuccess(`Permissions updated for role: ${selectedRole.name}`);
      setOriginalPermIds(new Set(assignedPermIds));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save permissions"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Selector Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Role-Based Access Control (RBAC)
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Role Permission Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a system role to view and configure granted capabilities across all ERP modules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Roles Pill Selector */}
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          {loadingRoles ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
              Loading roles...
            </div>
          ) : (
            roles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    if (isDirty) {
                      if (!confirm("You have unsaved changes. Switch role anyway?")) return;
                    }
                    setSelectedRole(role);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{role.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search permissions by name, action, or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {isDirty && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            Unsaved changes pending
          </div>
        )}
      </div>

      {/* Module Matrix Accordions */}
      {loadingPerms ? (
        <div className="py-16 text-center text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading permissions for {selectedRole?.name}...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(filteredModules.entries()).map(([moduleName, perms]) => {
            const allGranted = perms.every((p) => assignedPermIds.has(p.id));
            const someGranted = perms.some((p) => assignedPermIds.has(p.id));

            return (
              <div
                key={moduleName}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Module Header */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 tracking-wide uppercase">
                      {moduleName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {perms.filter((p) => assignedPermIds.has(p.id)).length} / {perms.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleModuleAll(moduleName, true)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 transition"
                    >
                      Grant All
                    </button>
                    <button
                      onClick={() => toggleModuleAll(moduleName, false)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {perms.map((p) => {
                    const isChecked = assignedPermIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePermission(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 select-none ${
                          isChecked
                            ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20"
                            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                              {p.action}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
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
}
