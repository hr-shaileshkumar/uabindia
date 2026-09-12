"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, Search } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { erpButtonClassName } from "@/components/workspace/styles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { platformApi } from "@/services/modules";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { PermissionMatrix, collectColumnPermissionIds } from "@/components/administration/PermissionMatrix";

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export interface RolePerm {
  permissionId: string;
  permissionName: string;
  module: string;
  action: string;
  description?: string;
}

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  roles?: string[];
  isActive: boolean;
}

export interface AuditRow {
  id: string;
  entityName: string;
  entityId?: string | null;
  action: string;
  performedAt: string;
  performedBy?: string | null;
}

interface AuditLogResponse {
  logs?: AuditRow[];
}

type PageAccess = {
  name: string;
  path: string;
  requiredPermissions: string[];
  accessible: boolean;
};

type ModuleAccessGroup = {
  label: string;
  pages: PageAccess[];
};

type ModuleAccess = {
  key: string;
  label: string;
  groups: ModuleAccessGroup[];
  totalPages: number;
  accessiblePages: number;
  hasModuleAccess: boolean;
};

const SYSTEM_MODULE_KEY = "erp";
const ACTION_SORT_ORDER = ["access", "view", "create", "edit", "approve", "delete", "export", "manage", "settings"];

const humanize = (value: string) =>
  value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const moduleLabel = (value: string) => (value.toLowerCase() === SYSTEM_MODULE_KEY ? "System shell" : humanize(value));

function buildGrantedPermissionSet(permissions: RolePerm[]) {
  const granted = new Set<string>();

  for (const permission of permissions) {
    const moduleKey = permission.module.trim();
    if (!moduleKey) continue;

    granted.add(`module:${moduleKey}`.toLowerCase());
    granted.add(`${moduleKey}.*`.toLowerCase());

    const actionKey = permission.action.trim();
    if (actionKey) {
      granted.add(`${moduleKey}.${actionKey}`.toLowerCase());
      granted.add(`resource:${moduleKey}.${actionKey}`.toLowerCase());
    }
  }

  return granted;
}

