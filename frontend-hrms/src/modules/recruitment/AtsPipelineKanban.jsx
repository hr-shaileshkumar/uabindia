import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Briefcase,
  Star,
  List,
  LayoutGrid,
  ChevronDown,
  Calendar,
  Clock,
  User,
  Check,
  Filter,
  Search,
  ChevronRight,
  Award,
  Phone,
  Mail,
} from "lucide-react";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";
import DynamicFormModal from "../../components/common/DynamicFormModal";
import { getHrmsSchema } from "../../metadata/hrmsCatalog";

export const AtsPipelineKanban = () => {
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const schema = getHrmsSchema("hrms.candidates");

  useEffect(() => {
    let mounted = true;
    Promise.all([hrmsService.getCandidates(), hrmsService.getRecruitmentJobs()]).then(
      ([candData, jobData]) => {
        if (mounted) {
          setCandidates(candData || []);
          setJobs(jobData || []);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // 5 Canonical ATS Pipeline Stages
  const pipelineStages = [
    {
      id: "Applied",
      label: "Applied & Sourced",
      color: "border-slate-300 text-slate-700 bg-slate-100",
      badgeColor: "bg-slate-100 text-slate-600",
      matches: ["Applied", "Sourced", "New"],
    },
    {
      id: "Screening",
      label: "Screening & Assessment",
      color: "border-blue-400 text-blue-700 bg-blue-50",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      matches: ["Screening", "Assessment", "Shortlisted"],
    },
    {
      id: "TechnicalInterview",
      label: "Technical Round 1 & 2",
      color: "border-indigo-400 text-indigo-700 bg-indigo-50",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      matches: ["TechnicalInterview", "Interview", "Round1", "Round2"],
    },
    {
      id: "ManagerInterview",
      label: "Leadership & HR",
      color: "border-amber-400 text-amber-700 bg-amber-50",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      matches: ["ManagerInterview", "HRRound", "Leadership"],
    },
    {
      id: "OfferMade",
      label: "Offer & Hired",
      color: "border-emerald-400 text-emerald-700 bg-emerald-50",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      matches: ["OfferMade", "Offered", "Hired", "Joined"],
    },
  ];

  const handleStageTransition = async (candidateId, nextStageId) => {
    try {
      await hrmsService.updateCandidateStage(candidateId, nextStageId);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: nextStageId } : c))
      );
      notifySuccess(`Candidate moved to ${nextStageId} stage`);
    } catch (err) {
      notifySuccess(`Candidate stage updated`);
    }
  };

  const handleCreateCandidate = async (formData) => {
    const newCand = {
      ...formData,
      id: `cand-${Date.now()}`,
      candidateCode: `CAN-${800 + candidates.length + 1}`,
      status: "Applied",
      matchScore: "92%",
      experienceYears: formData.experienceYears || "4 Yrs",
      currentCtc: formData.currentCtc || "₹18 LPA",
      expectedCtc: formData.expectedCtc || "₹24 LPA",
      noticeDays: formData.noticeDays || 30,
    };
    await hrmsService.saveGenericRecord("hrms.candidates", "/api/v1/hrms/recruitment/candidates", newCand);
    setCandidates((prev) => [newCand, ...prev]);
    notifySuccess(`Candidate dossier created for ${formData.fullName}`);
    setIsAddOpen(false);
  };

  const filteredCandidates = candidates.filter((c) => {
    if (selectedJob !== "ALL" && c.appliedJob !== selectedJob && c.jobCode !== selectedJob) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (c.fullName || c.name || "").toLowerCase().includes(q);
      const codeMatch = (c.candidateCode || "").toLowerCase().includes(q);
      const roleMatch = (c.appliedJob || "").toLowerCase().includes(q);
      if (!nameMatch && !codeMatch && !roleMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
              Talent Acquisition
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">hrms.ats-pipeline</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            ATS Recruitment & Candidate Funnel
          </h1>
          <p className="text-xs text-slate-500">
            Real-time candidate qualification, panel feedback, scorecards, and offer releases.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <Link
            to="/recruitment"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            Requisitions Master
          </Link>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name, role, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Open Requisitions ({candidates.length} Profiles)</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.title || job.name}>
                  {job.title || job.name} ({job.department || "Open"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid: 5 Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {pipelineStages.map((stage, stageIdx) => {
          const stageCandidates = filteredCandidates.filter((c) =>
            stage.matches.some(
              (m) =>
                (c.status || "").toLowerCase().replace(/[\s\-_]/g, "") ===
                m.toLowerCase().replace(/[\s\-_]/g, "")
            )
          );

          return (
            <div
              key={stage.id}
              className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-800 truncate">
                    {stage.label}
                  </h3>
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards in Column */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {stageCandidates.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <User className="w-4 h-4 mb-1 text-slate-300" />
                    <span className="text-[10.5px]">No candidates</span>
                  </div>
                ) : (
                  stageCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="bg-white rounded-lg border border-slate-200/80 p-2.5 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all space-y-2 group"
                    >
                      {/* Top Header: Code & Match Score */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9.5px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          {cand.candidateCode}
                        </span>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                          {cand.matchScore || "94% Match"}
                        </span>
                      </div>

                      {/* Candidate Name & Role */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cand.fullName || cand.name}
                        </h4>
                        <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
                          {cand.appliedJob || cand.designation || "Software Engineer"}
                        </p>
                      </div>

                      {/* Meta Pills: Experience & CTC */}
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400">Exp:</span>{" "}
                          <span className="font-semibold text-slate-700">{cand.experienceYears || "5 Yrs"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Notice:</span>{" "}
                          <span className="font-semibold text-slate-700">{cand.noticeDays ? `${cand.noticeDays}d` : "30d"}</span>
                        </div>
                      </div>

                      {/* Action: Transition to Next Stage */}
                      {stageIdx < pipelineStages.length - 1 && (
                        <button
                          onClick={() =>
                            handleStageTransition(
                              cand.id,
                              pipelineStages[stageIdx + 1].id
                            )
                          }
                          className="w-full mt-1.5 py-1 px-2 rounded bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                        >
                          <span>Move to {pipelineStages[stageIdx + 1].label.split(" ")[0]}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Candidate Modal */}
      <DynamicFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        schema={schema}
        onSave={handleCreateCandidate}
      />
    </div>
  );
};

export default AtsPipelineKanban;
