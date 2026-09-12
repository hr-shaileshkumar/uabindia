"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
  type PlatformListColumn,
} from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { QuickCopyButton } from "@/components/workspace/quick-copy";
import { crmApi } from "@/services/modules/crm";
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  customerCode: string;
  customerName: string;
  customerType?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  gstNumber?: string;
  panNumber?: string;
  creditLimit?: number;
  paymentTerms?: number;
  openingBalance?: number;
  status?: string;
};

const emptyCustomerForm = () => ({
  customerCode: "",
  customerName: "",
  customerType: "Company",
  companyName: "",
  email: "",
  phoneNumber: "",
  mobileNumber: "",
  contactPerson: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  billingAddress: "",
  shippingAddress: "",
  gstNumber: "",
  panNumber: "",
  creditLimit: 0,
  paymentTerms: 30,
  openingBalance: 0,
  status: "Active",
});

const customersApi = crmApi.customers;

export default function CustomersManager() {
  const { labels } = useLocalization();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  // Drawer inspector states
  const [mode, setMode] = useState<"closed" | "create" | "edit" | "view">("closed");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomerForm());
  const [activeTab, setActiveTab] = useState<"basic" | "address" | "finance">("basic");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customersApi.getAll(1, 200);
      const list = res.data?.data || res.data?.customers || (Array.isArray(res.data) ? res.data : []);
      setCustomers(list);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch customers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  // Unique state / regional jurisdictions from data
  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => c.state && set.add(c.state));
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        (c.customerName || "").toLowerCase().includes(q) ||
        (c.customerCode || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phoneNumber || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.gstNumber || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" && (c.status || "Active").toLowerCase() === "active") ||
        (statusFilter === "Inactive" && (c.status || "").toLowerCase() === "inactive") ||
        (statusFilter === "On Hold" && (c.status || "").toLowerCase() === "on hold");

      const matchesState = stateFilter === "all" || c.state === stateFilter;

      return matchesSearch && matchesStatus && matchesState;
    });
  }, [customers, search, statusFilter, stateFilter]);

  // KPI Calculations
  const activeCount = useMemo(
    () => customers.filter((c) => (c.status || "Active").toLowerCase() === "active").length,
    [customers]
  );
  const onHoldOrInactiveCount = useMemo(
    () => customers.filter((c) => (c.status || "").toLowerCase() !== "active").length,
    [customers]
  );
  const totalCreditLimit = useMemo(
    () => customers.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0),
    [customers]
  );

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Accounts",
      value: customers.length,
      tone: "info",
      icon: <Building2 className="h-3.5 w-3.5" />,
      subtext: "Registered clients",
    },
    {
      label: "Active Customers",
      value: activeCount,
      tone: "positive",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      subtext: "Trading active",
    },
    {
      label: "On Hold / Inactive",
      value: onHoldOrInactiveCount,
      tone: "warning",
      icon: <XCircle className="h-3.5 w-3.5" />,
      subtext: "Review required",
    },
    {
      label: "Total Credit Line",
      value: formatCurrency(totalCreditLimit),
      tone: "neutral",
      icon: <CreditCard className="h-3.5 w-3.5" />,
      subtext: "Approved credit",
    },
  ];

  // Drawer Openers
  const openCreate = () => {
    setEditing(null);
    setForm(emptyCustomerForm());
    setActiveTab("basic");
    setMode("create");
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      customerCode: customer.customerCode || "",
      customerName: customer.customerName || "",
      customerType: customer.customerType || "Company",
      companyName: customer.companyName || "",
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      mobileNumber: customer.mobileNumber || "",
      contactPerson: customer.contactPerson || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "India",
      postalCode: customer.postalCode || "",
      billingAddress: customer.billingAddress || "",
      shippingAddress: customer.shippingAddress || "",
      gstNumber: customer.gstNumber || "",
      panNumber: customer.panNumber || "",
      creditLimit: customer.creditLimit || 0,
      paymentTerms: customer.paymentTerms || 30,
      openingBalance: customer.openingBalance || 0,
      status: customer.status || "Active",
    });
    setActiveTab("basic");
    setMode("edit");
  };

  const openView = (customer: Customer) => {
    setEditing(customer);
    setMode("view");
  };

  // Save Customer
  const handleSave = async () => {
    if (!form.customerName.trim()) {
      notifyError("Customer Name is required.");
      return;
    }

    const payload = {
      customerCode: form.customerCode.trim() || undefined,
      customerName: form.customerName.trim(),
      customerType: form.customerType,
      companyName: form.companyName.trim() || undefined,
      email: form.email.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      mobileNumber: form.mobileNumber.trim() || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || "India",
      postalCode: form.postalCode.trim() || undefined,
      billingAddress: form.billingAddress.trim() || undefined,
      shippingAddress: form.shippingAddress.trim() || undefined,
      gstNumber: form.gstNumber.trim().toUpperCase() || undefined,
      panNumber: form.panNumber.trim().toUpperCase() || undefined,
      creditLimit: Number(form.creditLimit) || 0,
      paymentTerms: Number(form.paymentTerms) || 30,
      openingBalance: Number(form.openingBalance) || 0,
      status: form.status,
    };

    try {
      setIsSaving(true);
      if (mode === "edit" && editing) {
        await customersApi.update(editing.id, payload);
        notifySuccess(`Customer "${form.customerName}" updated successfully.`);
      } else {
        await customersApi.create(payload);
        notifySuccess(`Customer "${form.customerName}" created successfully.`);
      }
      setMode("closed");
      await fetchCustomers();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save customer."));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Customer
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await customersApi.delete(deleteTarget.id);
      notifySuccess(`Customer "${deleteTarget.customerName}" deleted successfully.`);
      setDeleteTarget(null);
      await fetchCustomers();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete customer."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredCustomers.length === 0) {
      notifyError("No customer accounts to export.");
      return;
    }
    const headers = [
      "Customer Code",
      "Customer Name",
      "Customer Type",
      "Email",
      "Phone",
      "City",
      "State",
      "GSTIN",
      "Credit Limit",
      "Payment Terms",
      "Status",
    ];
    const rows = filteredCustomers.map((c) => [
      `"${(c.customerCode || "").replace(/"/g, '""')}"`,
      `"${(c.customerName || "").replace(/"/g, '""')}"`,
      `"${(c.customerType || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.phoneNumber || "").replace(/"/g, '""')}"`,
      `"${(c.city || "").replace(/"/g, '""')}"`,
      `"${(c.state || "").replace(/"/g, '""')}"`,
      `"${(c.gstNumber || "").replace(/"/g, '""')}"`,
      `"${c.creditLimit ?? 0}"`,
      `"${c.paymentTerms ?? 30}"`,
      `"${(c.status || "Active").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `customers_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Exported ${filteredCustomers.length} customer account(s) to CSV.`);
  };

  // Table Columns
  const listColumns: PlatformListColumn[] = [
    { key: "name", label: "Customer Account", dataType: "string" },
    { key: "contact", label: "Contact Info" },
    { key: "location", label: "Location" },
    { key: "taxId", label: `Tax ID (${labels.taxId})` },
    { key: "credit", label: "Credit Terms", dataType: "currency" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", locked: true },
  ];

  // Drawer Form Content
  const drawerForm = (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
        {(
          [
            { id: "basic", label: "Basic Info", icon: <UserCheck className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "address", label: "Address & Location", icon: <MapPin className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "finance", label: "Financial & Tax", icon: <CreditCard className="h-3.5 w-3.5 mr-1.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.customerCode}
              placeholder="e.g. CUST-1001 (auto-generated if empty)"
              onChange={(e) => setForm((f) => ({ ...f, customerCode: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Status
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Legal / Billing Name *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.customerName}
              placeholder="Full registered corporate name"
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Type
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.customerType}
              onChange={(e) => setForm((f) => ({ ...f, customerType: e.target.value }))}
            >
              <option value="Company">Corporate / Business (B2B)</option>
              <option value="Individual">Retail / Individual (B2C)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Person
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.contactPerson}
              placeholder="Designated manager or buyer"
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Billing Email Address
            </label>
            <input
              type="email"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.email}
              placeholder="billing@customer.com"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone / Mobile
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.phoneNumber}
              placeholder="+91 98765 43210"
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
        </div>
      )}

      {activeTab === "address" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.city}
              placeholder="e.g. Mumbai, Bangalore"
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              State / Province
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.state}
              placeholder="e.g. Maharashtra, Karnataka"
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Country
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.country}
              placeholder="India"
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Postal / PIN Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.postalCode}
              placeholder="e.g. 400001"
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Billing Address
            </label>
            <textarea
              className="erp-input w-full min-h-[70px] rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.billingAddress}
              placeholder="Full invoice billing street address"
              onChange={(e) => setForm((f) => ({ ...f, billingAddress: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shipping / Delivery Address
            </label>
            <textarea
              className="erp-input w-full min-h-[70px] rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.shippingAddress}
              placeholder="Warehouse / delivery site address (if different from billing)"
              onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
            />
          </div>
        </div>
      )}

      {activeTab === "finance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tax ID / GST Number ({labels.taxId})
            </label>
            <input
              maxLength={15}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.gstNumber}
              placeholder="e.g. 27AAAAA0000A1Z5"
              onChange={(e) => setForm((f) => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              PAN Number
            </label>
            <input
              maxLength={10}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.panNumber}
              placeholder="e.g. ABCDE1234F"
              onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Terms (Days)
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.paymentTerms}
              placeholder="30"
              onChange={(e) => setForm((f) => ({ ...f, paymentTerms: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Approved Credit Limit (₹)
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.creditLimit}
              placeholder="e.g. 500000"
              onChange={(e) => setForm((f) => ({ ...f, creditLimit: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Opening Balance (₹)
            </label>
            <input
              type="number"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.openingBalance}
              placeholder="0"
              onChange={(e) => setForm((f) => ({ ...f, openingBalance: Number(e.target.value) }))}
            />
          </div>

          <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Statutory Tax & Credit Control Compliance
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
              Customer tax IDs directly dictate GST e-Invoice generation, e-Way bill compliance, and Place of Supply (POS) tax allocation (IGST vs CGST/SGST) across all sales orders and invoices.
            </p>
          </div>
        </div>
      )}

      {/* Drawer Footer */}
      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <ErpDrawerFooter
          onCancel={() => setMode("closed")}
          onSave={() => void handleSave()}
          saving={isSaving}
          isEdit={mode === "edit"}
        />
      </div>
    </div>
  );

  // Read-only View Inspector Content
  const viewInspectorContent = editing && (
    <div className="space-y-4 py-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Account Overview</span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
              (editing.status || "Active").toLowerCase() === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {editing.status || "Active"}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{editing.customerName}</h3>
        <p className="text-xs font-mono text-slate-500">Code: {editing.customerCode}</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Billing Email</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{editing.email || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Contact Number</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{editing.phoneNumber || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Location</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {[editing.city, editing.state, editing.country].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Credit Limit & Terms</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(editing.creditLimit)} · {editing.paymentTerms || 30} Days Terms
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setMode("closed")}
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => openEdit(editing)}
          className="inline-flex h-8 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Edit Account
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title="Customers Master & Accounts"
        subtitle="Manage corporate and retail customer directories, credit terms, billing addresses, and tax credentials."
        categoryTag="Sales & CRM / Masters"
        icon="users"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer name, code, email, GST, city…"
        filterOptions={[
          {
            key: "status",
            label: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "Active" },
              { label: "Inactive Only", value: "Inactive" },
              { label: "On Hold", value: "On Hold" },
            ],
          },
          {
            key: "state",
            label: "All Regions",
            value: stateFilter,
            onChange: setStateFilter,
            options: [
              { label: "All Regions", value: "all" },
              ...stateOptions.map((s) => ({ label: s, value: s })),
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
          setStateFilter("all");
        }}
        primaryActionLabel="Add Customer"
        onPrimaryAction={openCreate}
        onRefresh={() => void fetchCustomers()}
        onExportCsv={handleExportCsv}
        isLoading={loading}
        listKey="crm-customers"
        listRows={filteredCustomers}
        getRowId={(row) => row.id}
        emptyMessage="No customer accounts found. Click Add Customer to register your first client."
        listColumns={listColumns}
        renderListRow={(customer) => (
          <tr key={customer.id} className="erp-tr">
            <td className="erp-td">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                  {(customer.customerName || "C").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openView(customer)}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate text-left block cursor-pointer transition-colors"
                  >
                    {customer.customerName}
                  </button>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>{customer.customerCode}</span>
                    <QuickCopyButton text={customer.customerCode} label="code" />
                  </div>
                </div>
              </div>
            </td>
            <td className="erp-td">
              <div className="space-y-0.5">
                {customer.email && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    {customer.email}
                  </div>
                )}
                {customer.phoneNumber && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    {customer.phoneNumber}
                  </div>
                )}
                {!customer.email && !customer.phoneNumber && (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </td>
            <td className="erp-td">
              {customer.city || customer.state ? (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  {[customer.city, customer.state].filter(Boolean).join(", ")}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-300">
              {customer.gstNumber ? (
                <div className="flex items-center gap-1">
                  <span>{customer.gstNumber}</span>
                  <QuickCopyButton text={customer.gstNumber} label="tax id" />
                </div>
              ) : (
                "—"
              )}
            </td>
            <td className="erp-td">
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(customer.creditLimit)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {customer.paymentTerms || 30} Days Terms
                </span>
              </div>
            </td>
            <td className="erp-td">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
                  (customer.status || "Active").toLowerCase() === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                    : (customer.status || "").toLowerCase() === "on hold"
                      ? "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                      : "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                )}
              >
                {customer.status || "Active"}
              </span>
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                onView={{ label: "View Details", onClick: () => openView(customer) }}
                onEdit={{ label: "Edit Customer", onClick: () => openEdit(customer) }}
                onDelete={{ label: "Delete Account", onClick: () => setDeleteTarget(customer) }}
              />
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={
          mode === "edit"
            ? `Edit: ${editing?.customerName}`
            : mode === "view"
              ? `Customer Account: ${editing?.customerName}`
              : "Register New Customer"
        }
        inspectorSubTitle={
          mode === "view"
            ? "Account summary, credit limit, and contact coordinates"
            : "Fill details across Basic Info, Address & Location, and Financial & Tax tabs"
        }
        inspectorWidth="xl"
        inspectorContent={mode === "view" ? viewInspectorContent : drawerForm}
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchCustomers()}
              className="font-bold text-rose-800 underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </AdministrationGlobalPageShell>

      {/* Universal Delete Dialog */}
      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Customer Account"
        entityName={deleteTarget?.customerName || deleteTarget?.customerCode}
        description={`Are you sure you want to delete customer "${deleteTarget?.customerName}"? Any associated historical transaction records will remain archived.`}
        isHardDelete
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
