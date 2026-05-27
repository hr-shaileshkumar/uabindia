"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/lib/hrApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PurchaseOrderForm>({
    poNumber: "",
    vendorId: "",
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    totalAmount: 0,
    status: "Draft",
  });

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

  const handleSave = async () => {
    if (!formData.poNumber.trim() || !formData.vendorId.trim()) {
      setError("PO number and vendor are required");
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
      setFormData({
        poNumber: "",
        vendorId: "",
        poDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        totalAmount: 0,
        status: "Draft",
      });
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
    if (!confirm("Are you sure you want to delete this purchase order?")) return;
    try {
      await hrApi.erp.purchaseOrders.delete(id);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete purchase order"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <p className="text-sm text-gray-600 mt-1">Manage procurement and purchase orders</p>
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
              <CardTitle>Purchase Orders</CardTitle>
              <Button onClick={() => {
                setEditingId(null);
                setFormData({
                  poNumber: "",
                  vendorId: "",
                  poDate: new Date().toISOString().split("T")[0],
                  expectedDeliveryDate: "",
                  totalAmount: 0,
                  status: "Draft",
                });
                setActiveTab("form");
              }}>Add Order</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">PO #</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Vendor</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{order.poNumber}</td>
                          <td className="px-4 py-3 text-gray-600">{order.vendorId}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(order.poDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-600">{order.status}</td>
                          <td className="px-4 py-3 text-gray-600">₹{order.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(order)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(order.id)}>Delete</Button>
                            </div>
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
              <CardTitle>{editingId ? "Edit Purchase Order" : "Create Purchase Order"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">PO Number</label>
                  <input
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Vendor ID</label>
                  <input
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">PO Date</label>
                  <input
                    name="poDate"
                    type="date"
                    value={formData.poDate}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Expected Delivery</label>
                  <input
                    name="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Amount</label>
                  <input
                    name="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingId ? "Update Order" : "Save Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
