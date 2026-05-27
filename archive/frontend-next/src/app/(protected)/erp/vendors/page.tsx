"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/lib/hrApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Vendor = {
  id: string;
  vendorCode: string;
  vendorName: string;
  vendorType: string;
  gstNumber?: string;
  paymentTerms?: number;
  creditLimit?: number;
};

type VendorForm = {
  vendorCode: string;
  vendorName: string;
  vendorType: string;
  gstNumber: string;
  paymentTerms: number;
  creditLimit: number;
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorForm>({
    vendorCode: "",
    vendorName: "",
    vendorType: "Supplier",
    gstNumber: "",
    paymentTerms: 30,
    creditLimit: 0,
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await hrApi.erp.vendors.getAll();
      setVendors(response.data?.data || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch vendors";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditLimit" || name === "paymentTerms" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.vendorName.trim() || !formData.vendorCode.trim()) {
      setError("Vendor name and code are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await hrApi.erp.vendors.update(editingId, formData);
      } else {
        await hrApi.erp.vendors.create(formData);
      }
      setActiveTab("list");
      setEditingId(null);
      setFormData({
        vendorCode: "",
        vendorName: "",
        vendorType: "Supplier",
        gstNumber: "",
        paymentTerms: 30,
        creditLimit: 0,
      });
      await fetchVendors();
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save vendor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      vendorType: vendor.vendorType,
      gstNumber: vendor.gstNumber || "",
      paymentTerms: vendor.paymentTerms || 30,
      creditLimit: vendor.creditLimit || 0,
    });
    setEditingId(vendor.id);
    setActiveTab("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await hrApi.erp.vendors.delete(id);
      await fetchVendors();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete vendor";
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-600 mt-1">Manage supplier and vendor records</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Vendor List</TabsTrigger>
          <TabsTrigger value="form">{editingId ? "Edit Vendor" : "New Vendor"}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendor Directory</CardTitle>
              <Button onClick={() => setActiveTab("form")}>Add Vendor</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-gray-500">Loading vendors...</div>
              ) : vendors.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No vendors found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">GST</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Credit Limit</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {vendors.map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{vendor.vendorCode}</td>
                          <td className="px-4 py-3 text-gray-700">{vendor.vendorName}</td>
                          <td className="px-4 py-3 text-gray-600">{vendor.vendorType}</td>
                          <td className="px-4 py-3 text-gray-600">{vendor.gstNumber || "-"}</td>
                          <td className="px-4 py-3 text-gray-600">
                            ₹{(vendor.creditLimit || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(vendor)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(vendor.id)}>Delete</Button>
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
              <CardTitle>{editingId ? "Edit Vendor" : "Create Vendor"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Vendor Code</label>
                  <input
                    name="vendorCode"
                    value={formData.vendorCode}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                  <input
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Vendor Type</label>
                  <select
                    name="vendorType"
                    value={formData.vendorType}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="Supplier">Supplier</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">GST Number</label>
                  <input
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Terms (days)</label>
                  <input
                    name="paymentTerms"
                    type="number"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Credit Limit</label>
                  <input
                    name="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingId ? "Update Vendor" : "Save Vendor"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
