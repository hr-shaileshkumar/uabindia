"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Tag,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
} from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { useCompanies, useCompanyMutations } from "@/features/companies/hooks";
import type { CompanyRecord } from "@/features/companies/types";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  GLOBAL_JURISDICTIONS,
  getCountryJurisdiction,
} from "@/lib/workspace/jurisdictions";

const INDUSTRIES = [
  "Technology",
  "Manufacturing",
  "Healthcare",
  "Finance & Banking",
  "Education",
  "Retail",
  "Construction",
  "Logistics & Transport",
  "Agriculture",
  "Media & Entertainment",
  "Hospitality",
  "Real Estate",
  "Professional Services",
  "Government",
  "Non-Profit",
  "Other",
];

const emptyForm = () => ({
  name: "",
  legalName: "",
  code: "",
  email: "",
  phoneNumber: "",
  taxId: "",
  industry: "",
  city: "",
  state: "",
  country: "India",
  countryCode: "IND",
  registrationAddress: "",
  website: "",
  isActive: true,
});

export function CompaniesManager() {
  const { data, isLoading, isError, error, refetch } = useCompanies(1, 100);
  const { createCompanyMutation, updateCompanyMutation, deleteCompanyMutation } =
    useCompanyMutations();
  const companies = useMemo(() => data?.companies ?? [], [data?.companies]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<CompanyRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [activeTab, setActiveTab] = useState<"basic" | "address" | "compliance">("basic");

  const industries = useMemo(() => {
    const set = new Set(companies.map((c) => c.industry).filter(Boolean));
    return [...set] as string[];
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (c.legalName ?? "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);
      const matchesIndustry =
        industryFilter === "all" || c.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [companies, search, statusFilter, industryFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setActiveTab("basic");
    setMode("create");
  };

  const openEdit = (company: CompanyRecord) => {
    setEditing(company);
    setForm({
      name: company.name || "",
      legalName: company.legalName || "",
      code: company.code || "",
      email: company.email || "",
      phoneNumber: company.phoneNumber || "",
      taxId: company.taxId || "",
      industry: company.industry || "",
      city: company.city || "",
      state: company.state || "",
      country: company.country || "India",
      countryCode:
        ((company as unknown as Record<string, unknown>).countryCode as string) || "IND",
      registrationAddress: company.registrationAddress || "",
      website:
        ((company as unknown as Record<string, unknown>).website as string) || "",
      isActive: company.isActive,
    });
    setActiveTab("basic");
    setMode("edit");
  };

  const save = async () => {
    if (!form.name.trim()) {
      notifyError("Company name is required.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      legalName: form.legalName.trim() || undefined,
      code: form.code.trim() || undefined,
      email: form.email.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      industry: form.industry.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      registrationAddress: form.registrationAddress.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (mode === "edit" && editing) {
        await updateCompanyMutation.mutateAsync({ id: editing.id, payload });
        notifySuccess("Company updated successfully.");
      } else {
        await createCompanyMutation.mutateAsync({ payload });
        notifySuccess("Company created successfully.");
      }
      setMode("closed");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save company."));
    }
  };

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Companies",
      value: companies.length,
      tone: "info",
      icon: <Building2 className="h-3.5 w-3.5" />,
      subtext: "Registered entities",
    },
    {
      label: "Active",
      value: companies.filter((c) => c.isActive).length,
      tone: "positive",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      subtext: "Operating",
    },
    {
      label: "Inactive",
      value: companies.filter((c) => !c.isActive).length,
      tone: "warning",
      icon: <XCircle className="h-3.5 w-3.5" />,
      subtext: "Dormant",
    },
    {
      label: "Industries",
      value: industries.length,
      tone: "neutral",
      icon: <Tag className="h-3.5 w-3.5" />,
      subtext: "Sectors covered",
    },
  ];

  const drawerForm = (
    <div className="space-y-0">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
        {(["basic", "address", "compliance"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 cursor-pointer ${
              activeTab === tab
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab === "basic"
              ? "Basic Info"
              : tab === "address"
                ? "Address"
                : "Compliance"}
          </button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Display Name *</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.name}
              placeholder="e.g. UAB India Solutions"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Legal / Registered Name</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.legalName}
              placeholder="Full legal name for MCA records"
              onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Code</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.code}
              placeholder="e.g. UAB001"
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry Sector</label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
            >
              <option value="">Select Industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              type="email"
              value={form.email}
              placeholder="hello@company.com"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.phoneNumber}
              placeholder="+91 98765 43210"
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <span>Mark as Active (appears in company context selector)</span>
            </label>
          </div>
        </div>
      )}

      {activeTab === "address" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country / Jurisdiction</label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.countryCode}
              onChange={(e) => {
                const jur = getCountryJurisdiction(e.target.value);
                setForm((f) => ({
                  ...f,
                  countryCode: jur.code,
                  country: jur.name,
                  state: jur.subdivisions[0] || "",
                }));
              }}
            >
              {Object.values(GLOBAL_JURISDICTIONS).map((j) => (
                <option key={j.code} value={j.code}>
                  {j.flag} {j.name} ({j.currency})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {getCountryJurisdiction(form.countryCode).subdivisionType}
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            >
              <option value="">Select {getCountryJurisdiction(form.countryCode).subdivisionType}</option>
              {getCountryJurisdiction(form.countryCode).subdivisions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.city}
              placeholder="e.g. New York, London, Dubai, Mumbai"
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Website</label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              type="url"
              value={form.website}
              placeholder="https://company.com"
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Headquarters Address</label>
            <textarea
              className="erp-input w-full min-h-[90px] rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.registrationAddress}
              placeholder="Full registered headquarters address"
              onChange={(e) => setForm((f) => ({ ...f, registrationAddress: e.target.value }))}
            />
          </div>
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {getCountryJurisdiction(form.countryCode).taxIdLabel}
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.taxId}
              placeholder={`Enter official ${getCountryJurisdiction(form.countryCode).taxIdLabel}`}
              onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value.toUpperCase() }))}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Corporate tax identification number for invoices, ledger postings, and statutory reporting.
            </p>
          </div>
          <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Global Compliance & Multi-Entity Scope
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
              Company records establish the legal jurisdiction for financial statements, ledger postings, multi-currency reporting, and statutory tax compliance under {getCountryJurisdiction(form.countryCode).name} rules.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <ErpDrawerFooter
          onCancel={() => setMode("closed")}
          onSave={() => void save()}
          saving={createCompanyMutation.isPending || updateCompanyMutation.isPending}
          isEdit={mode === "edit"}
        />
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title="Companies & Legal Entities"
        subtitle="Manage the complete registry of corporate entities, legal names, GSTIN, and multi-branch configurations."
        categoryTag="Organization Structure"
        icon="building"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search company name, code, email, city…"
        filterOptions={[
          {
            key: "status",
            label: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "active" },
              { label: "Inactive Only", value: "inactive" },
            ],
          },
          {
            key: "industry",
            label: "All Industries",
            value: industryFilter,
            onChange: setIndustryFilter,
            options: [
              { label: "All Industries", value: "all" },
              ...industries.map((i) => ({ label: i, value: i })),
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
          setIndustryFilter("all");
        }}
        primaryActionLabel="Add Company"
        onPrimaryAction={openCreate}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        listKey="platform-companies"
        listRows={filtered}
        getRowId={(row) => row.id}
        emptyMessage="No companies found. Add your first legal entity to get started."
        listColumns={[
          { key: "name", label: "Company", dataType: "string" },
          { key: "code", label: "Code" },
          { key: "contact", label: "Contact" },
          { key: "location", label: "Location" },
          { key: "industry", label: "Industry" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions", locked: true },
        ]}
        renderListRow={(company) => (
          <tr key={company.id} className="erp-tr">
            <td className="erp-td">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{company.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{company.legalName || company.code || "—"}</div>
                </div>
              </div>
            </td>
            <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-300">{company.code || "—"}</td>
            <td className="erp-td">
              <div className="space-y-0.5">
                {company.email && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {company.email}
                  </div>
                )}
                {company.phoneNumber && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {company.phoneNumber}
                  </div>
                )}
                {!company.email && !company.phoneNumber && <span className="text-xs text-slate-400">—</span>}
              </div>
            </td>
            <td className="erp-td">
              {company.city || company.state ? (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {[company.city, company.state].filter(Boolean).join(", ")}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="erp-td">
              {company.industry ? (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                  {company.industry}
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="erp-td">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
                  company.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                    : "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                )}
              >
                {company.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                onEdit={{ label: "Edit Company", onClick: () => openEdit(company) }}
                onDelete={{ label: "Delete Company", onClick: () => setDeleteId(company.id) }}
              />
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={mode === "edit" ? `Edit: ${editing?.name}` : "Register New Company"}
        inspectorSubTitle="Fill details across Basic Info, Address, and Compliance tabs"
        inspectorContent={drawerForm}
      >
        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
            {getApiErrorMessage(error, "Failed to load companies.")}
          </div>
        )}
      </AdministrationGlobalPageShell>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Company"
        entityName={companies.find((c) => c.id === deleteId)?.name}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteCompanyMutation.mutateAsync(deleteId);
            notifySuccess("Company deleted.");
            await refetch();
          } catch (err) {
            notifyError(getApiErrorMessage(err, "Failed to delete company."));
          } finally {
            setDeleteId(null);
          }
        }}
        loading={deleteCompanyMutation.isPending}
      />
    </>
  );
}

export default CompaniesManager;
