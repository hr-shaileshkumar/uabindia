"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
import { procurementApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type PurchaseRequest = {
  id: string;
  requestNumber?: string;
  poNumber?: string;
  requestedBy?: string;
  description?: string;
  itemDescription?: string;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  estimatedCost?: number;
  totalAmount?: number;
  poDate?: string;
  expectedDeliveryDate?: string;
  requiredDate?: string;
  department?: string;
  justification?: string;
  status?: string;
  approvedBy?: string;
  poReference?: string;
  createdAt?: string;
};

type RequestForm = {
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  requiredDate: string;
  department: string;
  justification: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
  Approved: {
    chip: "erp-chip erp-chip-success",
    label: "Approved",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  Pending: {
    chip: "erp-chip erp-chip-warning",
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Rejected: {
    chip: "erp-chip erp-chip-danger",
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  Converted: {
    chip: "erp-chip erp-chip-info",
    label: "Converted to PO",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
  },
  Draft: {
    chip: "erp-chip erp-chip-neutral",
    label: "Draft",
    icon: null,
  },
};

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function PurchaseRequestsPage() {
  const [records, setRecords] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<RequestForm>({
    itemDescription: "",
    quantity: 1,
    estimatedCost: 0,
    requiredDate: "",
    department: "",
    justification: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await procurementApi.purchaseRequests.getAll(1, 50);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      const requests: PurchaseRequest[] = list.map((row: PurchaseRequest, index: number) => ({
        id: row.id || String(index),
        requestNumber: row.requestNumber,
        requestedBy: row.requestedBy || "User",
        itemDescription: row.itemDescription,
        quantity: row.quantity || 1,
        estimatedCost: row.estimatedCost || 0,
        requiredDate: row.requiredDate,
        department: row.department,
        status: row.status || "Pending",
        createdAt: row.createdAt,
      }));

      setRecords(requests);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load purchase requests.");
      setError(message);
      notifyError(message, "Purchase Requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!form.itemDescription || form.quantity <= 0) {
      return;
    }

    try {
      setSaving(true);
      await procurementApi.purchaseRequests.create({
        itemDescription: form.itemDescription,
        quantity: form.quantity,
        estimatedCost: form.estimatedCost,
        requiredDate: form.requiredDate || undefined,
        department: form.department,
        justification: form.justification,
      });
      setShowForm(false);
      setForm({
        itemDescription: "",
        quantity: 1,
        estimatedCost: 0,
        requiredDate: "",
        department: "",
        justification: "",
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create purchase request."), "Purchase Request");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.requestNumber || "").toLowerCase().includes(query) ||
      (record.itemDescription || "").toLowerCase().includes(query) ||
      (record.requestedBy || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approvedCount = filtered.filter((record) =>
    ["Approved", "Converted"].includes(record.status || ""),
  ).length;
  const pendingCount = filtered.filter((record) => record.status === "Pending").length;
  const totalValue = filtered.reduce((sum, record) => sum + (record.estimatedCost || 0), 0);

  const list = useErpListView({
    listKey: "purchase-requests",
    rows: filtered,
    columns: [
      { key: "requestNumber", label: "Request" },
      { key: "itemDescription", label: "Item" },
      { key: "quantity", label: "Qty", dataType: "number" },
      { key: "estimatedCost", label: "Estimate", className: "text-right", dataType: "currency" },
      { key: "requiredDate", label: "Required By", dataType: "date" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
    ],
    getRowId: (record) => record.id,
    loading,
    emptyMessage: "No purchase requests found. Use New request in the header to raise one.",
    onCreate: () => setShowForm(true),
    createLabel: "New request",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          className="erp-input max-w-xs"
          placeholder="Request number, item, or requester..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="erp-select w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Converted">Converted to PO</option>
        </select>
      </>
    ),
    renderRow: (record) => {
      const status = STATUS_CONFIG[record.status || "Pending"] || STATUS_CONFIG.Pending;
      return (
        <tr key={record.id} className="erp-tr">
          <td className="erp-td font-mono text-xs font-semibold text-slate-700">{record.requestNumber || "-"}</td>
          <td className="erp-td">
            <p className="font-semibold text-slate-900">{record.itemDescription || "-"}</p>
            {record.requestedBy ? <p className="text-xs text-slate-500">Requested by {record.requestedBy}</p> : null}
          </td>
          <td className="erp-td text-slate-600">{record.quantity || 0}</td>
          <td className="erp-td text-right font-semibold text-slate-900">{formatCurrency(record.estimatedCost)}</td>
          <td className="erp-td text-slate-600">
            {record.requiredDate ? new Date(record.requiredDate).toLocaleDateString("en-IN") : "-"}
          </td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral text-xs">{record.department || "-"}</span>
          </td>
          <td className="erp-td">
            <span className={`${status.chip} flex w-fit items-center gap-1`}>
              {status.icon}
              {status.label}
            </span>
          </td>
        </tr>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Purchase Requests"
      subtitle="Keep internal demand capture, approval visibility, and PO readiness in one clean requisition workspace."
      eyebrow="Procurement / Requisition Control"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Requests", value: filtered.length, helper: "visible" },
            { label: "Approved", value: approvedCount, tone: "positive" },
            { label: "Pending", value: pendingCount, tone: "warning" },
            { label: "Value", value: formatCurrency(totalValue), tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New request" onClick={() => setShowForm(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New purchase request"
        subtitle="Capture the item need, department, timing, and justification."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel="Submit request"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Item Description</label>
            <input
              className="erp-input mt-1"
              placeholder="5 HP ProBook laptops, safety stock, office furniture..."
              value={form.itemDescription}
              onChange={(event) => setForm({ ...form, itemDescription: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Quantity</label>
            <input
              className="erp-input mt-1"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
            />
          </div>
          <div>
            <label className="erp-label">Estimated Unit Cost (Rs)</label>
            <input
              className="erp-input mt-1"
              type="number"
              min={0}
              step="0.01"
              value={form.estimatedCost}
              onChange={(event) => setForm({ ...form, estimatedCost: Number(event.target.value) })}
            />
          </div>
          <div>
            <label className="erp-label">Required By</label>
            <input
              className="erp-input mt-1"
              type="date"
              value={form.requiredDate}
              onChange={(event) => setForm({ ...form, requiredDate: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Department</label>
            <input
              className="erp-input mt-1"
              placeholder="Engineering, Operations, Admin..."
              value={form.department}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Business Justification</label>
            <textarea
              className="erp-input mt-1"
              rows={3}
              value={form.justification}
              onChange={(event) => setForm({ ...form, justification: event.target.value })}
              placeholder="Explain why the purchase is needed and any urgency..."
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Estimated Total</span>
            <span className="font-bold text-slate-900">{formatCurrency(form.quantity * form.estimatedCost)}</span>
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