function hasRequiredPermission(requiredPermissions: string[] | undefined, granted: Set<string>) {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  for (const key of requiredPermissions) {
    const normalized = key.trim().toLowerCase();
    if (!normalized) continue;

    if (granted.has(normalized)) return true;

    if (normalized.endsWith(".*")) {
      const prefix = normalized.slice(0, -2);
      if ([...granted].some((value) => value.startsWith(`${prefix}.`))) return true;
    }

    const moduleScope = normalized.startsWith("module:")
      ? normalized.slice("module:".length)
      : normalized.startsWith("resource:")
        ? normalized.slice("resource:".length).split(".")[0]
        : normalized.split(".")[0];

    if (moduleScope) {
      if (
        granted.has(`module:${moduleScope}`) ||
        granted.has(`${moduleScope}.*`) ||
        granted.has(`${moduleScope}.access`) ||
        granted.has(`${moduleScope}.view`) ||
        granted.has(`resource:${moduleScope}.access`) ||
        granted.has(`resource:${moduleScope}.view`)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function AdministrationRolesManager() {
  const { confirmDialog } = useConfirmDialog();
  const { navigation, routeRules } = useUiSchema();

  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [rolePermissionCounts, setRolePermissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<RolePerm[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [originalAssigned, setOriginalAssigned] = useState<Set<string>>(new Set());
  const [permLoading, setPermLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "permissions" | "users" | "audit">("overview");
  const [expandedModuleKeys, setExpandedModuleKeys] = useState<Set<string>>(new Set());
  const [roleDrawer, setRoleDrawer] = useState<"closed" | "create" | "edit">("closed");
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [roleSaving, setRoleSaving] = useState(false);

  const loadRolePermissions = useCallback(async (roleId: string) => {
    if (!roleId) return;

    setPermLoading(true);
    setSaveMsg("");

    try {
      const response = await platformApi.admin.rolePermissions(roleId);
      const permissions = (response.data.permissions as RolePerm[]) || [];
      const nextAssigned = new Set(permissions.map((permission) => permission.permissionId));

      setSelectedRolePermissions(permissions);
      setAssigned(nextAssigned);
      setOriginalAssigned(new Set(nextAssigned));
      setRolePermissionCounts((previous) => ({ ...previous, [roleId]: nextAssigned.size }));
    } catch (loadError) {
      const message = getApiErrorMessage(loadError, "Failed to load role permissions.");
      setSaveMsg(message);
      notifyError(message);
    } finally {
      setPermLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes, usersRes, auditRes] = await Promise.all([
          platformApi.admin.roles(),
          platformApi.admin.permissions(),
          platformApi.admin.users(),
          platformApi.admin.auditLogs({ page: 1, limit: 100 }),
        ]);

        const nextRoles = ((rolesRes.data.roles as Role[]) || []).slice().sort((left, right) => left.name.localeCompare(right.name));
        setRoles(nextRoles);
        setAllPerms((permsRes.data.permissions as Permission[]) || []);
        setUsers((usersRes.data as UserRow[]) || []);
        setAuditLogs(((auditRes.data as AuditLogResponse)?.logs || []).slice());

        const counts = await Promise.all(
          nextRoles.map(async (role) => {
            try {
              const response = await platformApi.admin.rolePermissions(role.id);
              return [role.id, (response.data.permissions as RolePerm[] | undefined)?.length ?? 0] as const;
            } catch {
              return [role.id, 0] as const;
            }
          }),
        );

        setRolePermissionCounts(Object.fromEntries(counts));
        setSelectedRoleId((current) => current || nextRoles[0]?.id || "");
      } catch (loadError) {
        const message = getApiErrorMessage(loadError, "Failed to load role access data.");
        setError(message);
        notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    void loadRolePermissions(selectedRoleId);
  }, [loadRolePermissions, selectedRoleId]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const grantedPermissions = useMemo(() => buildGrantedPermissionSet(selectedRolePermissions), [selectedRolePermissions]);

  const selectedRoleUsers = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter((user) => (user.roles || []).includes(selectedRole.name));
  }, [selectedRole, users]);

  const selectedRoleUserCount = selectedRole ? selectedRoleUsers.length : 0;
  const selectedRolePermissionCount = selectedRole ? rolePermissionCounts[selectedRole.id] ?? assigned.size : 0;

  const filteredPermissions = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase();
    return allPerms
      .filter((permission) => {
        if (moduleFilter !== "all" && permission.module !== moduleFilter) return false;
        if (!keyword) return true;
        return (
          permission.module.toLowerCase().includes(keyword) ||
          permission.action.toLowerCase().includes(keyword) ||
          permission.name.toLowerCase().includes(keyword) ||
          (permission.description ?? "").toLowerCase().includes(keyword)
        );
      })
      .sort((left, right) => {
        if (left.module !== right.module) return left.module.localeCompare(right.module);
        const leftOrder = ACTION_SORT_ORDER.indexOf(left.action.toLowerCase());
        const rightOrder = ACTION_SORT_ORDER.indexOf(right.action.toLowerCase());
        const normalizedLeft = leftOrder === -1 ? 999 : leftOrder;
        const normalizedRight = rightOrder === -1 ? 999 : rightOrder;
        if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
        return left.action.localeCompare(right.action);
      });
  }, [allPerms, moduleFilter, permissionSearch]);

  const groupedPermissions = useMemo(() => {
    const grouped = new Map<string, Permission[]>();
    filteredPermissions.forEach((permission) => {
      const bucket = grouped.get(permission.module) ?? [];
      bucket.push(permission);
      grouped.set(permission.module, bucket);
    });
    return grouped;
  }, [filteredPermissions]);

  const moduleOptions = useMemo(
    () => ["all", ...Array.from(new Set(allPerms.map((permission) => permission.module))).sort()],
    [allPerms],
  );

  const accessModules: ModuleAccess[] = useMemo(() => {
    return navigation.modules
      .map((module) => {
        const groups = module.groups
          .map((group) => ({
            label: group.label?.trim() || "Pages",
            pages: group.items.map((item) => ({
              name: item.name,
              path: item.path,
              requiredPermissions: item.requiredPermissions,
              accessible: hasRequiredPermission(item.requiredPermissions, grantedPermissions),
            })),
          }))
          .filter((group) => group.pages.length > 0);

        const allPages = groups.flatMap((group) => group.pages);

        return {
          key: module.key,
          label: module.displayName,
          groups,
          totalPages: allPages.length,
          accessiblePages: allPages.filter((page) => page.accessible).length,
          hasModuleAccess: selectedRolePermissions.some((permission) => permission.module.toLowerCase() === module.key.toLowerCase()),
        };
      })
      .filter((module) => module.totalPages > 0)
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [grantedPermissions, navigation.modules, selectedRolePermissions]);

  const summaryMetrics = useMemo(() => {
    const accessibleModules = accessModules.filter((module) => module.hasModuleAccess).length;
    const accessiblePages = accessModules.reduce((count, module) => count + module.accessiblePages, 0);
    const blockedPages = accessModules.reduce((count, module) => count + (module.totalPages - module.accessiblePages), 0);
    return { accessibleModules, accessiblePages, blockedPages };
  }, [accessModules]);

  const systemShellPermissions = useMemo(
    () => selectedRolePermissions.filter((permission) => permission.module.toLowerCase() === SYSTEM_MODULE_KEY),
    [selectedRolePermissions],
  );

  const relevantAuditLogs = useMemo(() => {
    if (!selectedRole) return [];
    return auditLogs
      .filter((log) => {
        if (log.entityId === selectedRole.id) return true;
        const entity = log.entityName.toLowerCase();
        return entity.includes("role") || entity.includes("permission");
      })
      .slice(0, 12);
  }, [auditLogs, selectedRole]);

  const hasUnsavedChanges = useMemo(() => {
    if (assigned.size !== originalAssigned.size) return true;
    for (const value of assigned) {
      if (!originalAssigned.has(value)) return true;
    }
    return false;
  }, [assigned, originalAssigned]);

  const togglePerm = (permissionId: string) => {
    setAssigned((previous) => {
      const next = new Set(previous);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
    setSaveMsg("");
  };

  const toggleEntireModule = (moduleKey: string) => {
    const modulePermissions = groupedPermissions.get(moduleKey) ?? [];
    if (modulePermissions.length === 0) return;

    const allAssigned = modulePermissions.every((permission) => assigned.has(permission.id));
    setAssigned((previous) => {
      const next = new Set(previous);
      modulePermissions.forEach((permission) => {
        if (allAssigned) next.delete(permission.id);
        else next.add(permission.id);
      });
      return next;
    });
    setSaveMsg("");
  };

  const toggleColumn = (moduleKey: string, column: string) => {
    const ids = collectColumnPermissionIds(filteredPermissions, moduleKey, column);
    if (ids.length === 0) return;
    const allAssigned = ids.every((id) => assigned.has(id));
    setAssigned((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => {
        if (allAssigned) next.delete(id);
        else next.add(id);
      });
      return next;
    });
    setSaveMsg("");
  };

  const toggleModuleView = (moduleKey: string) => {
    setExpandedModuleKeys((previous) => {
      const next = new Set(previous);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      await platformApi.admin.updateRolePermissions(selectedRole.id, Array.from(assigned));
      notifySuccess("Role permissions updated successfully.");
      setOriginalAssigned(new Set(assigned));
      await loadRolePermissions(selectedRole.id);
    } catch (saveError) {
      const message = getApiErrorMessage(saveError, "Failed to update role permissions.");
      setSaveMsg(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const saveRoleMeta = async () => {
    if (!roleForm.name.trim()) {
      notifyError("Role name is required.");
      return;
    }
    try {
      setRoleSaving(true);
      if (roleDrawer === "edit" && selectedRoleId) {
        await platformApi.admin.updateRole(selectedRoleId, {
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || undefined,
        });
        notifySuccess("Role updated.");
      } else {
        const res = await platformApi.admin.createRole({
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || undefined,
        });
        const newId = (res.data as { id?: string; role?: { id?: string } })?.id
          ?? (res.data as { role?: { id?: string } })?.role?.id;
        notifySuccess("Role created.");
        if (newId) setSelectedRoleId(String(newId));
      }
      setRoleDrawer("closed");
      const rolesRes = await platformApi.admin.roles();
      const nextRoles = ((rolesRes.data.roles as Role[]) || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      setRoles(nextRoles);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save role."));
    } finally {
      setRoleSaving(false);
    }
  };

  const deleteSelectedRole = async () => {
    if (!selectedRoleId) return;
    try {
      setRoleSaving(true);
      await platformApi.admin.deleteRole(selectedRoleId);
      notifySuccess("Role deleted.");
      setSelectedRoleId("");
      setRoleDrawer("closed");
      const rolesRes = await platformApi.admin.roles();
      setRoles(((rolesRes.data.roles as Role[]) || []).slice().sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete role."));
    } finally {
      setRoleSaving(false);
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Roles Configured", value: roles.length, tone: "info", subtext: "RBAC Roles" },
    { label: "Active Permissions", value: allPerms.length, tone: "positive", subtext: "Permissions" },
    { label: "Covered Modules", value: navigation.modules.length, tone: "warning", subtext: "Modules" },
    { label: "Protected Routes", value: routeRules.rules.length, tone: "positive", subtext: "Route Rules" },
  ];

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_ROLES_VIEW}>
      <AdministrationGlobalPageShell
        title="Roles & Access Control Matrix"
        subtitle="Manage role-permission matrices, module accessibility switches, route access rules, and assigned users."
        categoryTag="Enterprise RBAC Governance"
        kpiMetrics={kpis}
      >
        <div className="p-4 space-y-5">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`${erpButtonClassName.secondary} inline-flex items-center gap-2 cursor-pointer`}
              onClick={() => {
                setRoleForm({ name: "", description: "" });
                setRoleDrawer("create");
              }}
            >
              New role
            </button>
            <button type="button" onClick={() => void savePermissions()} disabled={!hasUnsavedChanges || saving || permLoading || !selectedRole} className={`${erpButtonClassName.primary} inline-flex items-center gap-2 cursor-pointer`}>
              <Copy className="h-4 w-4" />{saving ? "Saving..." : "Save permissions"}
            </button>
            <button type="button" className={`${erpButtonClassName.secondary} inline-flex items-center gap-2 cursor-pointer`} onClick={() => setActiveTab("overview")}>
              <ArrowRight className="h-4 w-4" />Overview
            </button>
          </div>
          {confirmDialog}

          {roleDrawer !== "closed" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{roleDrawer === "edit" ? "Edit role" : "New role"}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                  <input className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" className={erpButtonClassName.secondary} onClick={() => setRoleDrawer("closed")}>Cancel</button>
                <button type="button" className={erpButtonClassName.primary} disabled={roleSaving} onClick={() => void saveRoleMeta()}>
                  {roleSaving ? "Saving…" : "Save role"}
                </button>
              </div>
            </div>
          ) : null}

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 mb-4">{error}</div>}

          <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex h-fit max-h-[calc(100vh-13rem)] flex-col overflow-hidden">
              <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <Search className="h-3.5 w-3.5" />Roles
                </div>
                <input
                  className="erp-input mt-3 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Search role, scope, or status..."
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                <div className="space-y-2">
                  {roles
                    .filter((role) => {
                      const keyword = roleSearch.trim().toLowerCase();
                      if (!keyword) return true;
                      return `${role.name} ${role.description || ""}`.toLowerCase().includes(keyword);
                    })
                    .map((role) => {
                      const isSelected = selectedRole?.id === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-slate-950 dark:text-white">{role.name}</div>
                                {isSelected ? <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">Active</span> : null}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{role.description || "Role access profile"}</p>
                            </div>
                            <div className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                              <div>{rolePermissionCounts[role.id] ?? 0} permissions</div>
                              <div>{users.filter((user) => (user.roles || []).includes(role.name)).length} users</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                  {!loading && roles.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">No roles were returned by the backend.</div>
                  )}
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              {!selectedRole ? (
                <div className="p-8 text-center text-xs text-slate-500 min-h-[28rem] flex items-center justify-center">
                  Select a role from the left panel to review its module access, page access, and granular permissions.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                  <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedRole.name}</h2>
                          {hasUnsavedChanges ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Unsaved changes
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {selectedRole.description || "This role controls access to modules, pages, and permission actions."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {permLoading ? "Loading..." : `${assigned.size} assigned permissions`}
                          </span>
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {selectedRoleUserCount} assigned users
                          </span>
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {selectedRolePermissionCount} catalog permissions
                          </span>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 xl:w-auto xl:flex-row xl:items-center">
                        {saveMsg ? <span className={`text-sm ${saveMsg.startsWith("Failed") ? "text-red-500" : "text-green-600"}`}>{saveMsg}</span> : null}
                        <button
                          type="button"
                          className={`${erpButtonClassName.secondary} cursor-pointer`}
                          onClick={() => {
                            setRoleForm({
                              name: selectedRole.name,
                              description: selectedRole.description || "",
                            });
                            setRoleDrawer("edit");
                          }}
                        >
                          Edit role
                        </button>
                        <button
                          type="button"
                          className={`${erpButtonClassName.secondary} text-rose-700 cursor-pointer`}
                          disabled={roleSaving}
                          onClick={() => {
                            if (window.confirm(`Delete role "${selectedRole.name}"?`)) void deleteSelectedRole();
                          }}
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => void savePermissions()} disabled={saving || permLoading || !hasUnsavedChanges} className={`${erpButtonClassName.primary} cursor-pointer`}>
                          {saving ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 px-5 pt-5 xl:grid-cols-[minmax(0,1fr),16rem]">
                    <div className="min-w-0">
                      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "permissions" | "users" | "audit")}>
                        <TabsList>
                          <TabsTrigger value="overview">Module & page access</TabsTrigger>
                          <TabsTrigger value="permissions">Permissions ({selectedRolePermissionCount})</TabsTrigger>
                          <TabsTrigger value="users">Assigned Users ({selectedRoleUserCount})</TabsTrigger>
                          <TabsTrigger value="audit">Audit Logs ({relevantAuditLogs.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-5 space-y-4">
                          {systemShellPermissions.length > 0 ? (
                            <div className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950 dark:text-white">System shell access</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">ERP shell permissions used for platform access only.</p>
                                </div>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {systemShellPermissions.length} permission{systemShellPermissions.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {systemShellPermissions.map((permission) => (
                                  <span key={permission.permissionId} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {permission.permissionName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {accessModules.map((module) => {
                            const expanded = expandedModuleKeys.has(module.key) || module.accessiblePages > 0;
                            return (
                              <section key={module.key} className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{module.label}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {module.accessiblePages} of {module.totalPages} pages accessible
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleModuleView(module.key)}
                                      className="erp-action-btn erp-action-btn-secondary h-9 px-3 text-xs cursor-pointer"
                                    >
                                      {expanded ? "Collapse" : "Expand"}
                                    </button>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${module.hasModuleAccess ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                                      {module.hasModuleAccess ? "Module access on" : "Module access off"}
                                    </span>
                                  </div>
                                </div>

                                <div className={`space-y-4 px-4 py-4 ${expanded ? "block" : "hidden"}`}>
                                  {module.groups.map((group) => (
                                    <div key={`${module.key}-${group.label}`}>
                                      {module.groups.length > 1 ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{group.label}</p> : null}
                                      <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                                        {group.pages.map((page) => (
                                          <div key={`${page.path}-${page.name}`} className={`rounded-2xl border px-3 py-2.5 ${page.accessible ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{page.name}</p>
                                                <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">{page.path}</p>
                                              </div>
                                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${page.accessible ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                                                {page.accessible ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Access</span> : "Blocked"}
                                              </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              {page.requiredPermissions.length > 0 ? (
                                                page.requiredPermissions.map((permission) => (
                                                  <span key={permission} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {permission}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                  Open page
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            );
                          })}
                        </TabsContent>

                        <TabsContent value="permissions" className="mt-5">
                          <div className="grid w-full gap-3 xl:w-auto xl:grid-cols-[minmax(16rem,22rem),auto]">
                            <input
                              value={permissionSearch}
                              onChange={(event) => setPermissionSearch(event.target.value)}
                              placeholder="Search permissions, actions, or module names..."
                              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <select
                              value={moduleFilter}
                              onChange={(event) => setModuleFilter(event.target.value)}
                              className="erp-select h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white xl:min-w-52"
                            >
                              {moduleOptions.map((module) => (
                                <option key={module} value={module}>
                                  {module === "all" ? "All modules" : moduleLabel(module)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                            Matrix columns: View · Create · Edit · Delete · Approve · Export · Access. Click a column header to bulk-toggle that action within a module.
                          </p>

                          {permLoading ? (
                            <div className="p-8 text-center text-xs text-slate-500 min-h-[18rem] flex items-center justify-center">Loading permissions...</div>
                          ) : (
                            <div className="mt-5">
                              <PermissionMatrix
                                permissions={filteredPermissions}
                                assigned={assigned}
                                onToggle={togglePerm}
                                onToggleModule={toggleEntireModule}
                                onToggleColumn={toggleColumn}
                              />
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="users" className="mt-5">
                          {selectedRoleUsers.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500 min-h-[18rem] flex items-center justify-center">No active users are currently assigned to this role.</div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {selectedRoleUsers.map((user) => (
                                <div key={user.id} className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName || user.email}</div>
                                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                                      {user.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Roles: {(user.roles || []).join(", ") || "—"}</div>
                                  <div className="mt-4">
                                    <Link href={ROUTES.PLATFORM_USERS} className="erp-action-btn erp-action-btn-secondary">
                                      Open users workspace
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="audit" className="mt-5">
                          {relevantAuditLogs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500 min-h-[18rem] flex items-center justify-center">No recent access-control activity matched this role yet.</div>
                          ) : (
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                              <div className="overflow-x-auto">
                                <table className="erp-table">
                                  <thead className="erp-thead">
                                    <tr>
                                      <th className="erp-th">Entity</th>
                                      <th className="erp-th">Action</th>
                                      <th className="erp-th">Actor</th>
                                      <th className="erp-th">When</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {relevantAuditLogs.map((log) => (
                                      <tr key={log.id} className="erp-tr">
                                        <td className="erp-td">
                                          <div className="erp-row-title">{log.entityName}</div>
                                          <div className="erp-row-meta font-mono text-[11px]">{log.entityId || "No entity ID"}</div>
                                        </td>
                                        <td className="erp-td">
                                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">{log.action}</span>
                                        </td>
                                        <td className="erp-td text-sm text-slate-600 dark:text-slate-300">{log.performedBy || "System"}</td>
                                        <td className="erp-td text-sm text-slate-500 dark:text-slate-400">{new Date(log.performedAt).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-[calc(var(--erp-topbar-height,4rem)+1rem)] xl:h-fit">
                      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">At a glance</p>
                        <div className="mt-3 grid gap-2 text-sm">
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2"><span className="text-slate-600 dark:text-slate-400">Modules</span><span className="font-semibold text-slate-950 dark:text-white">{summaryMetrics.accessibleModules}/{accessModules.length}</span></div>
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2"><span className="text-slate-600 dark:text-slate-400">Pages on</span><span className="font-semibold text-slate-950 dark:text-white">{summaryMetrics.accessiblePages}</span></div>
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2"><span className="text-slate-600 dark:text-slate-400">Pages off</span><span className="font-semibold text-slate-950 dark:text-white">{summaryMetrics.blockedPages}</span></div>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Module access hints</p>
                        <div className="mt-3 space-y-2">
                          {accessModules.slice(0, 5).map((module) => (
                            <button
                              key={module.key}
                              type="button"
                              onClick={() => {
                                setActiveTab("overview");
                                toggleModuleView(module.key);
                              }}
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <span className="truncate text-slate-700 dark:text-slate-300">{module.label}</span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${module.accessiblePages > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                                {module.accessiblePages}/{module.totalPages}
                              </span>
                            </button>
                          ))}
                        </div>
                      </section>
                    </aside>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </AdministrationGlobalPageShell>
    </ProtectedRoute>
  );
}

export default AdministrationRolesManager;
