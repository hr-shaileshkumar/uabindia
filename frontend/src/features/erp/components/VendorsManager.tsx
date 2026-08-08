"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { GlobalLoading } from "@/components/ui/GlobalLoading";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { SideDrawer } from "@/components/ui/side-drawer";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { Search, Plus, Eye, Edit3, Trash2, ShieldCheck, Building2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  value != null ? `₹${value.toLocaleString("en-IN")}` : "-";

export default function VendorsManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
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

  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) return vendors;
    const term = searchTerm.toLowerCase();
    return vendors.filter(
      (v) =>
        v.vendorName.toLowerCase().includes(term) ||
        v.vendorCode.toLowerCase().includes(term) ||
        v.vendorType.toLowerCase().includes(term) ||
        (v.gstNumber && v.gstNumber.toLowerCase().includes(term))
    );
  }, [vendors, searchTerm]);

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
    setEditingId(null);
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = (vendor: Vendor) => {
    setFormData({
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      vendorType: vendor.vendorType,
      gstNumber: vendor.gstNumber || "",
      paymentTerms: vendor.paymentTerms || 30,
      creditLimit: vendor.creditLimit || 0,
    });
    setEditingId(vendor.id);
    setIsFormDrawerOpen(true);
  };

  const openViewDrawer = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsViewDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.vendorName.trim() || !formData.vendorCode.trim()) {
      notifyError("Vendor name and vendor code are required fields.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await vendorsApi.update(editingId, formData);
        notifySuccess(`Vendor "${formData.vendorName}" updated successfully.`);
      } else {
        await vendorsApi.create(formData);
        notifySuccess(`Vendor "${formData.vendorName}" created successfully.`);
      }
      setIsFormDrawerOpen(false);
      resetForm();
      await fetchVendors();
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save vendor";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete vendor "${name}"`,
      message: "Are you sure you want to delete this vendor master record? This action cannot be undone.",
      confirmText: "Delete Record",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await vendorsApi.delete(id);
      notifySuccess("Vendor record deleted.");
      await fetchVendors();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete vendor";
      notifyError(message);
    }
  };

  return (
    <StandardPageLayout
      title="Vendors Master"
      subtitle="Manage procurement supplier directory, onboarding readiness, tax registration, and payment terms."
      eyebrow="Procurement / Masters"
      icon="briefcase"
      meta={
        <>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {vendors.length} Total Records
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
            {supplierCount} Suppliers
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {serviceCount} Service Partners
          </span>
        </>
      }
      actions={
        <Button onClick={openCreateDrawer} className="gap-2">
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      }
    >
      <div className="space-y-4">
        {confirmDialog}

        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Vendor Directory</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Search and review legal identity, tax credentials, payment terms, and approved credit limits.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor name, GST, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="erp-input pl-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading && vendors.length === 0 ? (
              <div className="p-12">
                <GlobalLoading label="Loading vendors directory..." variant="inline" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="erp-empty py-12">
                {searchTerm ? "No vendors match your search criteria." : "No vendors found. Click Add Vendor to create the first record."}
              </div>
            ) : (
              <div className="erp-table-wrap border-0 shadow-none">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">Code</th>
                      <th className="erp-th">Vendor Name</th>
                      <th className="erp-th">Type</th>
                      <th className="erp-th">GST Number</th>
                      <th className="erp-th">Payment Terms</th>
                      <th className="erp-th">Credit Limit</th>
                      <th className="erp-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="erp-tr hover:bg-slate-50/80 transition-colors">
                        <td className="erp-td font-semibold text-slate-900">{vendor.vendorCode}</td>
                        <td className="erp-td font-medium text-slate-800">{vendor.vendorName}</td>
                        <td className="erp-td">
                          <Badge variant="outline" className="text-xs font-normal">
                            {vendor.vendorType}
                          </Badge>
                        </td>
                        <td className="erp-td text-slate-600 font-mono text-xs">{vendor.gstNumber || "-"}</td>
                        <td className="erp-td text-slate-600">{vendor.paymentTerms || 30} days</td>
                        <td className="erp-td font-semibold text-slate-900">{formatCurrency(vendor.creditLimit)}</td>
                        <td className="erp-td text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900" onClick={() => openViewDrawer(vendor)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800" onClick={() => openEditDrawer(vendor)} title="Edit Record">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800" onClick={() => void handleDelete(vendor.id, vendor.vendorName)} title="Delete Record">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>

      {/* Slide-Over Drawer for Create / Edit Form */}
      <SideDrawer
        open={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={editingId ? `Edit Vendor: ${formData.vendorCode}` : "Create New Vendor"}
        subtitle="Capture procurement-safe vendor master data, tax registration, and payment terms."
        width="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsFormDrawerOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={loading}>
              {editingId ? "Update Vendor" : "Save Vendor"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="erp-label">Vendor Code <span className="text-rose-500">*</span></label>
              <input name="vendorCode" value={formData.vendorCode} onChange={handleChange} placeholder="e.g. VND-1024" className="erp-input" />
            </div>
            <div>
              <label className="erp-label">Vendor Legal / Trading Name <span className="text-rose-500">*</span></label>
              <input name="vendorName" value={formData.vendorName} onChange={handleChange} placeholder="Full business legal name" className="erp-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Vendor Category</label>
                <select name="vendorType" value={formData.vendorType} onChange={handleChange} className="erp-select">
                  <option value="Supplier">Supplier</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Service">Service Partner</option>
                </select>
              </div>
              <div>
                <label className="erp-label">GST Identification Number</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" className="erp-input uppercase font-mono text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Payment Terms (Days)</label>
                <input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} type="number" min={0} placeholder="30" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Approved Credit Limit (₹)</label>
                <input name="creditLimit" value={formData.creditLimit} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* Slide-Over Drawer for Quick View Details */}
      <SideDrawer
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={selectedVendor ? selectedVendor.vendorName : "Vendor Details"}
        subtitle={selectedVendor ? `Vendor Code: ${selectedVendor.vendorCode}` : ""}
        width="md"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setIsViewDrawerOpen(false)}>Close</Button>
            {selectedVendor && (
              <Button onClick={() => { setIsViewDrawerOpen(false); openEditDrawer(selectedVendor); }}>
                Edit Vendor Record
              </Button>
            )}
          </div>
        }
      >
        {selectedVendor && (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor Profile</span>
                <Badge variant="outline">{selectedVendor.vendorType}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{selectedVendor.vendorName}</h3>
              <p className="text-xs text-slate-500 font-mono">Code: {selectedVendor.vendorCode}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">GST Registration Number</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">{selectedVendor.gstNumber || "Not Registered"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Standard Payment Terms</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedVendor.paymentTerms || 30} Net Days</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <CreditCard className="h-5 w-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Approved Credit Ceiling</p>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(selectedVendor.creditLimit)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </StandardPageLayout>
  );
}
