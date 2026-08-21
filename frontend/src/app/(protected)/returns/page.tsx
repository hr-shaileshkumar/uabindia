"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpRowActions } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
import { ErpDocumentStatusActions } from "@/components/erp/erp-document-kit";
import { salesApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ReturnRow = {
  id: string;
  returnNumber?: string;
  customerId?: string;
  customerName?: string;
  originalOrderRef?: string;
  amount?: number;
  reason?: string;
  returnDate?: string;
  status?: string;
  creditNoteNumber?: string;
  soNumber?: string;
  totalAmount?: number;
  soDate?: string;
};

type ReturnForm = {
  customerId: string;
  originalOrderRef: string;
  amount: number;
  reason: string;
  returnDate: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
  Pending: {
    chip: "erp-chip erp-chip-warning",
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Processed: {
    chip: "erp-chip erp-chip-success",
    label: "Processed",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  Rejected: {
    chip: "erp-chip erp-chip-danger",
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  Approved: {
    chip: "erp-chip erp-chip-info",
    label: "Approved",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
};

const RETURN_REASONS = [
  "Defective Product",
  "Wrong Item Delivered",
  "Damaged in Transit",
  "Customer Changed Mind",
  "Quantity Mismatch",
  "Quality Issue",
  "Other",
];

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function ReturnsPage() {
  const [records, setRecords] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<ReturnForm>({
    customerId: "",
    originalOrderRef: "",
    amount: 0,
    reason: "Defective Product",
    returnDate: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await salesApi.returns.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const mapped: ReturnRow[] = list.map((row: ReturnRow, index: number) => ({
        id: row.id || String(index),
        returnNumber: row.returnNumber,
        customerId: row.customerId,
        originalOrderRef: row.originalOrderRef,
        amount: row.amount,
        reason: row.reason,
        returnDate: row.returnDate,
        status: row.status,
        creditNoteNumber: row.creditNoteNumber,
      }));

      setRecords(mapped);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load return records.");
      setError(message);
      notifyError(message, "Returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!form.customerId) {
      return;
    }

    try {
      setSaving(true);
      await salesApi.returns.create({
        customerId: form.customerId,
        originalOrderRef: form.originalOrderRef,
        amount: form.amount,
        reason: form.reason,
        returnDate: form.returnDate,
      });
      setShowForm(false);
      setForm({
        customerId: "",
        originalOrderRef: "",
        amount: 0,
        reason: "Defective Product",
        returnDate: new Date().toISOString().split("T")[0],
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create return."), "Return");
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async (id: string) => {
    try {
      await salesApi.returns.process(id);
      notifySuccess("Return processed.");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to process return."), "Return");
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.returnNumber || "").toLowerCase().includes(query) ||
      (record.customerName || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const processedCount = filtered.filter((record) => record.status === "Processed").length;
  const pendingCount = filtered.filter((record) => record.status === "Pending").length;
  const totalReturnValue = filtered.reduce((sum, record) => sum + (record.amount || 0), 0);

  const list = useErpListView({
    listKey: "sales-returns",
    rows: filtered,
    columns: [
      { key: "returnNumber", label: "Return" },
      { key: "customerName", label: "Customer" },
      { key: "originalOrderRef", label: "Order Ref" },
      { key: "amount", label: "Amount", dataType: "currency" },
      { key: "reason", label: "Reason" },
      { key: "returnDate", label: "Date", dataType: "date" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (record) => record.id,
    loading,
    emptyMessage: "No return records found. Use New return in the header to create one.",
    onCreate: () => setShowForm(true),
    createLabel: "New return",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          className="erp-input max-w-xs"
          placeholder="Return number or customer..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="erp-select w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Processed">Processed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </>
    ),
    renderRow: (record) => {
      const status = STATUS_CONFIG[record.status || "Pending"] || STATUS_CONFIG.Pending;
      return (
        <tr key={record.id} className="erp-tr">
          <td className="erp-td font-mono text-sm font-semibold text-slate-900">{record.returnNumber || "-"}</td>
          <td className="erp-td text-slate-700">{record.customerName || record.customerId || "-"}</td>
          <td className="erp-td font-mono text-xs text-slate-600">{record.originalOrderRef || "-"}</td>
          <td className="erp-td font-semibold text-slate-900">{formatCurrency(record.amount)}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral text-xs">{record.reason || "-"}</span>
          </td>
          <td className="erp-td text-slate-600">
            {record.returnDate ? new Date(record.returnDate).toLocaleDateString("en-IN") : "-"}
          </td>
          <td className="erp-td">
            <span className={`${status.chip} flex w-fit items-center gap-1`}>
              {status.icon}
              {status.label}
            </span>
          </td>
          <td className="erp-td">
            <div className="flex justify-end">
              <ErpRowActions
                extra={
                  <ErpDocumentStatusActions
                    canPost={record.status === "Pending" || record.status === "Approved"}
                    onPost={() => void handleProcess(record.id)}
                  />
                }
              />
            </div>
          </td>
        </tr>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Returns Management"
      subtitle="Handle return capture, credit-note workflow, and customer reverse-flow visibility from one simple screen."
      eyebrow="Sales / Return Control"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Returns", value: filtered.length, helper: "visible" },
            { label: "Processed", value: processedCount, tone: "positive" },
            { label: "Pending", value: pendingCount, tone: "warning" },
            { label: "Value", value: formatCurrency(totalReturnValue), tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New return" onClick={() => setShowForm(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New return"
        subtitle="Link the return to the original order, amount, reason, and customer."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel="Create return"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Customer ID</label>
            <input
              className="erp-input mt-1"
              placeholder="Enter customer ID"
              value={form.customerId}
              onChange={(event) => setForm({ ...form, customerId: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Original Order Reference</label>
            <input
              className="erp-input mt-1"
              placeholder="SO-2024-0001"
              value={form.originalOrderRef}
              onChange={(event) => setForm({ ...form, originalOrderRef: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Return Amount (Rs)</label>
            <input
              className="erp-input mt-1"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
            />
          </div>
          <div>
            <label className="erp-label">Return Date</label>
            <input
              className="erp-input mt-1"
              type="date"
              value={form.returnDate}
              onChange={(event) => setForm({ ...form, returnDate: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Reason</label>
            <select
              className="erp-select mt-1"
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            >
              {RETURN_REASONS.map((reason) => (
                <option key={reason}>{reason}</option>
              ))}
            </select>
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
