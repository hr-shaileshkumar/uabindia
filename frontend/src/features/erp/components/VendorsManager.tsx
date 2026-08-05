"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

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

const vendorsApi = hrApi.erp.vendors;

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function VendorsManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
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
      const response = await vendorsApi.getAll();
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
    void fetchVendors();
  }, []);

  const supplierCount = useMemo(
    () => vendors.filter((vendor) => vendor.vendorType.toLowerCase() === "supplier").length,
    [vendors]
  );
  const serviceCount = useMemo(
    () => vendors.filter((vendor) => vendor.vendorType.toLowerCase() === "service").length,
    [vendors]
  );
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditLimit" || name === "paymentTerms" ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      vendorCode: "",
      vendorName: "",
      vendorType: "Supplier",
      gstNumber: "",
      paymentTerms: 30,
      creditLimit: 0,
    });
  };

  const handleSave = async () => {
    if (!formData.vendorName.trim() || !formData.vendorCode.trim()) {
      setError("Vendor name and code are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await vendorsApi.update(editingId, formData);
      } else {
        await vendorsApi.create(formData);
      }
      setActiveTab("list");
      setEditingId(null);
      resetForm();
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
    const ok = await confirm({
      title: "Delete vendor",
      message: "Permanently delete this vendor? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await vendorsApi.delete(id);
      await fetchVendors();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete vendor";
      setError(message);
    }
  };

  return (
    <StandardPageLayout
      title="Vendors"
      subtitle="Control supplier master data, onboarding readiness, and payment terms from one procurement workspace."
      eyebrow="Procurement / Masters"
      icon="briefcase"
      meta={
        <>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {vendors.length} vendor records
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
            {supplierCount} suppliers
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {serviceCount} service partners
          </span>
        </>
      }
      actions={
        <Button onClick={() => { setEditingId(null); resetForm(); setActiveTab("form"); }}>
          Add Vendor
        </Button>
      }
    >
      <div className="space-y-4">
        {confirmDialog}
        {error && (
          <div className="erp-alert-error">
            <p className="font-medium">{error}</p>
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
                <div>
                  <CardTitle>Vendor Directory</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Legal identity, category, tax registration, terms, and approved credit range should be visible here.
                  </p>
                </div>
                <Button onClick={() => { setEditingId(null); resetForm(); setActiveTab("form"); }}>Add Vendor</Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="erp-loading">Loading vendors...</div>
                ) : vendors.length === 0 ? (
                  <div className="erp-empty">No vendors found. Add the first approved supplier record to begin procurement setup.</div>
                ) : (
                  <div className="erp-table-wrap border-0 shadow-none">
                    <table className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          <th className="erp-th">Code</th>
                          <th className="erp-th">Name</th>
                          <th className="erp-th">Type</th>
                          <th className="erp-th">GST</th>
                          <th className="erp-th">Terms</th>
                          <th className="erp-th">Credit Limit</th>
                          <th className="erp-th">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((vendor) => (
                          <tr key={vendor.id} className="erp-tr">
                            <td className="erp-td font-medium text-slate-900">{vendor.vendorCode}</td>
                            <td className="erp-td">{vendor.vendorName}</td>
                            <td className="erp-td text-slate-600">{vendor.vendorType}</td>
                            <td className="erp-td text-slate-600">{vendor.gstNumber || "-"}</td>
                            <td className="erp-td text-slate-600">{vendor.paymentTerms || 0} days</td>
                            <td className="erp-td font-medium text-slate-900">{formatCurrency(vendor.creditLimit)}</td>
                            <td className="erp-td">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(vendor)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => void handleDelete(vendor.id)}>Delete</Button>
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
                <p className="text-sm text-slate-500">
                  Capture procurement-safe master data only. Operational notes and transaction exceptions should stay outside this form.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="erp-label">Vendor Code</label>
                    <input name="vendorCode" value={formData.vendorCode} onChange={handleChange} placeholder="e.g. VND-1024" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Vendor Name</label>
                    <input name="vendorName" value={formData.vendorName} onChange={handleChange} placeholder="Legal or trading name" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Vendor Type</label>
                    <select name="vendorType" value={formData.vendorType} onChange={handleChange} className="erp-select">
                      <option value="Supplier">Supplier</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">GST Number</label>
                    <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="Tax registration ID" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Payment Terms</label>
                    <input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} type="number" min={0} placeholder="30" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Credit Limit</label>
                    <input name="creditLimit" value={formData.creditLimit} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                  <Button onClick={() => void handleSave()} disabled={loading}>{editingId ? "Update Vendor" : "Save Vendor"}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
}
