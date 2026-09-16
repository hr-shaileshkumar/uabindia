"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { procurementApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ErpMasterSelect, asRows, formatInr, useDocumentMasters } from "@/components/workspace/document-kit";
import { DocumentLifecycleTimeline } from "@/components/workspace/DocumentLifecycleTimeline";

export type GrnRow = {
  id: string;
  grnNumber?: string;
  vendorId?: string;
  vendorName?: string;
  poNumber?: string;
  poDate?: string;
  poReference?: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  totalItems?: number;
  totalAmount?: number;
  status?: string;
  remarks?: string;
};

export type GrnForm = {
  vendorId: string;
  purchaseOrderId: string;
  receivedDate: string;
  remarks: string;
};

export const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
  Accepted: {
    chip: "erp-chip erp-chip-success",
    label: "Accepted",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  PendingQC: {
    chip: "erp-chip erp-chip-warning",
    label: "Pending QC",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  Rejected: {
    chip: "erp-chip erp-chip-danger",
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  PartialAccepted: {
    chip: "erp-chip erp-chip-info",
    label: "Partial",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

export function GoodsReceiptNotesManager() {
  const { vendors } = useDocumentMasters();
  const [records, setRecords] = useState<GrnRow[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Array<{ id: string; poNumber: string; vendorId: string; totalAmount: number; items?: unknown[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [form, setForm] = useState<GrnForm>({
    vendorId: "",
    purchaseOrderId: "",
    receivedDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await procurementApi.grn.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const poRes = await procurementApi.purchaseOrders.getAll(1, 100).catch(() => ({ data: { data: [] } }));
      setPurchaseOrders(
        asRows<{ id: string; poNumber: string; vendorId: string; totalAmount: number; items?: unknown[] }>(poRes.data),
      );

      const mapped: GrnRow[] = list.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        grnNumber: String(row.grnNumber ?? ""),
        vendorId: row.vendorId ? String(row.vendorId) : undefined,
        vendorName: String(row.vendorName ?? row.vendorId ?? ""),
        poReference: String(row.poReference ?? row.poNumber ?? ""),
        receivedDate: row.receivedDate ? String(row.receivedDate) : undefined,
        totalItems: Number(row.totalItems ?? 0),
        totalAmount: Number(row.totalAmount ?? 0),
        status: String(row.status ?? "PendingQC"),
        remarks: row.remarks ? String(row.remarks) : undefined,
      }));

      setRecords(mapped);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load GRN records.");
      setError(message);
      notifyError(message, "GRN");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const vendorPos = useMemo(
    () => purchaseOrders.filter((order) => !form.vendorId || order.vendorId === form.vendorId),
    [purchaseOrders, form.vendorId],
  );
  const selectedPo = purchaseOrders.find((order) => order.id === form.purchaseOrderId);

  const handleSave = async () => {
    if (!form.vendorId) {
      return;
    }

    try {
      setSaving(true);
      await procurementApi.grn.create({
        vendorId: form.vendorId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        poReference: selectedPo?.poNumber,
        receivedDate: form.receivedDate,
        totalItems: Array.isArray(selectedPo?.items) ? selectedPo.items.length : 1,
        totalAmount: selectedPo?.totalAmount ?? 0,
        remarks: form.remarks,
        status: "PendingQC",
      });
      setShowForm(false);
      setForm({
        vendorId: "",
        purchaseOrderId: "",
        receivedDate: new Date().toISOString().split("T")[0],
        remarks: "",
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create GRN."), "GRN");
    } finally {
      setSaving(false);
    }
  };

  const acceptGrn = async (id: string) => {
    try {
      setAcceptingId(id);
      const res = await procurementApi.grn.accept(id);
      const count = Array.isArray(res.data?.movements) ? res.data.movements.length : 0;
      notifySuccess(
        count > 0 ? `GRN accepted; ${count} stock movement(s) posted.` : "GRN accepted.",
        "GRN",
      );
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to accept GRN."), "GRN");
    } finally {
      setAcceptingId(null);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.grnNumber || "").toLowerCase().includes(query) ||
      (record.vendorName || "").toLowerCase().includes(query) ||
      (record.poReference || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const acceptedCount = filtered.filter((record) => record.status === "Accepted").length;
  const pendingQcCount = filtered.filter((record) => record.status === "PendingQC").length;
  const totalItems = filtered.reduce((sum, record) => sum + (record.totalItems || 0), 0);

  const list = useErpListView({
    listKey: "goods-receipts",
    rows: filtered,
    columns: [
      { key: "grnNumber", label: "GRN" },
      { key: "vendorName", label: "Vendor" },
      { key: "poReference", label: "PO Reference" },
      { key: "receivedDate", label: "Received Date", dataType: "date" },
      { key: "totalItems", label: "Items", dataType: "number" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (record) => record.id,
    loading,
    emptyMessage: "No GRN records found. Use New GRN in the header to record one.",
    onCreate: () => setShowForm(true),
    createLabel: "New GRN",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          className="erp-input max-w-xs"
          placeholder="GRN number, vendor, or PO..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="erp-select w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All Status</option>
          <option value="PendingQC">Pending QC</option>
          <option value="Accepted">Accepted</option>
          <option value="PartialAccepted">Partial</option>
          <option value="Rejected">Rejected</option>
        </select>
      </>
    ),
    renderRow: (record) => {
      const status = STATUS_CONFIG[record.status || "PendingQC"] || STATUS_CONFIG.PendingQC;
      const canAccept = !["Accepted", "Rejected"].includes(record.status || "");
      return (
        <tr key={record.id} className="erp-tr">
          <td className="erp-td font-mono text-sm font-semibold text-slate-900 dark:text-white">{record.grnNumber || "-"}</td>
          <td className="erp-td text-slate-700 dark:text-slate-300">{record.vendorName || record.vendorId || "-"}</td>
          <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-400">{record.poReference || "-"}</td>
          <td className="erp-td text-slate-600 dark:text-slate-400">
            {record.receivedDate ? new Date(record.receivedDate).toLocaleDateString("en-IN") : "-"}
          </td>
          <td className="erp-td font-semibold text-slate-700 dark:text-slate-300">{record.totalItems || "-"}</td>
          <td className="erp-td">
            <span className={`${status.chip} flex w-fit items-center gap-1`}>
              {status.icon}
              {status.label}
            </span>
          </td>
          <td className="erp-td">
            {canAccept ? (
              <button
                type="button"
                className="erp-action-btn erp-action-btn-primary text-xs cursor-pointer"
                disabled={acceptingId === record.id}
                onClick={() => void acceptGrn(record.id)}
              >
                {acceptingId === record.id ? "Accepting…" : "Accept & stock"}
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
      title="Goods Receipt"
      subtitle="Track PO-linked receipts, receiving volume, and quality-control state before inventory settlement."
      eyebrow="Procurement / Receiving Control"
      icon="box"
      meta={
        <CrudHeaderStats
          items={[
            { label: "GRNs", value: filtered.length, helper: "visible" },
            { label: "Accepted", value: acceptedCount, tone: "positive" },
            { label: "Pending QC", value: pendingQcCount, tone: "warning" },
            { label: "Units", value: totalItems.toLocaleString("en-IN"), tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New GRN" onClick={() => setShowForm(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="space-y-6">
        <DocumentLifecycleTimeline currentStage="GRN" />
        <CrudCard>{list.table}</CrudCard>
      </div>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New GRN"
        subtitle="Link the vendor and purchase order. Accept later to post stock from PO lines."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            disabled={!form.vendorId}
            saveLabel="Record GRN"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <ErpMasterSelect
            label="Vendor"
            value={form.vendorId}
            options={vendors}
            placeholder="Select vendor"
            onChange={(id) => setForm({ ...form, vendorId: id, purchaseOrderId: "" })}
          />
          <ErpMasterSelect
            label="Purchase order"
            value={form.purchaseOrderId}
            options={vendorPos.map((order) => ({
              id: order.id,
              label: order.poNumber,
              meta: formatInr(order.totalAmount),
            }))}
            placeholder="Select PO"
            onChange={(id) => setForm({ ...form, purchaseOrderId: id })}
          />
          {selectedPo ? (
            <p className="text-sm text-slate-500">
              Receipt will stock the lines on {selectedPo.poNumber} ({formatInr(selectedPo.totalAmount)}).
            </p>
          ) : (
            <p className="text-sm text-slate-500">A PO is required before Accept can post stock.</p>
          )}
          <div>
            <label className="erp-label">Received Date</label>
            <input
              className="erp-input mt-1"
              type="date"
              value={form.receivedDate}
              onChange={(event) => setForm({ ...form, receivedDate: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Remarks</label>
            <textarea
              className="erp-input mt-1"
              rows={3}
              value={form.remarks}
              onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              placeholder="Quality remarks, shortages, mismatch notes..."
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export const GrnManager = GoodsReceiptNotesManager;
export default GoodsReceiptNotesManager;
