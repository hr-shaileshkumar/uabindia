"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, Building2, User } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { StatusBadge } from "@/components/workspace/status-badge";
import { erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import apiClient from "@/services/apiClient";

export type CrmContact = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  status?: string;
  source?: string;
  createdAt?: string;
};

const CONTACT_SOURCES = ["Website", "Referral", "LinkedIn", "Cold Call", "Email Campaign", "Trade Show", "Other"];
const CONTACT_STATUSES = ["Active", "Inactive", "Lead", "Customer"];

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  jobTitle: "",
  status: "Active",
  source: "Website",
});

const asList = (raw: unknown): CrmContact[] => {
  if (Array.isArray(raw)) return raw as CrmContact[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CrmContact[];
    if (Array.isArray(obj.items)) return obj.items as CrmContact[];
  }
  return [];
};

const getFullName = (c: CrmContact) =>
  c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";

const statusTone = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "customer") return "positive" as const;
  if (s === "lead") return "info" as const;
  if (s === "inactive") return "neutral" as const;
  return "info" as const;
};

export function CrmContactsManager() {
  const [records, setRecords] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get("/crm/contacts?page=1&limit=200");
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load contacts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchSearch = !q || [getFullName(r), r.email, r.phone, r.companyName, r.jobTitle]
        .some((v) => (v || "").toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (c: CrmContact) => {
    setEditingId(c.id);
    setForm({
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      phone: c.phone || "",
      companyName: c.companyName || "",
      jobTitle: c.jobTitle || "",
      status: c.status || "Active",
      source: c.source || "Website",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      notifyError("First name or last name is required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        status: form.status,
        source: form.source,
      };
      if (editingId) {
        await apiClient.put(`/crm/contacts/${editingId}`, payload);
        notifySuccess("Contact updated.");
      } else {
        await apiClient.post("/crm/contacts", payload);
        notifySuccess("Contact created.");
      }
      setDrawerOpen(false);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save contact."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/crm/contacts/${id}`);
      notifySuccess("Contact deleted.");
      setDeletingId(null);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete contact."));
    }
  };

  const customerCount = records.filter((r) => (r.status || "").toLowerCase() === "customer").length;
  const leadCount = records.filter((r) => (r.status || "").toLowerCase() === "lead").length;

  const list = useErpListView({
    listKey: "crm-contacts",
    rows: filtered,
    columns: [
      { key: "name", label: "Contact" },
      { key: "company", label: "Company" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (c) => c.id,
    loading,
    emptyMessage: "No contacts found. Add your first contact.",
    onCreate: openCreate,
    createLabel: "New contact",
    onRefresh: () => void load(),
    extraFilters: (
      <div className="flex flex-wrap items-end gap-3">
        <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter by name, email, or company…" />
        <div className="min-w-36">
          <label className="erp-label">Status</label>
          <select className="erp-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {CONTACT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    ),
    renderRow: (c) => (
      <tr key={c.id} className={erpTableRowHoverClassName}>
        <td className={`${erpTableTdClassName}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {(c.firstName?.[0] || c.fullName?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{getFullName(c)}</p>
              {c.jobTitle && <p className="text-xs text-slate-500">{c.jobTitle}</p>}
            </div>
          </div>
        </td>
        <td className={erpTableTdClassName}>
          {c.companyName ? (
            <div className="flex items-center gap-1.5 text-sm text-slate-700">
              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              {c.companyName}
            </div>
          ) : <span className="text-slate-400">—</span>}
        </td>
        <td className={erpTableTdClassName}>
          {c.email ? (
            <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              {c.email}
            </a>
          ) : <span className="text-slate-400 text-xs">—</span>}
        </td>
        <td className={erpTableTdClassName}>
          {c.phone ? (
            <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              {c.phone}
            </a>
          ) : <span className="text-slate-400 text-xs">—</span>}
        </td>
        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>{c.source || "—"}</td>
        <td className={erpTableTdClassName}>
          <StatusBadge tone={statusTone(c.status)}>{c.status || "Active"}</StatusBadge>
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions
            onEdit={{ label: "Edit", onClick: () => openEdit(c) }}
            onDelete={{ label: "Delete", onClick: () => setDeletingId(c.id) }}
          />
        </td>
      </tr>
    ),
  });

  return (
    <>
      <StandardPageLayout
        title="CRM Contacts"
        subtitle="Manage all business contacts — customers, leads, and prospects with full profile tracking."
        eyebrow="CRM / Contacts"
        icon="users"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Total contacts", value: records.length, helper: "all" },
              { label: "Customers", value: customerCount, tone: "positive" },
              { label: "Leads", value: leadCount, tone: "info" },
              { label: "Other", value: records.length - customerCount - leadCount, tone: "neutral" },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void load()} loading={loading} />
            {list.headerTools}
            <ErpCreateButton label="New contact" onClick={openCreate} />
          </>
        }
        filters={list.filterBar}
      >
        {error && <div className="erp-alert-error text-sm">{error}</div>}
        <CrudCard>{list.table}</CrudCard>
      </StandardPageLayout>

      {/* Create / Edit Drawer */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit contact" : "New contact"}
        subtitle="Enter contact details. Email and phone are optional."
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel={editingId ? "Save changes" : "Create contact"}
          />
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">First name *</label>
              <input
                className="erp-input mt-1"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Ravi"
              />
            </div>
            <div>
              <label className="erp-label">Last name</label>
              <input
                className="erp-input mt-1"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Sharma"
              />
            </div>
          </div>
          <div>
            <label className="erp-label">Email</label>
            <input
              type="email"
              className="erp-input mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ravi@company.com"
            />
          </div>
          <div>
            <label className="erp-label">Phone</label>
            <input
              type="tel"
              className="erp-input mt-1"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="erp-label">Company name</label>
            <input
              className="erp-input mt-1"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="erp-label">Job title</label>
            <input
              className="erp-input mt-1"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="Procurement Manager"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Status</label>
              <select className="erp-input mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CONTACT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Source</label>
              <select className="erp-input mt-1" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {CONTACT_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* Delete Confirmation */}
      <UniversalDeleteDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
        entityName="contact"
        onConfirm={() => { if (deletingId) void handleDelete(deletingId); }}
      />
    </>
  );
}
