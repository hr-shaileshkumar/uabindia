"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";
import { TableActionMenu } from "@/components/table/TableActionMenu";
import QuickEditDrawer from "@/components/ui/QuickEditDrawer";
import EntityProfileCard from "@/components/ui/EntityProfileCard";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";

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
  // Platform pages are global admin views – intentionally ignore topbar org context
  const { companyId: ctxCompanyId } = useOrgContext();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [companyTenantMap, setCompanyTenantMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
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

  const load = async (includeDeletedFlag?: boolean) => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const [usersRes, rolesRes, companiesRes, tenantsRes] = await Promise.all([
          hrApi.platform.users(includeDeletedFlag ?? showDeleted),
          hrApi.platform.roles(),
          hrApi.company.getAllForSuperAdmin(),
          hrApi.platform.tenants(),
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
          hrApi.platform.users(includeDeletedFlag ?? showDeleted),
          hrApi.platform.roles(),
        ]);

        setUsers(usersRes.data || []);
        setRoles(rolesRes.data.roles || []);
        setCompanyTenantMap({});
      }
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load users");
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted, ctxCompanyId]);

  const toggleRole = (roleName: string) => {
    setForm((prev) => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((r) => r !== roleName) : [...prev.roles, roleName],
      };
    });
  };

  const openCreate = () => {
    setError(null);
    setEditingUserId(null);
    setForm(emptyForm());
    setActiveTab("form");
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
    setActiveTab("form");
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

  const toggleQuickRole = (roleName: string) => {
    setQuickEditForm((prev) => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((r) => r !== roleName) : [...prev.roles, roleName],
      };
    });
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
      await hrApi.platform.updateUser(quickEditUser.id, {
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

  const closeForm = () => {
    setActiveTab("list");
    setEditingUserId(null);
    setForm(emptyForm());
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
    if (!ok) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingUserId) {
        await hrApi.platform.updateUser(editingUserId, {
          fullName: form.fullName.trim() || undefined,
          password: form.password.trim() || undefined,
          isActive: form.isActive,
          roles: form.roles,
        });
        notifySuccess("User updated successfully.");
      } else {
        await hrApi.platform.createUser({
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

  const handleDelete = async (user: UserRow) => {
    const ok = await confirm({
      title: "Delete user",
      message: `Delete user "${user.email}"? It will move to deleted records and can be restored later.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    setError(null);

    try {
      await hrApi.platform.deleteUser(user.id);
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
      await hrApi.platform.recycleBin.restore("Users", user.id);
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
      await hrApi.platform.recycleBin.hardDelete("Users", user.id);
      notifySuccess("User permanently deleted.");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to permanently delete user");
      setError(message);
      notifyError(message);
    }
  };

  const filteredUsers = useMemo(() => users.filter((u) => {
    if (showDeleted) {
      if (!u.isDeleted) return false;
    } else if (u.isDeleted) {
      return false;
    }

    const keyword = search.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      u.fullName?.toLowerCase().includes(keyword) ||
      u.email.toLowerCase().includes(keyword) ||
      (u.roles || []).join(" ").toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);

    // When a specific company is selected, show only users of that company's tenant
    if (isSuperAdmin && ctxCompanyId) {
      const tenantId = companyTenantMap[ctxCompanyId];
      if (!tenantId || u.tenantId !== tenantId) return false;
    }

    return matchesKeyword && matchesStatus;
  }), [users, showDeleted, search, statusFilter, isSuperAdmin, ctxCompanyId, companyTenantMap]);

  // ─── Bulk selection ──────────────────────────────────────────────────────────
  const selection = useTableSelection<UserRow>();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const userBulkFields: BulkActionFieldConfig[] = [
    { key: "isActive", label: "Active Status", fieldType: "boolean" },
  ];

  useEffect(() => {
    selection.setItems(filteredUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers]);

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
    for (const u of selection.selectedItems) {
      try { await hrApi.platform.deleteUser(u.id); successCount += 1; } catch { /* continue */ }
    }
    selection.clearSelection();
    notifySuccess(`Deleted ${successCount} of ${count} user${count === 1 ? "" : "s"}.`);
    await load();
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    let successCount = 0;
    const count = selection.selectionCount;
    for (const u of selection.selectedItems) {
      try {
        await hrApi.platform.updateUser(u.id, updates as { isActive?: boolean; roles?: string[]; fullName?: string; password?: string });
        successCount += 1;
      } catch { /* continue */ }
    }
    setBulkApplying(false);
    setBulkEditOpen(false);
    selection.clearSelection();
    notifySuccess(`Updated ${successCount} of ${count} user${count === 1 ? "" : "s"}.`);
    await load();
  };

  return (
    <StandardPageLayout
      title="Users"
      subtitle="Manage application users, activation state, and access posture."
      eyebrow="Administration / Access"
      icon="employees"
      actions={
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          <button
            onClick={() => setShowDeleted((prev) => !prev)}
            className={`erp-action-btn w-full lg:w-auto ${showDeleted ? "erp-action-btn-warning" : "erp-action-btn-secondary"}`}
          >
            {showDeleted ? "Hide Deleted" : "Show Deleted"}
          </button>
          <button onClick={openCreate} className="erp-action-btn erp-action-btn-primary w-full lg:w-auto">
            Create User
          </button>
        </div>
      }
      filters={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
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
      }
    >
      {confirmDialog}

      {/* KPI summary cards – counts reflect current filter (company/status) */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Users</p><p className="erp-kpi-value">{filteredUsers.length}</p><p className="erp-kpi-meta">All registered accounts</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{filteredUsers.filter(u => u.isActive && !u.isDeleted).length}</p><p className="erp-kpi-meta">Accounts with access</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Inactive</p><p className="erp-kpi-value">{filteredUsers.filter(u => !u.isActive && !u.isDeleted).length}</p><p className="erp-kpi-meta">Suspended accounts</p></div>
        <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Deleted</p><p className="erp-kpi-value erp-kpi-value-danger">{filteredUsers.filter(u => u.isDeleted).length}</p><p className="erp-kpi-meta">Soft-deleted records</p></div>
      </div>

      {error && <div className="erp-alert-error mb-4">{error}</div>}

      <div className="overflow-x-auto border-b border-gray-200 mb-4">
        <div className="flex min-w-max gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              activeTab === "list"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            User List ({filteredUsers.length})
          </button>
          {(activeTab === "form" || editingUserId) && (
            <button
              onClick={() => setActiveTab("form")}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                activeTab === "form"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {editingUserId ? "Edit User" : "Create User"}
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {activeTab === "list" && selection.selectionCount > 0 && (
        <BulkActionBar
          selectionCount={selection.selectionCount}
          onEdit={() => setBulkEditOpen(true)}
          onRefresh={() => { selection.clearSelection(); void load(); }}
          onDelete={() => void handleBulkDelete()}
          onClear={selection.clearSelection}
          loading={bulkApplying}
        />
      )}

      {activeTab === "list" && bulkEditOpen && (
        <BulkEditDialog
          fields={userBulkFields}
          selectionCount={selection.selectionCount}
          onApply={handleBulkEdit}
          onClose={() => setBulkEditOpen(false)}
          loading={bulkApplying}
        />
      )}

      {activeTab === "form" && (
        <div className="erp-panel mb-4 erp-panel-body erp-kpi-card erp-kpi-card-info erp-kpi-action-card space-y-4">
          <div className="text-sm font-semibold text-slate-800">{editingUserId ? "Edit User" : "Create User"}</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isSuperAdmin && !editingUserId && (
              <div className="md:col-span-2">
                <label className="erp-label">Tenant *</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => setForm((prev) => ({ ...prev, tenantId: e.target.value }))}
                  className="erp-select"
                >
                  <option value="">— select tenant —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.subdomain ? ` (${t.subdomain})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="erp-kpi-action-footer border-t border-slate-100 pt-4">
            <button onClick={handleSave} disabled={saving} className="erp-action-btn erp-action-btn-primary">
              {saving ? "Saving..." : editingUserId ? "Update User" : "Create User"}
            </button>
            <button onClick={closeForm} className="erp-action-btn erp-action-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === "list" && (
      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">User directory</div>
            <div className="erp-table-subtitle">Review identity records and activation state in a denser enterprise grid.</div>
          </div>
          <span className="erp-toolbar-badge">{loading ? "Loading..." : `${filteredUsers.length} users`}</span>
        </div>
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">
                  <SelectAllCheckbox
                    checked={selection.isAllSelected}
                    indeterminate={selection.isIndeterminate}
                    onChange={selection.isAllSelected ? selection.clearSelection : selection.selectAll}
                  />
                </th>
                <th className="erp-th">Name</th>
                <th className="erp-th">Email</th>
                <th className="erp-th">Roles</th>
                {isSuperAdmin && <th className="erp-th">Tenant ID</th>}
                <th className="erp-th">Status</th>
                <th className="erp-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className={`erp-tr${u.isDeleted ? " opacity-50 bg-red-50" : ""}`}>
                  <td className="erp-td">
                    <SelectionCheckbox
                      checked={selection.isSelected(u.id)}
                      onChange={() => selection.toggleSelection(u.id)}
                      label={`Select ${u.email}`}
                    />
                  </td>
                  <td className="erp-td">
                    <div className="erp-row-title">{u.fullName}</div>
                    <div className="erp-row-meta">Application identity record</div>
                  </td>
                  <td className="erp-td text-sm text-slate-700">{u.email}</td>
                  <td className="erp-td text-xs text-slate-600">{u.roles?.join(", ") || "-"}</td>
                  {isSuperAdmin && (
                    <td className="erp-td text-xs text-slate-500 font-mono">
                      {u.tenantId ? u.tenantId.slice(0, 8) + "…" : "—"}
                    </td>
                  )}
                  <td className="erp-td">
                    <span className={u.isDeleted ? "erp-chip erp-chip-error" : u.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                      {u.isDeleted ? "Deleted" : u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="erp-td">
                    <TableActionMenu
                      items={
                        !u.isDeleted
                          ? [
                              { label: "View Details", onClick: () => setSelectedUser(u) },
                              { label: "Quick Edit", onClick: () => openQuickEdit(u) },
                              { label: "Open Full Edit", onClick: () => openFullEdit(u) },
                              { label: "Delete", onClick: () => void handleDelete(u), danger: true },
                            ]
                          : [
                              { label: "Restore", onClick: () => void handleRestore(u) },
                              { label: "Permanent Delete", onClick: () => void handleHardDelete(u), danger: true },
                            ]
                      }
                    />
                  </td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="erp-td py-8 text-center text-slate-500">{showDeleted ? "No deleted users found for selected filters." : "No users found for selected filters."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === "list" && selectedUser && (
        <div className="mt-4">
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
              { label: "Roles", value: selectedUser.roles?.join(", ") || "—" },
              { label: "Tenant", value: selectedUser.tenantId || "—" },
              { label: "Record ID", value: selectedUser.id.slice(0, 12) + "…" },
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
        </div>
      )}

      <QuickEditDrawer
        open={Boolean(quickEditUser)}
        title="Quick Edit User"
        subtitle="Fast rename/role/status changes"
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
                      ? "border-blue-300 bg-blue-50 text-blue-700"
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
    </StandardPageLayout>
  );
}
