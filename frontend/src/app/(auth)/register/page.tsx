"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Mail,
  PartyPopper,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import apiClient, { setClientAuthToken } from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { publicSiteUrl } from "@/lib/public-marketing";
import { getPublicBaseDomain } from "@/lib/public-site-url";
import { cn } from "@/lib/utils";

const trialFeatures = [
  "Full access to Finance, HRMS, Payroll & Inventory modules",
  "Statutory Indian GST filing (GSTR-1, 3B) & NIC E-Invoicing",
  "Automated double-entry general ledger & trial balance",
  "Dedicated tenant database isolation & custom subdomain",
  "Multi-user role access with audit trail logs",
  "Zero credit card required — 14 days 100% free",
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audience = "platform";
  const shell = usePublicPageData("register", audience);

  const [step, setStep] = useState<1 | 2>(1);

  interface WorkspaceSuccessData {
    companyName: string;
    subdomain: string;
    parentDomain: string;
    fullWorkspaceUrl: string;
    adminName: string;
    adminEmail: string;
  }

  const [successData, setSuccessData] = useState<WorkspaceSuccessData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [industry, setIndustry] = useState("Technology & Services");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Subdomain validation state
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainMessage, setSubdomainMessage] = useState("");

  // Submission state
  const [loading, setLoading] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState("");

  // Auto-generate subdomain from company name
  const handleCompanyNameChange = (name: string) => {
    setCompanyName(name);
    if (!subdomain || subdomain === "") {
      const generated = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      setSubdomain(generated);
    }
  };

  // Debounced subdomain availability check
  useEffect(() => {
    if (!subdomain || subdomain.trim().length < 3) {
      setSubdomainAvailable(null);
      setSubdomainMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingSubdomain(true);
        const res = await apiClient.get<{ available: boolean; message?: string }>(
          `/public/check-subdomain?subdomain=${encodeURIComponent(subdomain.trim())}`
        );
        setSubdomainAvailable(res.data.available);
        setSubdomainMessage(
          res.data.available ? "Subdomain is available!" : res.data.message || "Subdomain is already taken."
        );
      } catch {
        setSubdomainAvailable(null);
      } finally {
        setCheckingSubdomain(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notifyError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      notifyError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setProvisionProgress("Creating your isolated cloud workspace...");

      const res = await apiClient.post<{
        success: boolean;
        token: string;
        tenant: { id: string; name: string; subdomain: string };
        user: { id: string; email: string; fullName: string };
      }>("/public/register-tenant", {
        companyName: companyName.trim(),
        subdomain: subdomain.trim(),
        industry,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });

      if (res.data.token) {
        localStorage.setItem("uab_auth_token", res.data.token);
        localStorage.setItem("uab_current_tenant", res.data.tenant.subdomain);
        setClientAuthToken(res.data.token);
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        const sec = isSecure ? "; Secure" : "";
        document.cookie = `uab_auth_token=${res.data.token}; path=/; max-age=900; SameSite=Lax${sec}`;
        document.cookie = `uab_tenant_subdomain=${res.data.tenant.subdomain}; path=/; max-age=604800; SameSite=Lax${sec}`;
      }

      setProvisionProgress("Seeding default Indian Chart of Accounts and GST configuration...");
      await new Promise((r) => setTimeout(r, 600));

      const parentDomain = typeof window !== "undefined" && window.location
        ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? (window.location.port ? `localhost:${window.location.port}` : "localhost")
            : getPublicBaseDomain())
        : getPublicBaseDomain();

      const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
      const fullUrl = `${protocol}//${res.data.tenant.subdomain}.${parentDomain}`;

      setSuccessData({
        companyName: companyName.trim(),
        subdomain: res.data.tenant.subdomain,
        parentDomain,
        fullWorkspaceUrl: fullUrl,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
      });
      setLoading(false);
      notifySuccess("Company workspace created successfully! Congratulations!");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Registration failed. Please check details."));
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!successData?.fullWorkspaceUrl) return;
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(successData.fullWorkspaceUrl);
      setCopiedLink(true);
      notifySuccess("Workspace URL copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleLaunchWorkspace = () => {
    if (!successData) return;
    try {
      const targetUrl = new URL(`${successData.fullWorkspaceUrl}/dashboard`);
      if (typeof window !== "undefined" && window.location.hostname === targetUrl.hostname) {
        router.push("/dashboard");
      } else {
        // Direct browser reflection to their dedicated subdomain workspace
        window.location.href = targetUrl.toString();
      }
    } catch {
      window.location.href = `${successData.fullWorkspaceUrl}/dashboard`;
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sign Up & Start Free Trial | Enterprise Platform",
    url: `${publicSiteUrl}/register`,
    description: "Create your cloud ERP workspace with a 14-day free trial. No credit card required.",
  };

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData data={structuredData} />

      <section className={cn(publicPageSectionClassName, "pb-20 pt-8 sm:pb-28 sm:pt-12")}>
        <div className={`${publicSectionClassName} grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start`}>
          {/* Left Column: Public Value Prop & Trust */}
          <div className="space-y-6">
            <MotionReveal>
              <div>
                <p className={publicEyebrowClassName}>Self-Service Onboarding</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Launch your company ERP workspace in 60 seconds
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  Experience modern enterprise management tailored for Indian businesses. Start your 14-day free trial with full access to all core modules.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={0.04}>
              <div className={publicPanelClassName}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Included in your 14-day trial
                </p>
                <ul className="mt-4 space-y-3">
                  {trialFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" />
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">Enterprise Security:</span> 256-bit encryption, SOC-2 compliant tenant isolation, and DPDP Indian Data Residency.
                  </div>
                </div>
              </div>
            </MotionReveal>
          </div>

          {/* Right Column: Interactive 2-Step Form */}
          <MotionReveal delay={0.06}>
            <div className={cn(publicPanelClassName, "border-slate-300 shadow-xl bg-white p-6 sm:p-8")}>
              {successData ? (
                <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                  {/* Celebratory Icon */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-500/10 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <PartyPopper className="h-9 w-9" />
                  </div>

                  {/* Heading & Subtitle */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Workspace Provisioned Successfully</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                      Congratulations, {successData.adminName}!
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Your dedicated cloud ERP workspace for <span className="font-semibold text-slate-900 dark:text-white">{successData.companyName}</span> has been provisioned and is ready for launch.
                    </p>
                  </div>

                  {/* Subdomain + Parent Platform Domain Breakdown Box */}
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 text-left dark:border-blue-900/50 dark:bg-blue-950/30 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-950 dark:text-blue-300">
                        <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>Dedicated Workspace Link</span>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        Custom Subdomain
                      </span>
                    </div>

                    {/* Breakdown pills showing subdomain + parent domain */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Domain Structure:</span>
                      <span className="rounded-md bg-white px-2 py-0.5 font-mono font-bold text-blue-700 border border-blue-200 shadow-sm dark:bg-slate-900 dark:border-blue-800 dark:text-blue-300">
                        {successData.subdomain}
                      </span>
                      <span className="text-slate-400 font-bold">+</span>
                      <span className="rounded-md bg-white px-2 py-0.5 font-mono text-slate-700 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                        .{successData.parentDomain}
                      </span>
                    </div>

                    {/* Full link container with one-click copy */}
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                          {successData.fullWorkspaceUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      You and your employees can directly log in using this URL anytime.
                    </p>
                  </div>

                  {/* Summary Details */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Master Admin:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{successData.adminEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Subscription:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">14-Day Free Enterprise Trial</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Chart of Accounts:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Indian Statutory Baseline (Initialized)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-500">Isolation & Privacy:</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Dedicated Tenant DB & 256-bit AES
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Direct Launch Button */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleLaunchWorkspace}
                      className={cn(
                        publicButtonClassName.primary,
                        "w-full justify-center py-3.5 text-base font-bold shadow-lg shadow-blue-500/20 group cursor-pointer"
                      )}
                    >
                      <span>Launch My Workspace</span>
                      <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="text-xs text-slate-500 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Or continue directly on current domain →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Guided Demo Alternative Banner */}
                  <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Prefer a guided tour before setting up?</p>
                      <p className="text-slate-600 dark:text-slate-400">Our solution team can walk your leadership through live enterprise workflows.</p>
                    </div>
                    <Link
                      href="/contact?type=demo"
                      className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      Schedule Demo
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Step Bar */}
                  <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {step === 1 ? "Step 1: Workspace & Company" : "Step 2: Administrator Account"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {step === 1 ? "Choose your company name and custom subdomain" : "Create your master admin credentials"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                          step === 1 ? "bg-slate-900 text-white" : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        1
                      </span>
                      <span className="h-0.5 w-4 bg-slate-200" />
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                          step === 2 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        2
                      </span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-16 text-center space-y-4">
                      <Loader2 className="mx-auto h-10 w-10 text-slate-900 animate-spin" />
                      <h3 className="text-base font-semibold text-slate-900">Provisioning your ERP workspace...</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">{provisionProgress}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {step === 1 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Company / Organization Name *</label>
                            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                              <Building2 className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => handleCompanyNameChange(e.target.value)}
                                placeholder="e.g. Acme Enterprises Ltd"
                                className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Choose Workspace Subdomain *</label>
                            <div className="mt-1.5 flex items-center rounded-xl border border-slate-300 bg-slate-50/50 transition overflow-hidden focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                              <div className="flex items-center gap-2 pl-3.5 pr-1 text-slate-400 dark:text-slate-500">
                                <Globe className="h-4 w-4 shrink-0" />
                              </div>
                              <input
                                type="text"
                                required
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                placeholder="acme"
                                className="w-full border-none bg-transparent py-2.5 pl-2 pr-2 text-sm font-mono text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                              />
                              <span className="flex items-center px-3.5 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 border-l border-slate-200 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                .{getPublicBaseDomain()}
                              </span>
                            </div>

                            {/* Subdomain status */}
                            <div className="mt-1.5 min-h-[18px]">
                              {checkingSubdomain ? (
                                <span className="text-[11px] text-slate-400">Checking availability…</span>
                              ) : subdomainAvailable === true ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {subdomainMessage}
                                </span>
                              ) : subdomainAvailable === false ? (
                                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{subdomainMessage}</span>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Industry / Sector</label>
                            <select
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              className="w-full mt-1.5 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
                            >
                              <option value="Technology & Services">Technology, IT & Services</option>
                              <option value="Manufacturing">Manufacturing & Engineering</option>
                              <option value="Retail & E-commerce">Retail, Wholesale & E-commerce</option>
                              <option value="Healthcare & Pharma">Healthcare, Pharma & Biotech</option>
                              <option value="Construction & Real Estate">Construction & Real Estate</option>
                              <option value="Logistics & Supply Chain">Logistics, Transport & Warehousing</option>
                              <option value="Professional Consulting">Professional Consulting & Legal</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            disabled={!companyName.trim() || !subdomain.trim() || subdomainAvailable === false}
                            onClick={() => setStep(2)}
                            className={cn(
                              publicButtonClassName.primary,
                              "w-full mt-4 justify-center py-2.5 text-sm font-semibold disabled:opacity-50"
                            )}
                          >
                            Continue to Admin Setup <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                              <User className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              <input
                                type="text"
                                required
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="e.g. Rahul Sharma"
                                className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Work Email Address *</label>
                            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                              <Mail className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              <input
                                type="email"
                                required
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="rahul@acme.com"
                                className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Mobile / Contact Number</label>
                            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                              <Phone className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                                <Lock className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                <input
                                  type="password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm Password *</label>
                              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                                <Lock className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                <input
                                  type="password"
                                  required
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className={cn(publicButtonClassName.secondary, "w-1/3 justify-center py-2.5 text-xs font-semibold")}
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              disabled={!adminName.trim() || !adminEmail.trim() || !password || password !== confirmPassword}
                              className={cn(
                                publicButtonClassName.primary,
                                "w-2/3 justify-center py-2.5 text-sm font-semibold disabled:opacity-50"
                              )}
                            >
                              Launch My Workspace <Sparkles className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  )}

                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Already registered your company?{" "}
                    <Link href="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                      Sign in here
                    </Link>
                  </div>
                </>
              )}
            </div>
          </MotionReveal>
        </div>
      </section>
    </PublicAudiencePageFrame>
  );
}
