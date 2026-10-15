"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Briefcase,
  Users,
  FileText,
  Calendar,
  Award,
  CheckCircle2,
  Plus,
  Search,
  ExternalLink,
  Printer,
  ChevronRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Building2,
  Clock,
  Send,
  UserCheck,
  Check,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { hrmsApi } from "@/services/modules/hrms";
import { useOrgContext } from "@/context/OrgContext";
import { notifyError, notifySuccess } from "@/lib/notifications";
import AppointmentLetterModal, { AppointmentLetterData } from "@/features/hrms/components/AppointmentLetterModal";

interface StaffingPlan {
  id: string;
  planCode: string;
  planTitle: string;
  department: string;
  designation: string;
  fiscalYear: number;
  quarter?: string;
  budget: number;
  targetHeadcount: number;
  currentHeadcount: number;
  vacancies: number;
  hiredCount: number;
  status: string;
  createdAt: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  level: string;
  minSalary: number;
  maxSalary: number;
  numberOfPositions: number;
  status: string;
  isActive: boolean;
  staffingPlanId?: string;
  closingDate?: string;
  postedDate?: string;
}

interface JobApplication {
  id: string;
  candidateId: string;
  candidateName: string;
  email: string;
  phoneNumber?: string;
  currentCompany?: string;
  currentDesignation?: string;
  yearsOfExperience: number;
  resume?: string;
  coverLetter?: string;
  jobPostingId: string;
  jobTitle: string;
  department: string;
  status: string;
  candidateStatus: string;
  overallRating: string;
  screeningRound?: string;
  applicationDate: string;
  interviewDate?: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  currentCompany?: string;
  currentDesignation?: string;
  yearsOfExperience: number;
  resume?: string;
  coverLetter?: string;
  status: string;
  overallRating: string;
  sourceOfRecruit?: string;
  notes?: string;
  appliedDate: string;
  interviewDate?: string;
  jobPostingId: string;
  jobTitle?: string;
}

interface OfferLetter {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobPostingId?: string;
  jobTitle?: string;
  department?: string;
  joiningDesignation: string;
  offerSalary: number;
  annualCtc: number;
  monthlyGross: number;
  offerDate: string;
  joiningDate?: string;
  reportingManager?: string;
  offerTerms?: string;
  status: string;
  isJoined: boolean;
  employeeId?: string;
  employeeCode?: string;
}

interface AppointmentLetter {
  id: string;
  letterNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail?: string;
  employeePhone?: string;
  issueDate: string;
  joiningDate: string;
  designation: string;
  department: string;
  workLocation?: string;
  annualCtc: number;
  monthlyGross: number;
  probationMonths: number;
  noticePeriodDays: number;
  termsAndConditions?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  status: string;
}

