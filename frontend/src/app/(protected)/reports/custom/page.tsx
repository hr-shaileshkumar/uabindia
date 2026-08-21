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
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { reportsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type CustomReportRow = {
  id: string;
  name?: string;
  reportType?: string;
  dateRange?: string;
  outputFormat?: string;
  schedule?: string;
  status?: string;
  createdByName?: string;
  lastRunAt?: string;
  lastRowCount?: number;
  lastRunSummary?: string;
};

const REPORT_TYPES = [
  { id: "sales", label: "Sales" },
  { id: "inventory", label: "Inventory" },
  { id: "customers", label: "Customers" },
  { id: "finance", label: "Finance" },
  { id: "hrms", label: "HR & Payroll" },
];

const emptyForm = () => ({
  name: "",
  reportType: "sales",
  dateRange: "last30days",
  outputFormat: "pdf",
  schedule: "Manual",
});

const asList = (raw: unknown): CustomReportRow[] => {
  if (Array.isArray(raw)) return raw as CustomReportRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CustomReportRow[];
    if (Array.isArray(obj.records)) return obj.records as CustomReportRow[];
  }
  return [];
};

const chip = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "active") return "erp-chip erp-chip-success";
  return "erp-chip erp-chip-warning";
};

export default function CustomReportsPage() {
  const [records, setRecords] = useState<CustomReportRow[]>([]);
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
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsApi.custom.list();
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load custom reports."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        [r.name, r.reportType, r.schedule, r.createdByName, r.status].some((v) =>
          (v || "").toLowerCase().includes(q)
        );
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: CustomReportRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      reportType: row.reportType || "sales",
      dateRange: row.dateRange || "last30days",
      outputFormat: row.outputFormat || "pdf",
      schedule: row.schedule || "Manual",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notifyError("Report name is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      reportType: form.reportType,
      dateRange: form.dateRange,
      outputFormat: form.outputFormat,
      schedule: form.schedule,
    };
    try {
      setSaving(true);
      if (editingId) {
        await reportsApi.custom.update(editingId, payload);
        notifySuccess("Report updated.");
      } else {
        await reportsApi.custom.create(payload);
        notifySuccess("Report created.");
      }
      setDrawerOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save report."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "run" | "activate") => {
    try {
      setBusyId(id);
      if (action === "run") await reportsApi.custom.run(id);
      else await reportsApi.custom.activate(id);
      notifySuccess(action === "run" ? "Report ran." : "Report activated.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await reportsApi.custom.delete(deleteId);
      notifySuccess("Report deleted.");
      setDeleteId(null);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete report."));
    } finally {
      setDeleting(false);
    }
  };

  const list = useErpListView({
    listKey: "reports-custom",
    rows: filtered,
    columns: [
      { key: "name", label: "Report name", dataType: "string" },
      { key: "reportType", label: "Type", dataType: "string" },
      { key: "createdByName", label: "Created by", dataType: "string" },
      { key: "lastRunAt", label: "Last run", dataType: "string" },
      { key: "schedule", label: "Schedule", dataType: "string" },
      { key: "status", label: "Status", dataType: "string" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No custom reports yet.",
    emptyAction: <ErpCreateButton label="Create report" onClick={openCreate} />,
    onCreate: openCreate,
    createLabel: "Create report",
    onRefresh: () => void load(),
    renderRow: (r) => (
      <>
        <td className="erp-td">
          <p className="font-semibold text-slate-900">{r.name}</p>
          {r.lastRunSummary ? <p className="text-xs text-slate-500">{r.lastRunSummary}</p> : null}
        </td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-neutral">{r.reportType}</span>
        </td>
        <td className="erp-td text-slate-600">{r.createdByName || "—"}</td>
        <td className="erp-td text-xs text-slate-600">
          {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString("en-IN") : "Never"}
          {r.lastRowCount != null && r.lastRunAt ? (
            <span className="block text-slate-400">{r.lastRowCount} rows</span>
          ) : null}
        </td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-neutral">{r.schedule}</span>
        </td>
        <td className="erp-td">
          <span className={chip(r.status)}>{r.status}</span>
        </td>
        <td className="erp-td">
          <ErpRowActions
            onEdit={{ label: "Edit", onClick: () => openEdit(r) }}
            onDelete={{ label: "Delete", onClick: () => setDeleteId(r.id) }}
            extra={
              <>
                <button
                  type="button"
                  className={`${erpButtonClassName.ghost} h-8 px-2 text-xs`}
                  disabled={busyId === r.id}
                  onClick={() => void runAction(r.id, "run")}
                >
                  Run
                </button>
                {(r.status || "").toLowerCase() !== "active" ? (
                  <button
                    type="button"
                    className={`${erpButtonClassName.ghost} h-8 px-2 text-xs`}
                    disabled={busyId === r.id}
                    onClick={() => void runAction(r.id, "activate")}
                  >
                    Activate
                  </button>
                ) : null}
              </>
            }
          />
        </td>
      </>
    ),
  });

  return (
    <>
      <StandardPageLayout
        title="Custom Reports"
        icon="settings"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Reports", value: records.length, helper: "saved" },
              {
                label: "Scheduled",
                value: records.filter((r) => r.schedule && r.schedule !== "Manual").length,
                tone: "positive",
              },
              {
                label: "Active",
                value: records.filter((r) => (r.status || "").toLowerCase() === "active").length,
                tone: "info",
              },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void load()} loading={loading} />
            {list.headerTools}
            <ErpCreateButton label="Create report" onClick={openCreate} />
          </>
        }
        filters={
          <>
            <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter name or type…" />
            <div className="w-40">
              <label className="erp-label">Status</label>
              <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
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
        title={editingId ? "Edit custom report" : "Create custom report"}
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={saving}
            isEdit={Boolean(editingId)}
            disabled={!form.name.trim()}
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Report name *</label>
            <input
              className="erp-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Type</label>
            <select
              className="erp-select"
              value={form.reportType}
              onChange={(e) => setForm({ ...form, reportType: e.target.value })}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Schedule</label>
            <select
              className="erp-select"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            >
              {["Manual", "Daily", "Weekly", "Monthly"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Date range</label>
            <select
              className="erp-select"
              value={form.dateRange}
              onChange={(e) => setForm({ ...form, dateRange: e.target.value })}
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thisMonth">This month</option>
              <option value="lastMonth">Last month</option>
              <option value="thisYear">This year</option>
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Format</label>
            <select
              className="erp-select"
              value={form.outputFormat}
              onChange={(e) => setForm({ ...form, outputFormat: e.target.value })}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete custom report"
        description="This removes the saved report definition."
        isHardDelete
        onConfirm={() => void handleDelete()}
        loading={deleting}
      />
    </>
  );
}
