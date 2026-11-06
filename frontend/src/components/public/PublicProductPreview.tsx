"use client";

import React, { useState } from "react";
import {
  Users,
  Receipt,
  Building2,
  Package,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Radio,
  FileCheck2,
  TrendingUp,
  Cpu,
  Lock,
  Layers,
  Clock,
  ScanLine,
  Zap,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PublicProductPreviewProps = {
  className?: string;
  compact?: boolean;
};

type PreviewTab = "hrms" | "gst" | "banking" | "inventory";

export default function PublicProductPreview({
  className,
  compact = false,
}: PublicProductPreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("hrms");

  // Default to custom home banner from millisecond zero (No flash/overlap of old cockpit on refresh!)
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(
    "/assets/pages/home/banner.png"
  );

  // Compact Mode (for Auth / Login / Register pages)
  if (compact) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Global Cloud ERP Engine
            </span>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Multi-Region Tier-IV
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-2.5 dark:border-purple-900/30 dark:bg-purple-950/20">
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Global HRMS</span>
            </div>
            <p className="mt-1 text-xs font-extrabold text-slate-900 dark:text-white">Multi-Currency</p>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Multi-Country Tax & Payroll</span>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <Receipt className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tax & E-Invoicing</span>
            </div>
            <p className="mt-1 text-xs font-extrabold text-slate-900 dark:text-white">PEPPOL & VAT/GST</p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Cross-Border Compliant</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CONDITION 1: WHEN CUSTOM IMAGE EXISTS (Render ONLY clean image)
  // No refresh overlap, no borders, no inner grey box.
  // =========================================================================
  if (loadedImageSrc) {
    return (
      <div className="relative flex items-center justify-center w-full">
        <img
          src={loadedImageSrc}
          alt="UabIndia Global ERP Platform"
          onError={() => setLoadedImageSrc(null)}
          className="w-full h-auto max-h-[580px] lg:max-h-[660px] xl:max-h-[740px] object-contain mx-auto transition-transform duration-500 hover:scale-[1.01]"
        />
      </div>
    );
  }

  // =========================================================================
  // CONDITION 2: WHEN NO IMAGE IN ASSETS (Render 3-Step Cockpit Window)
  // =========================================================================
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-blue-900/10 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-all",
        className
      )}
    >
      {/* Top Browser / Window Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden xs:inline">Real-Time Global Workflow</span>
          <Globe2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Interactive Tabs Menu */}
      <div className="grid grid-cols-2 border-b border-slate-200/80 bg-slate-100/70 p-1.5 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-950/60">
        <button
          type="button"
          onClick={() => setActiveTab("hrms")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
            activeTab === "hrms"
              ? "bg-white text-purple-700 shadow-xs dark:bg-slate-800 dark:text-purple-300 ring-1 ring-purple-100 dark:ring-purple-900/30"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Users className="h-3.5 w-3.5 text-purple-500" />
          <span>Global Workforce</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gst")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
            activeTab === "gst"
              ? "bg-white text-blue-700 shadow-xs dark:bg-slate-800 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900/30"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Receipt className="h-3.5 w-3.5 text-blue-500" />
          <span>Tax & E-Invoice</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("banking")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
            activeTab === "banking"
              ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-800 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-900/30"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Building2 className="h-3.5 w-3.5 text-indigo-500" />
          <span>Global Treasury</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
            activeTab === "inventory"
              ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-800 dark:text-emerald-300 ring-1 ring-emerald-100 dark:ring-emerald-900/30"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          )}
        >
          <Package className="h-3.5 w-3.5 text-emerald-500" />
          <span>Supply Chain ERP</span>
        </button>
      </div>

      {/* Visual Animation Stage (3-Step Process Flow) */}
      <div className="p-4 sm:p-6 min-h-[260px] flex flex-col justify-between">
        {/* ========================================================= */}
        {/* TAB 1: GLOBAL WORKFORCE & MULTI-CURRENCY PAYROLL          */}
        {/* ========================================================= */}
        {activeTab === "hrms" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 via-white to-amber-50/30 p-4 dark:border-purple-950 dark:bg-slate-950/60">
              <div className="grid grid-cols-3 gap-2 text-center items-center relative z-10">
                <div className="flex flex-col items-center">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
                    <Radio className="h-6 w-6 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-bold">
                      ✓
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Global Attendance</p>
                  <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">Biometric · GPS · Remote</p>
                </div>

                <div className="flex flex-col items-center relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shadow-md">
                    <Cpu className="h-6 w-6 animate-spin [animation-duration:8s]" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Policy Engine</p>
                  <p className="text-[10px] text-slate-500">Multi-Timezone & Overtime</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">Cross-Border Payouts</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Multi-Currency Bank Batch</p>
                </div>
              </div>

              <div
                aria-hidden
                className="absolute top-10 left-16 right-16 h-0.5 border-t-2 border-dashed border-purple-300/80 dark:border-purple-800/60 -z-0 pointer-events-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-850">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">Multi-Jurisdiction Compliant</p>
                  <p className="text-[10px] text-slate-500">Local Tax Withholding & Labor Regulations</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-850">
                <Clock className="h-4 w-4 shrink-0 text-indigo-500" />
                <div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">&lt; 3 Minutes Processing</p>
                  <p className="text-[10px] text-slate-500">Automated gross-to-net calculation</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GLOBAL TAX & E-INVOICING (PEPPOL, VAT, GST)        */}
        {/* ========================================================= */}
        {activeTab === "gst" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-4 dark:border-blue-950 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
                    <ScanLine className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Direct Cross-Border Tax & PEPPOL E-Invoicing Gateway
                    </h4>
                    <p className="text-[10px] text-slate-500">Cryptographic Hash · Digital Signatures · QR Validation</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Validated
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-blue-100 bg-white/90 p-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500">B2B E-Invoicing</p>
                  <p className="font-extrabold text-blue-700 dark:text-blue-300 text-xs mt-0.5">Automated</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-white/90 p-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500">Global VAT & GST</p>
                  <p className="font-extrabold text-blue-700 dark:text-blue-300 text-xs mt-0.5">Multi-Country</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-white/90 p-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500">Tax Filing</p>
                  <p className="font-extrabold text-blue-700 dark:text-blue-300 text-xs mt-0.5">Audit-Ready</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-850">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Lock className="h-3.5 w-3.5 text-blue-600" />
                Cross-Border Compliant Invoices
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Zero Regulatory Risk</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CONNECTED BANKING, SWIFT, SEPA & TREASURY          */}
        {/* ========================================================= */}
        {activeTab === "banking" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-4 dark:border-indigo-950 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Direct Corporate Banking, SWIFT & SEPA APIs
                    </h4>
                    <p className="text-[10px] text-slate-500">Global Corporate Banks · Automated Clearing House · Instant Clearing</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" /> Real-Time Sync
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-indigo-100 bg-white/90 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500 font-medium">Bank Reconciliation</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Auto 2-Way Multi-Currency Match</p>
                  <span className="text-[10px] text-indigo-600 font-semibold">No manual statements</span>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-white/90 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500 font-medium">Cross-Border Payouts</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Dual-OTP Multi-Tier Approval</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Global Wire, ACH & Local Rails</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-850">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                SOC-2 Type II & ISO 27001 Certified
              </span>
              <span className="text-[10px] font-bold text-indigo-600">Hardware Security Module (HSM) Encryption</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GLOBAL SUPPLY CHAIN, INVENTORY & FREIGHT           */}
        {/* ========================================================= */}
        {activeTab === "inventory" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-4 dark:border-emerald-950 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cross-Border Multi-Location Inventory & SCM
                    </h4>
                    <p className="text-[10px] text-slate-500">Real-Time Multi-Currency Valuation & Global Logistics</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Live Control
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-emerald-100 bg-white/90 p-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500">Valuation</p>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">FIFO & WAC</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white/90 p-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500">Reorder Triggers</p>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">Auto-PO Drafted</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white/90 p-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] text-slate-500">Quality Checks</p>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">Customs & Inspection</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-850">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                Global Batch, Serial & Expiry Tracking
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Zero Stock Leakage</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Live Bar */}
      <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/90 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Global Sovereign Cloud · Multi-Region Tier-IV Infrastructure · High Availability 99.98%
        </span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          UabIndia Global Enterprise OS
        </span>
      </div>
    </div>
  );
}
