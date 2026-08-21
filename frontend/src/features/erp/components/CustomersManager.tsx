"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { SideDrawer } from "@/components/ui/side-drawer";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/erp/crud-workspace";
import { ErpCreateButton, ErpRefreshButton, ErpRowActions } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { crmApi } from "@/services/modules/crm";
import { Mail, Phone, MapPin, Building2, CreditCard } from "lucide-react";

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

const customersApi = crmApi.customers;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "-";

export default function CustomersManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer state management
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
      const response = await customersApi.getAll();
      setCustomers(response.data?.data || []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch customers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(term) ||
        c.customerCode.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.city && c.city.toLowerCase().includes(term)) ||
        (c.gstNumber && c.gstNumber.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  const activeCount = useMemo(
    () => customers.filter((c) => (c.status || "active").toLowerCase() === "active").length,
    [customers]
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
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = (customer: Customer) => {
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
    setIsFormDrawerOpen(true);
  };

  const openViewDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.customerName.trim() || !formData.customerCode.trim()) {
      notifyError("Customer name and customer code are required fields.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await customersApi.update(editingId, formData);
        notifySuccess(`Customer "${formData.customerName}" updated successfully.`);
      } else {
        await customersApi.create(formData);
        notifySuccess(`Customer "${formData.customerName}" created successfully.`);
      }
      setIsFormDrawerOpen(false);
      resetForm();
      await fetchCustomers();
      setError(null);
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Failed to save customer"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete Customer "${name}"`,
      message: "Are you sure you want to delete this customer record? Associated billing history may be impacted.",
      confirmText: "Delete Record",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await customersApi.delete(id);
      notifySuccess("Customer record deleted.");
      await fetchCustomers();
    } catch (err: unknown) {
      notifyError(getErrorMessage(err, "Failed to delete customer"));
    }
  };

  const list = useErpListView({
    listKey: "customers",
    rows: filteredCustomers,
    columns: [
      { key: "customerCode", label: "Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "email", label: "Contact Info" },
      { key: "city", label: "Location" },
      { key: "gstNumber", label: "GST Number" },
      { key: "creditLimit", label: "Credit Limit", dataType: "currency" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: searchTerm ? "No customer accounts match your search query." : "No customer accounts found. Click New customer to begin.",
    onCreate: openCreateDrawer,
    createLabel: "New customer",
    onRefresh: () => void fetchCustomers(),
    extraFilters: (
      <input
        type="search"
        placeholder="Search customer, GST, email, city..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="erp-input max-w-xs"
      />
    ),
    onBulkDelete: async (rows) => {
      for (const row of rows) {
        await customersApi.delete(row.id);
      }
      notifySuccess(`${rows.length} customer record(s) deleted.`);
      await fetchCustomers();
    },
    renderRow: (customer) => (
      <tr key={customer.id} className="erp-tr">
        <td className="erp-td font-semibold text-slate-900">{customer.customerCode}</td>
        <td className="erp-td font-medium text-slate-900">{customer.customerName}</td>
        <td className="erp-td">
          <div className="space-y-0.5 text-xs">
            <p className="text-slate-700">{customer.email || "-"}</p>
            <p className="font-mono text-slate-500">{customer.phoneNumber}</p>
          </div>
        </td>
        <td className="erp-td text-slate-600">
          {customer.city ? `${customer.city}${customer.state ? `, ${customer.state}` : ""}` : "-"}
        </td>
        <td className="erp-td font-mono text-xs text-slate-600">{customer.gstNumber || "-"}</td>
        <td className="erp-td font-semibold text-slate-900">{formatCurrency(customer.creditLimit)}</td>
        <td className="erp-td">
          <Badge variant={customer.status === "Inactive" ? "outline" : "default"} className="text-xs">
            {customer.status || "Active"}
          </Badge>
        </td>
        <td className="erp-td text-right">
          <ErpRowActions
            onView={{ label: "View", onClick: () => openViewDrawer(customer) }}
            onEdit={{ label: "Edit", onClick: () => openEditDrawer(customer) }}
            onDelete={{ label: "Delete", onClick: () => void handleDelete(customer.id, customer.customerName) }}
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Customers Master"
      subtitle="Manage corporate and retail customer directory, credit terms, billing addresses, and GST credentials."
      eyebrow="Sales & CRM / Masters"
      icon="users"
      meta={
        <>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {customers.length} Total Accounts
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {activeCount} Active Customers
          </span>
        </>
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void fetchCustomers()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New customer" onClick={openCreateDrawer} />
        </>
      }
      filters={list.filterBar}
    >
      {confirmDialog}
      {error ? <div className="erp-alert-error text-sm">{error}</div> : null}
      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={editingId ? "Edit Customer" : "Create New Customer"}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsFormDrawerOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={loading}>
              {editingId ? "Update Account" : "Save Account"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Customer Code <span className="text-rose-500">*</span></label>
                <input name="customerCode" value={formData.customerCode} onChange={handleChange} placeholder="e.g. CUST-204" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Account Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="erp-select">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>

            <div>
              <label className="erp-label">Customer Legal Name <span className="text-rose-500">*</span></label>
              <input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Full corporate or billing name" className="erp-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Billing Email</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="billing@acme.com" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Phone Number</label>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+91 98765 43210" className="erp-input" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="erp-label">City</label>
                <input name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">State</label>
                <input name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Country</label>
                <input name="country" value={formData.country} onChange={handleChange} placeholder="India" className="erp-input" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="erp-label">GSTIN</label>
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="27AAAAA0000A1Z5" className="erp-input uppercase font-mono text-xs" />
              </div>
              <div>
                <label className="erp-label">Payment Terms</label>
                <input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} type="number" min={0} placeholder="30" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Credit Limit (₹)</label>
                <input name="creditLimit" value={formData.creditLimit} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
            </div>
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={selectedCustomer ? selectedCustomer.customerName : "Customer details"}
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setIsViewDrawerOpen(false)}>Close</Button>
            {selectedCustomer && (
              <Button onClick={() => { setIsViewDrawerOpen(false); openEditDrawer(selectedCustomer); }}>
                Edit Customer Account
              </Button>
            )}
          </div>
        }
      >
        {selectedCustomer && (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Overview</span>
                <Badge variant={selectedCustomer.status === "Inactive" ? "outline" : "default"}>
                  {selectedCustomer.status || "Active"}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.customerName}</h3>
              <p className="text-xs text-slate-500 font-mono">Code: {selectedCustomer.customerCode}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <Mail className="h-5 w-5 text-slate-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Billing Email</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCustomer.email || "Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <Phone className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Contact Number</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">{selectedCustomer.phoneNumber || "Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <MapPin className="h-5 w-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Billing Location</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCustomer.city ? `${selectedCustomer.city}, ${selectedCustomer.state || ""}, ${selectedCustomer.country || ""}` : "Not Specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <Building2 className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">GST Registration Number</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">{selectedCustomer.gstNumber || "Unregistered"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <CreditCard className="h-5 w-5 text-purple-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Credit Limit & Terms</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrency(selectedCustomer.creditLimit)} ({selectedCustomer.paymentTerms || 30} Days)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </StandardPageLayout>
  );
}
