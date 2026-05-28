"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/services/hrApi";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ModuleIcon from "@/components/ModuleIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { TableActionMenu } from "@/components/table/TableActionMenu";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";

type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendorId: string;
  poDate: string;
  expectedDeliveryDate?: string;
  status: string;
  totalAmount: number;
};

type PurchaseOrderForm = {
  poNumber: string;
  vendorId: string;
  poDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
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
  totalAmount: 0,
  status: "Draft",
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

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

export default function PurchaseOrdersPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { hasPermission } = usePermissions();
  const canCreatePurchaseOrder = hasPermission([PERMISSIONS.PURCHASE_ORDERS_CREATE]);
  const canEditPurchaseOrder = hasPermission([PERMISSIONS.PURCHASE_ORDERS_EDIT]);
  const canDeletePurchaseOrder = hasPermission([PERMISSIONS.PURCHASE_ORDERS_DELETE]);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PurchaseOrderForm>(createDefaultFormData);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await hrApi.erp.purchaseOrders.getAll();
      setOrders(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch purchase orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? Number(value) : value,
    }));
  };

  const canSavePurchaseOrder = editingId ? canEditPurchaseOrder : canCreatePurchaseOrder;

  const handleSave = async () => {
    if (!formData.poNumber.trim() || !formData.vendorId.trim()) {
      setError("PO number and vendor are required");
      return;
    }

    if (!canSavePurchaseOrder) {
      setError("You do not have permission to save this purchase order.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await hrApi.erp.purchaseOrders.update(editingId, formData);
      } else {
        await hrApi.erp.purchaseOrders.create(formData);
      }
      setActiveTab("list");
      setEditingId(null);
      setFormData(createDefaultFormData());
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
      totalAmount: order.totalAmount,
      status: order.status,
    });
    setEditingId(order.id);
    setActiveTab("form");
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
      await hrApi.erp.purchaseOrders.delete(id);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete purchase order"));
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(createDefaultFormData());
    setActiveTab("form");
  };

  const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const inFlightCount = orders.filter((order) => !["Received", "Cancelled"].includes(order.status)).length;
  const receivedCount = orders.filter((order) => order.status === "Received").length;
  const averageValue = orders.length ? Math.round(totalValue / orders.length) : 0;

  return (
    <StandardPageLayout
      title="Purchase Orders"
      subtitle="Run procurement transactions with a clean Fiori-style workspace for monitoring, approval, and receipt status."
      eyebrow="Operations / Procurement"
      icon="box"
      actions={
        canCreatePurchaseOrder ? (
          <button type="button" onClick={handleCreateNew} className="erp-action-btn erp-action-btn-primary">
            Create Purchase Order
          </button>
        ) : null
      }
    >
      {confirmDialog}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total orders</p>
          <p className="erp-kpi-value">{orders.length}</p>
          <p className="erp-kpi-meta">All procurement documents in the current workspace.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">In process</p>
          <p className="erp-kpi-value">{inFlightCount}</p>
          <p className="erp-kpi-meta">Draft, submitted, approved, and partially received orders.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Received</p>
          <p className="erp-kpi-value erp-kpi-value-success">{receivedCount}</p>
          <p className="erp-kpi-meta">Orders fully received into stores or inventory.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Average order value</p>
          <p className="erp-kpi-value">{formatCurrency(averageValue)}</p>
          <p className="erp-kpi-meta">Portfolio value across all purchase transactions.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Purchase Order List</TabsTrigger>
          <TabsTrigger value="form">{editingId ? "Edit Order" : "New Order"}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="erp-inline-icon" aria-hidden>
                    <ModuleIcon name="box" className="h-4 w-4" />
                  </span>
                  Procurement workbench
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">Review vendor commitments, due dates, and receipt progress in one place.</p>
              </div>
              <Button onClick={handleCreateNew}>Add Order</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="erp-loading">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="erp-empty">No purchase orders found.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">PO #</th>
                        <th className="erp-th">Vendor</th>
                        <th className="erp-th">Order date</th>
                        <th className="erp-th">Expected delivery</th>
                        <th className="erp-th">Status</th>
                        <th className="erp-th">Amount</th>
                        <th className="erp-th">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="erp-tr">
                          <td className="erp-td font-semibold text-slate-900">{order.poNumber}</td>
                          <td className="erp-td">{order.vendorId}</td>
                          <td className="erp-td">{new Date(order.poDate).toLocaleDateString()}</td>
                          <td className="erp-td">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "—"}</td>
                          <td className="erp-td">
                            <span className={getStatusChipClass(order.status)}>{order.status}</span>
                          </td>
                          <td className="erp-td font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</td>
                          <td className="erp-td">
                            {(() => {
                              const actionItems = [
                                ...(canEditPurchaseOrder ? [{ label: "Edit", onClick: () => handleEdit(order) }] : []),
                                ...(canDeletePurchaseOrder ? [{ label: "Delete", onClick: () => handleDelete(order.id), danger: true }] : []),
                              ];
                              return actionItems.length > 0 ? (
                                <TableActionMenu items={actionItems} />
                              ) : (
                                <span className="text-xs text-slate-500">No actions available</span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="erp-inline-icon" aria-hidden>
                  <ModuleIcon name="file" className="h-4 w-4" />
                </span>
                {editingId ? "Edit Purchase Order" : "Create Purchase Order"}
              </CardTitle>
              <p className="text-sm text-slate-500">
                Capture vendor, delivery, and order-value information using the shared ERP transaction standard.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">PO Number</label>
                  <input
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Vendor ID</label>
                  <input
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">PO Date</label>
                  <input
                    name="poDate"
                    type="date"
                    value={formData.poDate}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Expected Delivery</label>
                  <input
                    name="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Total Amount</label>
                  <input
                    name="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="erp-select"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Partial">Partial</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="erp-form-actions">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingId ? "Update Order" : "Save Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
}
