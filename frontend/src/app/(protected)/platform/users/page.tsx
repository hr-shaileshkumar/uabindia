"use client";

import { useEffect, useMemo, useState } from "react";
import { orgApi, platformApi } from "@/services/modules";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import QuickEditDrawer from "@/components/ui/QuickEditDrawer";
import EntityProfileCard from "@/components/ui/EntityProfileCard";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";
import { CrudCard } from "@/components/erp/crud-workspace";
import { UserTable } from "@/features/platform/components/UserTable";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";


interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isDeleted?: boolean;
  roles?: string[];
  tenantId?: string;
}

interface RoleRow {
  id: string;
  name: string;
}

interface TenantRow {
  id: string;
  name: string;
  subdomain?: string;
}

interface UserFormState {
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
  roles: string[];
  tenantId: string;
}

interface QuickUserEditState {
  fullName: string;
  isActive: boolean;
  roles: string[];
}

const emptyForm = (): UserFormState => ({
  fullName: "",
  email: "",
  password: "",
  isActive: true,
  roles: [],
  tenantId: "",
});

export default function UsersPage() {
  const { isSuperAdmin } = useAuth();
  const { companyId: ctxCompanyId } = useOrgContext();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [companyTenantMap, setCompanyTenantMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [quickEditUser, setQuickEditUser] = useState<UserRow | null>(null);
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditForm, setQuickEditForm] = useState<QuickUserEditState>({
    fullName: "",
    isActive: true,
    roles: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const selection = useTableSelection<UserRow>();

  const load = async (includeDeletedFlag?: boolean) => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const [usersRes, rolesRes, companiesRes, tenantsRes] = await Promise.all([
          platformApi.admin.users(includeDeletedFlag ?? showDeleted),
          platformApi.admin.roles(),
          orgApi.company.getAllForSuperAdmin(),
          platformApi.admin.tenants(),
        ]);

        const companies = Array.isArray((companiesRes.data as { companies?: Array<{ id: string; tenantId: string }> }).companies)
          ? (companiesRes.data as { companies: Array<{ id: string; tenantId: string }> }).companies
          : [];
        const nextMap: Record<string, string> = {};
        companies.forEach((company) => {
          if (company?.id && company?.tenantId) {
            nextMap[company.id] = company.tenantId;
          }
        });

        const tenantsData = Array.isArray((tenantsRes.data as { tenants?: TenantRow[] }).tenants)
          ? (tenantsRes.data as { tenants: TenantRow[] }).tenants
          : Array.isArray(tenantsRes.data) ? (tenantsRes.data as TenantRow[]) : [];

        setUsers(usersRes.data || []);
        setRoles(rolesRes.data.roles || []);
        setCompanyTenantMap(nextMap);
        setTenants(tenantsData);
      } else {
        const [usersRes, rolesRes] = await Promise.all([
          platformApi.admin.users(includeDeletedFlag ?? showDeleted),
          platformApi.admin.roles(),
        ]);

        setUsers(usersRes.data || []);
        setRoles(rolesRes.data.roles || []);
        setCompanyTenantMap({});
      }
      setError(null);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load users");
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted, ctxCompanyId]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    if (showDeleted) {
      if (!user.isDeleted) return false;
    } else if (user.isDeleted) {
      return false;
    }

    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      user.fullName?.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      (user.roles || []).join(" ").toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive);

    if (isSuperAdmin && ctxCompanyId) {
      const tenantId = companyTenantMap[ctxCompanyId];
      if (!tenantId || user.tenantId !== tenantId) return false;
    }

    return matchesKeyword && matchesStatus;
  }), [users, showDeleted, search, statusFilter, isSuperAdmin, ctxCompanyId, companyTenantMap]);

  useEffect(() => {
    selection.setItems(filteredUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers]);

  const userBulkFields: BulkActionFieldConfig[] = [
    { key: "isActive", label: "Active Status", fieldType: "boolean" },
  ];

  const isFormOpen = editingUserId !== null || Boolean(form.email || form.fullName || form.password || form.roles.length || form.tenantId);
  const activeUsers = filteredUsers.filter((user) => user.isActive && !user.isDeleted).length;
  const inactiveUsers = filteredUsers.filter((user) => !user.isActive && !user.isDeleted).length;
  const deletedUsers = filteredUsers.filter((user) => user.isDeleted).length;

  const toggleRole = (roleName: string) => {
    setForm((prev) => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((role) => role !== roleName) : [...prev.roles, roleName],
      };
    });
  };

  const toggleQuickRole = (roleName: string) => {
    setQuickEditForm((prev) => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((role) => role !== roleName) : [...prev.roles, roleName],
      };
    });
  };

  const openCreate = () => {
    setError(null);
    setEditingUserId(null);
    setForm(emptyForm());
    setSelectedUser(null);
  };

  const openFullEdit = (user: UserRow) => {
    setError(null);
    setEditingUserId(user.id);
    setForm({
      fullName: user.fullName || "",
      email: user.email,
      password: "",
      isActive: user.isActive,
      roles: user.roles || [],
      tenantId: user.tenantId || "",
    });
  };

  const closeForm = () => {
    setEditingUserId(null);
    setForm(emptyForm());
  };

  const openQuickEdit = (user: UserRow) => {
    setQuickEditUser(user);
    setQuickEditForm({
      fullName: user.fullName || "",
      isActive: user.isActive,
      roles: user.roles || [],
    });
  };

  const closeQuickEdit = () => {
    setQuickEditUser(null);
  };

  const handleSave = async () => {
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!editingUserId && !form.password.trim()) {
      setError("Password is required for new user.");
      return;
    }

    if (isSuperAdmin && !editingUserId && !form.tenantId) {
      setError("Tenant is required when creating a user as SuperAdmin.");
      return;
    }

    const ok = await confirm({
      title: editingUserId ? "Update user" : "Create user",
      message: editingUserId
        ? `Confirm updating user "${form.email.trim() || "selected user"}"?`
        : `Confirm creating user "${form.email.trim()}"?`,
      confirmText: editingUserId ? "Update" : "Create",
    });
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      if (editingUserId) {
        await platformApi.admin.updateUser(editingUserId, {
          fullName: form.fullName.trim() || undefined,
          password: form.password.trim() || undefined,
          isActive: form.isActive,
          roles: form.roles,
        });
        notifySuccess("User updated successfully.");
      } else {
        await platformApi.admin.createUser({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim() || undefined,
          isActive: form.isActive,
          roles: form.roles,
          ...(isSuperAdmin && form.tenantId ? { tenantId: form.tenantId } : {}),
        });
        notifySuccess("User created successfully.");
      }

      closeForm();
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save user");
      setError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickEditSave = async () => {
    if (!quickEditUser) return;

    const ok = await confirm({
      title: "Quick update user",
      message: `Confirm quick update for "${quickEditUser.email}"?`,
      confirmText: "Update",
    });
    if (!ok) return;

    setQuickEditSaving(true);
    try {
      await platformApi.admin.updateUser(quickEditUser.id, {
        fullName: quickEditForm.fullName.trim() || undefined,
        isActive: quickEditForm.isActive,
        roles: quickEditForm.roles,
      });
      notifySuccess("User quick-updated successfully.");
      closeQuickEdit();
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to quick update user");
      setError(message);
      notifyError(message);
    } finally {
      setQuickEditSaving(false);
    }
  };

  const handleDelete = async (user: UserRow) => {
    const ok = await confirm({
      title: "Delete user",
      message: `Delete user "${user.email}"? It will move to deleted records and can be restored later.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await platformApi.admin.deleteUser(user.id);
      notifySuccess("User deleted successfully.");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to delete user");
      setError(message);
      notifyError(message);
    }
  };

  const handleRestore = async (user: UserRow) => {
    try {
      await platformApi.admin.recycleBin.restore("Users", user.id);
      notifySuccess("User restored successfully.");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to restore user");
      setError(message);
      notifyError(message);
    }
  };

  const handleHardDelete = async (user: UserRow) => {
    const ok = await confirm({
      title: "Permanent delete user",
      message: `Permanently delete user "${user.email}" from database? This cannot be undone.`,
      confirmText: "Permanent Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await platformApi.admin.recycleBin.hardDelete("Users", user.id);
      notifySuccess("User permanently deleted.");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to permanently delete user");
      setError(message);
      notifyError(message);
    }
  };

  const handleBulkDelete = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Delete selected users",
      message: `Delete ${count} selected user${count === 1 ? "" : "s"}?`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!ok) return;

    let successCount = 0;
    for (const user of selection.selectedItems) {
      try {
        await platformApi.admin.deleteUser(user.id);
        successCount += 1;
      } catch {
        // Continue processing remaining rows.
      }
    }

    selection.clearSelection();
    notifySuccess(`Deleted ${successCount} of ${count} user${count === 1 ? "" : "s"}.`);
    await load();
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    let successCount = 0;
    const count = selection.selectionCount;
    for (const user of selection.selectedItems) {
      try {
        await platformApi.admin.updateUser(user.id, updates as { isActive?: boolean; roles?: string[]; fullName?: string; password?: string });
        successCount += 1;
      } catch {
        // Continue processing remaining rows.
      }
    }
    setBulkApplying(false);
    setBulkEditOpen(false);
    selection.clearSelection();
    notifySuccess(`Updated ${successCount} of ${count} user${count === 1 ? "" : "s"}.`);
    await load();
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total Users", value: filteredUsers.length, tone: "info", subtext: "Directory" },
    { label: "Active Accounts", value: activeUsers, tone: "positive", subtext: "Active" },
    { label: "Inactive Users", value: inactiveUsers, tone: "warning", subtext: "Inactive" },
    { label: "Soft-Deleted", value: deletedUsers, tone: "negative", subtext: "Recycle Bin" },
  ];

  return (
    <PlatformGlobalPageShell
      title="User Directory & Identity Management"
      subtitle="Manage application users, multi-tenant activation states, role assignments, and session postures."
      categoryTag="User Access Governance"
      kpiMetrics={kpis}
      primaryActionLabel="Create User"
      onPrimaryAction={openCreate}
    >
      <div className="p-4 space-y-5">
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(13rem,0.8fr)]">
          <div>
            <label className="erp-label">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role..."
              className="erp-input"
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="erp-select"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      {confirmDialog}
      {error ? <div className="erp-alert-error">{error}</div> : null}

      {selection.selectionCount > 0 && !isFormOpen ? (
        <BulkActionBar
          selectionCount={selection.selectionCount}
          onEdit={() => setBulkEditOpen(true)}
          onRefresh={() => {
            selection.clearSelection();
            void load();
          }}
          onDelete={() => void handleBulkDelete()}
          onClear={selection.clearSelection}
          loading={bulkApplying}
        />
      ) : null}

      {bulkEditOpen && !isFormOpen ? (
        <BulkEditDialog
          fields={userBulkFields}
          selectionCount={selection.selectionCount}
          onApply={handleBulkEdit}
          onClose={() => setBulkEditOpen(false)}
          loading={bulkApplying}
        />
      ) : null}

      {isFormOpen ? (
        <CrudCard
          title={editingUserId ? "Edit User" : "Create User"}
          description="Use one compact form surface for identity, activation, and role assignment."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isSuperAdmin && !editingUserId ? (
              <div className="md:col-span-2">
                <label className="erp-label">Tenant *</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => setForm((prev) => ({ ...prev, tenantId: e.target.value }))}
                  className="erp-select"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}{tenant.subdomain ? ` (${tenant.subdomain})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="erp-label">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={Boolean(editingUserId)}
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Password {editingUserId ? "(optional)" : "*"}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="erp-input"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="erp-label">Roles</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const selected = form.roles.includes(role.name);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.name)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-slate-400 bg-slate-100 text-slate-800"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="erp-form-actions border-t border-slate-100 pt-4">
            <button onClick={handleSave} disabled={saving} className="erp-action-btn erp-action-btn-primary">
              {saving ? "Saving..." : editingUserId ? "Update User" : "Create User"}
            </button>
            <button onClick={closeForm} className="erp-action-btn erp-action-btn-secondary">
              Cancel
            </button>
          </div>
        </CrudCard>
      ) : null}

      <CrudCard
        title="User Directory"
        description="Review identity records, activation state, roles, and tenant mapping in a single dense grid."
        badge={<span className="erp-toolbar-badge">{loading ? "Loading..." : `${filteredUsers.length} users`}</span>}
        actions={selectedUser ? (
          <button type="button" onClick={() => setSelectedUser(null)} className="erp-action-btn erp-action-btn-secondary">
            Hide Details
          </button>
        ) : null}
      >
        <UserTable
          users={filteredUsers}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          showDeleted={showDeleted}
          selection={selection}
          onSelectUser={setSelectedUser}
          onQuickEdit={openQuickEdit}
          onFullEdit={openFullEdit}
          onDelete={(u) => void handleDelete(u)}
          onRestore={(u) => void handleRestore(u)}
          onHardDelete={(u) => void handleHardDelete(u)}
        />
      </CrudCard>

      {selectedUser ? (
        <EntityProfileCard
          title={selectedUser.fullName || selectedUser.email}
          subtitle="User profile details"
          badge={
            <span className={selectedUser.isDeleted ? "erp-chip erp-chip-danger" : selectedUser.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {selectedUser.isDeleted ? "Deleted" : selectedUser.isActive ? "Active" : "Inactive"}
            </span>
          }
          items={[
            { label: "Email", value: selectedUser.email },
            { label: "Roles", value: selectedUser.roles?.join(", ") || "-" },
            { label: "Tenant", value: selectedUser.tenantId || "-" },
            { label: "Record ID", value: `${selectedUser.id.slice(0, 12)}...` },
          ]}
          footer={
            <div className="flex flex-wrap gap-2">
              {!selectedUser.isDeleted ? (
                <>
                  <button type="button" onClick={() => openQuickEdit(selectedUser)} className="erp-action-btn erp-action-btn-secondary">
                    Quick Edit
                  </button>
                  <button type="button" onClick={() => openFullEdit(selectedUser)} className="erp-action-btn erp-action-btn-primary">
                    Open Full Edit
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => void handleRestore(selectedUser)} className="erp-action-btn erp-action-btn-secondary">
                  Restore
                </button>
              )}
            </div>
          }
        />
      ) : null}

      <QuickEditDrawer
        open={Boolean(quickEditUser)}
        title="Quick Edit User"
        subtitle="Fast rename, role, and status changes"
        onClose={closeQuickEdit}
        onSave={() => void handleQuickEditSave()}
        saveLabel="Update User"
        saving={quickEditSaving}
      >
        <div>
          <label className="erp-label">Full Name</label>
          <input
            type="text"
            value={quickEditForm.fullName}
            onChange={(event) => setQuickEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="erp-input"
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={quickEditForm.isActive}
              onChange={(event) => setQuickEditForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Active user
          </label>
        </div>
        <div>
          <label className="erp-label">Roles</label>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => {
              const selected = quickEditForm.roles.includes(role.name);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleQuickRole(role.name)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "border-slate-400 bg-slate-100 text-slate-800"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {role.name}
                </button>
              );
            })}
          </div>
        </div>
      </QuickEditDrawer>
      </div>
    </PlatformGlobalPageShell>
  );
}
