"use client";

import React, { useState } from "react";
import { Building2, Plus, Eye, MapPin, Palette, ShieldCheck, DollarSign, Globe, Bell, FileText, Lock, Activity, Users, Layers, CheckCircle2, Clock, Download, Copy, Archive, ArrowRight, Phone, Mail, FileSpreadsheet, Map, ShieldAlert, Cpu } from "lucide-react";
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
  cin: string;
  pan: string;
  gstin: string;
  baseCurrency: string;
  employeeCount: number;
  branchCount: number;
  projectCount: number;
  status: "Active" | "Inactive" | "Archived";
  createdAt: string;
}

const SEED_COMPANIES: CompanyRow[] = [
  { id: "comp_1", companyCode: "UAB-IND", legalName: "UAB India Technologies Private Limited", displayName: "UAB India Tech", cin: "U72900MH2024PTC392019", pan: "AABCU9603R", gstin: "27AABCU9603R1ZM", baseCurrency: "INR (₹)", employeeCount: 1420, branchCount: 6, projectCount: 24, status: "Active", createdAt: "2024-01-15" },
  { id: "comp_2", companyCode: "UAB-GLOBAL", legalName: "UAB Global SaaS Holdings LLC", displayName: "UAB Global SaaS", cin: "LLC-992019280", pan: "FBCU10294K", gstin: "99FBCU10294K1Z0", baseCurrency: "USD ($)", employeeCount: 380, branchCount: 2, projectCount: 8, status: "Active", createdAt: "2024-03-20" },
];

export default function CompaniesMasterEnginePage() {
  const [companies, setCompanies] = useState<CompanyRow[]>(SEED_COMPANIES);
  const [search, setSearch] = useState("");

  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(SEED_COMPANIES[0]);
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

  const handleCreateCompanyFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizName.trim()) return;

    const newComp: CompanyRow = {
      id: `comp_${Date.now()}`,
      companyCode: wizCode.trim().toUpperCase() || `COMP-0${companies.length + 1}`,
      legalName: wizLegalName.trim() || `${wizName.trim()} Private Limited`,
      displayName: wizName.trim(),
      cin: wizCin.trim() || "U72900MH2026PTC000000",
      pan: "AABCU9603R",
      gstin: wizGstin.trim() || "27AABCU9603R1ZM",
      baseCurrency: wizCurrency,
      employeeCount: 1,
      branchCount: 1,
      projectCount: 0,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCompanies((prev) => [newComp, ...prev]);
    setSelectedCompany(newComp);
    setIsWizardOpen(false);
    setWizardStep(1);
    setWizName("");
    setWizCode("");
    setWizLegalName("");
    notifySuccess(`Company Legal Entity "${newComp.displayName}" created with full Master Architecture.`);
  };

  const handleCloneCompany = (comp: CompanyRow) => {
    const cloned: CompanyRow = {
      ...comp,
      id: `comp_${Date.now()}`,
      companyCode: `${comp.companyCode}-COPY`,
      displayName: `${comp.displayName} (Copy)`,
      legalName: `${comp.legalName} (Copy)`,
    };
    setCompanies((prev) => [cloned, ...prev]);
    setSelectedCompany(cloned);
    notifySuccess(`Company Master "${comp.displayName}" cloned successfully.`);
  };

  const filteredCompanies = companies.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.displayName.toLowerCase().includes(q) || c.companyCode.toLowerCase().includes(q) || c.gstin.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Total Companies", value: companies.length, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Legal Entities" },
    { label: "Total Employees Mapped", value: companies.reduce((acc, c) => acc + c.employeeCount, 0), tone: "positive", icon: <Users className="h-3.5 w-3.5" />, subtext: "Staff Members" },
    { label: "Active Branches", value: companies.reduce((acc, c) => acc + c.branchCount, 0), tone: "warning", icon: <MapPin className="h-3.5 w-3.5" />, subtext: "Office Locations" },
    { label: "Statutory Compliance", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "GSTIN/PAN/PF" },
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
      <div className="p-6 grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        {/* Left: Company Directory Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Company Directory ({filteredCompanies.length})</h3>
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => notifySuccess("Exporting directory to Excel...")}>
              <FileSpreadsheet className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>

          <div className="space-y-2">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCompany(c)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedCompany?.id === c.id
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 ring-1 ring-indigo-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    {c.displayName}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0">{c.companyCode}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 truncate">{c.legalName}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500">{c.employeeCount} Employees • {c.branchCount} Branches</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.baseCurrency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 17-Tab Company Master Profile Engine */}
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
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCloneCompany(selectedCompany)}>
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
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedCompany.branchCount} Locations</span>
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
                  <div><span className="text-slate-500">CIN (Corporate ID Number):</span> <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedCompany.cin}</p></div>
                  <div><span className="text-slate-500">PAN Number:</span> <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedCompany.pan}</p></div>
                  <div><span className="text-slate-500">GSTIN Tax Registration:</span> <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedCompany.gstin}</p></div>
                  <div><span className="text-slate-500">Incorporation Date:</span> <p className="font-mono text-slate-700 dark:text-slate-300">15 January 2024</p></div>
                  <div><span className="text-slate-500">Status:</span> <Badge className="bg-emerald-500/10 text-emerald-600 ml-2">{selectedCompany.status}</Badge></div>
                </div>
              </TabsContent>

              {/* Tab 3: Contact */}
              <TabsContent value="contact" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <div><span className="text-slate-500">Primary Official Email:</span> <p className="font-mono text-indigo-600 font-bold">contact@{selectedCompany.displayName.toLowerCase().replace(/\s+/g, "")}.com</p></div>
                  <div><span className="text-slate-500">Contact Number:</span> <p className="font-mono text-slate-800 font-bold">+91 22 4920 0000</p></div>
                  <div><span className="text-slate-500">Official Website:</span> <p className="font-mono text-indigo-600">https://www.{selectedCompany.displayName.toLowerCase().replace(/\s+/g, "")}.com</p></div>
                  <div><span className="text-slate-500">Emergency Desk Phone:</span> <p className="font-mono text-rose-600 font-bold">+91 98200 99281</p></div>
                </div>
              </TabsContent>

              {/* Tab 4: Addresses */}
              <TabsContent value="addresses" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
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
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleNextStep}>
                  Next Step <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateCompanyFinal}>
                  Provision Legal Entity
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PlatformGlobalPageShell>
  );
}
