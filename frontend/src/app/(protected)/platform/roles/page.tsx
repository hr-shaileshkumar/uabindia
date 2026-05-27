"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableActionMenu } from "@/components/table/TableActionMenu";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

interface RolePerm {
  permissionId: string;
  permissionName: string;
  module: string;
  action: string;
  description?: string;
}

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  roles?: string[];
  isActive: boolean;
}

interface AuditRow {
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

const MODULE_COLORS: Record<string, string> = {
  platform: "bg-violet-100 text-violet-700",
  security: "bg-red-100 text-red-700",
  licensing: "bg-amber-100 text-amber-700",
  hrms: "bg-green-100 text-green-700",
  payroll: "bg-blue-100 text-blue-700",
  reports: "bg-sky-100 text-sky-700",
  erp: "bg-orange-100 text-orange-700",
};

const ACTION_SORT_ORDER = ["access", "view", "create", "edit", "approve", "delete", "export", "manage", "settings"];

const ADD_ROLE_FAILED_MESSAGE = "Failed to add role. Please try again.";

function ModuleBadge({ module }: { module: string }) {
  const cls = MODULE_COLORS[module] ?? "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{humanize(module)}</span>;
}

function humanize(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPermissionLabel(permission: Permission) {
  if (permission.action.toLowerCase() === "access") {
    return `${humanize(permission.module)} workspace access`;
  }
  return humanize(permission.action);
}

function compareAssignedSets(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) return false;
  for (const item of left) {
    if (!right.has(item)) return false;
  }
  return true;
}

export default function RolesPage() {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { hasPermission } = usePermissions();
  const canCreateRole = hasPermission([PERMISSIONS.PLATFORM_ROLES_CREATE]);
  const canEditRole = hasPermission([PERMISSIONS.PLATFORM_ROLES_EDIT]);
  const canDeleteRole = hasPermission([PERMISSIONS.PLATFORM_ROLES_DELETE]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [rolePermissionCounts, setRolePermissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [originalAssigned, setOriginalAssigned] = useState<Set<string>>(new Set());
  const [permLoading, setPermLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"permissions" | "users" | "audit">("permissions");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);
  const [createRoleMsg, setCreateRoleMsg] = useState("");

  const [showEditRole, setShowEditRole] = useState(false);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [editingRole, setEditingRole] = useState(false);
  const [editRoleMsg, setEditRoleMsg] = useState("");
  const [deletingRole, setDeletingRole] = useState(false);

  const fetchRolePermissionSnapshot = useCallback(async (roleId: string) => {
    const response = await hrApi.platform.rolePermissions(roleId);
    return (response.data.permissions as RolePerm[]) || [];
  }, []);

  const fetchRolePermissionCounts = useCallback(
    async (roleList: Role[]) => {
      const counts = await Promise.all(
        roleList.map(async (role) => {
          try {
            const permissions = await fetchRolePermissionSnapshot(role.id);
            return [role.id, permissions.length] as const;
          } catch {
            return [role.id, 0] as const;
          }
        })
      );

      return Object.fromEntries(counts) as Record<string, number>;
    },
    [fetchRolePermissionSnapshot]
  );

  const openRole = useCallback(
    async (role: Role) => {
      setSelectedRole(role);
      setPermLoading(true);
      setSaveMsg("");
      setActiveTab("permissions");
      setShowEditRole(false);
      setEditRoleMsg("");
      try {
        const permissions = await fetchRolePermissionSnapshot(role.id);
        const nextAssigned = new Set(permissions.map((permission) => permission.permissionId));
        setAssigned(nextAssigned);
        setOriginalAssigned(new Set(nextAssigned));
        setRolePermissionCounts((previous) => ({ ...previous, [role.id]: nextAssigned.size }));
        setExpandedModules(new Set(permissions.map((permission) => permission.module)));
      } catch (loadError) {
        const message = getApiErrorMessage(loadError, "Failed to load role permissions.");
        setSaveMsg(message);
        notifyError(message);
      } finally {
        setPermLoading(false);
      }
    },
    [fetchRolePermissionSnapshot]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes, usersRes, auditRes] = await Promise.all([
          hrApi.platform.roles(),
          hrApi.platform.permissions(),
          hrApi.platform.users(),
          hrApi.platform.auditLogs({ page: 1, limit: 100 }),
        ]);

        const nextRoles = ((rolesRes.data.roles as Role[]) || []).slice().sort((left, right) => left.name.localeCompare(right.name));
        setRoles(nextRoles);
        setAllPerms((permsRes.data.permissions as Permission[]) || []);
        setUsers((usersRes.data as UserRow[]) || []);
        setAuditLogs((((auditRes.data || {}) as AuditLogResponse).logs || []).slice(0, 100));
        setRolePermissionCounts(await fetchRolePermissionCounts(nextRoles));
        setError(null);
      } catch (loadError) {
        const message = getApiErrorMessage(loadError, "Failed to load roles workspace.");
        setError(message);
        notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [fetchRolePermissionCounts]);

  const togglePerm = (permId: string) => {
    setAssigned((previous) => {
      const next = new Set(previous);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
    setSaveMsg("");
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    const ok = await confirm({
      title: "Save role permissions",
      message: `Apply permission changes for role \"${selectedRole.name}\"?`,
      confirmText: "Save",
    });
    if (!ok) return;

    setSaving(true);
    setSaveMsg("");
    try {
      const response = await hrApi.platform.updateRolePermissions(selectedRole.id, Array.from(assigned));
      const data = response.data;
      const nextAssigned = new Set(assigned);
      setOriginalAssigned(new Set(nextAssigned));
      setRolePermissionCounts((previous) => ({ ...previous, [selectedRole.id]: nextAssigned.size }));
      setSaveMsg(`Saved — ${data.granted} granted, ${data.revoked} revoked.`);
      notifySuccess(`Saved permissions: ${data.granted} granted, ${data.revoked} revoked.`);
    } catch (saveError) {
      const message = getApiErrorMessage(saveError, "Failed to save role permissions.");
      setSaveMsg(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    const trimmedName = newRoleName.trim();
    const trimmedDesc = newRoleDesc.trim();

    if (!trimmedName) {
      setCreateRoleMsg("Role name is required.");
      return;
    }

    const ok = await confirm({
      title: "Create role",
      message: `Create new role \"${trimmedName}\"?`,
      confirmText: "Create",
    });
    if (!ok) return;

    setCreatingRole(true);
    setCreateRoleMsg("");
    try {
      const response = await hrApi.platform.createRole({
        name: trimmedName,
        description: trimmedDesc || undefined,
      });

      const createdRole = (response.data?.role || response.data) as Role;
      setRoles((previous) =>
        [...previous.filter((role) => role.id !== createdRole.id), createdRole].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      );
      setRolePermissionCounts((previous) => ({ ...previous, [createdRole.id]: 0 }));
      setShowAddRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setCreateRoleMsg("");
      notifySuccess("Role added successfully.");
      await openRole(createdRole);
    } catch {
      setCreateRoleMsg(ADD_ROLE_FAILED_MESSAGE);
      notifyError(ADD_ROLE_FAILED_MESSAGE);
    } finally {
      setCreatingRole(false);
    }
  };

  const openEditRole = () => {
    if (!selectedRole) return;
    setEditRoleName(selectedRole.name);
    setEditRoleDesc(selectedRole.description || "");
    setEditRoleMsg("");
    setShowEditRole(true);
  };

  const updateRole = async () => {
    if (!selectedRole) return;

    const trimmedName = editRoleName.trim();
    const trimmedDesc = editRoleDesc.trim();

    if (!trimmedName) {
      setEditRoleMsg("Role name is required.");
      return;
    }

    const ok = await confirm({
      title: "Update role",
      message: `Save updates to role \"${selectedRole.name}\"?`,
      confirmText: "Update",
    });
    if (!ok) return;

    setEditingRole(true);
    setEditRoleMsg("");
    try {
      const response = await hrApi.platform.updateRole(selectedRole.id, {
        name: trimmedName,
        description: trimmedDesc || undefined,
      });

      const updatedRole = (response.data?.role || response.data) as Role;
      setRoles((previous) =>
        previous
          .map((role) => (role.id === updatedRole.id ? { ...role, ...updatedRole } : role))
          .sort((left, right) => left.name.localeCompare(right.name))
      );
      setSelectedRole((previous) =>
        previous && previous.id === updatedRole.id ? { ...previous, ...updatedRole } : previous
      );
      setShowEditRole(false);
      notifySuccess("Role updated successfully.");
    } catch (updateError) {
      const message = getApiErrorMessage(updateError, "Failed to update role. Please try again.");
      setEditRoleMsg(message);
      notifyError(message);
    } finally {
      setEditingRole(false);
    }
  };

  const deleteRole = async () => {
    if (!selectedRole) return;
    const ok = await confirm({
      title: "Delete role",
      message: `Delete role \"${selectedRole.name}\"? It will move to deleted records and related role-permission mappings will be deactivated.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingRole(true);
    setSaveMsg("");
    try {
      const deletingId = selectedRole.id;
      await hrApi.platform.deleteRole(deletingId);
      setRoles((previous) => previous.filter((role) => role.id !== deletingId));
      setRolePermissionCounts((previous) => {
        const next = { ...previous };
        delete next[deletingId];
        return next;
      });
      setSelectedRole(null);
      setAssigned(new Set());
      setOriginalAssigned(new Set());
      setSaveMsg("Role deleted.");
      notifySuccess("Role deleted successfully.");
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, "Failed to delete role. Please try again.");
      setSaveMsg(message);
      notifyError(message);
    } finally {
      setDeletingRole(false);
    }
  };

  const filteredRoles = useMemo(() => {
    const keyword = roleSearch.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter((role) =>
      role.name.toLowerCase().includes(keyword) ||
      (role.description ?? "").toLowerCase().includes(keyword)
    );
  }, [roleSearch, roles]);

  const roleUserCounts = useMemo(
    () =>
      Object.fromEntries(
        roles.map((role) => [
          role.id,
          users.filter((user) => (user.roles || []).includes(role.name)).length,
        ])
      ) as Record<string, number>,
    [roles, users]
  );

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
    [allPerms]
  );

  const selectedRoleUsers = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter((user) => (user.roles || []).includes(selectedRole.name));
  }, [selectedRole, users]);

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

  const hasUnsavedChanges = !compareAssignedSets(assigned, originalAssigned);
  const selectedRolePermissionCount = selectedRole ? rolePermissionCounts[selectedRole.id] ?? assigned.size : 0;
  const selectedRoleUserCount = selectedRole ? selectedRoleUsers.length : 0;

  const toggleModuleExpansion = (moduleKey: string) => {
    setExpandedModules((previous) => {
      const next = new Set(previous);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  };

  const toggleEntireModule = (moduleKey: string) => {
    const modulePermissions = groupedPermissions.get(moduleKey) ?? [];
    if (modulePermissions.length === 0) return;

    const allAssigned = modulePermissions.every((permission) => assigned.has(permission.id));
    setAssigned((previous) => {
      const next = new Set(previous);
      modulePermissions.forEach((permission) => {
        if (allAssigned) {
          next.delete(permission.id);
        } else {
          next.add(permission.id);
        }
      });
      return next;
    });
    setSaveMsg("");
  };

  const actionMenuItems = [
    ...(canEditRole ? [{ label: "Edit role", onClick: openEditRole }] : []),
    { label: "Open permissions catalog", onClick: () => router.push(ROUTES.PLATFORM_PERMISSIONS) },
    { label: "Open module mapping", onClick: () => router.push(ROUTES.PLATFORM_MODULE_MAPPING) },
    ...(canDeleteRole
      ? [{ label: deletingRole ? "Deleting..." : "Delete role", onClick: () => void deleteRole(), danger: true, disabled: deletingRole || saving || permLoading }]
      : []),
  ];

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_ROLES_VIEW}>
      <StandardPageLayout
        title="Roles & Access Control"
        subtitle="Manage role hierarchy, permission assignment, and access-control architecture from one cleaner governance workspace."
        eyebrow="Administration / Access Control"
        icon="shield"
      >
        {confirmDialog}

        {error && <div className="erp-alert-error mb-4">{error}</div>}

        <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="erp-panel flex h-fit max-h-[calc(100vh-13rem)] flex-col overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Roles</div>
                  <p className="mt-1 text-sm text-slate-500">
                    {loading ? "Loading role registry..." : `${roles.length} roles available for assignment governance.`}
                  </p>
                </div>
                {canCreateRole && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRole((previous) => !previous);
                      setCreateRoleMsg("");
                    }}
                    className="erp-action-btn erp-action-btn-primary"
                  >
                    {showAddRole ? "Close" : "+ Create Role"}
                  </button>
                )}
              </div>

              <div className="mt-4">
                <label className="erp-label">Search roles</label>
                <input
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.target.value)}
                  placeholder="Search by role name or description"
                  className="erp-input"
                />
              </div>
            </div>

            {showAddRole && (
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Create role</div>
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(event) => {
                      setNewRoleName(event.target.value);
                      setCreateRoleMsg("");
                    }}
                    placeholder="Role name (e.g. HR Manager)"
                    className="erp-input"
                  />
                  <textarea
                    value={newRoleDesc}
                    onChange={(event) => setNewRoleDesc(event.target.value)}
                    placeholder="Describe what this role can access"
                    className="erp-input min-h-24"
                  />
                  {createRoleMsg && <div className="text-xs text-red-500">{createRoleMsg}</div>}
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddRole(false);
                        setNewRoleName("");
                        setNewRoleDesc("");
                        setCreateRoleMsg("");
                      }}
                      className="erp-action-btn erp-action-btn-secondary"
                      disabled={creatingRole}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void createRole()}
                      className="erp-action-btn erp-action-btn-primary"
                      disabled={creatingRole}
                    >
                      {creatingRole ? "Creating..." : "Create Role"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {filteredRoles.map((role) => {
                  const selected = selectedRole?.id === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => void openRole(role)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-sky-200 bg-sky-50 shadow-sm ring-1 ring-sky-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`truncate text-sm font-semibold ${selected ? "text-sky-800" : "text-slate-800"}`}>
                            {role.name}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            {role.description || "No description provided for this role yet."}
                          </div>
                        </div>
                        {selected && (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 shadow-sm">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {roleUserCounts[role.id] ?? 0} users
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {rolePermissionCounts[role.id] ?? 0} permissions
                        </span>
                      </div>
                    </button>
                  );
                })}

                {!loading && filteredRoles.length === 0 && (
                  <div className="erp-empty">No roles match the current search.</div>
                )}
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            {!selectedRole ? (
              <div className="erp-empty min-h-[28rem]">
                Select a role from the left panel to manage permissions, assigned users, and recent access-control activity.
              </div>
            ) : (
              <div className="erp-panel overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-slate-900">{selectedRole.name}</h2>
                        {hasUnsavedChanges && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                            Unsaved changes
                          </span>
                        )}
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        {selectedRole.description || "Use this role to govern access across shared ERP modules and granular page actions."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {permLoading ? "Loading..." : `${assigned.size} assigned permissions`}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {selectedRoleUserCount} assigned users
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          Access control role
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 xl:w-auto xl:flex-row xl:items-center">
                      {saveMsg && (
                        <span className={`text-sm ${saveMsg.startsWith("Failed") ? "text-red-500" : "text-green-600"}`}>
                          {saveMsg}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => void savePermissions()}
                        disabled={saving || permLoading || !hasUnsavedChanges}
                        className="erp-action-btn erp-action-btn-primary"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <TableActionMenu label="More" items={actionMenuItems} />
                    </div>
                  </div>
                </div>

                {showEditRole && (
                  <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Edit role</div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <input
                        type="text"
                        value={editRoleName}
                        onChange={(event) => {
                          setEditRoleName(event.target.value);
                          setEditRoleMsg("");
                        }}
                        className="erp-input"
                        placeholder="Role name"
                      />
                      <input
                        type="text"
                        value={editRoleDesc}
                        onChange={(event) => setEditRoleDesc(event.target.value)}
                        className="erp-input"
                        placeholder="Description"
                      />
                    </div>
                    {editRoleMsg && <div className="mt-2 text-xs text-red-500">{editRoleMsg}</div>}
                    <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditRole(false);
                          setEditRoleMsg("");
                        }}
                        className="erp-action-btn erp-action-btn-secondary"
                        disabled={editingRole}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateRole()}
                        className="erp-action-btn erp-action-btn-primary"
                        disabled={editingRole}
                      >
                        {editingRole ? "Updating..." : "Update Role"}
                      </button>
                    </div>
                  </div>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "permissions" | "users" | "audit")} className="px-5 py-5">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
                    <TabsList>
                      <TabsTrigger value="permissions">Permissions ({selectedRolePermissionCount})</TabsTrigger>
                      <TabsTrigger value="users">Assigned Users ({selectedRoleUserCount})</TabsTrigger>
                      <TabsTrigger value="audit">Audit Logs ({relevantAuditLogs.length})</TabsTrigger>
                    </TabsList>

                    {activeTab === "permissions" && (
                      <div className="grid w-full gap-3 xl:w-auto xl:grid-cols-[minmax(16rem,22rem),auto]">
                        <input
                          value={permissionSearch}
                          onChange={(event) => setPermissionSearch(event.target.value)}
                          placeholder="Search permissions, routes, actions..."
                          className="erp-input"
                        />
                        <select
                          value={moduleFilter}
                          onChange={(event) => setModuleFilter(event.target.value)}
                          className="erp-select xl:min-w-52"
                        >
                          {moduleOptions.map((module) => (
                            <option key={module} value={module}>
                              {module === "all" ? "All modules" : humanize(module)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <TabsContent value="permissions" className="mt-5">
                    {permLoading ? (
                      <div className="erp-loading min-h-[18rem]">Loading permissions...</div>
                    ) : groupedPermissions.size === 0 ? (
                      <div className="erp-empty min-h-[18rem]">
                        No permissions match the current filters.
                      </div>
                    ) : (
                      <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
                        {Array.from(groupedPermissions.entries()).map(([moduleKey, modulePermissions]) => {
                          const assignedCount = modulePermissions.filter((permission) => assigned.has(permission.id)).length;
                          const partiallyAssigned = assignedCount > 0 && assignedCount < modulePermissions.length;
                          const expanded = expandedModules.has(moduleKey) || permissionSearch.trim().length > 0;

                          return (
                            <div key={moduleKey} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                              <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleExpansion(moduleKey)}
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${expanded ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                                    {expanded ? "−" : "+"}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <ModuleBadge module={moduleKey} />
                                      <span className="text-sm font-semibold text-slate-900">{humanize(moduleKey)}</span>
                                      {partiallyAssigned && (
                                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                                          Partial
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      {assignedCount} of {modulePermissions.length} permissions assigned
                                    </div>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={assignedCount > 0}
                                  onClick={() => toggleEntireModule(moduleKey)}
                                  className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                    assignedCount > 0
                                      ? "border-sky-200 bg-sky-50 text-sky-800"
                                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{assignedCount > 0 ? "Module access on" : "Module access off"}</span>
                                  <span
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                      assignedCount > 0 ? "bg-sky-600" : "bg-slate-300"
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                        assignedCount > 0 ? "translate-x-5" : "translate-x-1"
                                      }`}
                                    />
                                  </span>
                                </button>
                              </div>

                              {expanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                                  <div className="space-y-3">
                                    {modulePermissions.map((permission) => {
                                      const enabled = assigned.has(permission.id);
                                      return (
                                        <button
                                          key={permission.id}
                                          type="button"
                                          onClick={() => togglePerm(permission.id)}
                                          className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                                            enabled
                                              ? "border-sky-200 bg-white shadow-sm"
                                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                          }`}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold text-slate-900">{getPermissionLabel(permission)}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                              {permission.description || permission.name}
                                            </div>
                                          </div>
                                          <span
                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                                              enabled ? "bg-sky-600" : "bg-slate-300"
                                            }`}
                                          >
                                            <span
                                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                                enabled ? "translate-x-5" : "translate-x-1"
                                              }`}
                                            />
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="users">
                    {selectedRoleUsers.length === 0 ? (
                      <div className="erp-empty min-h-[18rem]">
                        No active users are currently assigned to this role.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedRoleUsers.map((user) => (
                          <div key={user.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{user.fullName || user.email}</div>
                                <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-slate-500">Roles: {(user.roles || []).join(", ") || "—"}</div>
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

                  <TabsContent value="audit">
                    {relevantAuditLogs.length === 0 ? (
                      <div className="erp-empty min-h-[18rem]">
                        No recent access-control activity matched this role yet.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="erp-td text-sm text-slate-600">{log.performedBy || "System"}</td>
                                  <td className="erp-td text-sm text-slate-500">{new Date(log.performedAt).toLocaleString()}</td>
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
            )}
          </section>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
