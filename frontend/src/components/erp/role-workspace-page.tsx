"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, FileText, Filter, Layers3, Plus, Search } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";

type RoleNode = {
  id: string;
  name: string;
  type: "Platform" | "Tenant" | "Company" | "Project";
  status: "Active" | "Draft" | "Locked";
  users: number;
  permissions: number;
  approvalFlow: string;
  dataScope: string;
  apiAccess: string;
  recentChange: string;
  favorite?: boolean;
};

const ROLES: RoleNode[] = [
  { id: "superadmin", name: "SuperAdmin", type: "Platform", status: "Locked", users: 1, permissions: 81, approvalFlow: "Bypass most approvals", dataScope: "All tenants", apiAccess: "Full API access", recentChange: "API keys updated for integration testing", favorite: true },
  { id: "platform-admin", name: "Platform Admin", type: "Platform", status: "Active", users: 2, permissions: 64, approvalFlow: "System approvals only", dataScope: "Platform workspace", apiAccess: "Admin API subset", recentChange: "Cloned from SuperAdmin and narrowed to platform tasks" },
  { id: "tenant-admin", name: "Tenant Admin", type: "Tenant", status: "Active", users: 6, permissions: 52, approvalFlow: "Tenant approval chain", dataScope: "Tenant records only", apiAccess: "Read/write APIs", recentChange: "Payroll and document access updated" },
  { id: "hr-manager", name: "HR Manager", type: "Company", status: "Active", users: 11, permissions: 34, approvalFlow: "Manager + HR head", dataScope: "Company employees", apiAccess: "HRMS APIs", recentChange: "Leave policy access granted", favorite: true },
  { id: "finance", name: "Finance", type: "Company", status: "Active", users: 7, permissions: 29, approvalFlow: "Finance controller", dataScope: "Accounts and payments", apiAccess: "Finance APIs", recentChange: "Reconciliation steps added" },
  { id: "project-manager", name: "Project Manager", type: "Project", status: "Draft", users: 4, permissions: 24, approvalFlow: "Project lead + PMO", dataScope: "Assigned projects", apiAccess: "Limited project APIs", recentChange: "Drafted for a new client rollout" },
];

const PERMISSIONS = [
  { module: "Sales", items: ["Customer", "Quotation", "Sales Order"] },
  { module: "Procurement", items: ["Vendor", "Purchase Request", "Purchase Order"] },
  { module: "Inventory", items: ["Warehouse", "Inventory", "Stock Movement"] },
  { module: "HRMS", items: ["Employee Master", "Attendance", "Leave"] },
  { module: "Finance", items: ["Chart of Accounts", "Payments", "Tax Reports"] },
];

const ACTION_COLUMNS = ["View", "Create", "Edit", "Delete", "Approve", "Export", "API"] as const;
const roleTypes: RoleNode["type"][] = ["Platform", "Tenant", "Company", "Project"];

