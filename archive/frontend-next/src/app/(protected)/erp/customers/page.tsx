"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/lib/hrApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Customer = {
  id: string;
  customerCode: string;
  customerName: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  creditLimit?: number;
  paymentTerms?: number;
  status?: string;
};

type CustomerForm = {
  customerCode: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  city: string;
  state: string;
  country: string;
  gstNumber: string;
  creditLimit: number;
  paymentTerms: number;
  status: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerForm>({
    customerCode: "",
    customerName: "",
    email: "",
    phoneNumber: "",
    city: "",
    state: "",
    country: "India",
    gstNumber: "",
    creditLimit: 0,
    paymentTerms: 30,
    status: "Active",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await hrApi.erp.customers.getAll();
      setCustomers(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch customers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditLimit" || name === "paymentTerms" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.customerName.trim() || !formData.customerCode.trim()) {
      setError("Customer name and code are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await hrApi.erp.customers.update(editingId, formData);
      } else {
        await hrApi.erp.customers.create(formData);
      }
      setActiveTab("list");
      setEditingId(null);
      setFormData({
        customerCode: "",
        customerName: "",
        email: "",
        phoneNumber: "",
        city: "",
        state: "",
        country: "India",
        gstNumber: "",
        creditLimit: 0,
        paymentTerms: 30,
        status: "Active",
      });
      await fetchCustomers();
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save customer"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "India",
      gstNumber: customer.gstNumber || "",
      creditLimit: customer.creditLimit || 0,
      paymentTerms: customer.paymentTerms || 30,
      status: customer.status || "Active",
    });
    setEditingId(customer.id);
    setActiveTab("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await hrApi.erp.customers.delete(id);
      await fetchCustomers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete customer"));
    }
  };

  const handleNew = () => {
    setFormData({
      customerCode: "",
      customerName: "",
      email: "",
      phoneNumber: "",
      city: "",
      state: "",
      country: "India",
      gstNumber: "",
      creditLimit: 0,
      paymentTerms: 30,
      status: "Active",
    });
    setEditingId(null);
    setActiveTab("form");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-600 mt-1">Manage customer master and billing terms</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Customer List</TabsTrigger>
          <TabsTrigger value="form">{editingId ? "Edit Customer" : "New Customer"}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Directory</CardTitle>
              <Button onClick={handleNew}>Add Customer</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-gray-500">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No customers found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">City</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Credit Limit</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{customer.customerCode}</td>
                          <td className="px-4 py-3 text-gray-700">{customer.customerName}</td>
                          <td className="px-4 py-3 text-gray-600">{customer.email || "-"}</td>
                          <td className="px-4 py-3 text-gray-600">{customer.phoneNumber || "-"}</td>
                          <td className="px-4 py-3 text-gray-600">{customer.city || "-"}</td>
                          <td className="px-4 py-3 text-gray-600">₹{(customer.creditLimit || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(customer)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(customer.id)}>Delete</Button>
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
              <CardTitle>{editingId ? "Edit Customer" : "Create Customer"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Code</label>
                  <input
                    name="customerCode"
                    value={formData.customerCode}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Name</label>
                  <input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">State</label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">GST Number</label>
                  <input
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Credit Limit</label>
                  <input
                    name="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Terms (days)</label>
                  <input
                    name="paymentTerms"
                    type="number"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingId ? "Update Customer" : "Save Customer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
