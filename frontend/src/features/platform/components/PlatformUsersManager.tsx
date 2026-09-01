"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  UserCircle2, Mail, Shield, ShieldOff, Users, Building2, 
  RotateCcw, Trash2, KeyRound, Eye
} from "lucide-react";
import { orgApi, platformApi } from "@/services/modules";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";
import { PlatformGlobalPageShell, type KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isDeleted?: boolean;
  roles?: string[];
  tenantId?: string;
}

export interface RoleRow { id: string; name: string; }
export interface TenantRow { id: string; name: string; subdomain?: string; }

interface UserFormState {
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
  roles: string[];
  tenantId: string;
}

const emptyForm = (): UserFormState => ({
  fullName: "", email: "", password: "", isActive: true, roles: [], tenantId: "",
});

function userInitials(name: string, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const USER_AVATAR_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-teal-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-green-600",
  "from-blue-500 to-indigo-600",
];

function avatarColor(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return USER_AVATAR_COLORS[hash % USER_AVATAR_COLORS.length];
}

export function PlatformUsersManager() {
  const { isSuperAdmin } = useAuth();
  const { companyId: ctxCompanyId } = useOrgContext();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [companyTenantMap, setCompanyTenantMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<"closed" | "create" | "edit" | "view">("closed");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<UserRow | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkRowIds, setBulkRowIds] = useState<string[]>([]);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"profile" | "roles" | "security">("profile");

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
        companies.forEach((c) => { if (c?.id && c?.tenantId) nextMap[c.id] = c.tenantId; });
        const tenantsData = Array.isArray((tenantsRes.data as { tenants?: TenantRow[] }).tenants)
          ? (tenantsRes.data as { tenants: TenantRow[] }).tenants
          : Array.isArray(tenantsRes.data) ? (tenantsRes.data as TenantRow[]) : [];
        setUsers((usersRes.data as UserRow[]) || []);
        setRoles(rolesRes.data.roles || []);
        setCompanyTenantMap(nextMap);
        setTenants(tenantsData);
      } else {
        const [usersRes, rolesRes] = await Promise.all([
          platformApi.admin.users(includeDeletedFlag ?? showDeleted),
          platformApi.admin.roles(),
        ]);
        setUsers((usersRes.data as UserRow[]) || []);
        setRoles(rolesRes.data.roles || []);
        setCompanyTenantMap({});
      }
      setError(null);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load users");
      setError(msg); notifyError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [showDeleted, ctxCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = useMemo(() =>
    users.filter((user) => {
      if (showDeleted) { if (!user.isDeleted) return false; }
      else if (user.isDeleted) return false;
      const kw = search.trim().toLowerCase();
      const matchesKeyword = !kw || user.fullName?.toLowerCase().includes(kw) ||
        user.email.toLowerCase().includes(kw) || (user.roles || []).join(" ").toLowerCase().includes(kw);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive);
      if (isSuperAdmin && ctxCompanyId) {
        const tenantId = companyTenantMap[ctxCompanyId];
        if (!tenantId || user.tenantId !== tenantId) return false;
      }
      return matchesKeyword && matchesStatus;
    }), [users, showDeleted, search, statusFilter, isSuperAdmin, ctxCompanyId, companyTenantMap]
  );

  const userBulkFields: BulkActionFieldConfig[] = [{ key: "isActive", label: "Active Status", fieldType: "boolean" }];
  const activeUsers = filteredUsers.filter((u) => u.isActive && !u.isDeleted).length;
  const inactiveUsers = filteredUsers.filter((u) => !u.isActive && !u.isDeleted).length;

  const tenantName = (tenantId?: string) => {
    if (!tenantId) return "—";
    const match = tenants.find((t) => t.id === tenantId);
    return match ? `${match.name}${match.subdomain ? ` (${match.subdomain})` : ""}` : tenantId.slice(0, 8);
  };

  const toggleRole = (roleName: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName) ? prev.roles.filter((r) => r !== roleName) : [...prev.roles, roleName],
    }));
  };

  const closeInspector = () => { setMode("closed"); setEditingUser(null); setForm(emptyForm()); setError(null); };
  const openCreate = () => { setError(null); setEditingUser(null); setForm(emptyForm()); setActiveFormTab("profile"); setMode("create"); };
  const openEdit = (user: UserRow) => {
    setError(null); setEditingUser(user);
    setForm({ fullName: user.fullName || "", email: user.email, password: "", isActive: user.isActive, roles: user.roles || [], tenantId: user.tenantId || "" });
    setActiveFormTab("profile"); setMode("edit");
  };
  const openView = (user: UserRow) => {
    setError(null); setEditingUser(user);
    setForm({ fullName: user.fullName || "", email: user.email, password: "", isActive: user.isActive, roles: user.roles || [], tenantId: user.tenantId || "" });
    setActiveFormTab("profile"); setMode("view");
  };

  const handleSave = async () => {
    if (mode === "view") return;
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (mode === "create" && !form.password.trim()) { setError("Password is required for new users."); return; }
    if (isSuperAdmin && mode === "create" && !form.tenantId) { setError("Tenant is required when creating a user as SuperAdmin."); return; }
    setSaving(true); setError(null);
    try {
      if (mode === "edit" && editingUser) {
        await platformApi.admin.updateUser(editingUser.id, { fullName: form.fullName.trim() || undefined, password: form.password.trim() || undefined, isActive: form.isActive, roles: form.roles });
        notifySuccess("User updated successfully.");
      } else {
        await platformApi.admin.createUser({ email: form.email.trim(), password: form.password, fullName: form.fullName.trim() || undefined, isActive: form.isActive, roles: form.roles, ...(isSuperAdmin && form.tenantId ? { tenantId: form.tenantId } : {}) });
        notifySuccess("User created successfully.");
      }
      closeInspector(); await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to save user"); setError(msg); notifyError(msg);
    } finally { setSaving(false); }
  };

  const handleRestore = async (user: UserRow) => {
    try { await platformApi.admin.recycleBin.restore("Users", user.id); notifySuccess("User restored."); await load(); }
    catch (err) { notifyError(getApiErrorMessage(err, "Failed to restore user")); }
  };

  const handleBulkDelete = async (rows: UserRow[]) => {
    const count = rows.length;
    const ok = await confirm({ title: "Delete selected users", message: `Delete ${count} user${count === 1 ? "" : "s"}?`, confirmText: "Delete All", variant: "danger" });
    if (!ok) return;
    let successCount = 0;
    for (const user of rows) {
      try { await platformApi.admin.deleteUser(user.id); successCount++; } catch { /* continue */ }
    }
    notifySuccess(`Deleted ${successCount} of ${count} user${count === 1 ? "" : "s"}.`);
    await load();
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    const count = bulkRowIds.length;
    const selected = users.filter((u) => bulkRowIds.includes(u.id));
    let successCount = 0;
    for (const user of selected) {
      try { await platformApi.admin.updateUser(user.id, updates as { isActive?: boolean; roles?: string[]; fullName?: string; password?: string; }); successCount++; } catch { /* continue */ }
    }
    setBulkApplying(false); setBulkEditOpen(false); setBulkRowIds([]);
    notifySuccess(`Updated ${successCount} of ${count} user${count === 1 ? "" : "s"}.`);
    await load();
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total Users", value: users.filter((u) => !u.isDeleted).length, tone: "info", icon: <Users className="h-3.5 w-3.5" />, subtext: "Directory" },
    { label: "Active", value: activeUsers, tone: "positive", icon: <Shield className="h-3.5 w-3.5" />, subtext: "Can sign in" },
    { label: "Inactive", value: inactiveUsers, tone: "warning", icon: <ShieldOff className="h-3.5 w-3.5" />, subtext: "Suspended" },
    { label: "Roles Defined", value: roles.length, tone: "neutral", icon: <KeyRound className="h-3.5 w-3.5" />, subtext: "Permission sets" },
  ];

  const readOnly = mode === "view";

  const drawerContent = (
    <div className="space-y-0">
      {/* Tab nav */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
        {(["profile", "roles", "security"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFormTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 cursor-pointer ${
              activeFormTab === tab
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab === "profile" ? "Profile" : tab === "roles" ? "Roles & Access" : "Security"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {activeFormTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User avatar preview */}
          {(form.fullName || form.email) && (
            <div className="md:col-span-2 flex items-center gap-3 mb-2 p-3 rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-900">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${editingUser ? avatarColor(editingUser.id) : "from-blue-600 to-indigo-600"} text-lg font-bold text-white shadow-sm`}>
                {userInitials(form.fullName, form.email)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{form.fullName || "New User"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{form.email || "Email not set"}</p>
              </div>
            </div>
          )}

          {isSuperAdmin && mode === "create" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tenant *</label>
              <select className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.tenantId} disabled={readOnly} onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))}>
                <option value="">Select tenant…</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}{t.subdomain ? ` (${t.subdomain})` : ""}</option>)}
              </select>
            </div>
          )}
          {isSuperAdmin && mode !== "create" && editingUser?.tenantId && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tenant</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {tenantName(editingUser.tenantId)}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.fullName} disabled={readOnly} placeholder="John Smith" onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
            <input className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" type="email" value={form.email} disabled={readOnly || mode === "edit"} placeholder="john@company.com" onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600" checked={form.isActive} disabled={readOnly} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              <span>Account Active — user can sign in and use the platform</span>
            </label>
          </div>
        </div>
      )}

      {activeFormTab === "roles" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Select the permission roles this user should have. Roles define what modules and actions they can access.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roles.map((role) => {
              const selected = form.roles.includes(role.name);
              return (
                <button
                  key={role.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleRole(role.name)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer ${
                    selected
                      ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors flex items-center justify-center ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-600"}`}>
                    {selected && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <span>{role.name}</span>
                </button>
              );
            })}
            {roles.length === 0 && <p className="col-span-2 text-xs text-slate-500">No roles defined. Create roles in Platform → Roles first.</p>}
          </div>
          {form.roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.roles.map((r) => (
                <span key={r} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">{r}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {activeFormTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {mode === "edit" ? "New Password (leave blank to keep current)" : "Initial Password *"}
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              type="password"
              value={form.password}
              disabled={readOnly}
              autoComplete="new-password"
              placeholder={mode === "edit" ? "Leave blank to keep current…" : "Min. 8 characters"}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Security Guidelines</p>
            <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 leading-relaxed list-disc list-inside">
              <li>Minimum 8 characters, include uppercase + number</li>
              <li>User will be prompted to change on first login</li>
              <li>Password reset links can be sent via email</li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        {readOnly ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeInspector} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">Close</button>
            {editingUser && !editingUser.isDeleted && (
              <button type="button" onClick={() => openEdit(editingUser)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer">Edit User</button>
            )}
          </div>
        ) : (
          <ErpDrawerFooter
            onCancel={closeInspector}
            onSave={() => void handleSave()}
            saving={saving}
            isEdit={mode === "edit"}
            saveLabel={mode === "edit" ? "Update User" : "Create User"}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <PlatformGlobalPageShell
        title="User Directory"
        subtitle="Manage user accounts, authentication, role assignments, and access control across the entire platform."
        categoryTag="Identity & Access"
        icon="users"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, or role…"
        onClearFilters={() => { setSearch(""); setStatusFilter("all"); setShowDeleted(false); }}
        filterOptions={[
          {
            key: "status", label: "Status", value: statusFilter,
            onChange: (v) => setStatusFilter(v as "all" | "active" | "inactive"),
            options: [{ label: "All Statuses", value: "all" }, { label: "Active Only", value: "active" }, { label: "Inactive Only", value: "inactive" }],
          },
          {
            key: "view", label: "View", value: showDeleted ? "deleted" : "live",
            onChange: (v) => setShowDeleted(v === "deleted"),
            options: [{ label: "Live Records", value: "live" }, { label: "Deleted Records", value: "deleted" }],
          },
        ]}
        primaryActionLabel="Add User"
        onPrimaryAction={openCreate}
        onRefresh={() => void load()}
        isLoading={loading}
        listKey="platform-users"
        listRows={filteredUsers}
        getRowId={(row) => row.id}
        emptyMessage={showDeleted ? "No deleted users match the current filters." : "No users found. Create a user to grant platform access."}
        listColumns={[
          { key: "user", label: "User", dataType: "string" },
          { key: "email", label: "Email" },
          { key: "roles", label: "Roles" },
          ...(isSuperAdmin ? [{ key: "tenant", label: "Tenant" }] : []),
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions", locked: true },
        ]}
        onBulkDelete={(rows) => void handleBulkDelete(rows)}
        bulkActions={[{
          key: "bulk-edit-status", label: "Edit status", category: "change",
          onClick: (rowIds) => { setBulkRowIds(rowIds); setBulkEditOpen(true); },
        }]}
        renderListRow={(user) => (
          <tr key={user.id} className="erp-tr">
            <td className="erp-td">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColor(user.id)} text-sm font-bold text-white shadow-sm`}>
                  {userInitials(user.fullName, user.email)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName || "—"}</div>
                  <div className="text-xs text-slate-400 font-mono">{user.id.slice(0, 8)}…</div>
                </div>
              </div>
            </td>
            <td className="erp-td">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {user.email}
              </div>
            </td>
            <td className="erp-td">
              <div className="flex flex-wrap gap-1">
                {user.roles?.length ? user.roles.map((r) => (
                  <span key={r} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">{r}</span>
                )) : <span className="text-xs text-slate-400">No roles</span>}
              </div>
            </td>
            {isSuperAdmin && (
              <td className="erp-td text-xs text-slate-600 dark:text-slate-300">{tenantName(user.tenantId)}</td>
            )}
            <td className="erp-td">
              <span className={
                user.isDeleted ? "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60"
                : user.isActive ? "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                : "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
              }>
                {user.isDeleted ? "Deleted" : user.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="erp-td text-right">
              {user.isDeleted ? (
                <ErpRowActions
                  onView={{ label: "View", onClick: () => openView(user) }}
                  extra={
                    <>
                      <button type="button" title="Restore" onClick={() => void handleRestore(user)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" title="Permanent delete" onClick={() => setHardDeleteTarget(user)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  }
                />
              ) : (
                <ErpRowActions
                  onView={{ label: "View User", onClick: () => openView(user) }}
                  onEdit={{ label: "Edit User", onClick: () => openEdit(user) }}
                  onDelete={{ label: "Delete User", onClick: () => setDeleteTarget(user) }}
                />
              )}
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={closeInspector}
        inspectorTitle={
          mode === "view" ? `Profile: ${editingUser?.fullName || editingUser?.email}` :
          mode === "edit" ? `Edit User: ${editingUser?.fullName || editingUser?.email}` :
          "Create New User"
        }
        inspectorSubTitle={
          mode === "view" ? "View user profile and role assignments" :
          mode === "create" ? "Fill profile, assign roles, and set security credentials" :
          "Update user details, roles, or reset password"
        }
        inspectorContent={drawerContent}
      >
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
      </PlatformGlobalPageShell>

      {confirmDialog}

      {bulkEditOpen && (
        <BulkEditDialog
          fields={userBulkFields}
          selectionCount={bulkRowIds.length}
          onApply={handleBulkEdit}
          onClose={() => { setBulkEditOpen(false); setBulkRowIds([]); }}
          loading={bulkApplying}
        />
      )}

      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete User"
        entityName={deleteTarget?.email}
        description={deleteTarget ? `Delete "${deleteTarget.email}"? The account will be soft-deleted and can be restored from the Recycle Bin.` : undefined}
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await platformApi.admin.deleteUser(deleteTarget.id);
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            notifySuccess("User deleted.");
            setDeleteTarget(null);
            void load();
          }
          catch (err) { notifyError(getApiErrorMessage(err, "Failed to delete user")); throw err; }
          finally { setDeleting(false); }
        }}
      />

      <UniversalDeleteDialog
        open={Boolean(hardDeleteTarget)}
        onOpenChange={(open) => !open && setHardDeleteTarget(null)}
        title="Permanently Delete User"
        entityName={hardDeleteTarget?.email}
        isHardDelete
        loading={deleting}
        onConfirm={async () => {
          if (!hardDeleteTarget) return;
          setDeleting(true);
          try {
            await platformApi.admin.recycleBin.hardDelete("Users", hardDeleteTarget.id);
            setUsers((prev) => prev.filter((u) => u.id !== hardDeleteTarget.id));
            notifySuccess("User permanently deleted.");
            setHardDeleteTarget(null);
            void load();
          }
          catch (err) { notifyError(getApiErrorMessage(err, "Failed to permanently delete user")); throw err; }
          finally { setDeleting(false); }
        }}
      />
    </>
  );
}

export default PlatformUsersManager;
