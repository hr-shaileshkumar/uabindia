"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { financeApi, procurementApi, salesApi } from "@/services/modules";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { ErpMasterSelect, asRows, formatInr, useDocumentMasters } from "@/components/workspace/document-kit";

type PaymentRow = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: string;
  partyName?: string;
  amount: number;
  paymentMode: string;
  status: string;
};

type OpenDoc = {
  id: string;
  label: string;
  partyId: string;
  balance: number;
  number: string;
};

function LegacyPaymentsView() {
  const { customers, vendors } = useDocumentMasters();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [invoices, setInvoices] = useState<OpenDoc[]>([]);
  const [bills, setBills] = useState<OpenDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentType: "Paid",
    partyId: "",
    amount: "",
    paymentMode: "BankTransfer",
    invoiceId: "",
    referenceNumber: "",
    remarks: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, invRes, billRes] = await Promise.all([
        financeApi.payments.list(1, 50),
        salesApi.invoices.getAll(1, 100).catch(() => ({ data: { data: [] } })),
        procurementApi.bills.getAll(1, 100).catch(() => ({ data: { data: [] } })),
      ]);
      setRows((payRes.data?.data as PaymentRow[]) || []);
      setInvoices(
        asRows<Record<string, unknown>>(invRes.data)
          .filter((row) => String(row.status ?? "") !== "Paid")
          .map((row) => ({
            id: String(row.id),
            number: String(row.invoiceNumber ?? ""),
            partyId: String(row.customerId ?? ""),
            balance: Number(row.balanceAmount ?? row.totalAmount ?? 0),
            label: `${row.invoiceNumber ?? "Invoice"} · ${formatInr(Number(row.balanceAmount ?? row.totalAmount ?? 0))}`,
          })),
      );
      setBills(
        asRows<Record<string, unknown>>(billRes.data)
          .filter((row) => String(row.status ?? "") !== "Paid")
          .map((row) => ({
            id: String(row.id),
            number: String(row.invoiceNumber ?? ""),
            partyId: String(row.vendorId ?? ""),
            balance: Number(row.balanceAmount ?? row.totalAmount ?? 0),
            label: `${row.invoiceNumber ?? "Bill"} · ${formatInr(Number(row.balanceAmount ?? row.totalAmount ?? 0))}`,
          })),
      );
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const received = form.paymentType === "Received";
  const parties = received ? customers : vendors;
  const openDocs = useMemo(
    () => (received ? invoices : bills).filter((doc) => !form.partyId || doc.partyId === form.partyId),
    [received, invoices, bills, form.partyId],
  );
  const selectedDoc = openDocs.find((doc) => doc.id === form.invoiceId);

  const save = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!form.partyId) {
      setError("Select a party.");
      return;
    }
    setError(null);
    const party = parties.find((row) => row.id === form.partyId);
    try {
      setLoading(true);
      await financeApi.payments.create({
        paymentDate: new Date(form.paymentDate).toISOString(),
        paymentType: form.paymentType,
        partyType: received ? "Customer" : "Vendor",
        partyId: form.partyId,
        partyName: party?.label,
        amount,
        paymentMode: form.paymentMode,
        invoiceType: form.invoiceId ? (received ? "SalesInvoice" : "PurchaseInvoice") : undefined,
        invoiceId: form.invoiceId || undefined,
        invoiceNumber: selectedDoc?.number,
        referenceNumber: form.referenceNumber || undefined,
        remarks: form.remarks || undefined,
      });
      setDrawerOpen(false);
      setForm({
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentType: "Paid",
        partyId: "",
        amount: "",
        paymentMode: "BankTransfer",
        invoiceId: "",
        referenceNumber: "",
        remarks: "",
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (Admin may be required).");
    } finally {
      setLoading(false);
    }
  };

  const moneyInCount = rows.filter((row) => row.paymentType === "Received").length;
  const moneyOutCount = rows.filter((row) => row.paymentType === "Paid").length;
  const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

  const list = useErpListView({
    listKey: "payments",
    rows,
    columns: [
      { key: "paymentNumber", label: "Number" },
      { key: "paymentDate", label: "Date", dataType: "date" },
      { key: "paymentType", label: "Type" },
      { key: "partyName", label: "Party" },
      { key: "amount", label: "Amount", className: "text-right", dataType: "currency" },
      { key: "paymentMode", label: "Mode" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No payments yet. Use New payment to record the first entry.",
    onCreate: () => setDrawerOpen(true),
    createLabel: "New payment",
    onRefresh: () => void load(),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td font-medium text-slate-900">{row.paymentNumber}</td>
        <td className="erp-td">{String(row.paymentDate).slice(0, 10)}</td>
        <td className="erp-td">{row.paymentType}</td>
        <td className="erp-td">{row.partyName ?? "—"}</td>
        <td className="erp-td text-right tabular-nums">{formatInr(Number(row.amount))}</td>
        <td className="erp-td">{row.paymentMode}</td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Payments"
      subtitle="Record receipts and disbursements, and allocate them to an invoice or vendor bill."
      eyebrow="Finance / Treasury"
      icon="wallet"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Payments", value: rows.length, helper: "records" },
            { label: "Money In", value: moneyInCount, tone: "positive" },
            { label: "Money Out", value: moneyOutCount, tone: "danger" },
            { label: "Amount", value: formatInr(totalAmount), tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New payment" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error text-sm">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New payment"
        subtitle="Allocate money in to a customer invoice, or money out to a vendor bill."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void save()}
            saving={loading}
            disabled={!form.partyId || Number(form.amount) <= 0}
            saveLabel="Save payment"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Date</label>
            <input type="date" value={form.paymentDate} onChange={(e) => setForm((current) => ({ ...current, paymentDate: e.target.value }))} className="erp-input mt-1" />
          </div>
          <div>
            <label className="erp-label">Type</label>
            <select
              value={form.paymentType}
              onChange={(e) => setForm((current) => ({ ...current, paymentType: e.target.value, partyId: "", invoiceId: "", amount: "" }))}
              className="erp-select mt-1"
            >
              <option value="Paid">Paid (out)</option>
              <option value="Received">Received (in)</option>
            </select>
          </div>
          <ErpMasterSelect
            label={received ? "Customer" : "Vendor"}
            value={form.partyId}
            options={parties}
            placeholder={received ? "Select customer" : "Select vendor"}
            onChange={(id) => setForm((current) => ({ ...current, partyId: id, invoiceId: "" }))}
          />
          <ErpMasterSelect
            label={received ? "Allocate to invoice" : "Allocate to vendor bill"}
            value={form.invoiceId}
            options={openDocs.map((doc) => ({ id: doc.id, label: doc.label }))}
            placeholder="Optional"
            onChange={(id, option) => {
              const doc = openDocs.find((row) => row.id === id);
              setForm((current) => ({
                ...current,
                invoiceId: id,
                amount: doc ? String(doc.balance) : current.amount,
                partyId: doc?.partyId || current.partyId,
              }));
              void option;
            }}
          />
          <div>
            <label className="erp-label">Amount</label>
            <input value={form.amount} onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))} className="erp-input mt-1" inputMode="decimal" />
          </div>
          <div>
            <label className="erp-label">Mode</label>
            <select value={form.paymentMode} onChange={(e) => setForm((current) => ({ ...current, paymentMode: e.target.value }))} className="erp-select mt-1">
              <option value="Cash">Cash</option>
              <option value="BankTransfer">Bank transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Reference</label>
            <input value={form.referenceNumber} onChange={(e) => setForm((current) => ({ ...current, referenceNumber: e.target.value }))} className="erp-input mt-1" />
          </div>
          <div>
            <label className="erp-label">Remarks</label>
            <input value={form.remarks} onChange={(e) => setForm((current) => ({ ...current, remarks: e.target.value }))} className="erp-input mt-1" />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default function PaymentsPage() {
  return (
    <DynamicPage
      pageKey="finance.payments"
      fallback={<LegacyPaymentsView />}
      renderMode="auto"
    />
  );
}
