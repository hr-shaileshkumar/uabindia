"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle, Plus, Truck, XCircle } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type GrnRow = {
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

type GrnForm = {
  vendorId: string;
  poReference: string;
  receivedDate: string;
  totalItems: number;
  remarks: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
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

export default function GoodsReceiptPage() {
  const [records, setRecords] = useState<GrnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<GrnForm>({
    vendorId: "",
    poReference: "",
    receivedDate: new Date().toISOString().split("T")[0],
    totalItems: 1,
    remarks: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await hrApi.erp.purchaseOrders.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const mapped: GrnRow[] = list
        .filter((purchaseOrder: GrnRow) =>
          ["Received", "Partial", "Approved"].includes(purchaseOrder.status || ""),
        )
        .map((purchaseOrder: GrnRow, index: number) => ({
          id: purchaseOrder.id || String(index),
          grnNumber: `GRN-${(purchaseOrder.poNumber || purchaseOrder.id?.slice(0, 8) || "").replace("PO-", "")}`,
          vendorId: purchaseOrder.vendorId,
          vendorName: purchaseOrder.vendorName || purchaseOrder.vendorId,
          poReference: purchaseOrder.poNumber,
          receivedDate: purchaseOrder.expectedDeliveryDate || purchaseOrder.poDate,
          totalItems: Math.max(1, Math.floor((purchaseOrder.totalAmount || 0) / 5000)),
          totalAmount: purchaseOrder.totalAmount,
          status: purchaseOrder.status === "Received" ? "Accepted" : "PendingQC",
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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.vendorId) {
      return;
    }

    try {
      setSaving(true);
      await hrApi.erp.stockMovements.create({
        movementType: "GRN",
        referenceNumber: form.poReference,
        vendorId: form.vendorId,
        movementDate: form.receivedDate,
        remarks: form.remarks,
        quantity: form.totalItems,
      });
      setShowForm(false);
      setForm({
        vendorId: "",
        poReference: "",
        receivedDate: new Date().toISOString().split("T")[0],
        totalItems: 1,
        remarks: "",
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create GRN."), "GRN");
    } finally {
      setSaving(false);
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
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="erp-action-btn erp-action-btn-primary"
        >
          <Plus className="h-4 w-4" />
          Record GRN
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input
              className="erp-input"
              placeholder="GRN number, vendor, or PO..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-select w-40"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Status</option>
              <option value="PendingQC">Pending QC</option>
              <option value="Accepted">Accepted</option>
              <option value="PartialAccepted">Partial</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Record Goods Receipt</h2>
              <p className="mt-1 text-sm text-slate-500">
                Capture the vendor, PO reference, receipt date, and received quantity.
              </p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Vendor ID</label>
                  <input
                    className="erp-input"
                    placeholder="Enter vendor ID"
                    value={form.vendorId}
                    onChange={(event) => setForm({ ...form, vendorId: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">PO Reference</label>
                  <input
                    className="erp-input"
                    placeholder="PO-2024-0001"
                    value={form.poReference}
                    onChange={(event) => setForm({ ...form, poReference: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Received Date</label>
                  <input
                    className="erp-input"
                    type="date"
                    value={form.receivedDate}
                    onChange={(event) => setForm({ ...form, receivedDate: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Items Received</label>
                  <input
                    className="erp-input"
                    type="number"
                    min={1}
                    value={form.totalItems}
                    onChange={(event) => setForm({ ...form, totalItems: Number(event.target.value) })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Remarks</label>
                  <textarea
                    className="erp-input"
                    rows={3}
                    value={form.remarks}
                    onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                    placeholder="Quality remarks, shortages, mismatch notes..."
                  />
                </div>
              </div>
              <div className="erp-form-actions">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="erp-action-btn erp-action-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">
                  {saving ? "Saving..." : "Record GRN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">GRN Register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor receipts by vendor, reference, quantity, and receiving status.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">GRN</th>
                <th className="erp-th">Vendor</th>
                <th className="erp-th">PO Reference</th>
                <th className="erp-th">Received Date</th>
                <th className="erp-th">Items</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-td py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Truck className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-400">No GRN records found.</p>
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="erp-action-btn erp-action-btn-secondary text-xs"
                      >
                        Record GRN
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const status = STATUS_CONFIG[record.status || "PendingQC"] || STATUS_CONFIG.PendingQC;
                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">
                        {record.grnNumber || "-"}
                      </td>
                      <td className="erp-td text-slate-700">
                        {record.vendorName || record.vendorId || "-"}
                      </td>
                      <td className="erp-td font-mono text-xs text-slate-600">
                        {record.poReference || "-"}
                      </td>
                      <td className="erp-td text-slate-600">
                        {record.receivedDate
                          ? new Date(record.receivedDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="erp-td font-semibold text-slate-700">{record.totalItems || "-"}</td>
                      <td className="erp-td">
                        <span className={`${status.chip} flex w-fit items-center gap-1`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
