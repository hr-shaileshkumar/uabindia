"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Briefcase,
  Building2,
  CheckCircle2,
  Layers,
  MapPin,
  Tag,
  Shield,
  ArrowRight,
  ChevronRight,
  Info,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpTabBar, ErpTabPanel, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { platformApi } from "@/services/modules/administration";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ROUTES } from "@/constants/routes";

export interface CountryProfileRecord {
  countryCode: string;
  countryName: string;
  flag: string;
  defaultCurrency: string;
  currencySymbol: string;
  defaultTimezone: string;
  fiscalYearStartMonth: number;
  taxSystemName: string;
  taxIdLabel: string;
  nationalIdLabel: string;
  socialSecurityLabel: string;
  bankRoutingLabel: string;
  subdivisions: string[];
  standardPayrollDeductions: string[];
}

export interface IndustryManifestRecord {
  code: string;
  name: string;
  icon: string;
  description: string;
  extendedModules: string[];
  customEntityNames: string[];
}

type TabKey = "jurisdictions" | "industries" | "tenant-locale" | "org-masters";

export function MasterDataManager() {
  const [activeTab, setActiveTab] = useState<TabKey>("jurisdictions");
  const [countries, setCountries] = useState<CountryProfileRecord[]>([]);
  const [industries, setIndustries] = useState<IndustryManifestRecord[]>([]);
  const [activeIndustryCode, setActiveIndustryCode] = useState<string>("Generic");
  const [tenantLocale, setTenantLocale] = useState<{
    countryCode?: string;
    defaultCurrency?: string;
    defaultTimezone?: string;
    fiscalYearStartMonth?: number;
    industryExtension?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activatingCode, setActivatingCode] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryProfileRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [countriesRes, industriesRes, activeIndRes, tenantLocaleRes] = await Promise.allSettled([
        platformApi.localization.getCountries(),
        platformApi.industryExtensions.getSupported(),
        platformApi.industryExtensions.getActive(),
        platformApi.localization.getCurrentTenant(),
      ]);

      if (countriesRes.status === "fulfilled" && Array.isArray(countriesRes.value.data)) {
        setCountries(countriesRes.value.data);
      }
      if (industriesRes.status === "fulfilled" && Array.isArray(industriesRes.value.data)) {
        setIndustries(industriesRes.value.data);
      }
      if (activeIndRes.status === "fulfilled" && activeIndRes.value.data?.activeCode) {
        setActiveIndustryCode(activeIndRes.value.data.activeCode);
      }
      if (tenantLocaleRes.status === "fulfilled" && tenantLocaleRes.value.data) {
        setTenantLocale(tenantLocaleRes.value.data);
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load master data catalogs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSelectIndustry = async (code: string) => {
    try {
      setActivatingCode(code);
      const res = await platformApi.industryExtensions.select(code);
      setActiveIndustryCode(code);
      notifySuccess(res.data?.message || `Industry Pack '${code}' activated successfully.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to set active industry pack."));
    } finally {
      setActivatingCode(null);
    }
  };

  // Jurisdictions Table
  const jurisdictionsList = useErpListView({
    listKey: "platform-master-jurisdictions",
    rows: countries,
    loading,
    emptyMessage: "No supported country jurisdictions found.",
    getRowId: (row) => row.countryCode,
    columns: [
      { key: "countryName", label: "Country & Jurisdiction", dataType: "string" },
      { key: "defaultCurrency", label: "Currency", dataType: "string" },
      { key: "defaultTimezone", label: "Timezone", dataType: "string" },
      { key: "taxSystemName", label: "Tax Regime", dataType: "string" },
      { key: "taxIdLabel", label: "Tax / National ID", dataType: "string" },
      { key: "actions", label: "Actions", locked: true },
    ],
    renderRow: (c) => (
      <>
        <td className="erp-td">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label={c.countryName}>
              {c.flag || "🌐"}
            </span>
            <div>
              <span className="font-semibold text-xs text-slate-900">{c.countryName}</span>
              <span className="ml-1.5 font-mono text-[10px] text-slate-500 font-bold">{c.countryCode}</span>
            </div>
          </div>
        </td>
        <td className="erp-td">
          <span className="font-mono text-xs font-semibold text-slate-800">
            {c.currencySymbol} {c.defaultCurrency}
          </span>
        </td>
        <td className="erp-td font-mono text-xs text-slate-600">{c.defaultTimezone}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-info text-xs">{c.taxSystemName}</span>
        </td>
        <td className="erp-td text-xs text-slate-600">
          <div>{c.taxIdLabel}</div>
          <div className="text-[10px] text-slate-400">{c.nationalIdLabel}</div>
        </td>
        <td className="erp-td text-right">
          <button
            type="button"
            onClick={() => setSelectedCountry(c)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-slate-50"
          >
            Inspect Profile <ChevronRight className="h-3 w-3" />
          </button>
        </td>
      </>
    ),
  });

  const tabItems = [
    { key: "jurisdictions", label: "Regional Jurisdictions", count: countries.length },
    { key: "industries", label: "Industry Extension Packs", count: industries.length },
    { key: "tenant-locale", label: "Tenant Localization" },
    { key: "org-masters", label: "Org Master Catalogs" },
  ];

  return (
    <StandardPageLayout
      title="Master Data & Regional Localization"
      subtitle="Multi-country tax systems, regional jurisdictions, industry extension packs, and organization master registers."
      eyebrow="Administration / Governance"
      icon="database"
      meta={
        <HeaderSummary
          items={[
            { label: "Jurisdictions", value: countries.length, tone: "info" },
            { label: "Industry Packs", value: industries.length, tone: "success" },
            { label: "Active Pack", value: activeIndustryCode, tone: "warning" },
            { label: "Tenant Region", value: tenantLocale?.countryCode || "IND", tone: "info" },
          ]}
        />
      }
      actions={<ErpRefreshButton onClick={() => void loadData()} loading={loading} />}
    >
      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {/* Tab 1: Jurisdictions */}
      <ErpTabPanel hidden={activeTab !== "jurisdictions"}>
        <CrudCard>{jurisdictionsList.table}</CrudCard>
      </ErpTabPanel>

      {/* Tab 2: Industry Extension Packs */}
      <ErpTabPanel hidden={activeTab !== "industries"}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((pack) => {
            const isActive = pack.code.toLowerCase() === activeIndustryCode.toLowerCase();
            return (
              <div
                key={pack.code}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm">
                      {pack.name.charAt(0)}
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active Pack
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                        {pack.code}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{pack.name}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{pack.description}</p>
                  </div>

                  {pack.extendedModules?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Extended Modules
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {pack.extendedModules.map((mod) => (
                          <span key={mod} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {pack.customEntityNames?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Domain Entities
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-indigo-600">
                        {pack.customEntityNames.join(" · ")}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  {isActive ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Configured for Current Tenant
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={activatingCode === pack.code}
                      onClick={() => void handleSelectIndustry(pack.code)}
                      className="w-full rounded-xl border border-indigo-200 bg-white py-2 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      {activatingCode === pack.code ? "Activating..." : "Activate Industry Pack"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ErpTabPanel>

      {/* Tab 3: Tenant Localization */}
      <ErpTabPanel hidden={activeTab !== "tenant-locale"}>
        <CrudCard>
          <div className="space-y-6 p-6">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/20 p-5">
              <h3 className="text-sm font-bold text-slate-900">Current Tenant Localization Baseline</h3>
              <p className="mt-1 text-xs text-slate-500">
                Operating parameters automatically configured based on your primary legal company registration.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-500">Country Code</span>
                <p className="mt-1 text-xl font-bold text-slate-900">{tenantLocale?.countryCode || "IND"}</p>
                <p className="mt-0.5 text-slate-400">ISO 3166-1 alpha-3</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-500">Operating Currency</span>
                <p className="mt-1 text-xl font-bold text-indigo-600">{tenantLocale?.defaultCurrency || "INR"}</p>
                <p className="mt-0.5 text-slate-400">Default reporting currency</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-500">Timezone</span>
                <p className="mt-1 text-xl font-bold text-slate-900">{tenantLocale?.defaultTimezone || "Asia/Kolkata"}</p>
                <p className="mt-0.5 text-slate-400">Clock sync & shift rules</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-500">Fiscal Year Start</span>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  Month {tenantLocale?.fiscalYearStartMonth || 4} (April)
                </p>
                <p className="mt-0.5 text-slate-400">Financial closing calendar</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-blue-900">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Need to modify default tenant currency or timezone?</span>
                  <p className="mt-0.5 text-blue-700 leading-relaxed">
                    Tenant-wide locale defaults can be configured under{" "}
                    <Link href={ROUTES.PLATFORM_SETTINGS} className="font-bold underline hover:text-blue-900">
                      Organization Settings
                    </Link>
                    . Individual company entity branches maintain their own GSTIN/Tax ID overrides.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CrudCard>
      </ErpTabPanel>

      {/* Tab 4: Org Master Catalogs */}
      <ErpTabPanel hidden={activeTab !== "org-masters"}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: ROUTES.PLATFORM_COMPANIES,
              label: "Companies & Legal Entities",
              desc: "Corporate entities, GSTIN profiles, pan-India branch networks, and banking details.",
              icon: Building2,
              color: "text-blue-600",
            },
            {
              href: ROUTES.PLATFORM_DEPARTMENTS,
              label: "Department Hierarchy",
              desc: "Functional divisions, cost allocation codes, and reporting managerial lines.",
              icon: Layers,
              color: "text-teal-600",
            },
            {
              href: ROUTES.PLATFORM_DESIGNATIONS,
              label: "Designations & Pay Bands",
              desc: "Standard job titles, grade hierarchies, and compensation levels.",
              icon: Tag,
              color: "text-amber-600",
            },
            {
              href: ROUTES.PLATFORM_BRANCHES,
              label: "Branches & Warehouses",
              desc: "Physical offices, delivery centers, manufacturing plants, and stock depots.",
              icon: MapPin,
              color: "text-indigo-600",
            },
            {
              href: ROUTES.PLATFORM_COST_CENTERS,
              label: "Cost Centers & GL Mapping",
              desc: "Financial cost centers for payroll allocation and general ledger budgeting.",
              icon: Briefcase,
              color: "text-rose-600",
            },
            {
              href: ROUTES.PLATFORM_BUSINESS_UNITS,
              label: "Business Units",
              desc: "Strategic operating business units grouping related lines of business.",
              icon: Globe,
              color: "text-purple-600",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-indigo-600">
                <span>Manage Registry</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </ErpTabPanel>

      {/* Country Profile Inspector Drawer */}
      <SideDrawer
        open={Boolean(selectedCountry)}
        onClose={() => setSelectedCountry(null)}
        title={selectedCountry ? `${selectedCountry.flag} ${selectedCountry.countryName} Jurisdiction Profile` : ""}
        subtitle={`ISO Alpha-3: ${selectedCountry?.countryCode}`}
      >
        {selectedCountry && (
          <div className="space-y-5 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Default Currency:</span>
                <span className="font-bold text-slate-900">
                  {selectedCountry.currencySymbol} {selectedCountry.defaultCurrency}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Standard Timezone:</span>
                <span className="font-mono text-slate-900">{selectedCountry.defaultTimezone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Tax Framework:</span>
                <span className="font-semibold text-indigo-700">{selectedCountry.taxSystemName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Tax ID Label:</span>
                <span className="font-bold text-slate-900">{selectedCountry.taxIdLabel}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">National Identity:</span>
                <span className="font-bold text-slate-900">{selectedCountry.nationalIdLabel}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Social Security / Pension:</span>
                <span className="font-bold text-slate-900">{selectedCountry.socialSecurityLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Bank Routing Format:</span>
                <span className="font-bold text-slate-900">{selectedCountry.bankRoutingLabel}</span>
              </div>
            </div>

            {selectedCountry.standardPayrollDeductions?.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Standard Statutory Deductions
                </span>
                <div className="mt-2 space-y-1.5">
                  {selectedCountry.standardPayrollDeductions.map((ded) => (
                    <div key={ded} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-medium text-slate-800">{ded}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCountry.subdivisions?.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  States / Subdivisions ({selectedCountry.subdivisions.length})
                </span>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2 text-[11px] text-slate-600 leading-relaxed bg-slate-50">
                  {selectedCountry.subdivisions.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </StandardPageLayout>
  );
}
