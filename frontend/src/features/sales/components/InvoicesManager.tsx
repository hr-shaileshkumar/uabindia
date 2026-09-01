"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { RecordAiDrawer } from "@/components/ai/RecordAiDrawer";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpRowActions } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import DynamicFieldsSection from "@/components/DynamicFieldsSection";
import { salesApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { erpButtonClassName } from "@/components/workspace/styles";
import {
  DocLine,
  ErpLineGrid,
  ErpMasterSelect,
  ErpTotalsStrip,
  INDIA_STATE_CODES,
  documentTotals,
  emptyBillDiscount,
  emptyDocLine,
  formatInr,
  gstSplit,
  payloadLines,
  printCommercialDocument,
  useDocumentMasters,
  withBillDiscount,
} from "@/components/workspace/document-kit";

export type InvoiceRow = {
  id: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  dueDate?: string;
  issueDate?: string;
  status?: string;
  placeOfSupply?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
};

export type InvoiceForm = {
  customerId: string;
  placeOfSupply: string;
  dueDate: string;
  notes: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Paid: { chip: "erp-chip erp-chip-success", label: "Paid" },
  Unpaid: { chip: "erp-chip erp-chip-info", label: "Unpaid" },
  Outstanding: { chip: "erp-chip erp-chip-info", label: "Outstanding" },
  Partial: { chip: "erp-chip erp-chip-warning", label: "Partial" },
  Overdue: { chip: "erp-chip erp-chip-danger", label: "Overdue" },
  Draft: { chip: "erp-chip erp-chip-neutral", label: "Draft" },
  Cancelled: { chip: "erp-chip erp-chip-danger", label: "Cancelled" },
};

const emptyForm = (): InvoiceForm => ({
  customerId: "",
  placeOfSupply: "",
  dueDate: "",
  notes: "",
});

export function InvoicesManager() {
  const { customers, items, schemes } = useDocumentMasters();
  const [records, setRecords] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [aiInvoiceId, setAiInvoiceId] = useState<string | null>(null);
  const [fieldsInvoice, setFieldsInvoice] = useState<InvoiceRow | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [lines, setLines] = useState<DocLine[]>([emptyDocLine()]);
  const [discount, setDiscount] = useState(emptyBillDiscount);

  const totals = useMemo(() => documentTotals(lines), [lines]);
  const billed = useMemo(() => withBillDiscount(totals, discount), [totals, discount]);
  const gst = gstSplit(totals.taxAmount, form.placeOfSupply);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salesApi.invoices.getAll(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const mapped: InvoiceRow[] = list.map((inv: Record<string, unknown>) => ({
        id: String(inv.id),
        invoiceNumber: String(inv.invoiceNumber ?? ""),
        customerId: inv.customerId ? String(inv.customerId) : undefined,
        customerName: String(inv.customerName ?? inv.customerId ?? ""),
        amount: Number(inv.subTotal ?? inv.totalAmount ?? 0),
        taxAmount: Number(inv.taxAmount ?? 0),
        totalAmount: Number(inv.totalAmount ?? 0),
        issueDate: inv.invoiceDate ? String(inv.invoiceDate) : undefined,
        dueDate: inv.dueDate ? String(inv.dueDate) : undefined,
        status: String(inv.status ?? inv.paymentStatus ?? "Unpaid"),
        placeOfSupply: inv.placeOfSupply ? String(inv.placeOfSupply) : undefined,
        cgstAmount: Number(inv.cgstAmount ?? 0),
        sgstAmount: Number(inv.sgstAmount ?? 0),
        igstAmount: Number(inv.igstAmount ?? 0),
      }));
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load invoices.");
      setError(msg);
      notifyError(msg, "Invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setLines([emptyDocLine()]);
    setDiscount(emptyBillDiscount());
    setShowForm(true);
  };

  const handleSave = async () => {
    const itemsPayload = payloadLines(lines);
    if (!form.customerId || itemsPayload.length === 0) return;
    try {
      setSaving(true);
      await salesApi.invoices.create({
        customerId: form.customerId,
        invoiceDate: new Date().toISOString(),
        dueDate: form.dueDate || undefined,
        placeOfSupply: form.placeOfSupply || undefined,
        items: itemsPayload,
        notes: form.notes,
        discountAmount: billed.discountAmount,
        totalAmount: billed.netTotal,
        status: "Unpaid",
        paymentStatus: "Pending",
      });
      setShowForm(false);
      setForm(emptyForm());
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create invoice."), "Invoice");
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = async (row: InvoiceRow) => {
    try {
      const res = await salesApi.invoices.getById(row.id);
      const inv = (res.data?.data ?? res.data) as Record<string, unknown>;
      const apiLines = Array.isArray(inv.items) ? (inv.items as Record<string, unknown>[]) : [];
      printCommercialDocument({
        title: "GST Tax Invoice",
        number: String(inv.invoiceNumber ?? row.invoiceNumber ?? ""),
        date: String(inv.invoiceDate ?? row.issueDate ?? "").slice(0, 10),
        dueDate: String(inv.dueDate ?? row.dueDate ?? "").slice(0, 10),
        party: String(inv.customerName ?? row.customerName ?? ""),
        partyGstin: String(inv.customerGstin ?? inv.gstNumber ?? "29ABCDE1234F1Z5"),
        partyAddress: String(inv.customerAddress ?? inv.billingAddress ?? "Commercial Complex, MG Road, Bangalore, Karnataka"),
        partyState: String(inv.placeOfSupply ?? row.placeOfSupply ?? "Karnataka (29)"),
        placeOfSupply: String(inv.placeOfSupply ?? row.placeOfSupply ?? ""),
        lines: apiLines.map((line) => ({
          description: String(line.description ?? ""),
          hsnCode: String(line.hsnCode ?? "998313"),
          quantity: Number(line.quantity ?? 0),
          unitPrice: Number(line.unitPrice ?? 0),
          taxRate: Number(line.taxRate ?? 18),
          discountAmount: Number(line.discountAmount ?? 0),
        })),
        subTotal: Number(inv.subTotal ?? row.amount ?? 0),
        taxAmount: Number(inv.taxAmount ?? row.taxAmount ?? 0),
        total: Number(inv.totalAmount ?? row.totalAmount ?? 0),
        discountAmount: Number(inv.discountAmount ?? 0),
        cgst: Number(inv.cgstAmount ?? row.cgstAmount ?? 0),
        sgst: Number(inv.sgstAmount ?? row.sgstAmount ?? 0),
        igst: Number(inv.igstAmount ?? row.igstAmount ?? 0),
      });
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not print invoice."), "Invoice");
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (r.invoiceNumber || "").toLowerCase().includes(q) ||
      (r.customerName || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const now = new Date();
  const paid = filtered.filter((r) => r.status === "Paid").length;
  const outstanding = filtered.filter((r) => ["Unpaid", "Outstanding", "Partial"].includes(r.status || "")).length;
  const overdue = filtered.filter((r) => {
    if (r.status === "Paid") return false;
    return r.dueDate ? new Date(r.dueDate) < now : false;
  }).length;
  const totalOutstanding = filtered
    .filter((r) => r.status !== "Paid")
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const list = useErpListView({
    listKey: "sales-invoices",
    rows: filtered,
    columns: [
      { key: "invoiceNumber", label: "Invoice #" },
      { key: "customerName", label: "Customer" },
      { key: "placeOfSupply", label: "POS" },
      { key: "dueDate", label: "Due Date", dataType: "date" },
      { key: "taxAmount", label: "GST", dataType: "currency" },
      { key: "totalAmount", label: "Amount", dataType: "currency" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No invoices found. Use New invoice in the header to create one.",
    onCreate: openCreate,
    createLabel: "New invoice",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          className="erp-input max-w-xs"
          placeholder="Invoice # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </>
    ),
    renderRow: (r) => {
      const cfg = STATUS_CONFIG[r.status || "Unpaid"] || STATUS_CONFIG.Unpaid;
      const isOverdue = r.status !== "Paid" && r.dueDate && new Date(r.dueDate) < now;
      const gstLabel = r.igstAmount
        ? `IGST ${formatInr(r.igstAmount)}`
        : `CGST ${formatInr(r.cgstAmount)} + SGST ${formatInr(r.sgstAmount)}`;
      return (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td font-mono text-sm font-semibold text-slate-900 dark:text-white">{r.invoiceNumber || "-"}</td>
          <td className="erp-td text-slate-700 dark:text-slate-300">{r.customerName || r.customerId || "-"}</td>
          <td className="erp-td text-slate-600 dark:text-slate-400">{r.placeOfSupply || "-"}</td>
          <td className="erp-td">
            <span className={isOverdue ? "font-semibold text-red-600" : "text-slate-600 dark:text-slate-400"}>
              {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "-"}
              {isOverdue ? <span className="ml-1 text-xs">!</span> : null}
            </span>
          </td>
          <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{gstLabel}</td>
          <td className="erp-td font-semibold text-slate-900 dark:text-white">{formatInr(r.totalAmount)}</td>
          <td className="erp-td">
            <span className={cfg.chip}>{cfg.label}</span>
          </td>
          <td className="erp-td">
            <ErpRowActions
              onView={{ label: "Print", onClick: () => void printInvoice(r) }}
              extra={
                <>
                  <button
                    type="button"
                    title="Fields"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer dark:hover:bg-slate-800 dark:text-slate-400"
                    onClick={() => setFieldsInvoice(r)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">Fields</span>
                  </button>
                  <button
                    type="button"
                    title="Ask AI"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer dark:hover:bg-slate-800 dark:text-slate-400"
                    onClick={() => setAiInvoiceId(r.id)}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="sr-only">Ask AI</span>
                  </button>
                </>
              }
            />
          </td>
        </tr>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Invoices"
      subtitle="Raise GST invoices with item lines, place of supply, and print from the register."
      eyebrow="Finance / Transactions"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Invoices", value: filtered.length, helper: "visible" },
            { label: "Paid", value: paid, tone: "positive" },
            { label: "Open", value: outstanding, helper: formatInr(totalOutstanding), tone: "warning" },
            { label: "Overdue", value: overdue, tone: "danger" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New invoice" onClick={openCreate} />
        </>
      }
      filters={list.filterBar}
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New invoice"
        subtitle="Select the customer, place of supply, and taxable lines. GST is calculated on save."
        width="full"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            disabled={!form.customerId || payloadLines(lines).length === 0}
            saveLabel="Create invoice"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ErpMasterSelect
              label="Customer"
              value={form.customerId}
              options={customers}
              placeholder="Select customer"
              onChange={(id, option) =>
                setForm((current) => ({
                  ...current,
                  customerId: id,
                  placeOfSupply: option?.state || current.placeOfSupply,
                }))
              }
            />
            <div>
              <label className="erp-label">Place of supply</label>
              <select
                className="erp-select mt-1"
                value={form.placeOfSupply}
                onChange={(e) => setForm((current) => ({ ...current, placeOfSupply: e.target.value }))}
              >
                <option value="">Select state</option>
                {INDIA_STATE_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="erp-label">Due Date</label>
              <input className="erp-input mt-1" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Notes</label>
              <input className="erp-input mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <ErpLineGrid lines={lines} onChange={setLines} items={items} priceField="sellingPrice" schemes={schemes} />
          <ErpTotalsStrip
            subTotal={totals.subTotal}
            taxAmount={totals.taxAmount}
            total={totals.total}
            cgst={gst.cgst}
            sgst={gst.sgst}
            igst={gst.igst}
            discount={discount}
            onDiscountChange={setDiscount}
          />
        </div>
      </SideDrawer>

      <SideDrawer
        open={Boolean(fieldsInvoice)}
        onClose={() => setFieldsInvoice(null)}
        title={fieldsInvoice ? `Custom fields · ${fieldsInvoice.invoiceNumber || "Invoice"}` : "Custom fields"}
        subtitle="SalesInvoice entity fields for this tenant"
        width="md"
        footer={
          <div className="flex justify-end">
            <button type="button" className={`${erpButtonClassName.secondary} cursor-pointer`} onClick={() => setFieldsInvoice(null)}>
              Close
            </button>
          </div>
        }
      >
        {fieldsInvoice ? (
          <DynamicFieldsSection entityName="SalesInvoice" recordId={fieldsInvoice.id} editable compact />
        ) : null}
      </SideDrawer>

      <RecordAiDrawer
        open={Boolean(aiInvoiceId)}
        onClose={() => setAiInvoiceId(null)}
        recordType="invoice"
        recordId={aiInvoiceId ?? ""}
        title="Ask AI · Invoice"
        suggestedPrompt="Summarize balance and collection risk for this invoice."
      />
    </StandardPageLayout>
  );
}

export default InvoicesManager;
