"use client";

import { useState, useEffect } from "react";
import { hrApi } from "@/lib/hrApi";
import { useAuth } from "@/context/AuthContext";

interface Company {
  id: string;
  tenantId?: string;
  name: string;
  legalName?: string;
  code?: string;
  registrationNumber?: string;
  taxId?: string;
  email?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  registrationAddress?: string;
  operationalAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  financialYearStart?: string;
  financialYearEnd?: string;
  maxEmployees?: number;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  hr_PersonName?: string;
  hr_PersonEmail?: string;
  notes?: string;
  isActive: boolean;
}

interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
}

type TabKey = "list" | "general" | "address" | "banking" | "contacts";

export default function CompaniesPage() {
  const { user } = useAuth();
  const roles = (user as { roles?: string[] } | null)?.roles || [];
  const isSuperAdmin = roles.includes("SuperAdmin");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<{ payload?: unknown; response?: unknown } | null>(null);

  const [formData, setFormData] = useState<Partial<Company>>({
    isActive: true,
  });

  useEffect(() => {
    fetchCompanies();
  }, [currentPage]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await hrApi.company.getAll();
      setCompanies(res.data?.companies || []);
      setTotal(res.data?.total || 0);
      setError(null);
    } catch (err) {
      setError((err as Error).message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSubdomain = () => {
    if (typeof window === "undefined") return "";
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.endsWith(".localhost") && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return hostname.split(".")[0] || "";
    }
    return "";
  };

  const loadTenants = async () => {
    if (!isSuperAdmin) return;
    try {
      setTenantLoading(true);
      const res = await hrApi.platform.tenants();
      const items = res.data?.tenants || [];
      setTenants(items);

      if (!selectedTenantId && items.length > 0) {
        const currentSubdomain = getCurrentSubdomain();
        const match = currentSubdomain
          ? items.find((tenant: TenantRow) => tenant.subdomain === currentSubdomain)
          : null;
        setSelectedTenantId(match?.id || items[0].id);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load tenants");
    } finally {
      setTenantLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const normalizePayload = (data: Partial<Company>) => {
    const payload: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === "" || value === null || typeof value === "undefined") return;
      if (key === "maxEmployees") {
        const numeric = typeof value === "string" ? Number(value) : value;
        if (!Number.isNaN(numeric)) {
          payload[key] = numeric;
        }
        return;
      }
      payload[key] = value;
    });
    return payload;
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError("Company name is required");
      return;
    }

    if (!editingId && isSuperAdmin && !selectedTenantId) {
      setError("Tenant is required for SuperAdmin");
      return;
    }

    try {
      setLoading(true);
      const payload = normalizePayload(formData);
      setDebugInfo({ payload });
      if (editingId) {
        // Update
        await hrApi.company.update(editingId, payload);
        setError(null);
        setDebugInfo(null);
        setActiveTab("list");
      } else {
        // Create
        const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);
        await hrApi.company.create(payload, selectedTenant?.subdomain ? { tenant: selectedTenant.subdomain } : undefined);
        setError(null);
        setDebugInfo(null);
        setActiveTab("list");
      }
      setFormData({ isActive: true });
      setEditingId(null);
      await fetchCompanies();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to save company";
      setError(message);
      setDebugInfo((prev) => ({
        payload: prev?.payload,
        response: (err as { response?: { data?: unknown } })?.response?.data || message,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setFormData(company);
    setEditingId(company.id);
    if (company.tenantId) {
      setSelectedTenantId(company.tenantId);
    }
    setActiveTab("general");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    try {
      await hrApi.company.delete(id);
      await fetchCompanies();
      setError(null);
    } catch (err) {
      setError((err as Error).message || "Failed to delete company");
    }
  };

  const handleNew = () => {
    setFormData({ isActive: true });
    setEditingId(null);
    setActiveTab("general");
  };

  const handleCancel = () => {
    setFormData({ isActive: true });
    setEditingId(null);
    setActiveTab("list");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Master</h1>
          <p className="text-sm text-gray-600 mt-1">Manage company details and configurations</p>
        </div>
        {activeTab === "list" && (
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + New Company
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      {debugInfo && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-600">Debug: Company create payload/response</p>
          <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
              activeTab === "list"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Companies ({total})
          </button>
          {(editingId || activeTab !== "list") && (
            <>
              <button
                onClick={() => setActiveTab("general")}
                className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === "general"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                General Information
              </button>
              <button
                onClick={() => setActiveTab("address")}
                className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === "address"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Address Details
              </button>
              <button
                onClick={() => setActiveTab("banking")}
                className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === "banking"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Banking Information
              </button>
              <button
                onClick={() => setActiveTab("contacts")}
                className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === "contacts"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Contacts
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === "list" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No companies found. Click &quot;New Company&quot; to add one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Tenant ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">City</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{company.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{company.tenantId || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{company.code || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{company.city || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{company.email || "-"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            company.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {company.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(company)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* General Information Tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isSuperAdmin && !editingId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tenant *</label>
                <select
                  name="tenantId"
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.subdomain})
                    </option>
                  ))}
                </select>
                {tenantLoading && <p className="mt-1 text-xs text-gray-500">Loading tenants...</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {formData.tenantId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tenant ID</label>
                <input
                  type="text"
                  value={formData.tenantId}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName || ""}
                onChange={handleInputChange}
                placeholder="Enter legal name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Code</label>
              <input
                type="text"
                name="code"
                value={formData.code || ""}
                onChange={handleInputChange}
                placeholder="e.g., COMP001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry || ""}
                onChange={handleInputChange}
                placeholder="e.g., IT Services"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Size</label>
              <select
                name="companySize"
                value={formData.companySize || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Employees</label>
              <input
                type="number"
                name="maxEmployees"
                value={formData.maxEmployees || ""}
                onChange={handleInputChange}
                placeholder="e.g., 500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                placeholder="company@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl || ""}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber || ""}
                onChange={handleInputChange}
                placeholder="CIN/Registration Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tax ID (GST/PAN)</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId || ""}
                onChange={handleInputChange}
                placeholder="GST/PAN Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Financial Year Start (MM-DD)</label>
              <input
                type="text"
                name="financialYearStart"
                value={formData.financialYearStart || ""}
                onChange={handleInputChange}
                placeholder="04-01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Financial Year End (MM-DD)</label>
              <input
                type="text"
                name="financialYearEnd"
                value={formData.financialYearEnd || ""}
                onChange={handleInputChange}
                placeholder="03-31"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive || false}
                onChange={handleInputChange}
                className="w-4 h-4 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">Active</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Address Details Tab */}
      {activeTab === "address" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Address</label>
              <textarea
                name="registrationAddress"
                value={formData.registrationAddress || ""}
                onChange={handleInputChange}
                placeholder="Full registration address"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Operational Address</label>
              <textarea
                name="operationalAddress"
                value={formData.operationalAddress || ""}
                onChange={handleInputChange}
                placeholder="Full operational address"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ""}
                onChange={handleInputChange}
                placeholder="City"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
              <input
                type="text"
                name="state"
                value={formData.state || ""}
                onChange={handleInputChange}
                placeholder="State/Province"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode || ""}
                onChange={handleInputChange}
                placeholder="Postal Code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || ""}
                onChange={handleInputChange}
                placeholder="Country"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Banking Information Tab */}
      {activeTab === "banking" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName || ""}
                onChange={handleInputChange}
                placeholder="Bank Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Branch</label>
              <input
                type="text"
                name="bankBranch"
                value={formData.bankBranch || ""}
                onChange={handleInputChange}
                placeholder="Branch Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber || ""}
                onChange={handleInputChange}
                placeholder="Account Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode || ""}
                onChange={handleInputChange}
                placeholder="IFSC Code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Main Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName || ""}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone || ""}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  value={formData.contactPersonEmail || ""}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">HR Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">HR Person Name</label>
                <input
                  type="text"
                  name="hr_PersonName"
                  value={formData.hr_PersonName || ""}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">HR Person Email</label>
                <input
                  type="email"
                  name="hr_PersonEmail"
                  value={formData.hr_PersonEmail || ""}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleInputChange}
              placeholder="Additional notes..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
