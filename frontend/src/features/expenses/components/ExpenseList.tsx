"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { ListCreateButton, ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { financeApi, orgApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import type { Expense } from "@/types";

const emptyForm = () => ({
  title: "",
  description: "",
  amount: "",
  category: "Travel",
  date: new Date().toISOString().slice(0, 10),
  employeeName: "",
  receiptUrl: "",
  projectId: "",
});

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [response, projectsRes] = await Promise.all([financeApi.expenses.getAll(1, 100), orgApi.project.getAll()]);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setExpenses(
        list.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          employeeId: row.employeeId ? String(row.employeeId) : undefined,
          employeeName: String(row.employeeName ?? ""),
          title: String(row.title ?? ""),
          description: row.description ? String(row.description) : undefined,
          amount: Number(row.amount ?? 0),
          currency: String(row.currency ?? "INR"),
          category: String(row.category ?? "General"),
          date: String(row.date ?? "").slice(0, 10),
          status: String(row.status ?? "Draft") as Expense["status"],
          receiptUrl: row.receiptUrl ? String(row.receiptUrl) : undefined,
          approvedBy: row.approvedBy ? String(row.approvedBy) : undefined,
          submittedAt: row.submittedAt ? String(row.submittedAt) : undefined,
          projectId: row.projectId ? String(row.projectId) : undefined,
        })),
      );
      const projList = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : [];
      setProjects(projList.map((p) => ({ id: String(p.id), name: String(p.name ?? p.projectCode ?? p.id) })));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load expenses."), "Expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setFormData({
      title: exp.title,
      description: exp.description ?? "",
      amount: String(exp.amount),
      category: exp.category ?? "Travel",
      date: exp.date,
      employeeName: exp.employeeName ?? "",
      receiptUrl: exp.receiptUrl ?? "",
      projectId: exp.projectId ?? "",
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.amount) return;
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      employeeName: formData.employeeName.trim() || undefined,
      receiptUrl: formData.receiptUrl.trim() || undefined,
      projectId: formData.projectId || undefined,
      status: editingId ? undefined : "Submitted",
    };
    try {
      setSaving(true);
      if (editingId) {
        await financeApi.expenses.update(editingId, payload);
        notifySuccess("Expense updated.", "Expenses");
      } else {
        await financeApi.expenses.create(payload);
        notifySuccess("Expense submitted.", "Expenses");
      }
      setDrawerOpen(false);
      setEditingId(null);
      setFormData(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save expense."), "Expenses");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "approve" | "reject" | "markPaid") => {
    try {
      if (action === "approve") await financeApi.expenses.approve(id);
      else if (action === "reject") await financeApi.expenses.reject(id);
      else await financeApi.expenses.markPaid(id);
      notifySuccess(
        action === "approve" ? "Expense approved." : action === "reject" ? "Expense rejected." : "Marked as paid.",
        "Expenses",
      );
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Expense action failed."), "Expenses");
    }
  };

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(q) || (e.employeeName || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || e.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const expenseStatusTone = (status: string) => {
    if (status === "Paid" || status === "Approved") return "positive" as const;
    if (status === "Submitted") return "warning" as const;
    if (status === "Rejected") return "danger" as const;
    return "neutral" as const;
  };

  const projectName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name ?? "—" : "—");

  const listRows = filtered.map((exp) => ({ ...exp, projectName: projectName(exp.projectId) }));

  const list = useErpListView({
    listKey: "expenses",
    rows: listRows,
    columns: [
      { key: "title", label: "Title" },
      { key: "employeeName", label: "Employee" },
      { key: "projectName", label: "Project" },
      { key: "amount", label: "Amount", dataType: "currency" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No expense reports submitted. Create the first expense claim to start the reimbursement workflow.",
    onCreate: openCreate,
    createLabel: "Submit Expense",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <ListSearchInput value={search} onChange={setSearch} placeholder="Search expense title or employee…" />
        <ListStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Submitted", value: "submitted" },
            { label: "Approved", value: "approved" },
            { label: "Paid", value: "paid" },
            { label: "Rejected", value: "rejected" },
          ]}
        />
      </>
    ),
    renderRow: (exp) => (
      <tr key={exp.id} className="erp-tr">
        <td className="erp-td">
          <p className="text-xs font-semibold">{exp.title}</p>
          <p className="text-[11px] text-slate-500">
            {exp.category} · {exp.date}
          </p>
        </td>
        <td className="erp-td text-xs">{exp.employeeName || "Unassigned"}</td>
        <td className="erp-td text-xs">{exp.projectName}</td>
        <td className="erp-td text-xs font-semibold">₹{exp.amount.toLocaleString("en-IN")}</td>
        <td className="erp-td">
          <StatusBadge tone={expenseStatusTone(exp.status)}>{exp.status}</StatusBadge>
        </td>
        <td className="erp-td text-right">
          <div className="inline-flex flex-wrap justify-end gap-1">
            {exp.status === "Draft" || exp.status === "Submitted" ? (
              <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => openEdit(exp)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {exp.status === "Submitted" ? (
              <>
                <button type="button" className={`${erpButtonClassName.primary} h-8 px-3 text-xs`} onClick={() => void runAction(exp.id, "approve")}>
                  Approve
                </button>
                <button type="button" className={`${erpButtonClassName.secondary} h-8 px-3 text-xs`} onClick={() => void runAction(exp.id, "reject")}>
                  Reject
                </button>
              </>
            ) : null}
            {exp.status === "Approved" ? (
              <button type="button" className={`${erpButtonClassName.primary} h-8 px-3 text-xs`} onClick={() => void runAction(exp.id, "markPaid")}>
                Mark paid
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Expense Management & Reimbursements"
      subtitle="Submit, review, and approve employee business expense reports and receipts."
      eyebrow="Finance / Expenses"
      icon="wallet"
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ListCreateButton label="Submit Expense" onClick={openCreate} />
        </>
      }
      filters={list.filterBar}
    >
      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit expense" : "Submit Expense Report"}
        subtitle="Persists to /api/v1/expenses for the current tenant."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerOpen(false)} className={erpButtonClassName.secondary}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleSubmit()} className={erpButtonClassName.primary} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Submit Expense"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Expense title *</label>
            <input className={`${erpFormInputClassName} mt-1`} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Description</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Employee name</label>
            <input className={`${erpFormInputClassName} mt-1`} value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Project</label>
            <select className={`${erpFormInputClassName} mt-1`} value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Amount (INR) *</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Date</label>
              <input type="date" className={`${erpFormInputClassName} mt-1`} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Category</label>
            <select className={`${erpFormInputClassName} mt-1`} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option>Travel</option>
              <option>Meals</option>
              <option>Office</option>
              <option>General</option>
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Receipt URL</label>
            <input className={`${erpFormInputClassName} mt-1`} value={formData.receiptUrl} onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })} placeholder="https://…" />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