const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const toneClass = (status: RoleNode["status"]) => {
  if (status === "Locked") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Draft") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export function RoleWorkspacePage({ mode = "roles" }: { mode?: "roles" | "permissions" }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RoleNode["type"] | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | RoleNode["status"]>("All");
  const [selectedRoleId, setSelectedRoleId] = useState(ROLES[1].id);
  const [compareRoleId, setCompareRoleId] = useState(ROLES[3].id);

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROLES.filter((role) => {
      const matchesQuery = !q || `${role.name} ${role.type} ${role.dataScope}`.toLowerCase().includes(q);
      const matchesType = typeFilter === "All" || role.type === typeFilter;
      const matchesStatus = statusFilter === "All" || role.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [query, statusFilter, typeFilter]);

  const selectedRole = filteredRoles.find((role) => role.id === selectedRoleId) ?? filteredRoles[0] ?? ROLES[1];
  const compareRole = ROLES.find((role) => role.id === compareRoleId) ?? ROLES[3];

  const headerStats = [
    { label: "Roles", value: ROLES.length, helper: "total" },
    { label: "Active", value: ROLES.filter((role) => role.status === "Active").length, tone: "positive" as const },
    { label: "Draft", value: ROLES.filter((role) => role.status === "Draft").length, tone: "warning" as const },
    { label: "Locked", value: ROLES.filter((role) => role.status === "Locked").length, tone: "info" as const },
  ];

  return (
    <StandardPageLayout
      title={mode === "permissions" ? "Permissions" : "Roles"}
      subtitle={mode === "permissions" ? "Grouped access catalog with a minimal, easier-to-scan layout." : "Focused role workspace with a cleaner list, detail view, and support rail."}
      eyebrow="Platform / Access Control"
      icon="shield"
      meta={<CrudHeaderStats items={headerStats} />}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="erp-action-btn erp-action-btn-secondary inline-flex items-center gap-2">
            <Copy className="h-4 w-4" />Clone
          </button>
          <button type="button" className="erp-action-btn erp-action-btn-secondary inline-flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />Compare
          </button>
          <button type="button" className="erp-action-btn erp-action-btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />Save
          </button>
        </div>
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[16.5rem_minmax(0,1fr)_16.5rem]">
        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--erp-topbar-height,4rem)+1rem)] xl:h-[calc(100vh-var(--erp-topbar-height,4rem)-2rem)] xl:overflow-auto">
          <section className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-none">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Search className="h-3.5 w-3.5" />Search
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SuperAdmin, HR, finance..." className="erp-input mt-3" />
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Type</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as RoleNode["type"] | "All")} className="erp-select">
                  <option value="All">All types</option>
                  {roleTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RoleNode["status"] | "All")} className="erp-select">
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Locked">Locked</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                <Filter className="h-3.5 w-3.5" />Filters
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Recently used
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-none">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Layers3 className="h-3.5 w-3.5" />Role list
            </div>
            <div className="mt-3 space-y-2.5">
              {filteredRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${selectedRole.id === role.id ? "border-slate-300 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                        {initials(role.name)}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-900">{role.name}</span>
                      {role.favorite ? <span className="text-amber-500">★</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{role.users} users · {role.permissions} permissions</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass(role.status)}`}>{role.status}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected role</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{selectedRole.name}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">The center panel stays focused on the selected role while the side rails stay quiet and useful.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${toneClass(selectedRole.status)}`}>{selectedRole.status}</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{selectedRole.type}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Users {selectedRole.users}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Permissions {selectedRole.permissions}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Scope {selectedRole.dataScope}</span>
            </div>
          </section>

          <CrudCard
            title={mode === "permissions" ? "Permissions" : "Overview"}
            description={mode === "permissions" ? "Grouped permission catalog with a clean matrix and module labels." : "Compact overview, recent changes, assigned users, and a light access preview."}
            badge={<span className="erp-toolbar-badge">Minimal</span>}
          >
            {mode === "roles" ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Permissions", value: selectedRole.permissions },
                    { label: "Users", value: selectedRole.users },
                    { label: "Approval Flow", value: selectedRole.approvalFlow },
                    { label: "API Access", value: selectedRole.apiAccess },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recent change</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{selectedRole.recentChange}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Compare with</p>
                    <select value={compareRoleId} onChange={(event) => setCompareRoleId(event.target.value)} className="erp-select mt-2">
                      {ROLES.filter((role) => role.id !== selectedRole.id).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                      <p className="font-semibold text-slate-900">{selectedRole.name} vs {compareRole.name}</p>
                      <p className="mt-1 text-slate-600">{selectedRole.permissions - compareRole.permissions} permission difference</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {PERMISSIONS.map((group) => (
                  <section key={group.module} className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{group.module}</p>
                        <p className="text-xs text-slate-500">{group.items.length} permissions</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">Module</span>
                    </div>
                    <div className="grid gap-2 px-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
                      {group.items.map((item) => (
                        <div key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Module</th>
                        {ACTION_COLUMNS.map((column) => <th key={column} className="px-2 py-3 text-center">{column}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSIONS.flatMap((group) => group.items.map((item) => ({ module: group.module, item }))).map((row, index) => (
                        <tr key={`${row.module}-${row.item}`} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.item}</td>
                          {ACTION_COLUMNS.map((column, columnIndex) => (
                            <td key={`${row.item}-${column}`} className="px-2 py-3 text-center">
                              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${((index + columnIndex) % 3 === 0) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-300"}`}>
                                {((index + columnIndex) % 3 === 0) ? <CheckCircle2 className="h-3.5 w-3.5" /> : "—"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CrudCard>

          <section className="rounded-[1.15rem] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Owner", value: selectedRole.type },
                { label: "Data scope", value: selectedRole.dataScope },
                { label: "API access", value: selectedRole.apiAccess },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--erp-topbar-height,4rem)+1rem)] xl:h-[calc(100vh-var(--erp-topbar-height,4rem)-2rem)] xl:overflow-auto">
          <section className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="text-slate-600">Role</span><span className="font-semibold text-slate-950">{selectedRole.name}</span></div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="text-slate-600">Status</span><span className="font-semibold text-slate-950">{selectedRole.status}</span></div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="text-slate-600">Permissions</span><span className="font-semibold text-slate-950">{selectedRole.permissions}</span></div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Effective preview</p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">View as HR Manager</p>
              <p className="mt-1 text-sm text-slate-600">Compact preview of what this role can see.</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent changes</p>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{selectedRole.recentChange}</div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Audit trail remains readable here.</div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Audit note</p>
            <div className="mt-3 flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="text-sm leading-6 text-slate-700">Keep review, compare, and save actions in the header so the page stays calm and easy to scan.</p>
            </div>
          </section>
        </aside>
      </div>
    </StandardPageLayout>
  );
}
