"use client";

import { useEffect, useMemo, useState } from "react";
import { procurementApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpRowActions } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";
import {
  DocLine,
  ErpLineGrid,
  ErpMasterSelect,
  ErpTotalsStrip,
  documentTotals,
  emptyBillDiscount,
  emptyDocLine,
  formatInr,
  payloadLines,
  useDocumentMasters,
  withBillDiscount,
} from "@/components/workspace/document-kit";
import { DocumentLifecycleTimeline } from "@/components/workspace/DocumentLifecycleTimeline";

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendorId: string;
  poDate: string;
  expectedDeliveryDate?: string;
  status: string;
  totalAmount: number;
};

export type PurchaseOrderForm = {
  poNumber: string;
  vendorId: string;
  poDate: string;
  expectedDeliveryDate: string;
  status: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

const createDefaultFormData = (): PurchaseOrderForm => ({
  poNumber: "",
  vendorId: "",
  poDate: new Date().toISOString().split("T")[0],
  expectedDeliveryDate: "",
  status: "Draft",
});

const getStatusChipClass = (status: string) => {
  switch (status) {
    case "Approved":
    case "Received":
      return "erp-chip erp-chip-success";
    case "Submitted":
      return "erp-chip erp-chip-info";
    case "Partial":
      return "erp-chip erp-chip-warning";
    case "Cancelled":
      return "erp-chip erp-chip-danger";
    default:
      return "erp-chip erp-chip-neutral";
  }
};

export function PurchaseOrdersManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { hasPermission } = usePermissions();
  const { vendors, items } = useDocumentMasters();
  const canCreatePurchaseOrder = hasPermission([PERMISSIONS.PURCHASE_ORDERS_CREATE]);
  const canEditPurchaseOrder = hasPermission([PERMISSIONS.PURCHASE_ORDERS_EDIT]);
  const canDeletePurchaseOrder = hasPermission([PERMISSIONS.PURCHASE_ORDERS_DELETE]);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PurchaseOrderForm>(createDefaultFormData);
  const [lines, setLines] = useState<DocLine[]>([emptyDocLine()]);
  const [discount, setDiscount] = useState(emptyBillDiscount);

  const totals = useMemo(() => documentTotals(lines), [lines]);
  const billed = useMemo(() => withBillDiscount(totals, discount), [totals, discount]);

  const vendorName = (id: string) => vendors.find((vendor) => vendor.id === id)?.label || id;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await procurementApi.purchaseOrders.getAll(1, 50);
      setOrders(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch purchase orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const canSavePurchaseOrder = editingId ? canEditPurchaseOrder : canCreatePurchaseOrder;

  const handleSave = async () => {
    if (!formData.vendorId.trim()) {
      setError("Vendor is required");
      return;
    }
    if (!editingId && payloadLines(lines).length === 0) {
      setError("Add at least one item line.");
      return;
    }
    if (!canSavePurchaseOrder) {
      setError("You do not have permission to save this purchase order.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await procurementApi.purchaseOrders.update(editingId, {
          poDate: formData.poDate,
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          status: formData.status,
        });
      } else {
        await procurementApi.purchaseOrders.create({
          poNumber: formData.poNumber || undefined,
          vendorId: formData.vendorId,
          poDate: formData.poDate,
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          status: formData.status,
          items: payloadLines(lines),
          discountAmount: billed.discountAmount,
          totalAmount: billed.netTotal,
        });
      }
      setDrawerOpen(false);
      setEditingId(null);
      setFormData(createDefaultFormData());
      setLines([emptyDocLine()]);
      setDiscount(emptyBillDiscount());
      await fetchOrders();
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save purchase order"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: PurchaseOrder) => {
    setFormData({
      poNumber: order.poNumber,
      vendorId: order.vendorId,
      poDate: order.poDate.split("T")[0],
      expectedDeliveryDate: order.expectedDeliveryDate?.split("T")[0] || "",
      status: order.status,
    });
    setEditingId(order.id);
    setDiscount(emptyBillDiscount());
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete purchase order",
      message: "Permanently delete this purchase order? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await procurementApi.purchaseOrders.delete(id);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete purchase order"));
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(createDefaultFormData());
    setLines([emptyDocLine()]);
    setDiscount(emptyBillDiscount());
    setDrawerOpen(true);
  };

  const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const inFlightCount = orders.filter((order) => !["Received", "Cancelled"].includes(order.status)).length;
  const receivedCount = orders.filter((order) => order.status === "Received").length;
  const averageValue = orders.length ? Math.round(totalValue / orders.length) : 0;

  const listRows = useMemo(
    () => orders.map((order) => ({ ...order, vendorName: vendorName(order.vendorId) })),
    [orders, vendors],
  );

  const list = useErpListView({
    listKey: "purchase-orders",
    rows: listRows,
    columns: [
      { key: "poNumber", label: "PO #" },
      { key: "vendorName", label: "Vendor" },
      { key: "poDate", label: "Order Date", dataType: "date" },
      { key: "expectedDeliveryDate", label: "Expected Delivery", dataType: "date" },
      { key: "status", label: "Status" },
      { key: "totalAmount", label: "Amount", dataType: "currency" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (order) => order.id,
    loading,
    emptyMessage: "No purchase orders found. Use New purchase order to create the first record.",
    onCreate: canCreatePurchaseOrder ? handleCreateNew : undefined,
    createLabel: "New purchase order",
    onRefresh: () => void fetchOrders(),
    onBulkDelete: canDeletePurchaseOrder
      ? async (selectedOrders) => {
          const ok = await confirm({
            title: `Delete ${selectedOrders.length} purchase orders`,
            message: "Permanently delete the selected purchase orders? This cannot be undone.",
            confirmText: "Delete",
            variant: "danger",
          });
          if (!ok) return;
          for (const order of selectedOrders) {
            await procurementApi.purchaseOrders.delete(order.id);
          }
          await fetchOrders();
        }
      : undefined,
    renderRow: (order) => (
      <tr key={order.id} className="erp-tr">
        <td className="erp-td font-semibold text-slate-900 dark:text-white">{order.poNumber}</td>
        <td className="erp-td text-slate-700 dark:text-slate-300">{order.vendorName}</td>
        <td className="erp-td text-slate-600 dark:text-slate-400">{new Date(order.poDate).toLocaleDateString()}</td>
        <td className="erp-td text-slate-600 dark:text-slate-400">
          {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "-"}
        </td>
        <td className="erp-td">
          <span className={getStatusChipClass(order.status)}>{order.status}</span>
        </td>
        <td className="erp-td font-semibold text-slate-900 dark:text-white">{formatInr(order.totalAmount)}</td>
        <td className="erp-td">
          <ErpRowActions
            onEdit={canEditPurchaseOrder ? { label: "Edit", onClick: () => handleEdit(order) } : undefined}
            onDelete={
              canDeletePurchaseOrder ? { label: "Delete", onClick: () => void handleDelete(order.id) } : undefined
            }
            extra={
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                onClick={async () => {
                  try {
                    await procurementApi.bills.create({
                      purchaseOrderId: order.id,
                      vendorId: order.vendorId,
                      invoiceDate: new Date().toISOString(),
                    });
                    notifySuccess(`Bill created from ${order.poNumber}.`);
                  } catch (err) {
                    notifyError(getErrorMessage(err, "Could not create vendor bill."));
                  }
                }}
              >
                Vendor bill
              </button>
            }
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Purchase Orders"
      subtitle="Commit vendor lines, GST, and receipt status from one purchase register."
      eyebrow="Procurement / Purchase Orders"
      icon="box"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Orders", value: orders.length, helper: "procurement" },
            { label: "In Process", value: inFlightCount, tone: "info" },
            { label: "Received", value: receivedCount, tone: "positive" },
            { label: "Avg Value", value: formatInr(averageValue), tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void fetchOrders()} loading={loading} />
          {list.headerTools}
          {canCreatePurchaseOrder ? (
            <ErpCreateButton label="New purchase order" onClick={handleCreateNew} />
          ) : null}
        </>
      }
      filters={list.filterBar}
    >
      {confirmDialog}
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="space-y-6">
        <DocumentLifecycleTimeline currentStage="PO" />
        <CrudCard>{list.table}</CrudCard>
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit purchase order" : "New purchase order"}
        subtitle="Pick the vendor and item lines. Amounts are calculated from quantity, rate, and GST."
        width="full"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={loading}
            isEdit={Boolean(editingId)}
            disabled={!formData.vendorId || (!editingId && payloadLines(lines).length === 0)}
            saveLabel={editingId ? "Update order" : "Save order"}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ErpMasterSelect
              label="Vendor"
              value={formData.vendorId}
              options={vendors}
              placeholder="Select vendor"
              disabled={Boolean(editingId)}
              onChange={(id) => setFormData((current) => ({ ...current, vendorId: id }))}
            />
            <div>
              <label className="erp-label">PO Number (optional)</label>
              <input
                value={formData.poNumber}
                disabled={Boolean(editingId)}
                onChange={(e) => setFormData((current) => ({ ...current, poNumber: e.target.value }))}
                className="erp-input mt-1"
                placeholder="Auto-generated if blank"
              />
            </div>
            <div>
              <label className="erp-label">PO Date</label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData((current) => ({ ...current, poDate: e.target.value }))}
                className="erp-input mt-1"
              />
            </div>
            <div>
              <label className="erp-label">Expected Delivery</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData((current) => ({ ...current, expectedDeliveryDate: e.target.value }))}
                className="erp-input mt-1"
              />
            </div>
            {editingId ? (
              <div>
                <label className="erp-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((current) => ({ ...current, status: e.target.value }))}
                  className="erp-select mt-1"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Partial">Partial</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            ) : null}
          </div>
          {!editingId ? (
            <>
              <ErpLineGrid lines={lines} onChange={setLines} items={items} priceField="purchasePrice" />
              <ErpTotalsStrip
                subTotal={totals.subTotal}
                taxAmount={totals.taxAmount}
                total={totals.total}
                discount={discount}
                onDiscountChange={setDiscount}
              />
            </>
          ) : (
            <p className="text-sm text-slate-500">Line items are locked after create. Use status to track receipt.</p>
          )}
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default PurchaseOrdersManager;
