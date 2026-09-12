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
  Briefcase,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
  type PlatformListColumn,
} from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { QuickCopyButton } from "@/components/workspace/quick-copy";
import { procurementApi } from "@/services/modules";
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type Vendor = {
  id: string;
  vendorCode: string;
  vendorName: string;
  vendorType: string;
  companyName?: string;
  gstNumber?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  paymentTerms?: number;
  creditLimit?: number;
  status?: string;
};

const VENDOR_TYPES = [
  "Supplier",
  "Service Provider",
  "Contractor",
  "Consultant",
  "Logistics & Freight",
  "Manufacturer",
  "Distributor",
];

const emptyVendorForm = () => ({
  vendorCode: "",
  vendorName: "",
  vendorType: "Supplier",
  companyName: "",
  gstNumber: "",
  email: "",
  phoneNumber: "",
  contactPerson: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  paymentTerms: 30,
  creditLimit: 0,
  status: "Active",
});

const vendorsApi = procurementApi.vendors;

export default function VendorsManager() {
  const { labels } = useLocalization();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer inspector states
  const [mode, setMode] = useState<"closed" | "create" | "edit" | "view">("closed");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyVendorForm());
  const [activeTab, setActiveTab] = useState<"basic" | "address" | "commercial">("basic");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Vendors
  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorsApi.getAll(1, 200);
      const list = res.data?.data || res.data?.vendors || (Array.isArray(res.data) ? res.data : []);
      setVendors(list);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch vendors"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVendors();
  }, []);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vendors.filter((v) => {
      const matchesSearch =
        !q ||
        (v.vendorName || "").toLowerCase().includes(q) ||
        (v.vendorCode || "").toLowerCase().includes(q) ||
        (v.vendorType || "").toLowerCase().includes(q) ||
        (v.email || "").toLowerCase().includes(q) ||
        (v.phoneNumber || "").toLowerCase().includes(q) ||
        (v.city || "").toLowerCase().includes(q) ||
        (v.gstNumber || "").toLowerCase().includes(q);

      const matchesType = typeFilter === "all" || v.vendorType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" && (v.status || "Active").toLowerCase() === "active") ||
        (statusFilter === "Inactive" && (v.status || "").toLowerCase() === "inactive");

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vendors, search, typeFilter, statusFilter]);

  // KPI Calculations
  const supplierCount = useMemo(
    () => vendors.filter((v) => (v.vendorType || "").toLowerCase().includes("supplier")).length,
    [vendors]
  );
  const serviceCount = useMemo(
    () => vendors.filter((v) => (v.vendorType || "").toLowerCase().includes("service")).length,
    [vendors]
  );
  const totalCreditLimit = useMemo(
    () => vendors.reduce((sum, v) => sum + (Number(v.creditLimit) || 0), 0),
    [vendors]
  );

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Suppliers",
      value: vendors.length,
      tone: "info",
      icon: <Truck className="h-3.5 w-3.5" />,
      subtext: "Master vendor registry",
    },
    {
      label: "Material Suppliers",
      value: supplierCount,
      tone: "positive",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      subtext: "Goods & raw stock",
    },
    {
      label: "Service Providers",
      value: serviceCount,
      tone: "neutral",
      icon: <Briefcase className="h-3.5 w-3.5" />,
      subtext: "Services & logistics",
    },
    {
      label: "Vendor Credit Limit",
      value: formatCurrency(totalCreditLimit),
      tone: "warning",
      icon: <CreditCard className="h-3.5 w-3.5" />,
      subtext: "Approved credit limit",
    },
  ];

  // Drawer Openers
  const openCreate = () => {
    setEditing(null);
    setForm(emptyVendorForm());
    setActiveTab("basic");
    setMode("create");
  };

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor);
    setForm({
      vendorCode: vendor.vendorCode || "",
      vendorName: vendor.vendorName || "",
      vendorType: vendor.vendorType || "Supplier",
      companyName: vendor.companyName || "",
      gstNumber: vendor.gstNumber || "",
      email: vendor.email || "",
      phoneNumber: vendor.phoneNumber || "",
      contactPerson: vendor.contactPerson || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      country: vendor.country || "India",
      postalCode: vendor.postalCode || "",
      paymentTerms: vendor.paymentTerms || 30,
      creditLimit: vendor.creditLimit || 0,
      status: vendor.status || "Active",
    });
    setActiveTab("basic");
    setMode("edit");
  };

  const openView = (vendor: Vendor) => {
    setEditing(vendor);
    setMode("view");
  };

  // Save Vendor
  const handleSave = async () => {
    if (!form.vendorName.trim()) {
      notifyError("Vendor Name is required.");
      return;
    }

    const payload = {
      vendorCode: form.vendorCode.trim() || undefined,
      vendorName: form.vendorName.trim(),
      vendorType: form.vendorType,
      companyName: form.companyName.trim() || undefined,
      gstNumber: form.gstNumber.trim().toUpperCase() || undefined,
      email: form.email.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || "India",
      postalCode: form.postalCode.trim() || undefined,
      paymentTerms: Number(form.paymentTerms) || 30,
      creditLimit: Number(form.creditLimit) || 0,
    };

    try {
      setIsSaving(true);
      if (mode === "edit" && editing) {
        await vendorsApi.update(editing.id, payload);
        notifySuccess(`Vendor "${form.vendorName}" updated successfully.`);
      } else {
        await vendorsApi.create(payload);
        notifySuccess(`Vendor "${form.vendorName}" created successfully.`);
      }
      setMode("closed");
      await fetchVendors();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save vendor."));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Vendor
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await vendorsApi.delete(deleteTarget.id);
      notifySuccess(`Vendor "${deleteTarget.vendorName}" deleted successfully.`);
      setDeleteTarget(null);
      await fetchVendors();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete vendor."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredVendors.length === 0) {
      notifyError("No vendor records to export.");
      return;
    }
    const headers = [
      "Vendor Code",
      "Vendor Name",
      "Vendor Category",
      "Email",
      "Phone",
      "City",
      "State",
      "GSTIN",
      "Payment Terms",
      "Credit Limit",
    ];
    const rows = filteredVendors.map((v) => [
      `"${(v.vendorCode || "").replace(/"/g, '""')}"`,
      `"${(v.vendorName || "").replace(/"/g, '""')}"`,
      `"${(v.vendorType || "Supplier").replace(/"/g, '""')}"`,
      `"${(v.email || "").replace(/"/g, '""')}"`,
      `"${(v.phoneNumber || "").replace(/"/g, '""')}"`,
      `"${(v.city || "").replace(/"/g, '""')}"`,
      `"${(v.state || "").replace(/"/g, '""')}"`,
      `"${(v.gstNumber || "").replace(/"/g, '""')}"`,
      `"${v.paymentTerms ?? 30}"`,
      `"${v.creditLimit ?? 0}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vendors_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Exported ${filteredVendors.length} vendor record(s) to CSV.`);
  };

  // Table Columns
  const listColumns: PlatformListColumn[] = [
    { key: "name", label: "Vendor & Supplier", dataType: "string" },
    { key: "type", label: "Category" },
    { key: "contact", label: "Contact Info" },
    { key: "location", label: "Location" },
    { key: "taxId", label: `GSTIN (${labels.taxId})` },
    { key: "terms", label: "Terms & Credit", dataType: "currency" },
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
            { id: "address", label: "Address & Facility", icon: <MapPin className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "commercial", label: "Commercial & Tax", icon: <CreditCard className="h-3.5 w-3.5 mr-1.5" /> },
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
              Vendor Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.vendorCode}
              placeholder="e.g. VEN-1001 (auto-generated if empty)"
              onChange={(e) => setForm((f) => ({ ...f, vendorCode: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vendor Category
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.vendorType}
              onChange={(e) => setForm((f) => ({ ...f, vendorType: e.target.value }))}
            >
              {VENDOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vendor Legal / Trade Name *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.vendorName}
              placeholder="Full registered trade or corporate name"
              onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Person / Sales POC
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.contactPerson}
              placeholder="Primary account executive"
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corporate Email
            </label>
            <input
              type="email"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.email}
              placeholder="orders@vendor.com"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone / Helpline
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.phoneNumber}
              placeholder="+91 98765 43210"
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Operating Status
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Active">Active Supplier</option>
              <option value="Inactive">Dormant / Blacklisted</option>
            </select>
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
              placeholder="e.g. Pune, Chennai"
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
              placeholder="e.g. Maharashtra, Tamil Nadu"
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
              PIN / Postal Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.postalCode}
              placeholder="e.g. 411001"
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Factory / Dispatch Address
            </label>
            <textarea
              className="erp-input w-full min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.address}
              placeholder="Full dispatch warehouse or corporate address"
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
        </div>
      )}

      {activeTab === "commercial" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GSTIN / Tax ID ({labels.taxId})
            </label>
            <input
              maxLength={15}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.gstNumber}
              placeholder="e.g. 27BBBBB0000B1Z5"
              onChange={(e) => setForm((f) => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
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
              Approved Supplier Credit Limit (₹)
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.creditLimit}
              placeholder="e.g. 200000"
              onChange={(e) => setForm((f) => ({ ...f, creditLimit: Number(e.target.value) }))}
            />
          </div>

          <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Procurement & 3-Way Match Integration
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
              Vendor profiles govern Purchase Orders (PO), Goods Receipt Notes (GRN), and Accounts Payable (AP) supplier invoices. GSTIN verification ensures automatic Input Tax Credit (ITC) reconciliation with GSTR-2B.
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

  // Read-only View Content
  const viewInspectorContent = editing && (
    <div className="space-y-4 py-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Supplier Profile</span>
          <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200/60 dark:bg-teal-950/50 dark:text-teal-300">
            {editing.vendorType || "Supplier"}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{editing.vendorName}</h3>
        <p className="text-xs font-mono text-slate-500">Code: {editing.vendorCode}</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Order Dispatch Email</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{editing.email || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Helpline / POC</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{editing.phoneNumber || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Factory / Location</p>
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
              {formatCurrency(editing.creditLimit)} · {editing.paymentTerms || 30} Days Payment Terms
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
          Edit Vendor
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title="Vendors & Supplier Directory"
        subtitle="Manage supplier master records, vendor categories, payment terms, procurement contracts, and tax IDs."
        categoryTag="Procurement & Sourcing / Masters"
        icon="truck"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vendor name, code, category, GST, city…"
        filterOptions={[
          {
            key: "type",
            label: "All Categories",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: "All Categories", value: "all" },
              ...VENDOR_TYPES.map((t) => ({ label: t, value: t })),
            ],
          },
          {
            key: "status",
            label: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "Active" },
              { label: "Inactive Only", value: "Inactive" },
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setTypeFilter("all");
          setStatusFilter("all");
        }}
        primaryActionLabel="Add Vendor"
        onPrimaryAction={openCreate}
        onRefresh={() => void fetchVendors()}
        onExportCsv={handleExportCsv}
        isLoading={loading}
        listKey="procurement-vendors"
        listRows={filteredVendors}
        getRowId={(row) => row.id}
        emptyMessage="No vendor accounts found. Click Add Vendor to register your first supplier."
        listColumns={listColumns}
        renderListRow={(vendor) => (
          <tr key={vendor.id} className="erp-tr">
            <td className="erp-td">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-bold text-white shadow-sm">
                  {(vendor.vendorName || "V").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openView(vendor)}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate text-left block cursor-pointer transition-colors"
                  >
                    {vendor.vendorName}
                  </button>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>{vendor.vendorCode}</span>
                    <QuickCopyButton text={vendor.vendorCode} label="code" />
                  </div>
                </div>
              </div>
            </td>
            <td className="erp-td">
              <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200/60 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60">
                {vendor.vendorType || "Supplier"}
              </span>
            </td>
            <td className="erp-td">
              <div className="space-y-0.5">
                {vendor.email && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    {vendor.email}
                  </div>
                )}
                {vendor.phoneNumber && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    {vendor.phoneNumber}
                  </div>
                )}
                {!vendor.email && !vendor.phoneNumber && (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </td>
            <td className="erp-td">
              {vendor.city || vendor.state ? (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-300">
              {vendor.gstNumber ? (
                <div className="flex items-center gap-1">
                  <span>{vendor.gstNumber}</span>
                  <QuickCopyButton text={vendor.gstNumber} label="tax id" />
                </div>
              ) : (
                "—"
              )}
            </td>
            <td className="erp-td">
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(vendor.creditLimit)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {vendor.paymentTerms || 30} Days Terms
                </span>
              </div>
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                onView={{ label: "View Details", onClick: () => openView(vendor) }}
                onEdit={{ label: "Edit Vendor", onClick: () => openEdit(vendor) }}
                onDelete={{ label: "Delete Supplier", onClick: () => setDeleteTarget(vendor) }}
              />
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={
          mode === "edit"
            ? `Edit: ${editing?.vendorName}`
            : mode === "view"
              ? `Supplier Profile: ${editing?.vendorName}`
              : "Register New Vendor"
        }
        inspectorSubTitle={
          mode === "view"
            ? "Supplier commercial profile, contact, and procurement terms"
            : "Fill details across Basic Info, Address & Facility, and Commercial & Tax tabs"
        }
        inspectorWidth="xl"
        inspectorContent={mode === "view" ? viewInspectorContent : drawerForm}
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchVendors()}
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
        title="Delete Vendor Supplier"
        entityName={deleteTarget?.vendorName || deleteTarget?.vendorCode}
        description={`Are you sure you want to delete vendor "${deleteTarget?.vendorName}"? Active purchase orders and goods receipt notes will retain archival vendor reference.`}
        isHardDelete
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
