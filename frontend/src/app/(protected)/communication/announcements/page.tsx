"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/erp/templates/UniversalDeleteDialog";
import { useErpListView } from "@/components/erp/erp-list-view";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: string;
  updatedAt?: string;
};

const emptyForm = () => ({
  title: "",
  body: "",
  audience: "All Employees",
  status: "Draft",
});

const normalizeValue = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
};

const asList = (raw: unknown): Record<string, unknown>[] => {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.records)) return obj.records as Record<string, unknown>[];
    if (Array.isArray(obj.announcements)) return obj.announcements as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  }
  return [];
};

const mapRow = (item: Record<string, unknown>, index: number): AnnouncementRecord => ({
  id: String(item.id ?? item.announcementId ?? index),
  title: normalizeValue(item.title, "Untitled announcement"),
  body: normalizeValue(item.body, normalizeValue(item.message, "")),
  audience: normalizeValue(item.audience, "All Employees"),
  status: normalizeValue(item.status, "Draft"),
  updatedAt:
    typeof item.updatedAt === "string"
      ? item.updatedAt
      : typeof item.publishedAt === "string"
        ? item.publishedAt
        : typeof item.createdAt === "string"
          ? item.createdAt
          : undefined,
});

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appApi.communication.announcements.list({ page: 1, limit: 100 });
      setAnnouncements(asList(response.data).map(mapRow));
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Failed to load announcements."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((row) => {
      const matchesSearch =
        !q ||
        [row.title, row.body, row.audience, row.status].some((v) => v.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [announcements, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: AnnouncementRecord) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      body: row.body,
      audience: row.audience || "All Employees",
      status: row.status || "Draft",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      notifyError("Title and body are required.");
      return;
    }
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience.trim() || "All Employees",
      status: form.status,
    };
    try {
      setSaving(true);
      if (editingId) {
        await appApi.communication.announcements.update(editingId, payload);
        notifySuccess("Announcement updated.");
      } else {
        await appApi.communication.announcements.create(payload);
        notifySuccess("Announcement created.");
      }
      setDrawerOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      void loadAnnouncements();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save announcement."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await appApi.communication.announcements.delete(deleteId);
      notifySuccess("Announcement deleted.");
      setDeleteId(null);
      void loadAnnouncements();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete announcement."));
    } finally {
      setDeleting(false);
    }
  };

  const list = useErpListView({
    listKey: "communication-announcements",
    rows: filtered,
    columns: [
      { key: "title", label: "Title", dataType: "string" },
      { key: "audience", label: "Audience", dataType: "string" },
      { key: "status", label: "Status", dataType: "string" },
      { key: "updatedAt", label: "Updated", dataType: "string" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No announcements yet.",
    emptyAction: <ErpCreateButton label="New announcement" onClick={openCreate} />,
    onCreate: openCreate,
    createLabel: "New announcement",
    onRefresh: () => void loadAnnouncements(),
    renderRow: (row) => (
      <>
        <td className="erp-td">
          <p className="font-semibold text-slate-900">{row.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{row.body || "No body"}</p>
        </td>
        <td className="erp-td text-slate-600">{row.audience}</td>
        <td className="erp-td">
          <span
            className={`erp-chip ${
              row.status.toLowerCase() === "published"
                ? "erp-chip-success"
                : row.status.toLowerCase() === "scheduled"
                  ? "erp-chip-warning"
                  : "erp-chip-neutral"
            }`}
          >
            {row.status}
          </span>
        </td>
        <td className="erp-td text-xs text-slate-500">{formatDate(row.updatedAt)}</td>
        <td className="erp-td">
          <ErpRowActions
            onEdit={{ label: "Edit", onClick: () => openEdit(row) }}
            onDelete={{ label: "Delete", onClick: () => setDeleteId(row.id) }}
          />
        </td>
      </>
    ),
  });

  return (
    <>
      <StandardPageLayout
        title="Announcements"
        icon="notifications"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Visible", value: filtered.length },
              {
                label: "Published",
                value: announcements.filter((a) => a.status.toLowerCase() === "published").length,
                tone: "positive",
              },
              {
                label: "Draft",
                value: announcements.filter((a) => a.status.toLowerCase() === "draft").length,
                tone: "warning",
              },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void loadAnnouncements()} loading={loading} />
            {list.headerTools}
            <ErpCreateButton label="New announcement" onClick={openCreate} />
          </>
        }
        filters={
          <>
            <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter title or audience…" />
            <div className="w-40">
              <label className="erp-label">Status</label>
              <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            {list.filterBar}
          </>
        }
      >
        {error ? <div className="erp-alert-error">{error}</div> : null}
        <CrudCard>{list.table}</CrudCard>
      </StandardPageLayout>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit announcement" : "New announcement"}
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={saving}
            isEdit={Boolean(editingId)}
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Title *</label>
            <input
              className="erp-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Quarterly town hall"
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Audience</label>
            <select
              className="erp-select"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              <option>All Employees</option>
              <option>Managers</option>
              <option>HR</option>
              <option>Finance</option>
              <option>Sales</option>
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Status</label>
            <select
              className="erp-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Body *</label>
            <textarea
              className="erp-input min-h-32"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Announcement message shown in the workspace feed."
            />
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete announcement"
        description="This removes the announcement from the communication feed."
        onConfirm={() => void handleDelete()}
        loading={deleting}
      />
    </>
  );
}
