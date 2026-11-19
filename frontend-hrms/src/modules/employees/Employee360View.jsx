import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Users,
  Building2,
  Calendar,
  CreditCard,
  Clock,
  Laptop,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Download,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { INITIAL_EMPLOYEES } from "../../services/mockData";
import hrmsService from "../../services/hrmsService";
import StatusBadge from "../../components/common/StatusBadge";

export const Employee360View = () => {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("id");

  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [selectedId, setSelectedId] = useState(queryId || INITIAL_EMPLOYEES[0].id);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    hrmsService.getEmployees().then((data) => {
      setEmployees(data);
      if (queryId && data.some((e) => e.id === queryId)) {
        setSelectedId(queryId);
      }
    });
  }, [queryId]);

  const emp = employees.find((e) => e.id === selectedId) || employees[0];

  return (
    <div className="space-y-4">
      {/* Top Bar: Selector & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Link
            to="/employees"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
          >
            ← Back to Directory
          </Link>
          <div className="h-3.5 w-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-800">
            Employee 360 Comprehensive Dossier
          </span>
        </div>

        {/* Quick Employee Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Viewing Staff:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-8 px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeCode}) — {e.departmentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Dossier Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <img
              src={emp.avatarUrl}
              alt={emp.fullName}
              className="w-18 h-18 rounded-xl object-cover ring-2 ring-blue-50 shadow-xs shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                  {emp.employeeCode}
                </span>
                <StatusBadge status={emp.status} />
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/50">
                  {emp.employmentType}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {emp.fullName}
              </h1>

              <p className="text-xs font-medium text-slate-600 mt-0.5">
                {emp.designationName} • <span className="text-blue-600 font-semibold">{emp.departmentName}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {emp.workEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {emp.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {emp.workLocation} ({emp.city})
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Reporting Manager</div>
              <div className="text-xs font-bold text-slate-800">{emp.managerName || "Direct to CEO"}</div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              Print Dossier
            </button>
          </div>
        </div>

        {/* Dossier Tabs */}
        <div className="flex border-b border-slate-100 mt-5 -mb-4 overflow-x-auto">
          {[
            { id: "overview", label: "Executive Overview" },
            { id: "employment", label: "Job & Structure" },
            { id: "compensation", label: "Compensation & Statutory (CTC)" },
            { id: "attendance", label: "Attendance & Leaves" },
            { id: "assets", label: "Allocated Assets" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-2 space-y-3.5">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly CTC</div>
                <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                  ₹ {emp.monthlyCtc.toLocaleString("en-IN")}
                </div>
                <div className="text-[10.5px] text-emerald-600 font-medium">Fixed Regular</div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tenure in Company</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  2 Yrs 8 Mos
                </div>
                <div className="text-[10.5px] text-blue-600 font-medium">Since {emp.joiningDate}</div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">98.2%</div>
                <div className="text-[10.5px] text-emerald-600 font-medium">High Reliability</div>
              </div>
            </div>

            {/* Statutory Overview */}
            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-2xs space-y-3">
              <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Statutory Identification
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[9.5px] text-slate-400 uppercase font-bold">PAN Number</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5 text-xs">{emp.pan}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[9.5px] text-slate-400 uppercase font-bold">Aadhaar (UID)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5 text-xs">{emp.aadhaar}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[9.5px] text-slate-400 uppercase font-bold">UAN (Provident Fund)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5 text-xs">{emp.uan}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[9.5px] text-slate-400 uppercase font-bold">ESI IP Number</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5 text-xs">{emp.esiNumber}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bank Account Details */}
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Salary Bank Account
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[9.5px] text-slate-400 uppercase font-semibold">Bank Name</div>
                  <div className="font-bold text-slate-800">{emp.bankName}</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400 uppercase font-semibold">Account Number</div>
                  <div className="font-mono font-bold text-slate-800">{emp.bankAccountNumber}</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400 uppercase font-semibold">IFSC Branch Code</div>
                  <div className="font-mono font-bold text-slate-800">{emp.bankIfsc}</div>
                </div>
                <div className="pt-1.5 border-t border-slate-100 text-[10.5px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Penny-drop verified
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "compensation" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Compensation & CTC Breakdown</h3>
              <p className="text-xs text-slate-500">Monthly component distribution under Indian statutory standards</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Annual Gross CTC</div>
              <div className="text-xl font-bold font-mono text-indigo-600">
                ₹ {(emp.monthlyCtc * 12).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* Earnings */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-100">
                Monthly Earnings
              </h4>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Basic Salary (50% of CTC)</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹ {(emp.monthlyCtc * 0.5).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">House Rent Allowance (HRA - 25%)</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹ {(emp.monthlyCtc * 0.25).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Special Allowance (25%)</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹ {(emp.monthlyCtc * 0.25).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 font-bold text-slate-900">
                <span>Total Monthly Gross</span>
                <span className="font-mono text-sm text-emerald-600">
                  ₹ {emp.monthlyCtc.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h4 className="font-bold text-rose-700 uppercase tracking-wider text-[11px] pb-1 border-b border-rose-100">
                Monthly Statutory Deductions
              </h4>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Employee Provident Fund (EPF 12% capped)</span>
                <span className="font-mono font-bold text-slate-800">₹ 1,800</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Employee State Insurance (ESI)</span>
                <span className="font-mono font-bold text-slate-800">₹ 0 (Exempt)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Professional Tax (PT)</span>
                <span className="font-mono font-bold text-slate-800">₹ 200</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Estimated TDS Withholding</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹ {Math.round(emp.monthlyCtc * 0.1).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 font-bold text-slate-900">
                <span>Net In-Hand Salary (Approx)</span>
                <span className="font-mono text-sm text-indigo-600">
                  ₹ {(emp.monthlyCtc - 2000 - Math.round(emp.monthlyCtc * 0.1)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "employment" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Organizational Assignment</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Business Unit / Department</div>
              <div className="font-bold text-slate-800 mt-1">{emp.departmentName}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Designation Title</div>
              <div className="font-bold text-slate-800 mt-1">{emp.designationName}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Employment Classification</div>
              <div className="font-bold text-slate-800 mt-1">{emp.employmentType}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Reporting Manager</div>
              <div className="font-bold text-slate-800 mt-1">{emp.managerName || "None"}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Duty Station Campus</div>
              <div className="font-bold text-slate-800 mt-1">{emp.workLocation}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Date of Joining</div>
              <div className="font-bold text-slate-800 mt-1">{emp.joiningDate}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Attendance & Leave History</h3>
            <Link
              to="/attendance/muster-roll"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Open Full Muster Roll <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-emerald-700 font-bold uppercase text-[10px]">Casual Leave (CL) Balance</div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">8 / 12</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">4 Days Utilized</div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div className="text-indigo-700 font-bold uppercase text-[10px]">Sick Leave (SL) Balance</div>
              <div className="text-2xl font-bold text-indigo-900 mt-1">10 / 10</div>
              <div className="text-[11px] text-indigo-600 mt-0.5">0 Days Utilized</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="text-purple-700 font-bold uppercase text-[10px]">Privilege Leave (PL) Balance</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">15 / 18</div>
              <div className="text-[11px] text-purple-600 mt-0.5">3 Days Utilized (Eligible for rollover)</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "assets" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Allocated IT & Physical Assets</h3>
          <div className="p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Apple MacBook Pro 16-inch M3 32GB</div>
                <div className="text-[11px] text-slate-400 font-mono">AST-LPT-2024-01 • Condition: Brand New</div>
              </div>
            </div>
            <StatusBadge status="Issued" tone="positive" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee360View;
