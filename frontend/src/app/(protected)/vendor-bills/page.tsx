"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DynamicPage } from "@/components/dynamic/DynamicPage";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { procurementApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  DocLine,
  ErpLineGrid,
  ErpMasterSelect,
  ErpTotalsStrip,
  asRows,
  docLinesFromApi,
  documentTotals,
  emptyBillDiscount,
  emptyDocLine,
  formatInr,
  payloadLines,
  useDocumentMasters,
  withBillDiscount,
} from "@/components/workspace/document-kit";
import { DocumentLifecycleTimeline } from "@/components/workspace/DocumentLifecycleTimeline";

type BillRow = {
  id: string;
  invoiceNumber?: string;
  vendorId?: string;
  vendorInvoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  status?: string;
};

function LegacyVendorBillsView() {
  const { vendors, items } = useDocumentMasters();
  const [records, setRecords] = useState<BillRow[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Array<{ id: string; poNumber: string; vendorId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    vendorId: "",
    purchaseOrderId: "",
    vendorInvoiceNumber: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<DocLine[]>([emptyDocLine()]);
  const [discount, setDiscount] = useState(emptyBillDiscount);

  const totals = useMemo(() => documentTotals(lines), [lines]);
  const billed = useMemo(() => withBillDiscount(totals, discount), [totals, discount]);
  const vendorName = (id?: string) => vendors.find((vendor) => vendor.id === id)?.label || id || "-";
  const vendorPos = purchaseOrders.filter((order) => !form.vendorId || order.vendorId === form.vendorId);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [billRes, poRes] = await Promise.all([
        procurementApi.bills.getAll(1, 50),
        procurementApi.purchaseOrders.getAll(1, 100).catch(() => ({ data: { data: [] } })),
      ]);
      setRecords(asRows<BillRow>(billRes.data));
      setPurchaseOrders(asRows(poRes.data));
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load vendor bills.");
      setError(message);
      notifyError(message, "Vendor bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPurchaseOrder = async (purchaseOrderId: string) => {
    setForm((current) => ({ ...current, purchaseOrderId }));
    if (!purchaseOrderId) {
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      return;
    }
    try {
      const res = await procurementApi.purchaseOrders.getById(purchaseOrderId);
      const po = (res.data?.data ?? res.data) as {
        vendorId?: string;
        discountAmount?: number;
        items?: Array<{ itemId?: string; description?: string; quantity?: number; unitPrice?: number; taxRate?: number }>;
      };
      setForm((current) => ({
        ...current,
        purchaseOrderId,
        vendorId: po.vendorId ? String(po.vendorId) : current.vendorId,
      }));
      setLines(docLinesFromApi(po.items));
      const poDiscount = Number(po.discountAmount ?? 0);
      setDiscount(
        poDiscount > 0 ? { kind: "amount", percent: 5, amount: poDiscount } : emptyBillDiscount(),
      );
    } catch {
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
    }
  };

  const handleSave = async () => {
    if (!form.vendorId) return;
    try {
      setSaving(true);
      await procurementApi.bills.create({
        vendorId: form.vendorId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        vendorInvoiceNumber: form.vendorInvoiceNumber || undefined,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        items: payloadLines(lines),
        discountAmount: billed.discountAmount,
        totalAmount: billed.netTotal,
      });
      setShowForm(false);
      setForm({
        vendorId: "",
        purchaseOrderId: "",
        vendorInvoiceNumber: "",
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        notes: "",
      });
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create vendor bill."), "Vendor bills");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((row) => {
    const query = search.toLowerCase();
    return (
      !query ||
      String(row.invoiceNumber ?? "").toLowerCase().includes(query) ||
      vendorName(row.vendorId).toLowerCase().includes(query) ||
      String(row.vendorInvoiceNumber ?? "").toLowerCase().includes(query)
    );
  });

  const unpaid = filtered.filter((row) => row.status !== "Paid").length;
  const openValue = filtered
    .filter((row) => row.status !== "Paid")
    .reduce((sum, row) => sum + Number(row.balanceAmount ?? row.totalAmount ?? 0), 0);

  const listRows = useMemo(
    () => filtered.map((row) => ({ ...row, vendorName: vendorName(row.vendorId) })),
    [filtered, vendors],
  );

  const list = useErpListView({
    listKey: "vendor-bills",
    rows: listRows,
    columns: [
      { key: "invoiceNumber", label: "Bill #" },
      { key: "vendorName", label: "Vendor" },
      { key: "vendorInvoiceNumber", label: "Vendor invoice" },
      { key: "invoiceDate", label: "Date", dataType: "date" },
      { key: "totalAmount", label: "Total", dataType: "currency" },
      { key: "balanceAmount", label: "Balance", dataType: "currency" },
      { key: "status", label: "Status" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No vendor bills yet. Use New bill to record one.",
    onCreate: () => {
      setForm({
        vendorId: "",
        purchaseOrderId: "",
        vendorInvoiceNumber: "",
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        notes: "",
      });
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      setShowForm(true);
    },
    createLabel: "New bill",
    onRefresh: () => void load(),
    extraFilters: (
      <input
        className="erp-input max-w-xs"
        placeholder="Bill #, vendor invoice, or vendor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    ),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td font-mono font-semibold">{row.invoiceNumber || "-"}</td>
        <td className="erp-td">{row.vendorName}</td>
        <td className="erp-td">{row.vendorInvoiceNumber || "-"}</td>
        <td className="erp-td">{row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString("en-IN") : "-"}</td>
        <td className="erp-td font-semibold">{formatInr(row.totalAmount)}</td>
        <td className="erp-td">{formatInr(row.balanceAmount)}</td>
        <td className="erp-td">
          <span className={row.status === "Paid" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
            {row.status || "Unpaid"}
          </span>
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Vendor bills"
      subtitle="Record supplier invoices against purchase orders, with GST lines and outstanding balances."
      eyebrow="Procurement / Accounts Payable"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Bills", value: filtered.length, helper: "visible" },
            { label: "Open", value: unpaid, tone: "warning" },
            { label: "Payable", value: formatInr(openValue), tone: "danger" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton
            label="New bill"
            onClick={() => {
              setForm({
                vendorId: "",
                purchaseOrderId: "",
                vendorInvoiceNumber: "",
                invoiceDate: new Date().toISOString().slice(0, 10),
                dueDate: "",
                notes: "",
              });
              setLines([emptyDocLine()]);
              setDiscount(emptyBillDiscount());
              setShowForm(true);
            }}
          />
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="space-y-6">
        <DocumentLifecycleTimeline currentStage="BILL" />
        <CrudCard>{list.table}</CrudCard>
      </div>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New vendor bill"
        subtitle="Select vendor and lines, or pull lines from a purchase order."
        width="full"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            disabled={!form.vendorId || payloadLines(lines).length === 0}
            saveLabel="Create bill"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ErpMasterSelect
              label="Vendor"
              value={form.vendorId}
              options={vendors}
              placeholder="Select vendor"
              onChange={(id) => setForm((current) => ({ ...current, vendorId: id, purchaseOrderId: "" }))}
            />
            <ErpMasterSelect
              label="Purchase order (optional)"
              value={form.purchaseOrderId}
              options={vendorPos.map((order) => ({ id: order.id, label: order.poNumber }))}
              placeholder="Select PO"
              onChange={(id) => void applyPurchaseOrder(id)}
            />
            <div>
              <label className="erp-label">Vendor invoice #</label>
              <input className="erp-input mt-1" value={form.vendorInvoiceNumber} onChange={(e) => setForm({ ...form, vendorInvoiceNumber: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Bill date</label>
              <input type="date" className="erp-input mt-1" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Due date</label>
              <input type="date" className="erp-input mt-1" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Notes</label>
              <input className="erp-input mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <ErpLineGrid lines={lines} onChange={setLines} items={items} priceField="purchasePrice" />
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

export default function VendorBillsPage() {
  return (
    <DynamicPage
      pageKey="procurement.vendor-bills"
      fallback={<LegacyVendorBillsView />}
      renderMode="auto"
    />
  );
}
