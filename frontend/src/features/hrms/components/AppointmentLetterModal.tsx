"use client";

import React, { useRef } from "react";
import { Printer, X, Award, CheckCircle2, Building2, Calendar, MapPin, UserCheck } from "lucide-react";

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
  issueDate?: string;
  annualCtc: number;
  monthlyGross: number;
  probationMonths?: number;
  noticePeriodDays?: number;
  termsAndConditions?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  companyName?: string;
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

  if (!isOpen || !data) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold tracking-wide">
              Official Appointment Letter &mdash; {data.letterNumber}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Letter Body */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto p-10 font-serif text-slate-800 bg-white print:p-0 print:m-0 print:overflow-visible print:shadow-none"
        >
          {/* Company Letterhead */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-sans">
                {data.companyName || "UAB INDIA ENTERPRISE"}
              </h1>
              <p className="text-xs font-sans text-slate-500 mt-1 uppercase tracking-wider">
                Corporate Human Resources &bull; Talent Operations &bull; Legal Compliance
              </p>
              <p className="text-xs font-sans text-slate-400">
                Registered Office: Tech Hub Sector 62, Noida, NCR, India &bull; hrms@uabindia.com
              </p>
            </div>
            <div className="text-right font-sans">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200">
                LETTER REF: {data.letterNumber}
              </span>
              <p className="text-xs text-slate-500 mt-1">Date: {formattedIssueDate}</p>
            </div>
          </div>

          {/* Letter Meta */}
          <div className="font-sans mb-6 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-950 text-base">{data.employeeName}</p>
            <p className="text-slate-600 font-medium">Employee Code: <span className="text-indigo-600 font-bold">{data.employeeCode}</span></p>
            {data.employeeEmail && <p className="text-slate-500">Email: {data.employeeEmail}</p>}
            {data.employeePhone && <p className="text-slate-500">Phone: {data.employeePhone}</p>}
          </div>

          {/* Formal Subject */}
          <div className="mb-6 font-sans">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
              Subject: Formal Letter of Appointment for the position of &ldquo;{data.designation}&rdquo;
            </p>
          </div>

          {/* Opening Paragraph */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <p>
              Dear <strong>{data.employeeName}</strong>,
            </p>
            <p>
              With reference to your application, subsequent evaluations, and acceptance of our Offer of Employment,
              the Management is pleased to appoint you as <strong>{data.designation}</strong> in the{" "}
              <strong>{data.department}</strong> Department at{" "}
              <strong>{data.companyName || "UAB India"}</strong> on the following terms and conditions:
            </p>

            {/* Structured Key Appointment Details */}
            <div className="font-sans my-6 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-slate-500">Date of Joining:</span>
                  <p className="font-semibold text-slate-900">{formattedJoiningDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-slate-500">Base Location:</span>
                  <p className="font-semibold text-slate-900">{data.workLocation || "Headquarters / Hybrid"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-slate-500">Annual CTC:</span>
                  <p className="font-semibold text-indigo-700 text-sm">{formattedCtc} per annum</p>
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

            {/* Terms List */}
            <h3 className="font-sans font-bold text-slate-900 text-sm mt-6">
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
                faithfully and comply with the Company’s policies, code of conduct, and directives.
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

            <p className="pt-2">
              We welcome you to our family and look forward to a mutually rewarding, productive, and enduring professional
              association.
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans">
            <div>
              <p className="text-xs text-slate-500 mb-8">For {data.companyName || "UAB India Enterprise"}:</p>
              <div className="border-b border-slate-400 w-48 mb-2"></div>
              <p className="text-xs font-bold text-slate-900">{data.signatoryName || "Authorized Signatory"}</p>
              <p className="text-xs text-slate-500">{data.signatoryDesignation || "Head of People & Culture"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-8">Candidate Acceptance:</p>
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
