"use client";

import React, { useRef, useState } from "react";
import { Printer, X, Award, CheckCircle2, Building2, Calendar, MapPin, FileText, Palette, LayoutTemplate } from "lucide-react";
import { useOrgContext } from "@/context/OrgContext";

export type LetterTemplateType = "appointment" | "offer" | "experience" | "relieving";
export type LetterheadLayoutStyle = "modern-split" | "centered-banner" | "classic-left" | "minimal-ribbon";

export interface AppointmentLetterData {
  id?: string;
  letterNumber: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail?: string;
  employeePhone?: string;
  designation: string;
  department: string;
  workLocation?: string;
  joiningDate: string;
  relievingDate?: string;
  issueDate?: string;
  annualCtc: number;
  monthlyGross: number;
  probationMonths?: number;
  noticePeriodDays?: number;
  termsAndConditions?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  companyName?: string;
  companyLegalName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyLogoUrl?: string;
  brandColor?: string;
  accentColor?: string;
  letterheadLayout?: LetterheadLayoutStyle;
  letterType?: LetterTemplateType;
}

interface AppointmentLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppointmentLetterData | null;
}

export const AppointmentLetterModal: React.FC<AppointmentLetterModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const {
    companyName: ctxCompanyName,
    companyLegalName: ctxCompanyLegalName,
    companyLogoUrl: ctxCompanyLogoUrl,
    companyAddress: ctxCompanyAddress,
    companyGstin: ctxCompanyGstin,
    companyBrandColor: ctxCompanyBrandColor,
    companyAccentColor: ctxCompanyAccentColor,
    companyLetterheadLayout: ctxCompanyLetterheadLayout,
    companySignatoryName: ctxCompanySignatoryName,
    companySignatoryDesignation: ctxCompanySignatoryDesignation,
  } = useOrgContext();

  const [activeLetterType, setActiveLetterType] = useState<LetterTemplateType>(
    data?.letterType || "appointment"
  );
  const [activeLayout, setActiveLayout] = useState<LetterheadLayoutStyle>(
    data?.letterheadLayout || (ctxCompanyLetterheadLayout as LetterheadLayoutStyle) || "modern-split"
  );

  if (!isOpen || !data) return null;

  // Resolving cascading branding: Data Props -> Context Company -> Default Fallbacks
  const effectiveCompanyName =
    data.companyLegalName ||
    data.companyName ||
    ctxCompanyLegalName ||
    ctxCompanyName ||
    "UAB INDIA ENTERPRISES PRIVATE LIMITED";

  const effectiveAddress =
    data.companyAddress ||
    ctxCompanyAddress ||
    "Corporate Headquarters, Bengaluru, Karnataka - 560100, India";

  const effectiveGstin = data.companyGstin || ctxCompanyGstin || null;
  const effectiveLogoUrl = data.companyLogoUrl || ctxCompanyLogoUrl || null;

  const rawBrandColor = data.brandColor || ctxCompanyBrandColor || "#0f172a";
  const brandColor = /^#[0-9a-fA-F]{3,8}$/.test(rawBrandColor) ? rawBrandColor : "#0f172a";

  const rawAccentColor = data.accentColor || ctxCompanyAccentColor || "#2563eb";
  const accentColor = /^#[0-9a-fA-F]{3,8}$/.test(rawAccentColor) ? rawAccentColor : "#2563eb";

  const signatoryName =
    data.signatoryName || ctxCompanySignatoryName || "Authorized Signatory";
  const signatoryTitle =
    data.signatoryDesignation || ctxCompanySignatoryDesignation || "Head of Human Resources";

  const handlePrint = () => {
    window.print();
  };

  const formattedJoiningDate = data.joiningDate
    ? new Date(data.joiningDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Immediate";

  const formattedRelievingDate = data.relievingDate
    ? new Date(data.relievingDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const formattedIssueDate = data.issueDate
    ? new Date(data.issueDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const formattedCtc = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(data.annualCtc || 0);

  const formattedMonthly = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(data.monthlyGross || Math.round((data.annualCtc || 0) / 12));

  // Dynamic Letter Titles & Subjects
  const templateConfig = {
    appointment: {
      title: "Letter of Appointment",
      refPrefix: "APT",
      subject: `Formal Letter of Appointment for the position of "${data.designation}"`,
      badge: "Official Appointment Letter",
    },
    offer: {
      title: "Employment Offer Letter",
      refPrefix: "OFR",
      subject: `Offer of Employment for the position of "${data.designation}"`,
      badge: "Official Offer Letter",
    },
    experience: {
      title: "Experience Certificate",
      refPrefix: "EXP",
      subject: `Work Experience Certificate & Verification of Employment`,
      badge: "Experience Certificate",
    },
    relieving: {
      title: "Relieving & Release Letter",
      refPrefix: "REL",
      subject: `Relieving Order & Clearance of Employment Dues`,
      badge: "Relieving Letter",
    },
  }[activeLetterType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold tracking-wide">
              {templateConfig.title} &mdash; <span className="font-mono text-slate-300">{data.letterNumber}</span>
            </h2>
          </div>

          {/* Letter Type & Layout Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeLetterType}
                onChange={(e) => setActiveLetterType(e.target.value as LetterTemplateType)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="appointment" className="bg-slate-900 text-white">Appointment Letter</option>
                <option value="offer" className="bg-slate-900 text-white">Offer Letter</option>
                <option value="experience" className="bg-slate-900 text-white">Experience Certificate</option>
                <option value="relieving" className="bg-slate-900 text-white">Relieving Letter</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <LayoutTemplate className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeLayout}
                onChange={(e) => setActiveLayout(e.target.value as LetterheadLayoutStyle)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="modern-split" className="bg-slate-900 text-white">Modern Split</option>
                <option value="centered-banner" className="bg-slate-900 text-white">Centered Banner</option>
                <option value="classic-left" className="bg-slate-900 text-white">Classic Formal</option>
                <option value="minimal-ribbon" className="bg-slate-900 text-white">Minimal Clean</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Palette className="w-3.5 h-3.5" style={{ color: brandColor }} />
              <span className="font-mono text-[11px]">{brandColor}</span>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto p-10 font-serif text-slate-800 bg-white print:p-0 print:m-0 print:overflow-visible print:shadow-none"
        >
          {/* Header Layout Renderers */}
          {activeLayout === "centered-banner" && (
            <div className="text-center pb-5 mb-8 border-b-2" style={{ borderColor: brandColor }}>
              {effectiveLogoUrl && (
                <img
                  src={effectiveLogoUrl}
                  alt="Company Logo"
                  className="max-h-14 max-w-[170px] object-contain mx-auto mb-2"
                />
              )}
              <h1 className="text-2xl font-bold tracking-tight font-sans" style={{ color: brandColor }}>
                {effectiveCompanyName}
              </h1>
              <p className="text-xs font-sans text-slate-600 mt-1 max-w-xl mx-auto leading-relaxed">
                {effectiveAddress}
              </p>
              {effectiveGstin && (
                <p className="text-xs font-sans font-medium text-slate-500 mt-0.5">
                  GSTIN: {effectiveGstin}
                </p>
              )}
              <div
                className="h-1 w-full rounded-full my-3"
                style={{
                  background: `linear-gradient(90deg, ${brandColor}, ${accentColor}, ${brandColor})`,
                }}
              />
              <div className="flex justify-between items-center text-xs font-sans text-slate-500 px-2 mt-2">
                <span>Date: <strong className="text-slate-800">{formattedIssueDate}</strong></span>
                <span
                  className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {templateConfig.badge}
                </span>
                <span>Ref: <strong className="font-mono text-slate-800">{data.letterNumber}</strong></span>
              </div>
            </div>
          )}

          {activeLayout === "classic-left" && (
            <div
              className="pb-5 mb-8 flex justify-between items-start font-sans"
              style={{
                borderTop: `3px solid ${brandColor}`,
                borderBottom: `1px solid ${accentColor}`,
                paddingTop: "12px",
              }}
            >
              <div>
                {effectiveLogoUrl && (
                  <img
                    src={effectiveLogoUrl}
                    alt="Company Logo"
                    className="max-h-12 max-w-[150px] object-contain mb-2"
                  />
                )}
                <h1 className="text-xl font-bold tracking-tight" style={{ color: brandColor }}>
                  {effectiveCompanyName}
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-md">
                  {effectiveAddress}
                </p>
                {effectiveGstin && (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    GSTIN: {effectiveGstin}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className="inline-block px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {templateConfig.badge}
                </span>
                <p className="text-xs text-slate-500 mt-2">
                  REF NO: <strong className="font-mono text-slate-800">{data.letterNumber}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Date: {formattedIssueDate}</p>
              </div>
            </div>
          )}

          {activeLayout === "minimal-ribbon" && (
            <div className="mb-8 font-sans">
              <div className="h-1.5 rounded-t" style={{ backgroundColor: brandColor }} />
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {effectiveLogoUrl && (
                    <img
                      src={effectiveLogoUrl}
                      alt="Company Logo"
                      className="max-h-10 max-w-[120px] object-contain"
                    />
                  )}
                  <div>
                    <h1 className="text-lg font-bold" style={{ color: brandColor }}>
                      {effectiveCompanyName}
                    </h1>
                    {effectiveGstin && (
                      <span className="text-[11px] text-slate-500">GSTIN: {effectiveGstin}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold uppercase text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {templateConfig.badge}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    #{data.letterNumber} &bull; {formattedIssueDate}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {effectiveAddress}
              </p>
            </div>
          )}

          {activeLayout === "modern-split" && (
            <div
              className="pb-6 mb-8 flex justify-between items-end border-b-2"
              style={{ borderColor: brandColor }}
            >
              <div>
                {effectiveLogoUrl && (
                  <img
                    src={effectiveLogoUrl}
                    alt="Company Logo"
                    className="max-h-12 max-w-[150px] object-contain mb-2"
                  />
                )}
                <h1 className="text-2xl font-bold tracking-tight font-sans" style={{ color: brandColor }}>
                  {effectiveCompanyName}
                </h1>
                <p className="text-xs font-sans text-slate-500 mt-1 uppercase tracking-wider">
                  Corporate Human Resources &bull; Talent Operations &bull; Legal Compliance
                </p>
                <p className="text-xs font-sans text-slate-500 mt-0.5">
                  {effectiveAddress}
                  {effectiveGstin && <span> &bull; GSTIN: {effectiveGstin}</span>}
                </p>
              </div>
              <div className="text-right font-sans">
                <span
                  className="inline-block px-3 py-1 text-xs font-semibold rounded-md border"
                  style={{
                    backgroundColor: `${brandColor}12`,
                    borderColor: `${brandColor}40`,
                    color: brandColor,
                  }}
                >
                  REF: {data.letterNumber}
                </span>
                <p className="text-xs text-slate-500 mt-1.5">Date: {formattedIssueDate}</p>
              </div>
            </div>
          )}

          {/* Letter Recipient Metadata */}
          <div className="font-sans mb-6 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-950 text-base">{data.employeeName}</p>
            <p className="text-slate-600 font-medium">
              Employee Code: <span className="font-bold" style={{ color: brandColor }}>{data.employeeCode}</span>
            </p>
            {data.employeeEmail && <p className="text-slate-500">Email: {data.employeeEmail}</p>}
            {data.employeePhone && <p className="text-slate-500">Phone: {data.employeePhone}</p>}
          </div>

          {/* Formal Subject */}
          <div className="mb-6 font-sans">
            <p className="text-sm font-bold uppercase tracking-wide border-b border-slate-200 pb-2" style={{ color: brandColor }}>
              Subject: {templateConfig.subject}
            </p>
          </div>

          {/* Dynamic Content Based on Letter Type */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <p>
              Dear <strong>{data.employeeName}</strong>,
            </p>

            {/* Template: Appointment Letter */}
            {activeLetterType === "appointment" && (
              <>
                <p>
                  With reference to your application, subsequent evaluations, and acceptance of our Offer of Employment,
                  the Management of <strong>{effectiveCompanyName}</strong> is pleased to appoint you as{" "}
                  <strong>{data.designation}</strong> in the <strong>{data.department}</strong> Department on the
                  following terms and conditions:
                </p>

                {/* Structured Key Appointment Details */}
                <div className="font-sans my-6 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: brandColor }} />
                    <div>
                      <span className="text-slate-500">Date of Joining:</span>
                      <p className="font-semibold text-slate-900">{formattedJoiningDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: brandColor }} />
                    <div>
                      <span className="text-slate-500">Base Work Location:</span>
                      <p className="font-semibold text-slate-900">{data.workLocation || "Corporate Office / Hybrid"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: brandColor }} />
                    <div>
                      <span className="text-slate-500">Annual Total CTC:</span>
                      <p className="font-semibold text-sm" style={{ color: brandColor }}>{formattedCtc} per annum</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-slate-500">Monthly Gross Salary:</span>
                      <p className="font-semibold text-emerald-700 text-sm">{formattedMonthly} per month</p>
                    </div>
                  </div>
                </div>

                <h3 className="font-sans font-bold text-sm mt-6" style={{ color: brandColor }}>
                  Terms &amp; Conditions of Employment:
                </h3>

                <ol className="list-decimal pl-5 space-y-2 text-xs">
                  <li>
                    <strong>Probation Period:</strong> You will be on probation for a period of{" "}
                    <strong>{data.probationMonths || 6} months</strong> from your date of joining. Upon successful
                    completion of probation and formal review, your employment will be confirmed in writing.
                  </li>
                  <li>
                    <strong>Notice Period &amp; Separation:</strong> During probation, either party may terminate employment
                    by giving 30 days written notice or gross salary in lieu thereof. Post-confirmation, the notice period
                    shall be <strong>{data.noticePeriodDays || 60} days</strong>.
                  </li>
                  <li>
                    <strong>Duties &amp; Responsibilities:</strong> You shall perform and discharge all assigned duties
                    faithfully and comply with the Company’s policies, code of conduct, and corporate guidelines.
                  </li>
                  <li>
                    <strong>Confidentiality &amp; Intellectual Property:</strong> All intellectual property, software code,
                    and business materials created during your tenure shall belong solely to the Company. Strict
                    confidentiality must be maintained concerning proprietary technical and business data.
                  </li>
                  {data.termsAndConditions && (
                    <li>
                      <strong>Special Conditions:</strong> {data.termsAndConditions}
                    </li>
                  )}
                </ol>
              </>
            )}

            {/* Template: Offer Letter */}
            {activeLetterType === "offer" && (
              <>
                <p>
                  We are delighted to extend to you an offer of employment with <strong>{effectiveCompanyName}</strong> for
                  the position of <strong>{data.designation}</strong> in our <strong>{data.department}</strong> team.
                </p>
                <p>
                  Your total compensation package (Annual Cost to Company) will be <strong>{formattedCtc}</strong> per
                  annum, payable monthly at approximately <strong>{formattedMonthly}</strong> subject to statutory deductions.
                </p>
                <div className="font-sans my-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <p><strong>Proposed Joining Date:</strong> {formattedJoiningDate}</p>
                  <p><strong>Location:</strong> {data.workLocation || "Corporate Office / Hybrid"}</p>
                  <p><strong>Offer Validity:</strong> Please sign and return the duplicate copy of this letter within 5 business days.</p>
                </div>
                <p>
                  We are excited about the prospect of you joining our team and contributing to our mutual success.
                </p>
              </>
            )}

            {/* Template: Experience Certificate */}
            {activeLetterType === "experience" && (
              <>
                <p>
                  This is to certify that <strong>{data.employeeName}</strong> (Employee ID: <strong>{data.employeeCode}</strong>)
                  was employed with <strong>{effectiveCompanyName}</strong> as a full-time <strong>{data.designation}</strong> in
                  the <strong>{data.department}</strong> department from <strong>{formattedJoiningDate}</strong> to{" "}
                  <strong>{formattedRelievingDate}</strong>.
                </p>
                <p>
                  During the tenure with us, {data.employeeName} demonstrated high professional competence, integrity,
                  and dedication. Their conduct and character were found to be exemplary throughout the association.
                </p>
                <p>
                  We thank them for their valuable contributions and wish them every success in their future endeavors.
                </p>
              </>
            )}

            {/* Template: Relieving Letter */}
            {activeLetterType === "relieving" && (
              <>
                <p>
                  This has reference to your formal resignation letter submitted from the services of{" "}
                  <strong>{effectiveCompanyName}</strong> as <strong>{data.designation}</strong>.
                </p>
                <p>
                  We wish to inform you that your resignation has been accepted and you are formally relieved from your
                  duties and responsibilities effective from the close of business hours on <strong>{formattedRelievingDate}</strong>.
                </p>
                <p>
                  All company assets, clearances, and handover obligations have been satisfactorily completed, and your full
                  and final settlement statement has been processed as per company policy.
                </p>
                <p>
                  We appreciate your contributions during your tenure with us and wish you the very best in all your future
                  endeavors.
                </p>
              </>
            )}

            <p className="pt-2">
              For any clarification or statutory verification regarding this document, please contact Corporate HR at{" "}
              <strong>hr@{effectiveCompanyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</strong>.
            </p>
          </div>

          {/* Signatures Block */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans">
            <div>
              <p className="text-xs text-slate-500 mb-8">For {effectiveCompanyName}:</p>
              <div className="border-b border-slate-400 w-48 mb-2"></div>
              <p className="text-xs font-bold text-slate-900">{signatoryName}</p>
              <p className="text-xs text-slate-500">{signatoryTitle}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-8">
                {activeLetterType === "appointment" || activeLetterType === "offer" ? "Candidate Acceptance:" : "Employee Acknowledgement:"}
              </p>
              <div className="border-b border-slate-400 w-48 mb-2"></div>
              <p className="text-xs font-bold text-slate-900">{data.employeeName}</p>
              <p className="text-xs text-slate-500">Signature &amp; Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentLetterModal;

