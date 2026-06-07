"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Megaphone, Users, Bell, Eye } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type Announcement = {
  id: string;
  title?: string;
  content?: string;
  audience?: string;
  status?: string;
  publishedAt?: string;
  expiresAt?: string;
  priority?: string;
  viewCount?: number;
  createdBy?: string;
};

type AnnouncementForm = {
  title: string;
  content: string;
  audience: string;
  priority: string;
  publishedAt: string;
  expiresAt: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Published: { chip: "erp-chip erp-chip-success", label: "Published" },
  Draft:     { chip: "erp-chip erp-chip-neutral", label: "Draft"     },
  Scheduled: { chip: "erp-chip erp-chip-info",    label: "Scheduled" },
  Expired:   { chip: "erp-chip erp-chip-warning", label: "Expired"   },
  Archived:  { chip: "erp-chip erp-chip-neutral", label: "Archived"  },
};

const AUDIENCE_OPTIONS = ["All Employees", "Management", "HR Team", "Finance Team", "Operations", "Department Specific", "New Joiners", "All Admins"];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<AnnouncementForm>({
    title: "", content: "", audience: "All Employees", priority: "Normal",
    publishedAt: new Date().toISOString().split("T")[0], expiresAt: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.communication.announcements.list({ page: 1, limit: 50 });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setAnnouncements(list);
    } catch (err) {
      // Backend endpoint not yet available - show empty state gracefully
      setAnnouncements([]);
      if (getApiErrorMessage(err, "").includes("404") === false) {
        const msg = getApiErrorMessage(err, "Failed to load announcements.");
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    try {
      setSaving(true);
      await hrApi.communication.announcements.create({
        title: form.title,
        content: form.content,
        audience: form.audience,
        priority: form.priority,
        publishedAt: form.publishedAt,
        expiresAt: form.expiresAt || null,
        status: "Published",
      });
      setShowForm(false);
      setForm({ title: "", content: "", audience: "All Employees", priority: "Normal", publishedAt: new Date().toISOString().split("T")[0], expiresAt: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create announcement."), "Announcement");
    } finally {
      setSaving(false);
    }
  };

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (a.title || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const published = filtered.filter((a) => a.status === "Published").length;
  const drafts    = filtered.filter((a) => a.status === "Draft").length;

  return (
    <StandardPageLayout
      title="Announcements"
      subtitle="Broadcast company-wide or targeted announcements to employees and teams across all departments."
      eyebrow="Communication / Broadcast"
      icon="megaphone"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Post Announcement
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Search announcements…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">All announcements</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Published</p>
          <p className="erp-kpi-value erp-kpi-value-success">{published}</p>
          <p className="erp-kpi-meta">Live announcements</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-neutral">
          <p className="erp-kpi-label">Drafts</p>
          <p className="erp-kpi-value">{drafts}</p>
          <p className="erp-kpi-meta">Not yet published</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Views</p>
          <p className="erp-kpi-value">{filtered.reduce((s, a) => s + (a.viewCount || 0), 0).toLocaleString()}</p>
          <p className="erp-kpi-meta">Cumulative employee reads</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Announcement</h2>
              <p className="mt-1 text-sm text-slate-500">Compose and publish a company-wide or targeted communication.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="erp-label">Title</label>
                <input className="erp-input" placeholder="Announcement headline…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="erp-label">Content</label>
                <textarea className="erp-input" rows={4} placeholder="Full announcement text…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
              </div>
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Audience</label>
                  <select className="erp-select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                    {AUDIENCE_OPTIONS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Priority</label>
                  <select className="erp-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Publish Date</label>
                  <input className="erp-input" type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Expiry Date (optional)</label>
                  <input className="erp-input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Publishing…" : "Publish Announcement"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements Feed */}
      {!loading && filtered.length === 0 ? (
        <div className="erp-panel">
          <div className="erp-panel-body py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <Megaphone className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">No announcements yet</p>
                <p className="mt-1 text-sm text-slate-500">Post your first company-wide announcement to engage employees.</p>
              </div>
              <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-primary">Post Announcement</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="erp-panel erp-panel-body">
                <div className="space-y-2">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))
          ) : (
            filtered.map((a) => {
              const cfg = STATUS_CONFIG[a.status || "Draft"] || STATUS_CONFIG.Draft;
              const priorityColor = { Urgent: "bg-red-500", High: "bg-amber-500", Normal: "bg-blue-500", Low: "bg-slate-400" }[a.priority || "Normal"] || "bg-slate-400";
              return (
                <div key={a.id} className="erp-panel">
                  <div className="erp-panel-body">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${priorityColor}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900">{a.title || "Untitled"}</h3>
                            <span className={cfg.chip}>{cfg.label}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">{a.content || "—"}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {a.audience || "All Employees"}</span>
                            {a.publishedAt && <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> {new Date(a.publishedAt).toLocaleDateString("en-IN")}</span>}
                            {a.viewCount != null && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {a.viewCount} views</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </StandardPageLayout>
  );
}
