"use client";

import React, { useState } from "react";
import {
  Building2,
  FileCheck2,
  FileSpreadsheet,
  CheckCircle2,
  Stamp,
  Eye,
  Layers,
  Sparkles,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export type LetterheadLayoutOption = "modern-split" | "centered-banner" | "classic-left" | "minimal-ribbon";
export type PreviewDocType = "invoice" | "offer" | "appointment";

export interface LetterheadPreviewProps {
  companyName?: string;
  legalName?: string;
  logoUrl?: string;
  brandColor?: string;
  accentColor?: string;
  letterheadLayout?: LetterheadLayoutOption | string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  gstin?: string;
  pan?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  stampUrl?: string;
  // Optional project override preview
  showProjectSimulation?: boolean;
  projectSiteAddress?: string;
  projectClientLogoUrl?: string;
}

export function LetterheadPreviewCard({
  companyName,
  legalName,
  logoUrl,
  brandColor: propBrandColor,
  accentColor: propAccentColor,
  letterheadLayout = "modern-split",
  address,
  city,
  state,
  postalCode,
  gstin,
  pan,
  signatoryName,
  signatoryDesignation,
  stampUrl,
  showProjectSimulation = false,
  projectSiteAddress,
  projectClientLogoUrl,
}: LetterheadPreviewProps) {
  const [activeLayout, setActiveLayout] = useState<LetterheadLayoutOption>(
    (letterheadLayout as LetterheadLayoutOption) || "modern-split"
  );
  const [activeDocType, setActiveDocType] = useState<PreviewDocType>("invoice");
  const [simulateProject, setSimulateProject] = useState(showProjectSimulation);

  // Sync prop changes if parent modifies layout
  React.useEffect(() => {
    if (letterheadLayout) {
      setActiveLayout(letterheadLayout as LetterheadLayoutOption);
    }
  }, [letterheadLayout]);

  const rawBrand = propBrandColor && /^#[0-9a-fA-F]{3,8}$/.test(propBrandColor) ? propBrandColor : "#0f172a";
  const rawAccent = propAccentColor && /^#[0-9a-fA-F]{3,8}$/.test(propAccentColor) ? propAccentColor : "#2563eb";

  const effectiveCompanyName = legalName || companyName || "Enterprise Global Pvt Ltd";
  const fullAddress = [address, city, state, postalCode].filter(Boolean).join(", ") || "102 Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103";
  const effectiveGstin = gstin || "29ABCDE1234F1Z5";
  const effectivePan = pan || "ABCDE1234F";
  const effectiveSignatory = signatoryName || "Rajesh Sharma";
  const effectiveDesignation = signatoryDesignation || "Director / Authorized Signatory";

  const effectiveSiteAddress = simulateProject
    ? (projectSiteAddress || "Metro Rail Corridor Site 4, Ring Road Extension, Bengaluru")
    : null;

  const effectiveClientLogo = simulateProject ? projectClientLogoUrl : null;

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 font-sans">
      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shadow-xs text-white"
            style={{ backgroundColor: rawBrand }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Live Letterhead Stationery Preview
            </h4>
            <p className="text-[11px] text-slate-500">
              Interactive rendering of corporate letterhead styling, logos, and signatures.
            </p>
          </div>
        </div>

        {/* Layout Presets Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 dark:bg-slate-850 dark:border-slate-700">
          {(
            [
              { id: "modern-split", label: "Modern Split" },
              { id: "centered-banner", label: "Centered Banner" },
              { id: "classic-left", label: "Classic Left" },
              { id: "minimal-ribbon", label: "Minimal Ribbon" },
            ] as const
          ).map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => setActiveLayout(layout.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                activeLayout === layout.id
                  ? "bg-slate-900 text-white shadow-2xs dark:bg-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {layout.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Bar: Document Sample Switcher & Project Simulation Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">Document Sample:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveDocType("invoice")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activeDocType === "invoice"
                  ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <FileSpreadsheet className="h-3 w-3" />
              <span>Tax Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDocType("offer")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activeDocType === "offer"
                  ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <FileCheck2 className="h-3 w-3" />
              <span>Offer Letter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDocType("appointment")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                activeDocType === "appointment"
                  ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Appointment</span>
            </button>
          </div>
        </div>

        {/* Project Simulation toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={simulateProject}
            onChange={(e) => setSimulateProject(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
          />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            Simulate Project Site Office Override
          </span>
        </label>
      </div>

      {/* ── Scaled Stationery Paper Preview ── */}
      <div className="relative mx-auto mt-2 max-w-2xl overflow-hidden rounded-xl border border-slate-300/80 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-all">
        {/* Subtle Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
          <span className="text-6xl font-black uppercase tracking-widest text-slate-900 dark:text-white rotate-[-30deg]">
            {effectiveCompanyName.split(" ")[0]}
          </span>
        </div>

        {/* Layout: Centered Banner */}
        {activeLayout === "centered-banner" && (
          <div className="relative z-10 text-center pb-4 mb-4 border-b-2" style={{ borderColor: rawBrand }}>
            <div className="flex justify-center items-center gap-3 mb-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-11 max-w-[140px] object-contain" />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-black text-sm"
                  style={{ backgroundColor: rawBrand }}
                >
                  {effectiveCompanyName.substring(0, 2).toUpperCase()}
                </div>
              )}
              {effectiveClientLogo && (
                <img
                  src={effectiveClientLogo}
                  alt="Client Logo"
                  className="max-h-9 max-w-[120px] object-contain border-l border-slate-300 pl-3"
                />
              )}
            </div>
            <div className="text-base font-extrabold tracking-tight" style={{ color: rawBrand }}>
              {effectiveCompanyName}
            </div>
            {effectiveSiteAddress && (
              <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Site Office: {effectiveSiteAddress}
              </div>
            )}
            <div className="text-[10px] text-slate-500 mt-0.5">
              {effectiveSiteAddress ? "Regd Office: " : ""}{fullAddress}
            </div>
            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              GSTIN: {effectiveGstin} &bull; PAN: {effectivePan}
            </div>
            <div
              className="h-1 w-full rounded-full my-2.5"
              style={{ background: `linear-gradient(90deg, ${rawBrand}, ${rawAccent}, ${rawBrand})` }}
            />
          </div>
        )}

        {/* Layout: Classic Left */}
        {activeLayout === "classic-left" && (
          <div
            className="relative z-10 pb-4 mb-4 flex justify-between items-start"
            style={{
              borderTop: `3px solid ${rawBrand}`,
              borderBottom: `1px solid ${rawAccent}`,
              paddingTop: "10px",
            }}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-10 max-w-[130px] object-contain" />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-xs"
                    style={{ backgroundColor: rawBrand }}
                  >
                    {effectiveCompanyName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {effectiveClientLogo && (
                  <img
                    src={effectiveClientLogo}
                    alt="Client Logo"
                    className="max-h-8 max-w-[100px] object-contain border-l border-slate-300 pl-2.5"
                  />
                )}
              </div>
              <div className="text-sm font-extrabold" style={{ color: rawBrand }}>
                {effectiveCompanyName}
              </div>
              {effectiveSiteAddress && (
                <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  Site Office: {effectiveSiteAddress}
                </div>
              )}
              <div className="text-[10px] text-slate-500 max-w-sm mt-0.5">
                {effectiveSiteAddress ? "Regd Office: " : ""}{fullAddress}
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                GSTIN: {effectiveGstin} &bull; PAN: {effectivePan}
              </div>
            </div>
            <div className="text-right">
              <span
                className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: rawBrand }}
              >
                {activeDocType === "invoice" ? "Tax Invoice" : activeDocType === "offer" ? "Offer Letter" : "Appointment"}
              </span>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">#DOC-2026-0891</div>
            </div>
          </div>
        )}

        {/* Layout: Minimal Ribbon */}
        {activeLayout === "minimal-ribbon" && (
          <div className="relative z-10 mb-4">
            <div className="h-1 rounded-t" style={{ backgroundColor: rawBrand }} />
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-8 max-w-[100px] object-contain" />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded text-white font-bold text-xs"
                    style={{ backgroundColor: rawBrand }}
                  >
                    {effectiveCompanyName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {effectiveClientLogo && (
                  <img
                    src={effectiveClientLogo}
                    alt="Client Logo"
                    className="max-h-7 max-w-[80px] object-contain border-l border-slate-300 pl-2"
                  />
                )}
                <div>
                  <div className="text-sm font-bold" style={{ color: rawBrand }}>
                    {effectiveCompanyName}
                  </div>
                  <div className="text-[10px] text-slate-500">GSTIN: {effectiveGstin}</div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: rawBrand }}
                >
                  {activeDocType === "invoice" ? "Tax Invoice" : "Official Letter"}
                </span>
              </div>
            </div>
            <div className="text-[9.5px] text-slate-500 pt-1">
              {effectiveSiteAddress ? `Site: ${effectiveSiteAddress} | Regd: ` : ""}{fullAddress}
            </div>
          </div>
        )}

        {/* Layout: Modern Split (Default) */}
        {activeLayout === "modern-split" && (
          <div
            className="relative z-10 pb-4 mb-4 flex justify-between items-end border-b-2"
            style={{ borderColor: rawBrand }}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-10 max-w-[130px] object-contain" />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-xs"
                    style={{ backgroundColor: rawBrand }}
                  >
                    {effectiveCompanyName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {effectiveClientLogo && (
                  <img
                    src={effectiveClientLogo}
                    alt="Client Logo"
                    className="max-h-8 max-w-[100px] object-contain border-l border-slate-300 pl-2.5"
                  />
                )}
              </div>
              <div className="text-base font-extrabold tracking-tight" style={{ color: rawBrand }}>
                {effectiveCompanyName}
              </div>
              {effectiveSiteAddress && (
                <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  Site Office: {effectiveSiteAddress}
                </div>
              )}
              <div className="text-[10px] text-slate-500 max-w-sm mt-0.5">
                {effectiveSiteAddress ? "Regd Office: " : ""}{fullAddress}
              </div>
              <div className="text-[10px] text-slate-500">
                GSTIN: <span className="font-semibold text-slate-700 dark:text-slate-300">{effectiveGstin}</span> &bull; PAN: {effectivePan}
              </div>
            </div>
            <div className="text-right">
              <span
                className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider"
                style={{
                  backgroundColor: `${rawBrand}14`,
                  borderColor: `${rawBrand}40`,
                  color: rawBrand,
                }}
              >
                {activeDocType === "invoice" ? "GST Tax Invoice" : activeDocType === "offer" ? "Job Offer Letter" : "Appointment"}
              </span>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Ref: INV-2026-00421</div>
            </div>
          </div>
        )}

        {/* ── Document Body Preview Mock ── */}
        <div className="relative z-10 py-3 text-xs space-y-3">
          {activeDocType === "invoice" ? (
            <>
              <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-900/40 flex justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Billed To</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">Apex Infrastructure Ltd</div>
                  <div className="text-[10px] text-slate-500">GSTIN: 27AABCA1234F1Z8 &bull; Mumbai, MH</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Invoice Date</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">28-Sep-2026</div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden text-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-1.5">Description</th>
                      <th className="p-1.5 text-center">HSN</th>
                      <th className="p-1.5 text-center">Qty</th>
                      <th className="p-1.5 text-right">Rate</th>
                      <th className="p-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-1.5 font-medium">Enterprise Engineering Services - Phase II</td>
                      <td className="p-1.5 text-center text-slate-500">998313</td>
                      <td className="p-1.5 text-center">1</td>
                      <td className="p-1.5 text-right">₹1,50,000</td>
                      <td className="p-1.5 text-right font-semibold">₹1,50,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="space-y-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                <strong>Dear Candidate,</strong>
              </p>
              <p>
                We are pleased to offer you the position of{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">Senior Project Lead</span> with{" "}
                <strong style={{ color: rawBrand }}>{effectiveCompanyName}</strong>. Your skills and achievements have impressed our leadership team.
              </p>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-[10px]">
                <div>Annual CTC: <strong>₹18,50,000 per annum</strong></div>
                <div>Location: <strong>Bengaluru, India</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* ── Signatory & Stamp Footer Block ── */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
          <div className="text-[9.5px] text-slate-400">
            This is a system authenticated document generated on {effectiveCompanyName} letterhead.
          </div>
          <div className="text-right relative">
            {stampUrl ? (
              <img
                src={stampUrl}
                alt="Stamp"
                className="max-h-12 max-w-[80px] object-contain absolute right-2 -top-8 opacity-80 pointer-events-none"
              />
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 mb-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Digitally Verified</span>
              </div>
            )}
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100" style={{ color: rawBrand }}>
              {effectiveSignatory}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {effectiveDesignation}
            </div>
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              {effectiveCompanyName}
            </div>
          </div>
        </div>
      </div>

      {/* Palette indicator badge */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600"
              style={{ backgroundColor: rawBrand }}
            />
            Primary: <code className="font-mono text-[10px]">{rawBrand}</code>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600"
              style={{ backgroundColor: rawAccent }}
            />
            Accent: <code className="font-mono text-[10px]">{rawAccent}</code>
          </span>
          <span className="text-slate-400">|</span>
          <span>Layout: <strong className="capitalize text-slate-700 dark:text-slate-200">{activeLayout.replace("-", " ")}</strong></span>
        </div>
        <span className="text-[10px] text-slate-400">
          Auto-cascades to all invoices, quotations, vouchers, and HR letters.
        </span>
      </div>
    </div>
  );
}
