"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type BillingRow = {
  id: string;
  invoiceNumber?: string;
  period?: string;
  amount?: number;
  plan?: string;
  paidDate?: string;
  status?: string;
  remarks?: string;
};

const formatCurrency = (v?: number) => (v != null ? `₹${v.toLocaleString("en-IN")}` : "—");

const emptyForm = () => ({
  period: new Date().toISOString().slice(0, 7),
  plan: "Standard",
  amount: "",
  remarks: "",
});

const asList = (raw: unknown): BillingRow[] => {
  if (Array.isArray(raw)) return raw as BillingRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as BillingRow[];
  }
  return [];
};

function LegacyLicensingBillingHistoryPage() {
  const [records, setRecords] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.licensing.invoices();
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load billing history"));
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
        [r.invoiceNumber, r.period, r.plan, r.status].some((v) => (v || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const handleSave = async () => {
    if (!form.amount) {
      notifyError("Amount is required.");
      return;
    }
    try {
      setSaving(true);
      await appApi.licensing.createInvoice({
        period: form.period,
        plan: form.plan,
        amount: Number(form.amount),
        remarks: form.remarks || undefined,
      });
      notifySuccess("Invoice created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create invoice."));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "pay" | "delete") => {
    try {
      if (action === "pay") await appApi.licensing.payInvoice(id);
      else await appApi.licensing.deleteInvoice(id);
      notifySuccess(action === "pay" ? "Marked paid." : "Invoice deleted.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  return (
    <>
      <ModuleTablePage
        title="Billing History"
        subtitle="Review billing records, invoices, and payment confirmations for your subscription."
        eyebrow="Licensing / Billing"
        icon="payroll"
        toolbarTitle="Billing ledger"
        toolbarSubtitle="Record billing cycles, mark invoices paid, and keep a tenant-level payment trail."
        loading={loading}
        error={error}
        onRetry={load}
        rows={filtered}
        countLabel={(count) => `${count} billing records`}
        emptyMessage="No billing records found."
        emptyAction={<ListCreateButton label="Add invoice" onClick={() => setDrawerOpen(true)} />}
        actions={<ListCreateButton label="Add invoice" onClick={() => setDrawerOpen(true)} />}
        filters={
          <>
            <ListSearchInput value={search} onChange={setSearch} placeholder="Filter invoice or plan…" />
            <ListStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Paid", value: "paid" },
                { label: "Overdue", value: "overdue" },
              ]}
            />
          </>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Invoices", value: records.length, helper: "total" },
              {
                label: "Paid",
                value: records.filter((record) => record.status === "Paid").length,
                tone: "positive",
              },
              {
                label: "Pending",
                value: records.filter((record) => record.status === "Pending").length,
                tone: "warning",
              },
              {
                label: "Billed",
                value: formatCurrency(records.reduce((total, record) => total + (record.amount || 0), 0)),
                helper: "cumulative",
                tone: "info",
              },
            ]}
          />
        }
        columns={[
          { label: "Invoice #" },
          { label: "Period" },
          { label: "Plan" },
          { label: "Amount" },
          { label: "Paid date" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td font-mono text-xs text-slate-900">{r.invoiceNumber}</td>
            <td className="erp-td text-slate-600">{r.period}</td>
            <td className="erp-td">
              <span className="erp-chip erp-chip-neutral">{r.plan}</span>
            </td>
            <td className="erp-td text-slate-600">{formatCurrency(r.amount)}</td>
            <td className="erp-td text-slate-600">
              {r.paidDate ? new Date(r.paidDate).toLocaleDateString("en-IN") : "—"}
            </td>
            <td className="erp-td">
              <span className={`erp-chip ${r.status === "Paid" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span>
            </td>
            <td className="erp-td text-right">
              <div className="inline-flex gap-1">
                {r.status !== "Paid" ? (
                  <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(r.id, "pay")}>
                    Mark paid
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`}
                  onClick={() => void runAction(r.id, "delete")}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add invoice"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Period</label>
              <input type="month" className={`${erpFormInputClassName} mt-1`} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Plan</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                {["Basic", "Standard", "Professional", "Enterprise"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Amount *</label>
            <input type="number" className={`${erpFormInputClassName} mt-1`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Remarks</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}

export default function LicensingBillingHistoryPage() {
  return (
    <DynamicPage
      pageKey="licensing.billing-history"
      fallback={<LegacyLicensingBillingHistoryPage />}
      renderMode="auto"
    />
  );
}
