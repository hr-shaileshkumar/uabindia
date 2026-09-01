"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput } from "@/components/workspace/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type SmsTemplateRow = {
  id: string;
  name: string;
  message?: string;
  body?: string;
  triggerEvent: string;
  language: string;
  status: string;
};

const emptyForm = () => ({
  name: "",
  body: "",
  triggerEvent: "",
  language: "en",
  status: "Active",
});

export default function CommunicationSmsTemplatesPage() {
  const [records, setRecords] = useState<SmsTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await appApi.communication.smsTemplates.list();
      setRecords((res.data?.records ?? res.data?.templates ?? []) as SmsTemplateRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load SMS templates");
      setLoadError(msg);
      notifyError(msg, "SMS Templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (row: SmsTemplateRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      body: row.body ?? row.message ?? "",
      triggerEvent: row.triggerEvent ?? "",
      language: row.language || "en",
      status: row.status || "Active",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      notifyError("Name and message body are required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      body: form.body.trim(),
      triggerEvent: form.triggerEvent.trim() || undefined,
      language: form.language,
      status: form.status,
    };
    try {
      setSaving(true);
      if (editingId) await appApi.communication.smsTemplates.update(editingId, payload);
      else await appApi.communication.smsTemplates.create(payload);
      notifySuccess(editingId ? "Template updated." : "Template created.");
      setDrawerOpen(false);
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save template."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this SMS template?")) return;
    try {
      await appApi.communication.smsTemplates.delete(id);
      notifySuccess("Template deleted.");
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete template."));
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || (r.triggerEvent || "").toLowerCase().includes(q);
  });

  return (
    <>
      <ModuleTablePage
        title="SMS Templates"
        subtitle="Configure SMS message templates for OTPs, alerts, HR notifications, and employee communications."
        eyebrow="Communication / SMS Templates"
        icon="message"
        toolbarTitle="SMS template library"
        toolbarSubtitle="Short-form templates triggered by ERP events."
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        rows={filtered}
        countLabel={(count) => `${count} templates`}
        emptyMessage="No SMS templates found."
        emptyAction={<ListCreateButton label="New template" onClick={openCreate} />}
        actions={<ListCreateButton label="New template" onClick={openCreate} />}
        filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Search name or event…" />}
        headerStats={
          <HeaderSummary
            items={[
              { label: "Templates", value: records.length },
              { label: "Active", value: records.filter((r) => r.status === "Active").length, tone: "success" },
            ]}
          />
        }
        columns={[{ label: "Name" }, { label: "Trigger Event" }, { label: "Language" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td text-slate-900">{r.name}</td>
            <td className="erp-td">
              <span className="erp-chip erp-chip-neutral">{r.triggerEvent}</span>
            </td>
            <td className="erp-td text-slate-600">{r.language}</td>
            <td className="erp-td">
              <span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span>
            </td>
            <td className="erp-td text-right">
              <div className="inline-flex gap-1">
                <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => openEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`} onClick={() => void handleDelete(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit SMS template" : "New SMS template"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : editingId ? "Save" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Name *</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Message *</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Trigger event</label>
              <input className={`${erpFormInputClassName} mt-1`} value={form.triggerEvent} onChange={(e) => setForm({ ...form, triggerEvent: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Status</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Active</option>
                <option>Draft</option>
              </select>
            </div>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
