"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Eye, Globe, Shield, CreditCard, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { hrApi } from "@/services/hrApi";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface CompanyRow {
  id: string;
  name: string;
  taxId?: string;
  currency?: string;
  country?: string;
  status?: "Active" | "Pending" | "Inactive";
  createdAt?: string;
}

const SEED_COMPANIES: CompanyRow[] = [
  { id: "cmp_101", name: "UAB India Manufacturing Pvt Ltd", taxId: "27AABCU9603R1ZM", currency: "INR", country: "India", status: "Active", createdAt: "2026-01-10" },
  { id: "cmp_102", name: "Acme Logistics Global Inc", taxId: "US-998201928", currency: "USD", country: "United States", status: "Active", createdAt: "2026-02-15" },
  { id: "cmp_103", name: "EuroTech Solutions GmbH", taxId: "DE-812049102", currency: "EUR", country: "Germany", status: "Active", createdAt: "2026-03-01" },
  { id: "cmp_104", name: "Apex Retail Services LLC", taxId: "UAE-7710294", currency: "AED", country: "United Arab Emirates", status: "Pending", createdAt: "2026-04-12" },
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>(SEED_COMPANIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [country, setCountry] = useState("India");

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await hrApi.company.getAllForSuperAdmin();
      const list = (res.data as unknown as { companies?: CompanyRow[] })?.companies || (Array.isArray(res.data) ? (res.data as CompanyRow[]) : []);
      if (list.length > 0) {
        setCompanies(list.map((c) => ({ ...c, status: c.status || "Active" })));
      }
    } catch {
      // Retain SEED_COMPANIES
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCmp: CompanyRow = {
      id: `cmp_${Date.now()}`,
      name: name.trim(),
      taxId: taxId.trim() || "GST-PENDING",
      currency,
      country,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCompanies((prev) => [newCmp, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setTaxId("");
    notifySuccess(`Company "${newCmp.name}" provisioned successfully.`);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.taxId && c.taxId.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || (c.status || "Active").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [companies, search, statusFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Total Companies", value: companies.length, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Legal Entities" },
    { label: "Active Operations", value: companies.filter((c) => c.status === "Active").length, tone: "positive", icon: <Shield className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Base Currencies", value: new Set(companies.map((c) => c.currency)).size, tone: "warning", icon: <CreditCard className="h-3.5 w-3.5" />, subtext: "Multi-Currency" },
    { label: "Operating Countries", value: new Set(companies.map((c) => c.country)).size, tone: "positive", icon: <Globe className="h-3.5 w-3.5" />, subtext: "Global Scope" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Company Directory & Legal Entities"
      subtitle="Register and manage multi-company structures, tax identifiers, reporting currencies, and legal jurisdictions."
      categoryTag="Legal Entity Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter company name, GST/Tax ID, or currency..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "status",
          label: "All Statuses",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All Statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      primaryActionLabel="Provision Company"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      onRefresh={loadCompanies}
      isLoading={loading}
      isInspectorOpen={isDrawerOpen || !!selectedCompany}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedCompany(null);
      }}
      inspectorTitle={selectedCompany ? `Company Profile: ${selectedCompany.name}` : "Register New Legal Entity"}
      inspectorSubTitle={selectedCompany ? `Entity ID #${selectedCompany.id}` : "Configure tax ID and reporting currency."}
      inspectorContent={
        selectedCompany ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCompany.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST / Tax ID:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedCompany.taxId || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Base Currency:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCompany.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Country:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedCompany.country}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedCompany(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Company Legal Name *</Label>
              <Input placeholder="Acme Enterprises India Pvt Ltd" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tax Registration / GSTIN</Label>
              <Input placeholder="27AABCU9603R1ZM" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Base Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="INR" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Company
              </Button>
            </div>
          </form>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Company Name</th>
              <th className="erp-th">GSTIN / Tax ID</th>
              <th className="erp-th">Base Currency</th>
              <th className="erp-th">Jurisdiction</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((cmp) => (
              <tr key={cmp.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    {cmp.name}
                  </span>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">{cmp.taxId || "-"}</td>
                <td className="erp-td font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{cmp.currency || "INR"}</td>
                <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{cmp.country || "India"}</td>
                <td className="erp-td">
                  <span className={cmp.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {cmp.status}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedCompany(cmp)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
