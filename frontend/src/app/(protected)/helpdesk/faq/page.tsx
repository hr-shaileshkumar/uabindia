"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
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

type FaqRow = { id: string; question: string; category: string; views: number; helpful: number; status: string };

const emptyForm = () => ({
  question: "",
  answer: "",
  category: "General",
  status: "Draft",
});

function LegacyHelpdeskFaqPage() {
  const [records, setRecords] = useState<FaqRow[]>([]);
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
      const res = await appApi.helpdesk.faq.list({ limit: 100 });
      setRecords((res.data?.records ?? res.data?.faqs ?? []) as FaqRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load FAQ articles");
      setLoadError(msg);
      notifyError(msg, "FAQ");
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

  const openEdit = (row: FaqRow) => {
    setEditingId(row.id);
    setForm({ question: row.question, answer: "", category: row.category || "General", status: row.status || "Draft" });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (form.question.trim().length < 5 || (!editingId && form.answer.trim().length < 5)) {
      notifyError("Question and answer must be at least 5 characters.");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await appApi.helpdesk.faq.update(editingId, {
          question: form.question.trim(),
          answer: form.answer.trim() || undefined,
          category: form.category,
          status: form.status,
        });
        notifySuccess("FAQ updated.", "FAQ");
      } else {
        await appApi.helpdesk.faq.create({
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          status: form.status,
        });
        notifySuccess("FAQ created.", "FAQ");
      }
      setDrawerOpen(false);
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save FAQ."), "FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this FAQ article?")) return;
    try {
      await appApi.helpdesk.faq.delete(id);
      notifySuccess("FAQ deleted.", "FAQ");
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete FAQ."), "FAQ");
    }
  };

  return (
    <>
      <ModuleTablePage
        title="FAQ"
        subtitle="Build and manage a self-service knowledge base to help employees resolve common issues without raising tickets."
        eyebrow="Helpdesk / FAQ"
        icon="help"
        toolbarTitle="Knowledge base"
        toolbarSubtitle="Create searchable FAQs organized by category to reduce support ticket volume."
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        rows={records.filter((r) => {
          const q = search.toLowerCase();
          return !q || r.question.toLowerCase().includes(q) || (r.category || "").toLowerCase().includes(q);
        })}
        countLabel={(count) => `${count} articles`}
        emptyMessage="No FAQ articles found. Create one to start the knowledge base."
        emptyAction={<ListCreateButton label="New article" onClick={openCreate} />}
        actions={<ListCreateButton label="New article" onClick={openCreate} />}
        filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Search questions…" />}
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Articles", value: records.length, helper: "faq" },
              {
                label: "Published",
                value: records.filter((record) => record.status === "Published").length,
                tone: "positive",
              },
              {
                label: "Views",
                value: records.reduce((total, record) => total + (record.views ?? 0), 0),
                helper: "all time",
                tone: "info",
              },
            ]}
          />
        }
        columns={[{ label: "Question" }, { label: "Category" }, { label: "Views" }, { label: "Helpful" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td text-slate-900">{r.question}</td>
            <td className="erp-td">
              <span className="erp-chip erp-chip-neutral">{r.category}</span>
            </td>
            <td className="erp-td text-slate-600">{r.views}</td>
            <td className="erp-td text-slate-600">{r.helpful}</td>
            <td className="erp-td">
              <span className={`erp-chip ${r.status === "Published" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span>
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
        title={editingId ? "Edit FAQ" : "New FAQ article"}
        subtitle="Persists to /api/v1/helpdesk/faq"
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
            <label className={erpFormLabelClassName}>Question *</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Answer {editingId ? "(leave blank to keep)" : "*"}</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={6} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Category</label>
              <input className={`${erpFormInputClassName} mt-1`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Status</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Draft</option>
                <option>Published</option>
              </select>
            </div>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

export default function HelpdeskFaqPage() {
  return (
    <DynamicPage
      pageKey="helpdesk.faq"
      fallback={<LegacyHelpdeskFaqPage />}
      renderMode="auto"
    />
  );
}
