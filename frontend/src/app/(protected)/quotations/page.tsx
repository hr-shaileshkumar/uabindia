"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { salesApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  DocLine,
  ErpLineGrid,
  ErpMasterSelect,
  ErpTotalsStrip,
  documentTotals,
  emptyBillDiscount,
  emptyDocLine,
  payloadLines,
  useDocumentMasters,
  withBillDiscount,
} from "@/components/workspace/document-kit";

type QuotationRow = {
  id: string;
  quoteNumber?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  validUntil?: string;
  createdDate?: string;
  status?: string;
  notes?: string;
  soNumber?: string;
  totalAmount?: number;
  expectedDeliveryDate?: string;
  soDate?: string;
};

type QuoteForm = {
  customerId: string;
  validUntil: string;
  notes: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Draft: { chip: "erp-chip erp-chip-neutral", label: "Draft" },
  Sent: { chip: "erp-chip erp-chip-info", label: "Sent" },
  Pending: { chip: "erp-chip erp-chip-warning", label: "Pending" },
  Accepted: { chip: "erp-chip erp-chip-success", label: "Accepted" },
  Rejected: { chip: "erp-chip erp-chip-danger", label: "Rejected" },
  Expired: { chip: "erp-chip erp-chip-neutral", label: "Expired" },
};

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function QuotationsPage() {
  const { customers, items, schemes } = useDocumentMasters();
  const [records, setRecords] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuoteForm>({
    customerId: "",
    validUntil: "",
    notes: "",
  });
  const [lines, setLines] = useState<DocLine[]>([emptyDocLine()]);
  const [discount, setDiscount] = useState(emptyBillDiscount);
  const totals = useMemo(() => documentTotals(lines), [lines]);
  const billed = useMemo(() => withBillDiscount(totals, discount), [totals, discount]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await salesApi.quotations.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const mapped: QuotationRow[] = list.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        quoteNumber: String(row.quotationNumber ?? row.quoteNumber ?? ""),
        customerId: row.customerId ? String(row.customerId) : undefined,
        customerName: String(row.customerName ?? row.customerId ?? ""),
        amount: Number(row.totalAmount ?? row.amount ?? 0),
        validUntil: row.validUntil ? String(row.validUntil) : undefined,
        createdDate: row.quotationDate ? String(row.quotationDate) : undefined,
        status: String(row.status ?? "Draft"),
        notes: row.notes ? String(row.notes) : undefined,
      }));

      setRecords(mapped);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load quotations.");
      setError(message);
      notifyError(message, "Quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const itemsPayload = payloadLines(lines);
    if (!form.customerId || itemsPayload.length === 0) {
      return;
    }

    try {
      setSaving(true);
      await salesApi.quotations.create({
        customerId: form.customerId,
        quotationDate: new Date().toISOString(),
        validUntil: form.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
        status: "Draft",
        notes: form.notes,
        items: itemsPayload,
        discountAmount: billed.discountAmount,
        totalAmount: billed.netTotal,
      });
      setShowForm(false);
      setForm({ customerId: "", validUntil: "", notes: "" });
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create quotation."), "Quotation");
    } finally {
      setSaving(false);
    }
  };

  const convertToOrder = async (id: string) => {
    try {
      setConvertingId(id);
      await salesApi.quotations.convertToOrder(id);
      notifySuccess("Quotation converted to sales order.", "Sales");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Convert to order failed."), "Sales");
    } finally {
      setConvertingId(null);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.quoteNumber || "").toLowerCase().includes(query) ||
      (record.customerName || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const acceptedCount = filtered.filter((record) => record.status === "Accepted").length;
  const _pendingCount = filtered.filter((record) =>
    ["Pending", "Sent"].includes(record.status || ""),
  ).length;
  const pipelineValue = filtered
    .filter((record) => ["Pending", "Sent"].includes(record.status || ""))
    .reduce((sum, record) => sum + (record.amount || 0), 0);
  const conversionRate = filtered.length ? Math.round((acceptedCount / filtered.length) * 100) : 0;

  const list = useErpListView({
    listKey: "sales-quotations",
    rows: filtered,
    columns: [
      { key: "quoteNumber", label: "Quotation" },
      { key: "customerName", label: "Customer" },
      { key: "amount", label: "Amount", dataType: "currency" },
      { key: "createdDate", label: "Created", dataType: "date" },
      { key: "validUntil", label: "Valid Until", dataType: "date" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (record) => record.id,
    loading,
    emptyMessage: "No quotations found. Use New quotation in the header to create one.",
    onCreate: () => {
      setForm({ customerId: "", validUntil: "", notes: "" });
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      setShowForm(true);
    },
    createLabel: "New quotation",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          className="erp-input max-w-xs"
          placeholder="Quotation number or customer..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="erp-select w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </>
    ),
    renderRow: (record) => {
      const isExpired = record.validUntil && new Date(record.validUntil) < new Date();
      const statusKey = isExpired ? "Expired" : record.status || "Draft";
      const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Draft;
      const canConvert =
        !isExpired && !["Accepted", "Rejected", "Expired"].includes(record.status || "");
      return (
        <tr key={record.id} className="erp-tr">
          <td className="erp-td font-mono text-sm font-semibold text-slate-900">{record.quoteNumber || "-"}</td>
          <td className="erp-td text-slate-700">{record.customerName || record.customerId || "-"}</td>
          <td className="erp-td font-semibold text-slate-900">{formatCurrency(record.amount)}</td>
          <td className="erp-td text-slate-600">
            {record.createdDate ? new Date(record.createdDate).toLocaleDateString("en-IN") : "-"}
          </td>
          <td className="erp-td">
            <span className={isExpired ? "font-semibold text-red-600" : "text-slate-600"}>
              {record.validUntil ? new Date(record.validUntil).toLocaleDateString("en-IN") : "-"}
              {isExpired ? <span className="ml-1 text-xs">Expired</span> : null}
            </span>
          </td>
          <td className="erp-td">
            <span className={status.chip}>{status.label}</span>
          </td>
          <td className="erp-td">
            {canConvert ? (
              <button
                type="button"
                className="erp-action-btn erp-action-btn-secondary text-xs"
                disabled={convertingId === record.id}
                onClick={() => void convertToOrder(record.id)}
              >
                {convertingId === record.id ? "Converting…" : "To order"}
              </button>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </td>
        </tr>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Quotations"
      subtitle="Manage quote creation, validity, and sales pipeline visibility without heavy duplicate UI blocks."
      eyebrow="Sales / Quotation Control"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Quotations", value: filtered.length, helper: "visible" },
            { label: "Accepted", value: acceptedCount, tone: "positive" },
            { label: "Pipeline", value: formatCurrency(pipelineValue), tone: "warning" },
            { label: "Conversion", value: `${conversionRate}%`, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton
            label="New quotation"
            onClick={() => {
              setForm({ customerId: "", validUntil: "", notes: "" });
              setLines([emptyDocLine()]);
              setDiscount(emptyBillDiscount());
              setShowForm(true);
            }}
          />
        </>
      }
      filters={list.filterBar}
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New quotation"
        subtitle="Pick the customer and item lines. Totals follow quantity, rate, and GST."
        width="full"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            disabled={!form.customerId || payloadLines(lines).length === 0}
            saveLabel="Create quotation"
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
              onChange={(id) => setForm({ ...form, customerId: id })}
            />
            <div>
              <label className="erp-label">Valid Until</label>
              <input
                className="erp-input mt-1"
                type="date"
                value={form.validUntil}
                onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="erp-label">Notes or Terms</label>
              <textarea
                className="erp-input mt-1"
                rows={2}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Pricing notes, validity terms, delivery assumptions..."
              />
            </div>
          </div>
          <ErpLineGrid lines={lines} onChange={setLines} items={items} priceField="sellingPrice" schemes={schemes} />
          <ErpTotalsStrip
            subTotal={totals.subTotal}
            taxAmount={totals.taxAmount}
            total={totals.total}
            discount={discount}
            onDiscountChange={setDiscount}
          />
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
