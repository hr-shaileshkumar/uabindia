"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";

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

const customersApi = hrApi.erp.customers;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

const formatCurrency = (value?: number) =>
  value != null ? `Rs ${value.toLocaleString("en-IN")}` : "-";

export default function CustomersManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
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
      const response = await customersApi.getAll();
      setCustomers(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch customers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  const activeCustomers = useMemo(
    () => customers.filter((customer) => (customer.status || "Active") === "Active").length,
    [customers]
  );
  const totalCreditLimit = useMemo(
    () => customers.reduce((sum, customer) => sum + (customer.creditLimit || 0), 0),
    [customers]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  };

  const handleSave = async () => {
    if (!formData.customerName.trim() || !formData.customerCode.trim()) {
      setError("Customer name and code are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await customersApi.update(editingId, formData);
      } else {
        await customersApi.create(formData);
      }
      setActiveTab("list");
      setEditingId(null);
      resetForm();
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
    const ok = await confirm({
      title: "Delete customer",
      message: "Permanently delete this customer? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await customersApi.delete(id);
      await fetchCustomers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete customer"));
    }
  };

  return (
    <StandardPageLayout
      title="Customers"
      subtitle="Maintain customer master data, billing readiness, and commercial terms from one sales master workspace."
      eyebrow="Sales & CRM / Customers"
      icon="users"
      meta={
        <>
          <CrudHeaderStats
            items={[
              { label: "Customers", value: customers.length, helper: "records" },
              { label: "Active", value: activeCustomers, tone: "positive" },
              { label: "Credit", value: formatCurrency(totalCreditLimit), tone: "info" },
              { label: "Avg Terms", value: `${customers.length ? Math.round(customers.reduce((sum, customer) => sum + (customer.paymentTerms || 0), 0) / customers.length) : 0}d` },
            ]}
          />
        </>
      }
      actions={
        <Button onClick={() => { setEditingId(null); resetForm(); setActiveTab("form"); }}>
          Add Customer
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
          <TabsList className="erp-tabs-list">
            <TabsTrigger value="list" className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active">Customer List</TabsTrigger>
            <TabsTrigger value="form" className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active">{editingId ? "Edit Customer" : "New Customer"}</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <CrudCard
              title="Customer Directory"
              description="Show legal identity, contact, location, tax, credit, and billing term information in one compact table."
              actions={<Button onClick={() => { setEditingId(null); resetForm(); setActiveTab("form"); }}>Add Customer</Button>}
            >
                {loading ? (
                  <div className="erp-loading">Loading customers...</div>
                ) : customers.length === 0 ? (
                  <div className="erp-empty">No customers found. Add the first customer master record to begin order and billing flows.</div>
                ) : (
                  <div className="erp-table-wrap border-0 bg-white/80 shadow-none">
                    <table className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          <th className="erp-th">Code</th>
                          <th className="erp-th">Name</th>
                          <th className="erp-th">Email</th>
                          <th className="erp-th">Phone</th>
                          <th className="erp-th">City</th>
                          <th className="erp-th">Terms</th>
                          <th className="erp-th">Credit Limit</th>
                          <th className="erp-th">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id} className="erp-tr">
                            <td className="erp-td font-medium text-slate-900">{customer.customerCode}</td>
                            <td className="erp-td">{customer.customerName}</td>
                            <td className="erp-td text-slate-600">{customer.email || "-"}</td>
                            <td className="erp-td text-slate-600">{customer.phoneNumber || "-"}</td>
                            <td className="erp-td text-slate-600">{customer.city || "-"}</td>
                            <td className="erp-td text-slate-600">{customer.paymentTerms || 0} days</td>
                            <td className="erp-td font-medium text-slate-900">{formatCurrency(customer.creditLimit)}</td>
                            <td className="erp-td">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(customer)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => void handleDelete(customer.id)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </CrudCard>
          </TabsContent>

          <TabsContent value="form">
            <CrudCard
              title={editingId ? "Edit Customer" : "Create Customer"}
              description="Keep only customer master information here. Transaction history and collections activity should stay outside this setup form."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="erp-label">Customer Code</label>
                    <input name="customerCode" value={formData.customerCode} onChange={handleInputChange} placeholder="e.g. CUST-1024" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Customer Name</label>
                    <input name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="Legal or trading name" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="billing@company.com" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Phone</label>
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Primary contact number" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">City</label>
                    <input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">State</label>
                    <input name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Country</label>
                    <input name="country" value={formData.country} onChange={handleInputChange} placeholder="Country" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">GST Number</label>
                    <input name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} placeholder="Tax registration ID" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Credit Limit</label>
                    <input name="creditLimit" type="number" value={formData.creditLimit} onChange={handleInputChange} placeholder="0" className="erp-input" />
                  </div>
                  <div>
                    <label className="erp-label">Payment Terms</label>
                    <input name="paymentTerms" type="number" value={formData.paymentTerms} onChange={handleInputChange} placeholder="30" className="erp-input" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                  <Button onClick={() => void handleSave()} disabled={loading}>{editingId ? "Update Customer" : "Save Customer"}</Button>
                </div>
              </div>
            </CrudCard>
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
}
