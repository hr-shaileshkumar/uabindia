"use client";

import React, { useState } from "react";
import {
  User,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Laptop,
  Users,
  ShieldCheck,
  History,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit3,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/workspace/status-badge";
import { erpButtonClassName } from "@/components/workspace/styles";
import DynamicFieldsSection from "@/components/DynamicFieldsSection";

export interface EmployeeProfile360Data {
  id: string;
  tenantId: string;
  companyId: string;
  companyName?: string;
  fullName?: string;
  employeeCode?: string;
  status?: string;
  avatarUrl?: string;

  workEmail?: string;
  personalEmail?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  branchId?: string;
  branchName?: string;
  projectId?: string;
  projectName?: string;
  costCenterId?: string;
  costCenterName?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  employmentType?: string;
  workLocation?: string;
  dateOfJoining?: string;
  confirmationDate?: string;
  probationEndDate?: string;
  probationStatus?: string;

  pan?: string;
  aadhaar?: string;
  uan?: string;
  esiNumber?: string;
  pfNumber?: string;
  bankName?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;

  monthlyCtc: number;
  basicSalary: number;
  payrollStructureName?: string;

  attendanceSummary: {
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    onLeaveDays: number;
    totalHoursWorked: number;
    attendanceRate: number;
    recentLogs: Array<{
      date: string;
      shiftName?: string;
      inTime?: string;
      outTime?: string;
      status?: string;
      source?: string;
      isGpsVerified: boolean;
      isFrsVerified: boolean;
    }>;
  };
  leaveBalances: Array<{
    leaveType: string;
    totalAllocated: number;
    used: number;
    balance: number;
  }>;
  recentPayslips: Array<{
    payslipId: string;
    monthYear: string;
    grossEarnings: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    paymentDate?: string;
  }>;
  assignedAssets: Array<{
    assetId: string;
    assetCode: string;
    assetName: string;
    category: string;
    serialNumber?: string;
    assignedDate?: string;
    status: string;
  }>;
  documents: Array<{
    documentId: string;
    documentName: string;
    documentType: string;
    fileUrl?: string;
    uploadedDate: string;
    isVerified: boolean;
  }>;
  directReports: Array<{
    id: string;
    fullName: string;
    employeeCode?: string;
    designation?: string;
    department?: string;
    status?: string;
  }>;
  timelineEvents: Array<{
    timestamp: string;
    title: string;
    description: string;
    eventType: string;
  }>;
}

interface EmployeeProfile360Props {
  data: EmployeeProfile360Data;
  onEditClick?: () => void;
}

type TabKey =
  | "overview"
  | "employment"
  | "attendance"
  | "leave"
  | "payroll"
  | "documents"
  | "assets"
  | "reports"
  | "customFields"
  | "timeline";

export default function EmployeeProfile360({
  data,
  onEditClick,
}: EmployeeProfile360Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const initials = data.fullName
    ? data.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EMP";

  const tabs: Array<{ id: TabKey; label: string; icon: React.ElementType; count?: number }> = [
    { id: "overview", label: "Overview & Personal", icon: User },
    { id: "employment", label: "Employment & Org", icon: Building2 },
    {
      id: "attendance",
      label: "Attendance & Time",
      icon: Clock,
      count: data.attendanceSummary?.presentDays,
    },
    {
      id: "leave",
      label: "Leave Balances",
      icon: Calendar,
      count: data.leaveBalances?.reduce((acc, l) => acc + l.balance, 0),
    },
    { id: "payroll", label: "Salary & Payslips", icon: CreditCard },
    { id: "documents", label: "Document Vault", icon: FileText, count: data.documents?.length },
    { id: "assets", label: "Assigned Assets", icon: Laptop, count: data.assignedAssets?.length },
    { id: "reports", label: "Direct Reports", icon: Users, count: data.directReports?.length },
    { id: "customFields", label: "Custom Attributes", icon: Sparkles },
    { id: "timeline", label: "Lifecycle & Audit", icon: History },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── 360° Workspace Header Card ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-2xl font-bold text-white shadow-md ring-4 ring-indigo-50 dark:ring-slate-800">
              {initials}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>

            {/* Core Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {data.fullName ?? "Unnamed Employee"}
                </h1>
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {data.employeeCode ?? "EMP-XXXX"}
                </span>
                <StatusBadge
                  status={data.status ?? "Active"}
                  tone={data.status === "Active" ? "positive" : "warning"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {data.designationName ?? "Designation Not Assigned"}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {data.departmentName ?? "General"} • {data.companyName ?? "UAB Group"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {data.workLocation ?? data.branchName ?? "Headquarters"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onEditClick && (
              <button
                type="button"
                onClick={onEditClick}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4 text-slate-500" />
              ID Card
            </button>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/50">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Gross CTC
            </p>
            <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              ₹{Number(data.monthlyCtc || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/50">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              30-Day Attendance
            </p>
            <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
              {data.attendanceSummary?.attendanceRate ?? 96}%
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/50">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Leave Balance
            </p>
            <p className="mt-1 text-base font-bold text-blue-600 dark:text-blue-400">
              {data.leaveBalances?.reduce((acc, l) => acc + l.balance, 0) ?? 15} Days
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/50">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Employment Status
            </p>
            <p className="mt-1 text-base font-bold text-slate-800 dark:text-slate-200">
              {data.employmentType ?? "Permanent"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-100/60 p-1.5 dark:border-slate-800 dark:bg-slate-900/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Body Content ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* 1. Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Contact & Personal Information
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Official Work Email" value={data.workEmail} icon={Mail} />
                <InfoItem label="Personal Email" value={data.personalEmail} icon={Mail} />
                <InfoItem label="Primary Phone" value={data.phone} icon={Phone} />
                <InfoItem label="Alternate Phone" value={data.alternatePhone} icon={Phone} />
                <InfoItem
                  label="Date of Birth"
                  value={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString("en-IN") : undefined}
                  icon={Calendar}
                />
                <InfoItem label="Gender / Marital Status" value={`${data.gender ?? "—"} • ${data.maritalStatus ?? "—"}`} />
                <InfoItem label="Residential Address" value={data.address} icon={MapPin} className="sm:col-span-2" />
                <InfoItem label="City / State / PIN" value={`${data.city ?? "—"}, ${data.state ?? "—"} - ${data.postalCode ?? "—"}`} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Statutory & KYC Identifiers
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="PAN Number" value={data.pan} badge="Tax Identity" />
                <InfoItem label="Aadhaar (UIDAI)" value={data.aadhaar ? `•••• •••• ${data.aadhaar.slice(-4)}` : undefined} badge="Verified" />
                <InfoItem label="EPFO UAN" value={data.uan} />
                <InfoItem label="ESIC IP Number" value={data.esiNumber} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Disbursement Bank Account
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Bank Name" value={data.bankName} />
                <InfoItem label="Account Holder" value={data.bankAccountHolder ?? data.fullName} />
                <InfoItem label="Account Number" value={data.bankAccountNumber} />
                <InfoItem label="IFSC Code" value={data.bankIfsc} />
              </div>
            </div>

            {/* Dynamic Custom Metadata */}
            <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Custom Tenant Attributes
                </h3>
              </div>
              <DynamicFieldsSection entityName="Employee" recordId={data.id} editable={false} compact />
            </div>
          </div>
        )}

        {/* 2. Employment & Org Tab */}
        {activeTab === "employment" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Organization Hierarchy & Roles
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Reporting Manager" value={data.reportingManagerName ?? "Directly to Director"} icon={User} />
              <InfoItem label="Assigned Department" value={data.departmentName} icon={Building2} />
              <InfoItem label="Assigned Designation" value={data.designationName} icon={Briefcase} />
              <InfoItem label="Cost Center" value={data.costCenterName ?? "General Overhead"} icon={Layers} />
              <InfoItem label="Branch / Operating Unit" value={data.branchName ?? "Corporate Office"} icon={Building2} />
              <InfoItem label="Assigned Project" value={data.projectName ?? "Core Operations"} icon={Briefcase} />
              <InfoItem
                label="Date of Joining"
                value={data.dateOfJoining ? new Date(data.dateOfJoining).toLocaleDateString("en-IN") : undefined}
                icon={Calendar}
              />
              <InfoItem
                label="Probation Status"
                value={data.probationStatus ?? "Confirmed"}
                badge={data.confirmationDate ? "Confirmed" : "In Progress"}
              />
              <InfoItem
                label="Probation End Date"
                value={data.probationEndDate ? new Date(data.probationEndDate).toLocaleDateString("en-IN") : undefined}
              />
            </div>
          </div>
        )}

        {/* 3. Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Recent 30-Day Attendance Logs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Biometric and Mobile FRS punches with GPS validation records.
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {data.attendanceSummary?.presentDays ?? 0} Days Present
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">In Punch</th>
                    <th className="px-4 py-3">Out Punch</th>
                    <th className="px-4 py-3">Source & Mode</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.attendanceSummary?.recentLogs?.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                        {new Date(log.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.shiftName}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-200">
                        {log.inTime}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-200">
                        {log.outTime}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {log.source}
                          </span>
                          {log.isGpsVerified && (
                            <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              GPS ✓
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={log.status ?? "Present"}
                          tone={log.status === "Present" ? "positive" : "danger"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Leave Balances Tab */}
        {activeTab === "leave" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Annual Leave Allocations & Balances
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {data.leaveBalances?.map((leave, idx) => {
                const percent = Math.min(100, Math.round((leave.used / Math.max(1, leave.totalAllocated)) * 100));
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4.5 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{leave.leaveType}</p>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {leave.balance} Available
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Used: {leave.used} Days</span>
                      <span>Total: {leave.totalAllocated} Days</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Payroll Tab */}
        {activeTab === "payroll" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-sm dark:from-indigo-950 dark:to-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Active Salary Structure</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-4">
                <h4 className="text-2xl font-extrabold text-white">
                  ₹{Number(data.monthlyCtc || 0).toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-slate-300"> / month CTC</span>
                </h4>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                  Structure: {data.payrollStructureName ?? "Standard Indian CTC"}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Payslips History
              </h3>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Pay Period</th>
                      <th className="px-4 py-3">Gross Earnings</th>
                      <th className="px-4 py-3">Total Deductions</th>
                      <th className="px-4 py-3">Net Take-Home</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.recentPayslips?.map((slip) => (
                      <tr key={slip.payslipId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{slip.monthYear}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                          ₹{Number(slip.grossEarnings).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400">
                          -₹{Number(slip.totalDeductions).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{Number(slip.netSalary).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={slip.status} tone="positive" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. Document Vault Tab */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Employee Verified Documents
            </h3>
            {data.documents?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{doc.documentName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{doc.documentType}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-slate-800">
                No documents uploaded yet in this employee vault.
              </div>
            )}
          </div>
        )}

        {/* 7. Assigned Assets Tab */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Assigned IT & Physical Assets
            </h3>
            {data.assignedAssets?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.assignedAssets.map((asset) => (
                  <div
                    key={asset.assetId}
                    className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{asset.assetName}</p>
                      <StatusBadge status={asset.status} tone="positive" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Code: {asset.assetCode} • Category: {asset.category}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Serial: {asset.serialNumber ?? "—"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-slate-800">
                No company assets currently assigned to this employee.
              </div>
            )}
          </div>
        )}

        {/* 8. Direct Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Direct Subordinates & Team Members
            </h3>
            {data.directReports?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.directReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {report.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{report.fullName}</p>
                        <p className="text-[11px] text-slate-500">{report.designation ?? "Employee"}</p>
                      </div>
                    </div>
                    <StatusBadge status={report.status ?? "Active"} tone="positive" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-slate-800">
                This employee does not currently have any direct reporting subordinates.
              </div>
            )}
          </div>
        )}

        {/* 9. Custom Attributes Tab */}
        {activeTab === "customFields" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Tenant-Configured Custom Fields
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Dynamic enterprise attributes defined under Schema Manager for Employee records.
                </p>
              </div>
            </div>
            <DynamicFieldsSection entityName="Employee" recordId={data.id} editable={true} />
          </div>
        )}

        {/* 10. Lifecycle & Audit Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Employee Lifecycle & Activity Trail
            </h3>
            <div className="relative border-l-2 border-slate-200 pl-4 space-y-6 dark:border-slate-800">
              {data.timelineEvents?.map((evt, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{evt.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{evt.description}</p>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {new Date(evt.timestamp).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
  badge,
  className = "",
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
  badge?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/30 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {badge && (
          <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
          {value || <span className="font-normal text-slate-400">Not specified</span>}
        </p>
      </div>
    </div>
  );
}
