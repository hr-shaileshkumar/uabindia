"use client";

import React, { useState } from "react";
import { Building2, Plus, Eye, MapPin, Palette, ShieldCheck, DollarSign, Globe, Bell, FileText, Lock, Activity, Users, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface CompanyRow {
  id: string;
  companyCode: string;
  legalName: string;
  displayName: string;
  cin?: string;
  pan?: string;
  gstin?: string;
  baseCurrency: string;
  status: "Active" | "Inactive";
}

const SEED_COMPANIES: CompanyRow[] = [
  { id: "comp_1", companyCode: "UAB-IND", legalName: "UAB India Technologies Private Limited", displayName: "UAB India Tech", cin: "U72900MH2024PTC392019", pan: "AABCU9603R", gstin: "27AABCU9603R1ZM", baseCurrency: "INR (₹)", status: "Active" },
  { id: "comp_2", companyCode: "UAB-GLOBAL", legalName: "UAB Global SaaS Holdings LLC", displayName: "UAB Global SaaS", cin: "LLC-992019280", pan: "FBCU10294K", gstin: "99FBCU10294K1Z0", baseCurrency: "USD ($)", status: "Active" },
];

export default function CompaniesMasterPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>(SEED_COMPANIES);
  const [search, setSearch] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(SEED_COMPANIES[0]);
  const [activeTab, setActiveTab] = useState("general");

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR (₹)");

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newComp: CompanyRow = {
      id: `comp_${Date.now()}`,
      companyCode: code.trim().toUpperCase() || `COMP-0${companies.length + 1}`,
      legalName: `${name.trim()} Private Limited`,
      displayName: name.trim(),
      cin: "U72900MH2026PTC000000",
      pan: "AABCU9603R",
      gstin: "27AABCU9603R1ZM",
      baseCurrency: currency,
      status: "Active",
    };

    setCompanies((prev) => [newComp, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setCode("");
    notifySuccess(`Company Master "${newComp.displayName}" created.`);
  };

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.displayName.toLowerCase().includes(q) || c.companyCode.toLowerCase().includes(q) || (c.gstin && c.gstin.toLowerCase().includes(q));
  });

  const kpis: KpiMetricItem[] = [
    { label: "Registered Companies", value: companies.length, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Legal Entities" },
    { label: "Active Operations", value: companies.filter((c) => c.status === "Active").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Multi-Company" },
    { label: "Base Currencies", value: new Set(companies.map((c) => c.baseCurrency)).size, tone: "warning", icon: <DollarSign className="h-3.5 w-3.5" />, subtext: "Multi-Currency" },
    { label: "GSTIN Tax Registration", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Verified" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Company Master & Multi-Legal Entity Architecture"
      subtitle="12-Tab Master Configuration Engine for corporate legal entities, GSTIN/PAN tax registrations, branding, HR policies, IT SSO, and localization."
      categoryTag="Master Organization Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter company code, legal name, or GSTIN..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Legal Entity"
      onPrimaryAction={() => {
        setSelectedCompany(null);
        setIsDrawerOpen(true);
      }}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="p-6 grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
        {/* Left: Company List Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Corporate Legal Entities ({filteredCompanies.length})</span>
          </h3>

          <div className="space-y-2">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCompany(c)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedCompany?.id === c.id
                    ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    {c.displayName}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">{c.companyCode}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 truncate">{c.legalName}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500">GSTIN: {c.gstin || "-"}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.baseCurrency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 12-Tab Master Profile Engine */}
        {selectedCompany ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  {selectedCompany.displayName} ({selectedCompany.companyCode})
                </h2>
                <p className="text-xs text-slate-500">{selectedCompany.legalName}</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{selectedCompany.status}</Badge>
            </div>

            {/* 12 Master Profile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs gap-1">
                <TabsTrigger value="general" className="text-xs py-1.5 px-3">General & Tax IDs</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs py-1.5 px-3">Addresses</TabsTrigger>
                <TabsTrigger value="branding" className="text-xs py-1.5 px-3">Branding</TabsTrigger>
                <TabsTrigger value="hr" className="text-xs py-1.5 px-3">HR Policies</TabsTrigger>
                <TabsTrigger value="payroll" className="text-xs py-1.5 px-3">Payroll & Tax</TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs py-1.5 px-3">Compliance</TabsTrigger>
                <TabsTrigger value="financial" className="text-xs py-1.5 px-3">Financial Ledger</TabsTrigger>
                <TabsTrigger value="it" className="text-xs py-1.5 px-3">IT & SSO</TabsTrigger>
                <TabsTrigger value="localization" className="text-xs py-1.5 px-3">Localization</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs py-1.5 px-3">Notifications</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs py-1.5 px-3">Documents</TabsTrigger>
                <TabsTrigger value="security" className="text-xs py-1.5 px-3">Security & Audit</TabsTrigger>
              </TabsList>

              {/* Tab 1: General & Tax IDs */}
              <TabsContent value="general" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <div><span className="text-slate-500">Corporate Name:</span> <p className="font-bold text-slate-900 dark:text-slate-100">{selectedCompany.legalName}</p></div>
                  <div><span className="text-slate-500">CIN (Corporate Identification Number):</span> <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedCompany.cin || "U72900MH2024PTC392019"}</p></div>
                  <div><span className="text-slate-500">PAN Number:</span> <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedCompany.pan || "AABCU9603R"}</p></div>
                  <div><span className="text-slate-500">GSTIN Registration:</span> <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedCompany.gstin || "27AABCU9603R1ZM"}</p></div>
                  <div><span className="text-slate-500">MSME Registration:</span> <p className="font-semibold text-slate-800 dark:text-slate-200">MSME-MH-01-009281</p></div>
                  <div><span className="text-slate-500">Establishment Date:</span> <p className="font-mono text-slate-700 dark:text-slate-300">15 March 2024</p></div>
                </div>
              </TabsContent>

              {/* Tab 2: Addresses */}
              <TabsContent value="contact" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Registered Office Address:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">Unit 802, Supreme Business Park, Hiranandani Gardens, Powai, Mumbai - 400076, Maharashtra, India</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Corporate Headquarters:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">Level 14, World Trade Center, Brigade Gateway, Malleshwaram, Bengaluru - 560055, Karnataka, India</p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Branding */}
              <TabsContent value="branding" className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                      UAB
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Primary Brand Logo</p>
                      <p className="text-slate-500">SVG / PNG transparent letterhead logo (400x120px)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: HR Policies */}
              <TabsContent value="hr" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <div><span className="text-slate-500">Employee Code Format:</span> <p className="font-mono font-bold text-indigo-600">EMP-{selectedCompany.companyCode}-0000</p></div>
                  <div><span className="text-slate-500">Standard Working Hours:</span> <p className="font-semibold text-slate-800">09:00 AM - 06:00 PM (9 Hours)</p></div>
                  <div><span className="text-slate-500">Probation Duration:</span> <p className="font-semibold text-slate-800">6 Months</p></div>
                  <div><span className="text-slate-500">Notice Period:</span> <p className="font-semibold text-slate-800">60 Days</p></div>
                </div>
              </TabsContent>

              {/* Tab 5: Payroll & Statutory Setup */}
              <TabsContent value="payroll" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <div><span className="text-slate-500">EPF Code Number:</span> <p className="font-mono font-bold text-emerald-600">MH/BAN/0092810/000</p></div>
                  <div><span className="text-slate-500">ESIC Registration Code:</span> <p className="font-mono font-bold text-indigo-600">31000928100001001</p></div>
                  <div><span className="text-slate-500">Professional Tax (PT Rate):</span> <p className="font-semibold text-slate-800">MH State Slabs (Max ₹2,500/yr)</p></div>
                  <div><span className="text-slate-500">TDS Circle (TAN):</span> <p className="font-mono font-bold text-amber-600">MUMU09281F</p></div>
                </div>
              </TabsContent>

              {/* Other Tabs */}
              <TabsContent value="compliance" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Labour License Registration #LL-MH-2024-99201 • ISO 27001:2022 Certified.
              </TabsContent>
              <TabsContent value="financial" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Fiscal Year: 01 April - 31 March • Base Currency: {selectedCompany.baseCurrency}
              </TabsContent>
              <TabsContent value="it" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Azure AD SSO Enabled • Email Domain: @{selectedCompany.displayName.toLowerCase().replace(/\s+/g, "")}.com
              </TabsContent>
              <TabsContent value="localization" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Timezone: Asia/Kolkata (IST +05:30) • Date Format: DD/MM/YYYY
              </TabsContent>
              <TabsContent value="notifications" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                SMTP Active (smtp.sendgrid.net:587) • WhatsApp API Connected.
              </TabsContent>
              <TabsContent value="documents" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                Registration Certificates & Tax Return Archives uploaded to encrypted S3 Vault.
              </TabsContent>
              <TabsContent value="security" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                MFA Enforced for all Company Admins • Audit Trail: Immutable Log Stream.
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            Select a legal entity to configure master company profile.
          </div>
        )}
      </div>
    </PlatformGlobalPageShell>
  );
}
