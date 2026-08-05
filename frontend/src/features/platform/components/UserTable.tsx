"use client";

import { TableActionMenu } from "@/components/table/TableActionMenu";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";
import { EntityAvatar } from "@/components/erp/crud-workspace";
import type { TableSelectionState } from "@/hooks/useTableSelection";

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isDeleted?: boolean;
  roles?: string[];
  tenantId?: string;
}

type UserTableProps = {
  users: UserRow[];
  loading: boolean;
  isSuperAdmin: boolean;
  showDeleted: boolean;
  selection: TableSelectionState<UserRow>;
  onSelectUser: (user: UserRow) => void;
  onQuickEdit: (user: UserRow) => void;
  onFullEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onRestore: (user: UserRow) => void;
  onHardDelete: (user: UserRow) => void;
};

export function UserTable({
  users,
  loading,
  isSuperAdmin,
  showDeleted,
  selection,
  onSelectUser,
  onQuickEdit,
  onFullEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: UserTableProps) {
  return (
    <div className="erp-table-wrap rounded-none border-0 shadow-none">
      <table className="erp-table">
        <thead className="erp-thead">
          <tr>
            <th className="erp-th w-10">
              <SelectAllCheckbox
                checked={selection.isAllSelected}
                indeterminate={selection.isIndeterminate}
                onChange={selection.isAllSelected ? selection.clearSelection : selection.selectAll}
              />
            </th>
            <th className="erp-th">User Profile</th>
            <th className="erp-th">Email Address</th>
            <th className="erp-th">Assigned Roles</th>
            {isSuperAdmin ? <th className="erp-th">Tenant ID</th> : null}
            <th className="erp-th">Status</th>
            <th className="erp-th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={`erp-tr ${user.isDeleted ? "opacity-60 bg-rose-50/30 dark:bg-rose-950/20" : ""}`}
            >
              <td className="erp-td">
                <SelectionCheckbox
                  checked={selection.isSelected(user.id)}
                  onChange={() => selection.toggleSelection(user.id)}
                  label={`Select ${user.email}`}
                />
              </td>
              <td className="erp-td">
                <EntityAvatar name={user.fullName || user.email} subtext={user.email} />
              </td>
              <td className="erp-td text-xs font-medium text-slate-700 dark:text-slate-300">{user.email}</td>
              <td className="erp-td text-xs">
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/50"
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </td>
              {isSuperAdmin ? (
                <td className="erp-td text-xs font-mono text-slate-500">
                  {user.tenantId ? `${user.tenantId.slice(0, 8)}...` : "—"}
                </td>
              ) : null}
              <td className="erp-td">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    user.isDeleted
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      : user.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.isDeleted ? "bg-rose-500" : user.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {user.isDeleted ? "Deleted" : user.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="erp-td text-right">
                <TableActionMenu
                  items={
                    !user.isDeleted
                      ? isSuperAdmin
                        ? [
                            { label: "View Details", onClick: () => onSelectUser(user) },
                            { label: "Quick Edit", onClick: () => onQuickEdit(user) },
                            { label: "Open Full Edit", onClick: () => onFullEdit(user) },
                            { label: "Delete", onClick: () => onDelete(user), danger: true },
                          ]
                        : [{ label: "View Details", onClick: () => onSelectUser(user) }]
                      : isSuperAdmin
                        ? [
                            { label: "Restore", onClick: () => onRestore(user) },
                            { label: "Permanent Delete", onClick: () => onHardDelete(user), danger: true },
                          ]
                        : [{ label: "View Details", onClick: () => onSelectUser(user) }]
                  }
                />
              </td>
            </tr>
          ))}

          {!loading && users.length === 0 ? (
            <tr>
              <td colSpan={isSuperAdmin ? 7 : 6} className="erp-td py-12 text-center text-xs text-slate-500">
                {showDeleted ? "No deleted users found matching query filters." : "No active users found matching query filters."}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
