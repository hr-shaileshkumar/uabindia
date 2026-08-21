"use client";

import { useEffect, useMemo, useState } from "react";
import { salesApi } from "@/services/modules";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpRowActions } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
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
} from "@/components/erp/erp-document-kit";

type SalesOrder = {
  id: string;
  soNumber: string;
  customerId: string;
  soDate: string;
  expectedDeliveryDate?: string;
  status: string;
  totalAmount: number;
  notes?: string;
};

type SalesOrderForm = {
  soNumber: string;
  customerId: string;
  soDate: string;
  expectedDeliveryDate: string;
  status: string;
  notes: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

const createDefaultFormData = (): SalesOrderForm => ({
  soNumber: "",
  customerId: "",
  soDate: new Date().toISOString().split("T")[0],
  expectedDeliveryDate: "",
  status: "Draft",
  notes: "",
});

const getStatusChipClass = (status: string) => {
  switch (status) {
    case "Completed":
    case "Invoiced":
      return "erp-chip erp-chip-success";
    case "Confirmed":
      return "erp-chip erp-chip-info";
    case "Partial":
      return "erp-chip erp-chip-warning";
    case "Cancelled":
      return "erp-chip erp-chip-danger";
    default:
      return "erp-chip erp-chip-neutral";
  }
};

export default function SalesOrdersPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { hasPermission } = usePermissions();
  const { customers, items, schemes } = useDocumentMasters();
  const canCreateSalesOrder = hasPermission([PERMISSIONS.SALES_ORDERS_CREATE]);
  const canEditSalesOrder = hasPermission([PERMISSIONS.SALES_ORDERS_EDIT]);
  const canDeleteSalesOrder = hasPermission([PERMISSIONS.SALES_ORDERS_DELETE]);

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalesOrderForm>(createDefaultFormData);
  const [lines, setLines] = useState<DocLine[]>([emptyDocLine()]);
  const [discount, setDiscount] = useState(emptyBillDiscount);

  const totals = useMemo(() => documentTotals(lines), [lines]);
  const billed = useMemo(() => withBillDiscount(totals, discount), [totals, discount]);
  const customerName = (id: string) => customers.find((row) => row.id === id)?.label || id;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await salesApi.salesOrders.getAll(1, 50);
      setOrders(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch sales orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const canSaveSalesOrder = editingId ? canEditSalesOrder : canCreateSalesOrder;

  const handleSave = async () => {
    if (!formData.customerId.trim()) {
      setError("Customer is required");
      return;
    }
    if (!editingId && payloadLines(lines).length === 0) {
      setError("Add at least one item line.");
      return;
    }
    if (!canSaveSalesOrder) {
      setError("You do not have permission to save this sales order.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await salesApi.salesOrders.update(editingId, {
          soDate: formData.soDate,
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          status: formData.status,
          notes: formData.notes,
        });
      } else {
        await salesApi.salesOrders.create({
          soNumber: formData.soNumber || undefined,
          customerId: formData.customerId,
          soDate: formData.soDate,
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          status: formData.status,
          notes: formData.notes,
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
      setError(getErrorMessage(err, "Failed to save sales order"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: SalesOrder) => {
    setFormData({
      soNumber: order.soNumber,
      customerId: order.customerId,
      soDate: order.soDate.split("T")[0],
      expectedDeliveryDate: order.expectedDeliveryDate?.split("T")[0] || "",
      status: order.status,
      notes: order.notes || "",
    });
    setEditingId(order.id);
    setDiscount(emptyBillDiscount());
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete sales order",
      message: "Permanently delete this sales order? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await salesApi.salesOrders.delete(id);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete sales order"));
    }
  };

  const handleConvertToInvoice = async (id: string) => {
    try {
      setLoading(true);
      await salesApi.salesOrders.convertToInvoice(id);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to convert sales order to invoice"));
    } finally {
      setLoading(false);
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
  const confirmedCount = orders.filter((order) => ["Confirmed", "Partial"].includes(order.status)).length;
  const completedCount = orders.filter((order) => ["Completed", "Invoiced"].includes(order.status)).length;
  const averageValue = orders.length ? Math.round(totalValue / orders.length) : 0;

  const listRows = useMemo(
    () => orders.map((order) => ({ ...order, customerName: customerName(order.customerId) })),
    [orders, customers],
  );

  const list = useErpListView({
    listKey: "sales-orders",
    rows: listRows,
    columns: [
      { key: "soNumber", label: "Order #" },
      { key: "customerName", label: "Customer" },
      { key: "soDate", label: "Order Date", dataType: "date" },
      { key: "expectedDeliveryDate", label: "Expected Delivery", dataType: "date" },
      { key: "status", label: "Status" },
      { key: "totalAmount", label: "Amount", dataType: "currency" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (order) => order.id,
    loading,
    emptyMessage: "No sales orders found. Use New sales order to create the first record.",
    onCreate: canCreateSalesOrder ? handleCreateNew : undefined,
    createLabel: "New sales order",
    onRefresh: () => void fetchOrders(),
    onBulkDelete: canDeleteSalesOrder
      ? async (selectedOrders) => {
          const ok = await confirm({
            title: `Delete ${selectedOrders.length} sales orders`,
            message: "Permanently delete the selected sales orders? This cannot be undone.",
            confirmText: "Delete",
            variant: "danger",
          });
          if (!ok) return;
          for (const order of selectedOrders) {
            await salesApi.salesOrders.delete(order.id);
          }
          await fetchOrders();
        }
      : undefined,
    renderRow: (order) => (
      <tr key={order.id} className="erp-tr">
        <td className="erp-td font-semibold text-slate-900">{order.soNumber}</td>
        <td className="erp-td">{order.customerName}</td>
        <td className="erp-td">{new Date(order.soDate).toLocaleDateString()}</td>
        <td className="erp-td">
          {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "-"}
        </td>
        <td className="erp-td">
          <span className={getStatusChipClass(order.status)}>{order.status}</span>
        </td>
        <td className="erp-td font-semibold text-slate-900">{formatInr(order.totalAmount)}</td>
        <td className="erp-td">
          <ErpRowActions
            onEdit={canEditSalesOrder ? { label: "Edit", onClick: () => handleEdit(order) } : undefined}
            onDelete={canDeleteSalesOrder ? { label: "Delete", onClick: () => void handleDelete(order.id) } : undefined}
            extra={
              canEditSalesOrder && order.status !== "Invoiced" ? (
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  onClick={() => void handleConvertToInvoice(order.id)}
                >
                  Invoice
                </button>
              ) : null
            }
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Sales Orders"
      subtitle="Confirm customer lines and GST, then convert the order to a tax invoice."
      eyebrow="Sales & CRM / Sales Orders"
      icon="briefcase"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Orders", value: orders.length, helper: "sales" },
            { label: "In Progress", value: confirmedCount, tone: "info" },
            { label: "Completed", value: completedCount, tone: "positive" },
            { label: "Avg Value", value: formatInr(averageValue), tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void fetchOrders()} loading={loading} />
          {list.headerTools}
          {canCreateSalesOrder ? <ErpCreateButton label="New sales order" onClick={handleCreateNew} /> : null}
        </>
      }
      filters={list.filterBar}
    >
      {confirmDialog}
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit sales order" : "New sales order"}
        subtitle="Pick the customer and item lines. Totals follow quantity, rate, and GST."
        width="full"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={loading}
            isEdit={Boolean(editingId)}
            disabled={!formData.customerId || (!editingId && payloadLines(lines).length === 0)}
            saveLabel={editingId ? "Update order" : "Save order"}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ErpMasterSelect
              label="Customer"
              value={formData.customerId}
              options={customers}
              placeholder="Select customer"
              disabled={Boolean(editingId)}
              onChange={(id) => setFormData((current) => ({ ...current, customerId: id }))}
            />
            <div>
              <label className="erp-label">Order Number (optional)</label>
              <input
                value={formData.soNumber}
                disabled={Boolean(editingId)}
                onChange={(e) => setFormData((current) => ({ ...current, soNumber: e.target.value }))}
                className="erp-input mt-1"
                placeholder="Auto-generated if blank"
              />
            </div>
            <div>
              <label className="erp-label">Order Date</label>
              <input
                type="date"
                value={formData.soDate}
                onChange={(e) => setFormData((current) => ({ ...current, soDate: e.target.value }))}
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
                  <option value="Confirmed">Confirmed</option>
                  <option value="Partial">Partial</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <label className="erp-label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))}
                rows={2}
                className="erp-input mt-1"
              />
            </div>
          </div>
          {!editingId ? (
            <>
              <ErpLineGrid lines={lines} onChange={setLines} items={items} priceField="sellingPrice" schemes={schemes} />
              <ErpTotalsStrip
                subTotal={totals.subTotal}
                taxAmount={totals.taxAmount}
                total={totals.total}
                discount={discount}
                onDiscountChange={setDiscount}
              />
            </>
          ) : (
            <p className="text-sm text-slate-500">Line items are locked after create. Convert to invoice from the register.</p>
          )}
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