export default function RecruitmentHub() {
  const {
    companyId,
    companyName,
    companyLegalName,
    companyLogoUrl,
    companyAddress,
    companyGstin,
    companyBrandColor,
    companyAccentColor,
    companyLetterheadLayout,
    companySignatoryName,
    companySignatoryDesignation,
    projectId,
    projectName,
  } = useOrgContext();
  const [activeTab, setActiveTab] = useState<
    "staffing" | "openings" | "applications" | "interviews" | "offers" | "appointments"
  >("staffing");

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Data states
  const [staffingPlans, setStaffingPlans] = useState<StaffingPlan[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [appointmentLetters, setAppointmentLetters] = useState<AppointmentLetter[]>([]);

  // Modals & form states
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    planTitle: "",
    department: "Engineering",
    designation: "Software Engineer",
    fiscalYear: new Date().getFullYear(),
    quarter: "Q1",
    budget: 2500000,
    targetHeadcount: 3,
    currentHeadcount: 0,
  });

  const [newPostingModal, setNewPostingModal] = useState(false);
  const [postingForm, setPostingForm] = useState(() => ({
    title: "",
    department: "Engineering",
    location: "Noida / Remote",
    jobType: "FullTime",
    level: "MidLevel",
    minSalary: 800000,
    maxSalary: 1400000,
    numberOfPositions: 2,
    closingDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    staffingPlanId: "",
    requiredSkills: "React, TypeScript, C#, .NET, SQL",
    description: "Seeking a passionate engineer to join our high-growth enterprise platform team.",
  }));

  const [interviewModal, setInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewForm, setInterviewForm] = useState(() => ({
    candidateId: "",
    roundName: "Technical Round 1",
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    interviewer: "Hiring Manager",
  }));

  const [evaluationModal, setEvaluationModal] = useState(false);
  const [evalForm, setEvalForm] = useState({
    candidateId: "",
    screeningStatus: "Passed",
    technicalRating: "Proficient",
    communicationRating: "Good",
    culturalFitRating: "Good",
    overallScore: 85,
    comments: "Strong technical knowledge, clear communication, highly recommended.",
  });

  const [offerModal, setOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState(() => ({
    candidateId: "",
    candidateName: "",
    joiningDesignation: "Software Engineer",
    department: "Engineering",
    offerSalary: 1200000,
    joiningDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    reportingManager: "VP of Engineering",
    offerTerms: "Standard probation of 6 months. Standard medical and annual performance bonus.",
  }));

  const [appointmentModal, setAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(() => ({
    employeeId: "",
    designation: "Software Engineer",
    department: "Engineering",
    joiningDate: new Date().toISOString().slice(0, 10),
    annualCtc: 1200000,
    probationMonths: 6,
    noticePeriodDays: 60,
    workLocation: "Corporate Headquarters, Noida",
    signatoryName: "Shailesh Kumar",
    signatoryDesignation: "Director - Human Resources",
  }));

  // Printable Appointment Letter state
  const [activePrintLetter, setActivePrintLetter] = useState<AppointmentLetterData | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Load all initial recruitment data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, postingsRes, appsRes, candRes, offersRes, apptRes] = await Promise.allSettled([
        hrmsApi.recruitment.getStaffingPlans(),
        hrmsApi.recruitment.jobPostings(1, 50),
        hrmsApi.recruitment.getApplications({ page: 1, limit: 100 }),
        hrmsApi.recruitment.getCandidates({ page: 1, limit: 100 }),
        hrmsApi.recruitment.getOfferLetters({ page: 1, limit: 100 }),
        hrmsApi.recruitment.getAppointmentLetters({ page: 1, limit: 100 }),
      ]);

      if (plansRes.status === "fulfilled") {
        const raw = plansRes.value.data;
        setStaffingPlans(Array.isArray(raw) ? raw : raw?.data || raw?.items || []);
      }
      if (postingsRes.status === "fulfilled") {
        const raw = postingsRes.value.data;
        setJobPostings(raw?.jobPostings || raw?.data || raw?.items || []);
      }
      if (appsRes.status === "fulfilled") {
        const raw = appsRes.value.data;
        setApplications(raw?.data || raw?.items || (Array.isArray(raw) ? raw : []));
      }
      if (candRes.status === "fulfilled") {
        const raw = candRes.value.data;
        setCandidates(raw?.data || raw?.items || (Array.isArray(raw) ? raw : []));
      }
      if (offersRes.status === "fulfilled") {
        const raw = offersRes.value.data;
        setOfferLetters(raw?.data || raw?.items || (Array.isArray(raw) ? raw : []));
      }
      if (apptRes.status === "fulfilled") {
        const raw = apptRes.value.data;
        setAppointmentLetters(raw?.data || raw?.items || (Array.isArray(raw) ? raw : []));
      }
    } catch {
      notifyError("Failed to fetch recruitment lifecycle data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick stats calculations
  const stats = useMemo(() => {
    const totalVacancies = staffingPlans.reduce((acc, p) => acc + (p.vacancies || 0), 0);
    const activeOpenings = jobPostings.filter((p) => p.isActive).length;
    const totalApps = applications.length;
    const totalOffers = offerLetters.length;
    const totalJoined = offerLetters.filter((o) => o.isJoined).length;
    const totalApptLetters = appointmentLetters.length;
    return { totalVacancies, activeOpenings, totalApps, totalOffers, totalJoined, totalApptLetters };
  }, [staffingPlans, jobPostings, applications, offerLetters, appointmentLetters]);

  // Handlers for Staffing Plans
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrmsApi.recruitment.createStaffingPlan({
        ...planForm,
        companyId: companyId || undefined,
        projectId: projectId || undefined,
      });
      notifySuccess("Staffing Plan created successfully!");
      setNewPlanModal(false);
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to create Staffing Plan");
    }
  };

  const handleApprovePlan = async (id: string) => {
    try {
      await hrmsApi.recruitment.approveStaffingPlan(id);
      notifySuccess("Staffing Plan approved for hiring!");
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to approve Staffing Plan");
    }
  };

  // Handlers for Job Postings
  const handleCreatePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrmsApi.recruitment.createJobPosting({
        ...postingForm,
        companyId: companyId || undefined,
        projectId: projectId || undefined,
        staffingPlanId: postingForm.staffingPlanId || undefined,
      });
      notifySuccess("Job Opening created successfully!");
      setNewPostingModal(false);
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to create Job Opening");
    }
  };

  const handlePublishPosting = async (id: string) => {
    try {
      await hrmsApi.recruitment.publishJobPosting(id);
      notifySuccess("Job opening published live to Careers Portal (/careers)!");
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to publish Job Opening");
    }
  };

  const handleClosePosting = async (id: string) => {
    try {
      await hrmsApi.recruitment.closeJobPosting(id);
      notifySuccess("Job opening closed.");
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to close Job Opening");
    }
  };

  // Handlers for Interview & Screenings
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewForm.candidateId) return;
    try {
      await hrmsApi.recruitment.scheduleScreening(interviewForm.candidateId, {
        roundName: interviewForm.roundName,
        scheduledDate: interviewForm.scheduledDate,
        interviewer: interviewForm.interviewer,
      });
      notifySuccess("Interview round scheduled successfully!");
      setInterviewModal(false);
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to schedule interview");
    }
  };

  const handleOpenEvaluation = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setEvalForm({
      candidateId: cand.id,
      screeningStatus: "Passed",
      technicalRating: "Proficient",
      communicationRating: "Good",
      culturalFitRating: "Good",
      overallScore: 85,
      comments: "Candidate demonstrated solid expertise and strong fit.",
    });
    setEvaluationModal(true);
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      await hrmsApi.recruitment.updateCandidateStatus(
        selectedCandidate.id,
        evalForm.screeningStatus === "Passed" ? "Shortlisted" : "Rejected",
        evalForm.comments
      );
      notifySuccess(`Evaluation recorded. Candidate marked as ${evalForm.screeningStatus === "Passed" ? "Shortlisted" : "Rejected"}!`);
      setEvaluationModal(false);
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to submit evaluation");
    }
  };

  // Handlers for Offer Letters
  const handleOpenOfferModal = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setOfferForm({
      candidateId: cand.id,
      candidateName: cand.fullName,
      joiningDesignation: cand.currentDesignation || "Software Engineer",
      department: "Engineering",
      offerSalary: 1200000,
      joiningDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      reportingManager: "VP of Engineering",
      offerTerms: "Standard probation of 6 months. Standard medical and annual performance bonus.",
    });
    setOfferModal(true);
  };

  const handleIssueOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      await hrmsApi.recruitment.issueOfferLetter(selectedCandidate.id, {
        offerSalary: Number(offerForm.offerSalary),
        joiningDate: offerForm.joiningDate,
        joiningDesignation: offerForm.joiningDesignation,
        department: offerForm.department,
        reportingManager: offerForm.reportingManager,
        offerTerms: offerForm.offerTerms,
      });
      notifySuccess(`Formal Offer Letter issued to ${selectedCandidate.fullName}!`);
      setOfferModal(false);
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to issue offer letter");
    }
  };

  const handleAcceptOffer = async (id: string) => {
    try {
      await hrmsApi.recruitment.acceptOfferLetter(id);
      notifySuccess("Candidate offer marked as Accepted!");
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to accept offer");
    }
  };

  const handleRejectOffer = async (id: string) => {
    try {
      await hrmsApi.recruitment.rejectOfferLetter(id, "Declined by candidate");
      notifySuccess("Offer letter marked as Rejected.");
      loadData();
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to reject offer");
    }
  };

  // Convert Candidate to Employee (1-Click Onboarding)
  const handleConvertToEmployee = async (offerId: string) => {
    try {
      const res = await hrmsApi.recruitment.convertToEmployee(offerId);
      const msg = res.data?.message || "Candidate successfully onboarded as Employee!";
      notifySuccess(msg);
      loadData();
      setActiveTab("appointments");
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to onboard candidate as employee");
    }
  };

  // Issue Appointment Letter
  const handleOpenAppointmentModal = (offer: OfferLetter) => {
    if (!offer.employeeId) {
      notifyError("Please onboard candidate as Employee first.");
      return;
    }
    setAppointmentForm({
      employeeId: offer.employeeId,
      designation: offer.joiningDesignation,
      department: offer.department || "Engineering",
      joiningDate: offer.joiningDate || new Date().toISOString().slice(0, 10),
      annualCtc: offer.annualCtc || offer.offerSalary,
      probationMonths: 6,
      noticePeriodDays: 60,
      workLocation: "Corporate Headquarters, Noida",
      signatoryName: "Shailesh Kumar",
      signatoryDesignation: "Director - Human Resources",
    });
    setAppointmentModal(true);
  };

  const handleIssueAppointmentLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await hrmsApi.recruitment.issueAppointmentLetter(appointmentForm);
      notifySuccess("Official Appointment Letter issued successfully!");
      setAppointmentModal(false);
      loadData();
      if (res.data?.data) {
        handleViewPrintLetter(res.data.data);
      }
    } catch (err: unknown) {
      notifyError((err as Error)?.message || "Failed to issue appointment letter");
    }
  };

  const handleViewPrintLetter = (letter: AppointmentLetter) => {
    setActivePrintLetter({
      id: letter.id,
      letterNumber: letter.letterNumber,
      employeeName: letter.employeeName,
      employeeCode: letter.employeeCode,
      employeeEmail: letter.employeeEmail,
      employeePhone: letter.employeePhone,
      designation: letter.designation,
      department: letter.department,
      workLocation: letter.workLocation,
      joiningDate: letter.joiningDate,
      issueDate: letter.issueDate,
      annualCtc: letter.annualCtc,
      monthlyGross: letter.monthlyGross,
      probationMonths: letter.probationMonths,
      noticePeriodDays: letter.noticePeriodDays,
      termsAndConditions: letter.termsAndConditions,
      signatoryName: letter.signatoryName || companySignatoryName || "Authorized Signatory",
      signatoryDesignation: letter.signatoryDesignation || companySignatoryDesignation || "Head of People Operations",
      companyName: companyLegalName || companyName || "Corporate Enterprise",
      companyLegalName: companyLegalName || companyName || undefined,
      companyAddress: companyAddress || undefined,
      companyGstin: companyGstin || undefined,
      companyLogoUrl: companyLogoUrl || undefined,
      brandColor: companyBrandColor || undefined,
      accentColor: companyAccentColor || undefined,
      letterheadLayout: (companyLetterheadLayout as any) || undefined,
    });
    setPrintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Enterprise Recruitment Lifecycle &amp; ATS Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Senior HR &amp; Engineering Operations: Staffing Plans &rarr; Job Openings &rarr; Careers Portal &rarr; ATS &rarr; Interviews &rarr; Offer Letters &rarr; Employee Onboarding &rarr; Appointment Letters
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Live Careers Portal (/careers)
          </a>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Headcount Vacancies</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalVacancies}</p>
          <span className="text-[11px] text-amber-600 font-medium">From Staffing Plans</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Live Job Openings</span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.activeOpenings}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Published on Portal</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">ATS Applications</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalApps}</p>
          <span className="text-[11px] text-blue-600 font-medium">Received Candidates</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Offers Issued</span>
            <Send className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalOffers}</p>
          <span className="text-[11px] text-purple-600 font-medium">Formal CTC Packages</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Joined Employees</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalJoined}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Converted (EMP-*)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Appointment Letters</span>
            <Award className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalApptLetters}</p>
          <span className="text-[11px] text-teal-600 font-medium">Issued &amp; Printable</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("staffing")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === "staffing"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          1. Staffing Plans ({staffingPlans.length})
        </button>

        <button
          onClick={() => setActiveTab("openings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === "openings"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          2. Job Openings ({jobPostings.length})
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === "applications"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          3. ATS Applications ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab("interviews")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === "interviews"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          4. Interview Process ({candidates.filter((c) => c.status === "Interview" || c.interviewDate).length})
        </button>

        <button
          onClick={() => setActiveTab("offers")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === "offers"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          5. Offer Letters ({offerLetters.length})
        </button>

        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition shrink-0 ${
            activeTab === "appointments"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Award className="w-4 h-4" />
          6. Onboarding &amp; Appointments ({appointmentLetters.length})
        </button>
      </div>

      {/* Tab 1: Staffing Plans */}
      {activeTab === "staffing" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manpower Staffing Plans</h2>
              <p className="text-xs text-slate-500">
                Departmental headcount budgets and vacancy management. Approved plans allow creating linked Job Openings.
              </p>
            </div>
            <button
              onClick={() => setNewPlanModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow"
            >
              <Plus className="w-4 h-4" />
              New Staffing Plan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Plan Code</th>
                  <th className="py-3 px-4">Plan Title &amp; Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Fiscal / Quarter</th>
                  <th className="py-3 px-4">Budget (INR)</th>
                  <th className="py-3 px-4">Target vs Hired</th>
                  <th className="py-3 px-4">Vacancies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffingPlans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No staffing plans found. Click &quot;New Staffing Plan&quot; to create your first manpower requisition plan.
                    </td>
                  </tr>
                ) : (
                  staffingPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{plan.planCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{plan.planTitle}</div>
                        <div className="text-[11px] text-slate-500">{plan.designation}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{plan.department}</td>
                      <td className="py-3 px-4 text-slate-600">
                        FY {plan.fiscalYear} {plan.quarter ? `(${plan.quarter})` : ""}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        ₹{(plan.budget || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600">{plan.hiredCount || 0}</span>
                          <span className="text-slate-400">/</span>
                          <span className="font-bold text-slate-800">{plan.targetHeadcount}</span>
                        </div>
                        <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, ((plan.hiredCount || 0) / (plan.targetHeadcount || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          {plan.vacancies} open
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            plan.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : plan.status === "Closed"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {plan.status === "Approved" && <Check className="w-3 h-3" />}
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {plan.status === "Draft" ? (
                          <button
                            onClick={() => handleApprovePlan(plan.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
                          >
                            Approve Plan
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPostingForm((prev) => ({
                                ...prev,
                                staffingPlanId: plan.id,
                                department: plan.department,
                                title: plan.designation,
                                numberOfPositions: plan.vacancies || 1,
                              }));
                              setActiveTab("openings");
                              setNewPostingModal(true);
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition"
                          >
                            + Post Job
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Job Openings */}
      {activeTab === "openings" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Job Openings (Requisitions)</h2>
              <p className="text-xs text-slate-500">
                Jobs linked to approved Staffing Plans. Once published, candidates can apply directly from the Careers Portal.
              </p>
            </div>
            <button
              onClick={() => setNewPostingModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow"
            >
              <Plus className="w-4 h-4" />
              Create Job Opening
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Title &amp; Department</th>
                  <th className="py-3 px-4">Linked Staffing Plan</th>
                  <th className="py-3 px-4">Location / Type</th>
                  <th className="py-3 px-4">Positions</th>
                  <th className="py-3 px-4">Salary Range (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobPostings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No job postings found. Click &quot;Create Job Opening&quot; to link a posting to your staffing plan.
                    </td>
                  </tr>
                ) : (
                  jobPostings.map((job) => {
                    const linkedPlan = staffingPlans.find((p) => p.id === job.staffingPlanId);
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm">{job.title}</div>
                          <div className="text-[11px] text-slate-500">{job.department}</div>
                        </td>
                        <td className="py-3 px-4">
                          {linkedPlan ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {linkedPlan.planCode} ({linkedPlan.planTitle})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Direct Posting</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div>{job.location}</div>
                          <div className="text-[11px] text-slate-400">{job.jobType} &bull; {job.level}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{job.numberOfPositions || 1}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          ₹{(job.minSalary || 0).toLocaleString("en-IN")} - ₹{(job.maxSalary || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              job.isActive && job.status?.toLowerCase() === "open"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {job.isActive ? "Live on Careers" : "Closed / Draft"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {!job.isActive ? (
                            <button
                              onClick={() => handlePublishPosting(job.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
                            >
                              Publish Live
                            </button>
                          ) : (
                            <button
                              onClick={() => handleClosePosting(job.id)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Applications & Candidates (ATS Ledger) */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Applicant Tracking System (ATS Ledger)</h2>
              <p className="text-xs text-slate-500">
                All candidates who applied via the Careers Portal or direct recruitment pipeline.
              </p>
            </div>
            <div className="relative w-72">
              <Search className="pointer-events-none w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate, email, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Applied Role &amp; Dept</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Experience / Org</th>
                  <th className="py-3 px-4">Application Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No applications received yet. As candidates submit applications via the Careers Portal, they will appear here automatically!
                    </td>
                  </tr>
                ) : (
                  applications
                    .filter((a) => {
                      const q = searchTerm.toLowerCase();
                      return (
                        !q ||
                        a.candidateName?.toLowerCase().includes(q) ||
                        a.email?.toLowerCase().includes(q) ||
                        a.jobTitle?.toLowerCase().includes(q)
                      );
                    })
                    .map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm">{app.candidateName}</div>
                          {app.resume && (
                            <div className="text-[11px] text-indigo-600 truncate max-w-xs">{app.resume}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{app.jobTitle || "General Application"}</div>
                          <div className="text-[11px] text-slate-500">{app.department || "Operations"}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div>{app.email}</div>
                          <div className="text-[11px] text-slate-400">{app.phoneNumber || "No phone"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {app.yearsOfExperience === 0 ? "Fresher (0 yrs)" : `${app.yearsOfExperience} yrs`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {app.currentDesignation || "Graduate"} &bull; {app.currentCompany || "N/A"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(app.applicationDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              app.candidateStatus === "Joined"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : app.candidateStatus === "Offered"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : app.candidateStatus === "Interview"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : app.candidateStatus === "Shortlisted"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {app.candidateStatus || app.status || "Applied"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              const cand = candidates.find((c) => c.id === app.candidateId) || {
                                id: app.candidateId,
                                firstName: app.candidateName.split(" ")[0] || "Candidate",
                                lastName: app.candidateName.split(" ").slice(1).join(" ") || "",
                                fullName: app.candidateName,
                                email: app.email,
                                phoneNumber: app.phoneNumber,
                                currentCompany: app.currentCompany,
                                currentDesignation: app.currentDesignation,
                                yearsOfExperience: app.yearsOfExperience,
                                resume: app.resume,
                                coverLetter: app.coverLetter,
                                status: app.candidateStatus,
                                overallRating: app.overallRating,
                                appliedDate: app.applicationDate,
                                jobPostingId: app.jobPostingId,
                                jobTitle: app.jobTitle,
                              };
                              setSelectedCandidate(cand);
                              setInterviewForm({
                                candidateId: app.candidateId,
                                roundName: "Technical Round 1",
                                scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                                interviewer: "Technical Lead",
                              });
                              setInterviewModal(true);
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition"
                          >
                            Schedule Interview
                          </button>
                          <button
                            onClick={() => {
                              const cand = candidates.find((c) => c.id === app.candidateId) || {
                                id: app.candidateId,
                                firstName: app.candidateName.split(" ")[0] || "Candidate",
                                lastName: app.candidateName.split(" ").slice(1).join(" ") || "",
                                fullName: app.candidateName,
                                email: app.email,
                                phoneNumber: app.phoneNumber,
                                currentCompany: app.currentCompany,
                                currentDesignation: app.currentDesignation,
                                yearsOfExperience: app.yearsOfExperience,
                                status: app.candidateStatus,
                                overallRating: app.overallRating,
                                appliedDate: app.applicationDate,
                                jobPostingId: app.jobPostingId,
                                jobTitle: app.jobTitle,
                              };
                              handleOpenOfferModal(cand);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-sm transition"
                          >
                            Issue Offer
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Interview Process */}
      {activeTab === "interviews" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Interview Process &amp; Evaluation</h2>
              <p className="text-xs text-slate-500">
                Conduct structured multi-round evaluations: Technical rating, communication skills, cultural fit, and scores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.length === 0 ? (
              <div className="col-span-3 py-8 text-center text-slate-400">
                No active candidates in the interview pipeline.
              </div>
            ) : (
              candidates.map((cand) => (
                <div key={cand.id} className="p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md transition space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cand.fullName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cand.status === "Shortlisted"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : cand.status === "Interview"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {cand.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p><strong>Role:</strong> {cand.jobTitle || "Software Engineer"}</p>
                    <p><strong>Email:</strong> {cand.email}</p>
                    <p><strong>Experience:</strong> {cand.yearsOfExperience} years</p>
                    {cand.interviewDate && (
                      <p className="text-indigo-600 font-medium">
                        <strong>Scheduled:</strong> {new Date(cand.interviewDate).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEvaluation(cand)}
                      className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
                    >
                      Record Feedback
                    </button>
                    <button
                      onClick={() => handleOpenOfferModal(cand)}
                      className="flex-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg border border-purple-200 text-xs transition"
                    >
                      Issue Offer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Offer Letters */}
      {activeTab === "offers" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Offer Letters Ledger</h2>
              <p className="text-xs text-slate-500">
                Formal employment contracts with salary packages and joining dates. Once accepted, convert candidate to Employee in 1 click!
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Designation &amp; Dept</th>
                  <th className="py-3 px-4">Annual CTC</th>
                  <th className="py-3 px-4">Monthly Gross</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Employee Code</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offerLetters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No offer letters issued yet. Go to Candidates or ATS to issue formal offers.
                    </td>
                  </tr>
                ) : (
                  offerLetters.map((offer) => (
                    <tr key={offer.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{offer.candidateName}</div>
                        <div className="text-[11px] text-slate-500">{offer.candidateEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{offer.joiningDesignation}</div>
                        <div className="text-[11px] text-slate-500">{offer.department || "Engineering"}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">
                        ₹{(offer.annualCtc || offer.offerSalary || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        ₹{(offer.monthlyGross || Math.round((offer.offerSalary || 0) / 12)).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {offer.joiningDate
                          ? new Date(offer.joiningDate).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Immediate"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            offer.isJoined
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : offer.status === "Accepted"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : offer.status === "Rejected"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {offer.isJoined ? "Joined (EMP)" : offer.status || "Issued"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {offer.employeeCode || (offer.isJoined ? "EMP-CONFIRMED" : "—")}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {offer.status !== "Accepted" && !offer.isJoined && (
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition"
                          >
                            Mark Accepted
                          </button>
                        )}
                        {!offer.isJoined && offer.status !== "Rejected" && (
                          <button
                            onClick={() => handleConvertToEmployee(offer.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition"
                          >
                            Onboard as Employee &rarr;
                          </button>
                        )}
                        {offer.isJoined && (
                          <button
                            onClick={() => handleOpenAppointmentModal(offer)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition"
                          >
                            Issue Appointment Letter
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Appointment Letters & Onboarding */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Appointment Letters &amp; Onboarding</h2>
              <p className="text-xs text-slate-500">
                Official binding employment contracts for confirmed employees with official printable corporate letterhead.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Letter Number</th>
                  <th className="py-3 px-4">Employee Name &amp; Code</th>
                  <th className="py-3 px-4">Designation &amp; Dept</th>
                  <th className="py-3 px-4">Annual CTC</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Probation / Notice</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointmentLetters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No appointment letters issued yet. Convert an accepted offer letter to onboard the employee and issue their formal appointment letter!
                    </td>
                  </tr>
                ) : (
                  appointmentLetters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{letter.letterNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{letter.employeeName}</div>
                        <div className="text-[11px] font-mono font-bold text-emerald-600">{letter.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{letter.designation}</div>
                        <div className="text-[11px] text-slate-500">{letter.department}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">
                        ₹{(letter.annualCtc || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(letter.joiningDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{letter.probationMonths || 6} mos probation</div>
                        <div className="text-[11px] text-slate-400">{letter.noticePeriodDays || 60} days notice</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {letter.status || "Issued"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewPrintLetter(letter)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View &amp; Print Letter
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Staffing Plan */}
      {newPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Manpower Staffing Plan</h3>
                {companyName && (
                  <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" /> Scoped to: {companyName} {projectName ? `• Project: ${projectName}` : ""}
                  </p>
                )}
              </div>
              <button onClick={() => setNewPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={planForm.planTitle}
                  onChange={(e) => setPlanForm({ ...planForm, planTitle: e.target.value })}
                  placeholder="e.g. Q1 Tech Expansion Plan"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={planForm.department}
                    onChange={(e) => setPlanForm({ ...planForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation / Role</label>
                  <input
                    type="text"
                    required
                    value={planForm.designation}
                    onChange={(e) => setPlanForm({ ...planForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Headcount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={planForm.targetHeadcount}
                    onChange={(e) => setPlanForm({ ...planForm, targetHeadcount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Headcount</label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.currentHeadcount}
                    onChange={(e) => setPlanForm({ ...planForm, currentHeadcount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Budget (INR)</label>
                  <input
                    type="number"
                    min="100000"
                    required
                    value={planForm.budget}
                    onChange={(e) => setPlanForm({ ...planForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setNewPlanModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Job Opening */}
      {newPostingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create &amp; Link Job Opening</h3>
                {companyName && (
                  <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" /> Scoped to: {companyName} {projectName ? `• Project: ${projectName}` : ""}
                  </p>
                )}
              </div>
              <button onClick={() => setNewPostingModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePosting} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Link to Approved Staffing Plan</label>
                <select
                  value={postingForm.staffingPlanId}
                  onChange={(e) => {
                    const sel = staffingPlans.find((p) => p.id === e.target.value);
                    setPostingForm({
                      ...postingForm,
                      staffingPlanId: e.target.value,
                      department: sel?.department || postingForm.department,
                      title: sel?.designation || postingForm.title,
                      numberOfPositions: sel?.vacancies || postingForm.numberOfPositions,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
                >
                  <option value="">-- Optional / Select Staffing Plan --</option>
                  {staffingPlans
                    .filter((p) => p.status === "Approved")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.planCode} &mdash; {p.planTitle} ({p.department} - {p.vacancies} vacancies)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={postingForm.title}
                  onChange={(e) => setPostingForm({ ...postingForm, title: e.target.value })}
                  placeholder="e.g. Senior Fullstack .NET Engineer"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={postingForm.department}
                    onChange={(e) => setPostingForm({ ...postingForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={postingForm.location}
                    onChange={(e) => setPostingForm({ ...postingForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Positions</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={postingForm.numberOfPositions}
                    onChange={(e) => setPostingForm({ ...postingForm, numberOfPositions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Salary (INR)</label>
                  <input
                    type="number"
                    value={postingForm.minSalary}
                    onChange={(e) => setPostingForm({ ...postingForm, minSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Salary (INR)</label>
                  <input
                    type="number"
                    value={postingForm.maxSalary}
                    onChange={(e) => setPostingForm({ ...postingForm, maxSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Key Required Skills</label>
                <input
                  type="text"
                  value={postingForm.requiredSkills}
                  onChange={(e) => setPostingForm({ ...postingForm, requiredSkills: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={postingForm.description}
                  onChange={(e) => setPostingForm({ ...postingForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setNewPostingModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Save &amp; Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {interviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Schedule Interview Round</h3>
              <button onClick={() => setInterviewModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Candidate</label>
                <input
                  type="text"
                  disabled
                  value={selectedCandidate?.fullName || "Selected Candidate"}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-100 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Round Name</label>
                <input
                  type="text"
                  required
                  value={interviewForm.roundName}
                  onChange={(e) => setInterviewForm({ ...interviewForm, roundName: e.target.value })}
                  placeholder="e.g. Technical Round 1 or HR Cultural Round"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Interview Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduledDate}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Interviewer Name / Panel</label>
                <input
                  type="text"
                  required
                  value={interviewForm.interviewer}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setInterviewModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Evaluation / Feedback */}
      {evaluationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Submit Interview Evaluation</h3>
              <button onClick={() => setEvaluationModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Recommendation</label>
                  <select
                    value={evalForm.screeningStatus}
                    onChange={(e) => setEvalForm({ ...evalForm, screeningStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Passed">Passed (Recommend Hire)</option>
                    <option value="Failed">Failed (Reject)</option>
                    <option value="OnHold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Overall Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.overallScore}
                    onChange={(e) => setEvalForm({ ...evalForm, overallScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Feedback &amp; Comments</label>
                <textarea
                  rows={3}
                  required
                  value={evalForm.comments}
                  onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEvaluationModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Formal Offer Letter */}
      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Issue Formal Offer Letter</h3>
              <button onClick={() => setOfferModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleIssueOffer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Candidate</label>
                <input
                  type="text"
                  disabled
                  value={offerForm.candidateName}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-100 font-semibold text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Joining Designation</label>
                  <input
                    type="text"
                    required
                    value={offerForm.joiningDesignation}
                    onChange={(e) => setOfferForm({ ...offerForm, joiningDesignation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={offerForm.department}
                    onChange={(e) => setOfferForm({ ...offerForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Annual CTC (INR)</label>
                  <input
                    type="number"
                    min="100000"
                    required
                    value={offerForm.offerSalary}
                    onChange={(e) => setOfferForm({ ...offerForm, offerSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={offerForm.joiningDate}
                    onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reporting Manager</label>
                <input
                  type="text"
                  value={offerForm.reportingManager}
                  onChange={(e) => setOfferForm({ ...offerForm, reportingManager: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Terms &amp; Special Conditions</label>
                <textarea
                  rows={2}
                  value={offerForm.offerTerms}
                  onChange={(e) => setOfferForm({ ...offerForm, offerTerms: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setOfferModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow"
                >
                  Issue Offer Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Formal Appointment Letter */}
      {appointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Generate Official Appointment Letter</h3>
              <button onClick={() => setAppointmentModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleIssueAppointmentLetter} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Confirmed Designation</label>
                  <input
                    type="text"
                    required
                    value={appointmentForm.designation}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={appointmentForm.department}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Annual CTC (INR)</label>
                  <input
                    type="number"
                    required
                    value={appointmentForm.annualCtc}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, annualCtc: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Joining Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentForm.joiningDate}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Probation Period (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={appointmentForm.probationMonths}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, probationMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={appointmentForm.noticePeriodDays}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, noticePeriodDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Base Work Location</label>
                <input
                  type="text"
                  value={appointmentForm.workLocation}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, workLocation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={appointmentForm.signatoryName}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, signatoryName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Signatory Designation</label>
                  <input
                    type="text"
                    value={appointmentForm.signatoryDesignation}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, signatoryDesignation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAppointmentModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Issue &amp; Print Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Appointment Letter Modal */}
      <AppointmentLetterModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        data={activePrintLetter}
      />
    </div>
  );
}
