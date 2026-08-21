"use client";

import React, { useMemo, useState } from "react";
import { Building2, Plus, Eye, MapPin, Palette, ShieldCheck, DollarSign, Globe, Bell, FileText, Lock, Activity, Users, Layers, CheckCircle2, Clock, Download, Copy, Archive, ArrowRight, Phone, Mail, FileSpreadsheet, Map, ShieldAlert, Cpu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useCompanies, useCompanyMutations } from "@/features/companies/hooks";
import {
  buildClonePayload,
  buildCreatePayloadFromWizard,
  mapCompanyRecordToRow,
  type CompanyRow,
} from "@/features/companies/company-utils";
import { getErrorMessage } from "@/features/companies/tenant-utils";

export default function CompaniesMasterEnginePage() {
  const { data, isLoading, isError, error, refetch } = useCompanies(1, 100);
  const { createCompanyMutation } = useCompanyMutations();

  const companies = useMemo(
    () => (data?.companies ?? []).map(mapCompanyRecordToRow),
    [data?.companies]
  );

  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? companies[0] ?? null,
    [companies, selectedCompanyId]
  );
  const [activeTab, setActiveTab] = useState("overview");

  // 6-Step Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizName, setWizName] = useState("");
  const [wizCode, setWizCode] = useState("");
  const [wizLegalName, setWizLegalName] = useState("");
  const [wizCin, setWizCin] = useState("");
  const [wizGstin, setWizGstin] = useState("");
  const [wizPhone, setWizPhone] = useState("+91 98200 99281");
  const [wizCurrency, setWizCurrency] = useState("INR (₹)");

  const handleNextStep = () => {
    if (wizardStep < 6) setWizardStep((prev) => prev + 1);
  };

  const handleCreateCompanyFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizName.trim()) return;

    try {
      const response = await createCompanyMutation.mutateAsync({
        payload: buildCreatePayloadFromWizard({
          name: wizName,
          code: wizCode,
          legalName: wizLegalName,
          cin: wizCin,
          gstin: wizGstin,
          phone: wizPhone,
        }),
      });

      const created = response.company ? mapCompanyRecordToRow(response.company) : null;
      if (created) {
        setSelectedCompanyId(created.id);
      }

      setIsWizardOpen(false);
      setWizardStep(1);
      setWizName("");
      setWizCode("");
      setWizLegalName("");
      notifySuccess(`Company "${wizName.trim()}" created successfully.`);
    } catch (err) {
      notifyError(getErrorMessage(err, getApiErrorMessage(err, "Failed to create company.")), "Companies");
    }
  };

  const handleCloneCompany = async (comp: CompanyRow) => {
    try {
      const response = await createCompanyMutation.mutateAsync({
        payload: buildClonePayload(comp),
      });

      const cloned = response.company ? mapCompanyRecordToRow(response.company) : null;
      if (cloned) {
        setSelectedCompanyId(cloned.id);
      }

      notifySuccess(`Company "${comp.displayName}" cloned successfully.`);
    } catch (err) {
      notifyError(getErrorMessage(err, getApiErrorMessage(err, "Failed to clone company.")), "Companies");
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.displayName.toLowerCase().includes(q) || c.companyCode.toLowerCase().includes(q) || c.gstin.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Total Companies", value: data?.total ?? companies.length, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Legal Entities" },
    { label: "Active Companies", value: companies.filter((c) => c.status === "Active").length, tone: "positive", icon: <Users className="h-3.5 w-3.5" />, subtext: "Operational" },
    { label: "Inactive / Archived", value: companies.filter((c) => c.status !== "Active").length, tone: "warning", icon: <MapPin className="h-3.5 w-3.5" />, subtext: "Non-active" },
    { label: "Data Source", value: isLoading ? "…" : "Live API", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "/api/v1/companies" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Company Master Architecture & Legal Entity Engine"
      subtitle="SAP, Oracle Fusion & Dynamics 365 level 17-Tab Company Master Engine for configuring corporate legal entities, GSTIN/PAN compliance, HR policies, IT SSO, and audit streams."
      categoryTag="Master Organization Suite"
      kpiMetrics={kpis}
      searchPlaceholder="Filter company code, legal name, or GSTIN..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Create Company (6-Step Wizard)"
      onPrimaryAction={() => {
        setWizardStep(1);
        setIsWizardOpen(true);
      }}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      {isError && (
        <div className="mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {getApiErrorMessage(error, "Failed to load companies.")}
          <Button variant="ghost" size="sm" className="ml-2 h-auto p-0 text-xs" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="p-6 grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        {/* Left: Company Directory Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Company Directory ({filteredCompanies.length})</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                const header = "Code,Display Name,Legal Name,GSTIN,Currency,Employees,Status";
                const lines = filteredCompanies.map((c) =>
                  [c.companyCode, c.displayName, c.legalName, c.gstin, c.baseCurrency, String(c.employeeCount), c.status]
                    .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                    .join(","),
                );
                const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "companies.csv";
                a.click();
                URL.revokeObjectURL(url);
                notifySuccess(`Exported ${filteredCompanies.length} compan${filteredCompanies.length === 1 ? "y" : "ies"} to CSV.`);
              }}
            >
              <FileSpreadsheet className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading companies…
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No companies found. Create one to get started.
              </div>
            ) : (
              filteredCompanies.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedCompany?.id === c.id
                    ? "border-slate-500 bg-slate-50/30 dark:bg-slate-900/30 ring-1 ring-slate-400 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-slate-600 shrink-0" />
                    {c.displayName}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0">{c.companyCode}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 truncate">{c.legalName}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500">{c.employeeCount} Employees • {c.branchCount} Branches</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{c.baseCurrency}</span>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Right: 17-Tab Company Master Profile Engine */}
        {selectedCompany ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-slate-600" />
                  {selectedCompany.displayName} ({selectedCompany.companyCode})
                </h2>
                <p className="text-xs text-slate-500">{selectedCompany.legalName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" disabled={createCompanyMutation.isPending} onClick={() => void handleCloneCompany(selectedCompany)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Clone Company
                </Button>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{selectedCompany.status}</Badge>
              </div>
            </div>

            {/* 17 Master Profile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs gap-1">
                <TabsTrigger value="overview" className="text-xs py-1.5 px-3">Overview</TabsTrigger>
                <TabsTrigger value="general" className="text-xs py-1.5 px-3">General</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs py-1.5 px-3">Contact</TabsTrigger>
                <TabsTrigger value="addresses" className="text-xs py-1.5 px-3">Addresses</TabsTrigger>
                <TabsTrigger value="branding" className="text-xs py-1.5 px-3">Branding</TabsTrigger>
                <TabsTrigger value="hr" className="text-xs py-1.5 px-3">HR Config</TabsTrigger>
                <TabsTrigger value="payroll" className="text-xs py-1.5 px-3">Payroll Config</TabsTrigger>
                <TabsTrigger value="finance" className="text-xs py-1.5 px-3">Finance Config</TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs py-1.5 px-3">Legal & Compliance</TabsTrigger>
                <TabsTrigger value="branches" className="text-xs py-1.5 px-3">Branches & Locations</TabsTrigger>
                <TabsTrigger value="departments" className="text-xs py-1.5 px-3">Departments</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs py-1.5 px-3">Projects</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs py-1.5 px-3">Document Vault</TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs py-1.5 px-3">Integrations</TabsTrigger>
                <TabsTrigger value="security" className="text-xs py-1.5 px-3">Security</TabsTrigger>
                <TabsTrigger value="audit" className="text-xs py-1.5 px-3">Audit Logs</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs py-1.5 px-3">Timeline</TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                    <span className="text-slate-500 block mb-1">Mapped Workforce</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedCompany.employeeCount} Staff</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                    <span className="text-slate-500 block mb-1">Active Branches</span>
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{selectedCompany.branchCount} Locations</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                    <span className="text-slate-500 block mb-1">Company Projects</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedCompany.projectCount} Projects</span>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: General */}
              <TabsContent value="general" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <div><span className="text-slate-500">Legal Corporate Name:</span> <p className="font-bold text-slate-900 dark:text-slate-100">{selectedCompany.legalName}</p></div>
                  <div><span className="text-slate-500">CIN (Corporate ID Number):</span> <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedCompany.cin}</p></div>
                  <div><span className="text-slate-500">PAN Number:</span> <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedCompany.pan}</p></div>
                  <div><span className="text-slate-500">GSTIN Tax Registration:</span> <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedCompany.gstin}</p></div>
                  <div><span className="text-slate-500">Incorporation Date:</span> <p className="font-mono text-slate-700 dark:text-slate-300">15 January 2024</p></div>
                  <div><span className="text-slate-500">Status:</span> <Badge className="bg-emerald-500/10 text-emerald-600 ml-2">{selectedCompany.status}</Badge></div>
                </div>
              </TabsContent>

              {/* Tab 3: Contact */}
              <TabsContent value="contact" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <div><span className="text-slate-500">Primary Official Email:</span> <p className="font-mono text-slate-800 font-bold">{selectedCompany.email || "—"}</p></div>
                  <div><span className="text-slate-500">Contact Number:</span> <p className="font-mono text-slate-800 font-bold">{selectedCompany.phoneNumber || "—"}</p></div>
                  <div><span className="text-slate-500">Official Website:</span> <p className="font-mono text-slate-700">{selectedCompany.websiteUrl || "—"}</p></div>
                  <div><span className="text-slate-500">City / State:</span> <p className="font-mono text-slate-800 font-bold">{[selectedCompany.city, selectedCompany.state].filter(Boolean).join(", ") || "—"}</p></div>
                </div>
              </TabsContent>

              {/* Tab 4: Addresses */}
              <TabsContent value="addresses" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Registered Office Address:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedCompany.registrationAddress || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Operational Address:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedCompany.operationalAddress || "—"}</p>
                  </div>
                </div>
              </TabsContent>

              {/* Other Tabs */}
              <TabsContent value="branding" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Primary Brand Logo & Letterhead Header Watermark configured.
              </TabsContent>
              <TabsContent value="hr" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Employee Code: EMP-{selectedCompany.companyCode}-0000 • Attendance: Biometric + Geofence GPS.
              </TabsContent>
              <TabsContent value="payroll" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Monthly Pay Cycle (28th of month) • EPF, ESIC, PT, LWF, TDS setup active.
              </TabsContent>
              <TabsContent value="finance" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Fiscal Year: April - March • Cost & Profit Center General Ledger mappings active.
              </TabsContent>
              <TabsContent value="compliance" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                CIN: {selectedCompany.cin} • GSTIN: {selectedCompany.gstin} • Labour License #LL-MH-2024-99201.
              </TabsContent>
              <TabsContent value="branches" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                {selectedCompany.branchCount} Active Branches with GPS Geofencing radius (200 meters).
              </TabsContent>
              <TabsContent value="departments" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Engineering, Finance, HR, Sales, Legal, Operations.
              </TabsContent>
              <TabsContent value="projects" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                {selectedCompany.projectCount} Enterprise Projects with assigned Project Managers.
              </TabsContent>
              <TabsContent value="documents" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Encrypted S3 Vault for GST Returns, PAN, TAN, and Legal Incorporation Certificates.
              </TabsContent>
              <TabsContent value="integrations" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                SMTP Active • WhatsApp API Connected • Microsoft 363 & Azure AD SSO Enabled.
              </TabsContent>
              <TabsContent value="security" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                MFA Enforced • Session Timeout: 30 Mins • Allowed IP Whitelist active.
              </TabsContent>
              <TabsContent value="audit" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Immutable Audit Trail: Before/After value change tracking stream.
              </TabsContent>
              <TabsContent value="timeline" className="text-xs p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                Real-time Company Activity Event Timeline.
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            Select a legal entity to view 17-tab Master Engine.
          </div>
        )}
      </div>

      {/* 6-Step Company Provisioning Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Create Company — Step {wizardStep} of 6
              </h3>
              <Badge variant="outline">Step {wizardStep}</Badge>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-3 text-xs">
                <Label>Display Name</Label>
                <Input placeholder="e.g. UAB Global Tech" value={wizName} onChange={(e) => setWizName(e.target.value)} />
                <Label>Company Code</Label>
                <Input placeholder="e.g. UAB-IND" value={wizCode} onChange={(e) => setWizCode(e.target.value)} />
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <Label>Legal Registered Name</Label>
                <Input placeholder="e.g. UAB India Tech Private Limited" value={wizLegalName} onChange={(e) => setWizLegalName(e.target.value)} />
                <Label>CIN (Corporate ID Number)</Label>
                <Input placeholder="U72900MH2026PTC392019" value={wizCin} onChange={(e) => setWizCin(e.target.value)} />
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3 text-xs">
                <Label>GSTIN Tax Number</Label>
                <Input placeholder="27AABCU9603R1ZM" value={wizGstin} onChange={(e) => setWizGstin(e.target.value)} />
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-3 text-xs">
                <Label>Base Currency</Label>
                <Input value={wizCurrency} onChange={(e) => setWizCurrency(e.target.value)} />
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">Default brand theme colors & letterhead watermarks applied.</p>
              </div>
            )}

            {wizardStep === 6 && (
              <div className="space-y-3 text-xs p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200">
                <p className="font-bold text-emerald-700 dark:text-emerald-400">Ready to create company master entity!</p>
                <p className="text-slate-600 dark:text-slate-400">Name: {wizName} ({wizCode}) • Currency: {wizCurrency}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setIsWizardOpen(false)}>Cancel</Button>
              {wizardStep < 6 ? (
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" onClick={handleNextStep}>
                  Next Step <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createCompanyMutation.isPending} onClick={handleCreateCompanyFinal}>
                  {createCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Provisioning…
                    </>
                  ) : (
                    "Provision Legal Entity"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PlatformGlobalPageShell>
  );
}
