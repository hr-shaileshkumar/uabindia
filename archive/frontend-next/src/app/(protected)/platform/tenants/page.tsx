"use client";

import { useEffect, useState } from "react";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import { hrApi } from "@/lib/hrApi";

const headingFont = Space_Grotesk({ subsets: ["latin"], weight: ["400", "600", "700"] });
const bodyFont = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const response = (err as { response?: { data?: { message?: string; detail?: string } } }).response;
    const message = response?.data?.detail || response?.data?.message;
    if (message) return message;
  }

  if (err instanceof Error) return err.message;
  return fallback;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    subdomain: "",
    isActive: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await hrApi.platform.tenants();
      setTenants(res.data.tenants || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load tenants"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.subdomain.trim() || !form.adminEmail.trim() || !form.adminPassword.trim()) {
      setError("All fields are required.");
      return;
    }

    try {
      setCreating(true);
      await hrApi.platform.createTenant({
        name: form.name.trim(),
        subdomain: form.subdomain.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword.trim(),
      });
      setForm({ name: "", subdomain: "", adminEmail: "", adminPassword: "" });
      setError(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create tenant"));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (tenant: TenantRow) => {
    setEditingTenant(tenant);
    setEditForm({ name: tenant.name, subdomain: tenant.subdomain, isActive: tenant.isActive });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingTenant(null);
    setEditForm({ name: "", subdomain: "", isActive: true });
  };

  const handleUpdate = async () => {
    if (!editingTenant) return;
    if (!editForm.name.trim()) {
      setError("Tenant name is required.");
      return;
    }

    if (!editForm.subdomain.trim()) {
      setError("Tenant subdomain is required.");
      return;
    }

    try {
      setUpdating(true);
      await hrApi.platform.updateTenant(editingTenant.id, {
        name: editForm.name.trim(),
        subdomain: editForm.subdomain.trim(),
        isActive: editForm.isActive,
      });
      setError(null);
      cancelEdit();
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update tenant"));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (tenant: TenantRow) => {
    if (!window.confirm(`Delete tenant "${tenant.name}"? This will disable access.`)) return;

    try {
      setDeletingId(tenant.id);
      await hrApi.platform.deleteTenant(tenant.id);
      if (editingTenant?.id === tenant.id) {
        cancelEdit();
      }
      setError(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete tenant"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className={`${bodyFont.className} min-h-[70vh] rounded-3xl border border-black/5 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]`}
      style={{
        backgroundImage: "radial-gradient(1000px 420px at 8% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(700px 380px at 95% -10%, rgba(14,116,144,0.18), transparent 55%), linear-gradient(180deg, #f7f8f6 0%, #ffffff 60%)",
        color: "#0f172a",
      }}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2" style={{ animation: "fadeInUp 0.6s ease-out both" }}>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Platform / Core</p>
          <h1 className={`${headingFont.className} text-3xl md:text-4xl font-semibold`}>Tenants</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Create and manage tenant containers before onboarding companies and projects.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]" style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <div className="flex items-center justify-between">
              <h2 className={`${headingFont.className} text-lg font-semibold`}>Tenant Directory</h2>
              <span className="text-xs text-slate-500">{loading ? "Loading..." : `${tenants.length} total`}</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Subdomain</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-900">{t.name}</td>
                      <td className="px-4 py-2 text-slate-500">{t.subdomain}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(t)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deletingId === t.id}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                          >
                            {deletingId === t.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && tenants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No tenants found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              <h2 className={`${headingFont.className} text-lg font-semibold`}>Create Tenant</h2>
              <p className="text-xs text-slate-500 mt-1">Provision schema, admin user, and core modules.</p>
              <div className="mt-4 grid gap-3">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Tenant name"
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <input
                  name="subdomain"
                  value={form.subdomain}
                  onChange={handleChange}
                  placeholder="Subdomain (e.g., hrms)"
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <input
                  name="adminEmail"
                  value={form.adminEmail}
                  onChange={handleChange}
                  placeholder="Admin email"
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <input
                  name="adminPassword"
                  type="password"
                  value={form.adminPassword}
                  onChange={handleChange}
                  placeholder="Admin password"
                  className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {creating ? "Provisioning..." : "Create Tenant"}
                </button>
              </div>
            </div>

            {editingTenant && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                <div className="flex items-center justify-between">
                  <h2 className={`${headingFont.className} text-lg font-semibold`}>Edit Tenant</h2>
                  <button
                    onClick={cancelEdit}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Update name or active status.</p>
                <div className="mt-4 grid gap-3">
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Tenant name"
                    className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <input
                    name="subdomain"
                    value={editForm.subdomain}
                    onChange={handleEditChange}
                    placeholder="Subdomain (e.g., hrms)"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                  <p className="text-xs text-amber-700">
                    Changing subdomain will move the tenant schema. Use only lowercase letters, numbers, or hyphens.
                  </p>
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input
                      name="isActive"
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={handleEditChange}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Active tenant
                  </label>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:opacity-60"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
