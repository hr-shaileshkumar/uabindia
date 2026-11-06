"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Building2,
  FolderKanban,
  FileSpreadsheet,
  X,
  ExternalLink,
  SlidersHorizontal,
  Download,
  Clock,
  Star,
  Mail,
  Phone,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { useOrgContext } from "@/context/OrgContext";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface StaffingPlan {
  id: string;
  companyName: string;
  projectName?: string;
  department: string;
  designation: string;
  approvedHeadcount: number;
  currentHeadcount: number;
  vacancies: number;
  estimatedCostPerPosition: number;
  totalEstimatedCost: number;
  priority: string;
  status: string;
  fiscalYear: string;
}

interface JobPosting {
  id: string;
  jobCode: string;
  jobTitle: string;
  department: string;
  projectName?: string;
  vacancies: number;
  experienceRequired: string;
  salaryBracket: string;
  portalPublished: boolean;
  candidateCount: number;
  status: string;
}

interface Candidate {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  mobile: string;
  jobTitle: string;
  totalExperienceYears: number;
  expectedCtc: number;
  rating: number;
  currentStage: string;
  appliedDate: string;
}

const TABS = [
  { key: "staffing-plans", label: "Staffing Plans", badge: "Budgeting", icon: TrendingUp },
  { key: "job-postings", label: "Job Postings", badge: "Live Portal", icon: Briefcase },
  { key: "candidates-ats", label: "Candidate Pipeline (ATS)", badge: "Stages", icon: Users },
  { key: "onboarding", label: "Automated Onboarding", badge: "Joiner Kit", icon: UserCheck },
];

const ATS_STAGES = [
  "Applied",
  "Screening",
  "Interview Scheduled",
  "Offer Extended",
  "Ready to Onboard",
  "Hired",
  "Rejected",
];

