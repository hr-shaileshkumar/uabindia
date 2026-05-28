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
  totalAmount: number;
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
  totalAmount: 0,
  status: "Draft",
  notes: "",
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getStatusChipClass = (status: string) => {
  switch (status) {
    case "Completed":
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
  const canCreateSalesOrder = hasPermission([PERMISSIONS.SALES_ORDERS_CREATE]);
  const canEditSalesOrder = hasPermission([PERMISSIONS.SALES_ORDERS_EDIT]);
  const canDeleteSalesOrder = hasPermission([PERMISSIONS.SALES_ORDERS_DELETE]);

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalesOrderForm>(createDefaultFormData);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await hrApi.erp.salesOrders.getAll();
      setOrders(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch sales orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalAmount" ? Number(value) : value,
    }));
  };

  const canSaveSalesOrder = editingId ? canEditSalesOrder : canCreateSalesOrder;

  const handleSave = async () => {
    if (!formData.soNumber.trim() || !formData.customerId.trim()) {
      setError("Order number and customer are required");
      return;
    }

    if (!canSaveSalesOrder) {
      setError("You do not have permission to save this sales order.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await hrApi.erp.salesOrders.update(editingId, formData);
      } else {
        await hrApi.erp.salesOrders.create(formData);
      }
      setActiveTab("list");
      setEditingId(null);
      setFormData(createDefaultFormData());
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
      totalAmount: order.totalAmount,
      status: order.status,
      notes: order.notes || "",
    });
    setEditingId(order.id);
    setActiveTab("form");
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
      await hrApi.erp.salesOrders.delete(id);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete sales order"));
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(createDefaultFormData());
    setActiveTab("form");
  };

  const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const confirmedCount = orders.filter((order) => ["Confirmed", "Partial"].includes(order.status)).length;
  const completedCount = orders.filter((order) => order.status === "Completed").length;
  const averageValue = orders.length ? Math.round(totalValue / orders.length) : 0;

  return (
    <StandardPageLayout
      title="Sales Orders"
      subtitle="Manage customer commitments, fulfillment readiness, and commercial order value with one standardized transaction workspace."
      eyebrow="Operations / Commercial Orders"
      icon="briefcase"
      actions={
        canCreateSalesOrder ? (
          <button type="button" onClick={handleCreateNew} className="erp-action-btn erp-action-btn-primary">
            Create Sales Order
          </button>
        ) : null
      }
    >
      {confirmDialog}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total orders</p>
          <p className="erp-kpi-value">{orders.length}</p>
          <p className="erp-kpi-meta">All customer-facing sales documents in the current view.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Confirmed / partial</p>
          <p className="erp-kpi-value">{confirmedCount}</p>
          <p className="erp-kpi-meta">Orders ready for fulfillment or awaiting final completion.</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Completed</p>
          <p className="erp-kpi-value erp-kpi-value-success">{completedCount}</p>
          <p className="erp-kpi-meta">Orders fully delivered and commercially closed.</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Average order value</p>
          <p className="erp-kpi-value">{formatCurrency(averageValue)}</p>
          <p className="erp-kpi-meta">Commercial exposure per order across the sales pipeline.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Sales Order List</TabsTrigger>
          <TabsTrigger value="form">{editingId ? "Edit Order" : "New Order"}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="erp-inline-icon" aria-hidden>
                    <ModuleIcon name="briefcase" className="h-4 w-4" />
                  </span>
                  Commercial order desk
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">Track customer order numbers, delivery expectations, and revenue status in a structured grid.</p>
              </div>
              <Button onClick={handleCreateNew}>Add Order</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="erp-loading">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="erp-empty">No sales orders found.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Order #</th>
                        <th className="erp-th">Customer</th>
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
                          <td className="erp-td font-semibold text-slate-900">{order.soNumber}</td>
                          <td className="erp-td">{order.customerId}</td>
                          <td className="erp-td">{new Date(order.soDate).toLocaleDateString()}</td>
                          <td className="erp-td">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "—"}</td>
                          <td className="erp-td">
                            <span className={getStatusChipClass(order.status)}>{order.status}</span>
                          </td>
                          <td className="erp-td font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</td>
                          <td className="erp-td">
                            {(() => {
                              const actionItems = [
                                ...(canEditSalesOrder ? [{ label: "Edit", onClick: () => handleEdit(order) }] : []),
                                ...(canDeleteSalesOrder ? [{ label: "Delete", onClick: () => handleDelete(order.id), danger: true }] : []),
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
                {editingId ? "Edit Sales Order" : "Create Sales Order"}
              </CardTitle>
              <p className="text-sm text-slate-500">
                Maintain commercial order details, delivery dates, and customer context in a consistent ERP form layout.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Order Number</label>
                  <input
                    name="soNumber"
                    value={formData.soNumber}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Customer ID</label>
                  <input
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Order Date</label>
                  <input
                    name="soDate"
                    type="date"
                    value={formData.soDate}
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
                    <option value="Confirmed">Confirmed</option>
                    <option value="Partial">Partial</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="erp-input"
                  />
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