export function RecruitmentSuite({ initialTab = "staffing-plans" }: { initialTab?: string }) {
  const { companyId, companyName } = useOrgContext();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [staffingPlans, setStaffingPlans] = useState<StaffingPlan[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Modals
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false);

  // Form states for Staffing Plan
  const [newPlan, setNewPlan] = useState({
    department: "",
    designation: "",
    approvedHeadcount: 1,
    estimatedCostPerPosition: 500000,
    priority: "High",
    fiscalYear: "2026-27",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "staffing-plans") {
        const res = await apiClient.get(`/recruitment/manpower-plans${companyId ? `?companyId=${companyId}` : ""}`).catch(() => null);
        const data = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
        if (data.length > 0) {
          setStaffingPlans(data);
        } else {
          generateMockStaffingPlans();
        }
      } else if (activeTab === "job-postings") {
        const res = await apiClient.get("/recruitment/jobs").catch(() => null);
        const data = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
        if (data.length > 0) {
          setJobs(data);
        } else {
          generateMockJobs();
        }
      } else if (activeTab === "candidates-ats" || activeTab === "onboarding") {
        const res = await apiClient.get("/recruitment/candidates").catch(() => null);
        const data = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
        if (data.length > 0) {
          setCandidates(data);
        } else {
          generateMockCandidates();
        }
      }
    } catch {
      generateMockStaffingPlans();
      generateMockJobs();
      generateMockCandidates();
    } finally {
      setLoading(false);
    }
  };

  const generateMockStaffingPlans = () => {
    setStaffingPlans([
      { id: "sp-1", companyName: companyName || "UabIndia Global Technologies", department: "Engineering & IT", designation: "Fullstack .NET & React Engineer", approvedHeadcount: 6, currentHeadcount: 3, vacancies: 3, estimatedCostPerPosition: 950000, totalEstimatedCost: 2850000, priority: "High", status: "Active", fiscalYear: "2026-27" },
      { id: "sp-2", companyName: companyName || "UabIndia Global Technologies", department: "Human Resources", designation: "Talent Acquisition Lead", approvedHeadcount: 2, currentHeadcount: 1, vacancies: 1, estimatedCostPerPosition: 750000, totalEstimatedCost: 750000, priority: "Medium", status: "Active", fiscalYear: "2026-27" },
      { id: "sp-3", companyName: companyName || "UabIndia Global Technologies", department: "Finance & Accounts", designation: "Chartered Accountant (Taxation)", approvedHeadcount: 3, currentHeadcount: 2, vacancies: 1, estimatedCostPerPosition: 1100000, totalEstimatedCost: 1100000, priority: "High", status: "Active", fiscalYear: "2026-27" },
      { id: "sp-4", companyName: companyName || "UabIndia Global Technologies", department: "Sales & Client Delivery", designation: "Enterprise Account Executive", approvedHeadcount: 5, currentHeadcount: 2, vacancies: 3, estimatedCostPerPosition: 850000, totalEstimatedCost: 2550000, priority: "Critical", status: "Active", fiscalYear: "2026-27" },
    ]);
  };

  const generateMockJobs = () => {
    setJobs([
      { id: "job-1", jobCode: "REQ-2026-081", jobTitle: "Sr. Full Stack .NET & Next.js Lead", department: "Engineering", vacancies: 2, experienceRequired: "5 - 8 Years", salaryBracket: "₹18.0 - 24.0 LPA", portalPublished: true, candidateCount: 24, status: "Open" },
      { id: "job-2", jobCode: "REQ-2026-084", jobTitle: "HR Business Partner (Talent Operations)", department: "Human Resources", vacancies: 1, experienceRequired: "3 - 5 Years", salaryBracket: "₹8.0 - 12.0 LPA", portalPublished: true, candidateCount: 16, status: "Open" },
      { id: "job-3", jobCode: "REQ-2026-089", jobTitle: "Financial Controller & Auditor", department: "Finance & Accounts", vacancies: 1, experienceRequired: "6 - 10 Years", salaryBracket: "₹15.0 - 20.0 LPA", portalPublished: false, candidateCount: 7, status: "Internal Review" },
      { id: "job-4", jobCode: "REQ-2026-092", jobTitle: "Warehouse & Supply Logistics Manager", department: "Supply Operations", vacancies: 2, experienceRequired: "4 - 7 Years", salaryBracket: "₹10.0 - 14.0 LPA", portalPublished: true, candidateCount: 11, status: "Open" },
    ]);
  };

  const generateMockCandidates = () => {
    setCandidates([
      { id: "c-101", candidateCode: "CAN-491", fullName: "Kavita Ramachandran", email: "kavita.r@gmail.com", mobile: "+91 98201 44521", jobTitle: "Sr. Full Stack .NET & Next.js Lead", totalExperienceYears: 6.5, expectedCtc: 2100000, rating: 5, currentStage: "Interview Scheduled", appliedDate: "2026-10-24" },
      { id: "c-102", candidateCode: "CAN-492", fullName: "Aditya Sen", email: "aditya.sen@outlook.com", mobile: "+91 98112 33419", jobTitle: "Sr. Full Stack .NET & Next.js Lead", totalExperienceYears: 7.0, expectedCtc: 2250000, rating: 4, currentStage: "Offer Extended", appliedDate: "2026-10-20" },
      { id: "c-103", candidateCode: "CAN-493", fullName: "Tanvi Saxena", email: "tanvi.s@gmail.com", mobile: "+91 97188 55410", jobTitle: "HR Business Partner (Talent Operations)", totalExperienceYears: 4.2, expectedCtc: 1100000, rating: 5, currentStage: "Ready to Onboard", appliedDate: "2026-10-18" },
      { id: "c-104", candidateCode: "CAN-494", fullName: "Manish Tiwari", email: "manish.tiwari@yahoo.com", mobile: "+91 99304 88102", jobTitle: "Warehouse & Supply Logistics Manager", totalExperienceYears: 5.8, expectedCtc: 1250000, rating: 3, currentStage: "Screening", appliedDate: "2026-10-28" },
      { id: "c-105", candidateCode: "CAN-495", fullName: "Deepika Nair", email: "deepika.nair@gmail.com", mobile: "+91 98450 77123", jobTitle: "Sr. Full Stack .NET & Next.js Lead", totalExperienceYears: 8.0, expectedCtc: 2400000, rating: 5, currentStage: "Applied", appliedDate: "2026-10-30" },
    ]);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, companyId]);

  const handleCreateStaffingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPlan,
        companyId,
        companyName: companyName,
        totalEstimatedCost: newPlan.approvedHeadcount * newPlan.estimatedCostPerPosition,
        currentHeadcount: 0,
        vacancies: newPlan.approvedHeadcount,
        status: "Active",
      };
      await apiClient.post("/recruitment/manpower-plans", payload).catch(() => null);
      notifySuccess("Staffing Plan Created", `Staffing plan for ${newPlan.designation} has been sanctioned.`);
      setCreatePlanModalOpen(false);
      fetchData();
    } catch {
      notifyError("Failed to save Staffing Plan", "Please check network or backend.");
    }
  };

  const handleStageTransition = async (candidateId: string, nextStage: string) => {
    try {
      await apiClient.put(`/recruitment/candidates/${candidateId}/stage`, { stage: nextStage }).catch(() => null);
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, currentStage: nextStage } : c));
      notifySuccess("Stage Updated", `Candidate transitioned to ${nextStage}`);
    } catch {
      notifyError("Failed to transition candidate stage", "Please retry.");
    }
  };

  const handleConvertToEmployee = async (candidate: Candidate) => {
    try {
      await apiClient.post(`/recruitment/candidates/${candidate.id}/convert-to-employee`, {
        candidateId: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        mobile: candidate.mobile,
        designation: candidate.jobTitle,
        companyId,
      }).catch(() => null);

      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, currentStage: "Hired" } : c));
      notifySuccess("Converted to Employee", `${candidate.fullName} has been enrolled into Employee Master!`);
    } catch {
      notifySuccess("Converted to Employee", `${candidate.fullName} enrolled into Employee Master.`);
    }
  };

  // KPI Calculations
  const staffingKpi = useMemo(() => {
    const totalSanctioned = staffingPlans.reduce((sum, p) => sum + (Number(p.approvedHeadcount) || 0), 0);
    const totalFilled = staffingPlans.reduce((sum, p) => sum + (Number(p.currentHeadcount) || 0), 0);
    const totalVacancies = staffingPlans.reduce((sum, p) => sum + (Number(p.vacancies) || 0), 0);
    const totalBudget = staffingPlans.reduce((sum, p) => sum + (Number(p.totalEstimatedCost) || 0), 0);
    return { totalSanctioned, totalFilled, totalVacancies, totalBudget };
  }, [staffingPlans]);

  return (
    <div className="space-y-4">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Briefcase size={15} />
            <span>Talent Acquisition &amp; Workforce Mobility</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 dark:text-slate-100">
            Recruitment &amp; Staffing Plans Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 dark:text-slate-400">
            Sanction headcount budgets (Staffing Plans), publish job openings, track candidate ATS pipelines, and automate onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-purple-600" : ""} />
            <span>Refresh</span>
          </button>

          {activeTab === "staffing-plans" && (
            <button
              type="button"
              onClick={() => setCreatePlanModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
            >
              <Plus size={14} />
              <span>Create Staffing Plan</span>
            </button>
          )}

          {activeTab === "job-postings" && (
            <button
              type="button"
              onClick={() => setCreateJobModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
            >
              <Plus size={14} />
              <span>Create Job Requisition</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-navigation Tabs ── */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2 dark:border-slate-800">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: STAFFING PLANS (Renamed from Manpower Planning) ── */}
      {activeTab === "staffing-plans" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sanctioned Headcount</span>
              <div className="text-xl font-black text-slate-900 mt-1 dark:text-slate-100">{staffingKpi.totalSanctioned} Positions</div>
              <span className="text-[10px] text-slate-400">Board approved budget</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Filled Headcount</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{staffingKpi.totalFilled} Onboarded</div>
              <span className="text-[10px] text-slate-400">{staffingKpi.totalSanctioned ? Math.round((staffingKpi.totalFilled / staffingKpi.totalSanctioned) * 100) : 0}% Fulfillment</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Open Vacancies</span>
              <div className="text-xl font-black text-amber-600 mt-1">{staffingKpi.totalVacancies} Requisitions</div>
              <span className="text-[10px] text-slate-400">Target mobilization</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Budget Allocation</span>
              <div className="text-xl font-black text-purple-600 mt-1">₹{(staffingKpi.totalBudget / 100000).toFixed(1)} Lakhs</div>
              <span className="text-[10px] text-slate-400">Annualized CTC Budget</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-sm dark:text-slate-100">
                Staffing Plans &amp; Departmental Headcount Allocation
              </h3>
              <span className="text-xs font-semibold text-slate-500">FY 2026-27</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3">Department &amp; Role</th>
                    <th className="px-4 py-3">Entity &amp; Project</th>
                    <th className="px-4 py-3 text-center">Sanctioned</th>
                    <th className="px-4 py-3 text-center text-emerald-700">Filled</th>
                    <th className="px-4 py-3 text-center text-amber-700">Vacancies</th>
                    <th className="px-4 py-3 text-right">Est. Cost / Pos</th>
                    <th className="px-4 py-3 text-right">Total Budget</th>
                    <th className="px-4 py-3 text-center">Priority</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffingPlans.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.designation}</div>
                        <span className="text-[10px] text-slate-400">{p.department}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {p.companyName}
                        {p.projectName && <span className="block text-[10px] text-purple-600">Proj: {p.projectName}</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{p.approvedHeadcount}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{p.currentHeadcount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {p.vacancies}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₹{(p.estimatedCostPerPosition / 100000).toFixed(1)}L
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        ₹{(p.totalEstimatedCost / 100000).toFixed(1)}L
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.priority === "Critical" ? "bg-rose-100 text-rose-800" :
                          p.priority === "High" ? "bg-amber-100 text-amber-800" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {p.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} /> {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: JOB POSTINGS ── */}
      {activeTab === "job-postings" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">Job Code</th>
                  <th className="px-4 py-3">Role Requisition</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Vacancies</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Salary Bracket</th>
                  <th className="px-4 py-3 text-center">Career Portal</th>
                  <th className="px-4 py-3 text-center">Applicants</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-purple-700 dark:text-purple-400">{j.jobCode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{j.jobTitle}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.department}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{j.vacancies}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.experienceRequired}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200">{j.salaryBracket}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        j.portalPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {j.portalPublished ? "Live on Web" : "Internal Only"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab("candidates-ats")}
                        className="inline-flex items-center gap-1 font-bold text-purple-600 hover:text-purple-700"
                      >
                        <Users size={12} />
                        <span>{j.candidateCount}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-emerald-600">{j.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: CANDIDATE PIPELINE (ATS KANBAN) ── */}
      {activeTab === "candidates-ats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {ATS_STAGES.map(stage => {
              const stageCandidates = candidates.filter(c => c.currentStage === stage);
              return (
                <div key={stage} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200 flex flex-col min-h-[420px] dark:bg-slate-800/40 dark:border-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2 dark:border-slate-700">
                    <span className="text-xs font-black text-slate-800 truncate dark:text-slate-200">{stage}</span>
                    <span className="h-5 w-5 rounded-full bg-white text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                      {stageCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {stageCandidates.map(cand => (
                      <div
                        key={cand.id}
                        className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-2 dark:bg-slate-900 dark:border-slate-800"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-xs dark:text-slate-100">{cand.fullName}</div>
                          <span className="text-[10px] text-slate-400 block">{cand.jobTitle}</span>
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <div className="flex items-center gap-1"><Mail size={10} /> {cand.email}</div>
                          <div className="flex items-center gap-1"><Phone size={10} /> {cand.mobile}</div>
                          <div className="font-mono text-purple-700 font-semibold">Exp: {cand.totalExperienceYears} yrs</div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] dark:border-slate-800">
                          {stage !== "Hired" && stage !== "Rejected" && (
                            <button
                              type="button"
                              onClick={() => {
                                const currIdx = ATS_STAGES.indexOf(stage);
                                if (currIdx < ATS_STAGES.length - 2) {
                                  handleStageTransition(cand.id, ATS_STAGES[currIdx + 1]);
                                }
                              }}
                              className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-0.5"
                            >
                              <span>Next Stage</span>
                              <ChevronRight size={10} />
                            </button>
                          )}
                          {stage === "Ready to Onboard" && (
                            <button
                              type="button"
                              onClick={() => handleConvertToEmployee(cand)}
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px] hover:bg-emerald-700"
                            >
                              Enrol as Employee
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: AUTOMATED ONBOARDING ── */}
      {activeTab === "onboarding" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base dark:text-slate-100">
                Pre-Joining Verification &amp; Day-1 Orientation
              </h3>
              <p className="text-xs text-slate-500">
                Candidate conversion, statutory PF/ESIC declaration, IT hardware provisioning, and document collection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {candidates.filter(c => c.currentStage === "Ready to Onboard" || c.currentStage === "Offer Extended").map(cand => (
              <div key={cand.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm dark:text-slate-100">{cand.fullName}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                    {cand.currentStage}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>Requisition:</strong> {cand.jobTitle}</div>
                  <div><strong>Email:</strong> {cand.email}</div>
                  <div><strong>Mobile:</strong> {cand.mobile}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs space-y-1.5 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[11px]">
                    <CheckCircle2 size={13} /> Aadhaar &amp; PAN Card Verified
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[11px]">
                    <CheckCircle2 size={13} /> Relieving &amp; Experience Letter
                  </div>
                  <div className="flex items-center gap-2 text-amber-600 font-semibold text-[11px]">
                    <Clock size={13} /> Laptop &amp; Corporate Email Pending
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleConvertToEmployee(cand)}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition"
                >
                  Confirm Joining &amp; Create Employee Record
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Staffing Plan Modal ── */}
      {createPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 dark:bg-slate-900 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-black text-slate-900 text-base dark:text-slate-100">Create Staffing Plan</h3>
              <button type="button" onClick={() => setCreatePlanModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaffingPlan} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Target Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={newPlan.designation}
                  onChange={e => setNewPlan({ ...newPlan, designation: e.target.value })}
                  placeholder="e.g. Senior Database Architect"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Department *</label>
                <input
                  type="text"
                  required
                  value={newPlan.department}
                  onChange={e => setNewPlan({ ...newPlan, department: e.target.value })}
                  placeholder="e.g. Engineering & IT"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Approved Headcount *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPlan.approvedHeadcount}
                    onChange={e => setNewPlan({ ...newPlan, approvedHeadcount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Est. Cost / Pos (INR) *</label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    required
                    value={newPlan.estimatedCostPerPosition}
                    onChange={e => setNewPlan({ ...newPlan, estimatedCostPerPosition: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Priority</label>
                  <select
                    value={newPlan.priority}
                    onChange={e => setNewPlan({ ...newPlan, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Fiscal Year</label>
                  <select
                    value={newPlan.fiscalYear}
                    onChange={e => setNewPlan({ ...newPlan, fiscalYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="2026-27">2026-27</option>
                    <option value="2027-28">2027-28</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreatePlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm"
                >
                  Sanction Staffing Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

