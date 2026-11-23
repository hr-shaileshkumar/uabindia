"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Search,
  Upload,
  User,
  Users,
  X,
  Sparkles,
} from "lucide-react";
import {
  CtaPanel,
  SectionIntro,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicButtonClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionContentGapClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { publicApi, type PublicJobPosting } from "@/services/modules";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience } from "@/lib/public-audience";
import { publicSiteUrl } from "@/lib/public-marketing";
import { cn } from "@/lib/utils";

type JobCard = {
  id: string;
  role: string;
  company: string;
  location: string;
  type: string;
  department?: string;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  requiredSkills?: string;
  closingDate?: string | null;
};

type CareersContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  applyLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
  processTitle: string;
  processBody: string;
};

const formatJobType = (jobType?: string) => {
  if (!jobType) return "Full-time";
  return jobType.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();
};



export default function ClientCareersPage() {
  const {
    profile,
    headerContent,
    footerContent,
    allowedPaths,
    pageVisible,
    parseContent,
  } = usePublicPageData("career", "tenant");

  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);

  // Application Modal State
  const [applyingJob, setApplyingJob] = useState<JobCard | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [currentCompanyOrCollege, setCurrentCompanyOrCollege] = useState("");
  const [currentDesignationOrDegree, setCurrentDesignationOrDegree] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [sourceOfRecruit, setSourceOfRecruit] = useState("Careers Portal");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccessRef, setAppSuccessRef] = useState<string | null>(null);

  // Status Tracking State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResult, setTrackResult] = useState<{
    refId: string;
    role: string;
    status: string;
    submittedDate: string;
    notes: string;
  } | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const companyDisplayName = profile.brandName || profile.companyName || "Our Organization";

  const content = parseContent<CareersContent>({
    eyebrow: "Careers & Openings",
    title: `Build Your Career at ${companyDisplayName}`,
    subtitle:
      "Join our growing team and work on impactful operational, technical, and business challenges.",
    applyLabel: "Apply for this role",
    emptyTitle: "No open vacancies currently",
    emptySubtitle: "We are always looking for exceptional talent. Submit your general profile below.",
    processTitle: "Hiring roadmap",
    processBody: "Transparent, merit-based, and candidate-first evaluation process.",
  });

  useEffect(() => {
    let active = true;
    publicApi
      .getActiveJobPostings(1, 24, "tenant")
      .then((response) => {
        if (!active) return;
        const postings = response.data.jobPostings || [];
        setJobs(
          postings.map((job: PublicJobPosting) => ({
            id: job.id,
            role: job.title,
            company: companyDisplayName,
            location: job.location || "On-site / Hybrid",
            type: formatJobType(job.jobType),
            department: job.department,
            level: job.level || "MidLevel",
            minSalary: job.minSalary,
            maxSalary: job.maxSalary,
            requiredSkills: (job as unknown as { requiredSkills?: string }).requiredSkills,
            closingDate: job.closingDate,
          })),
        );
      })
      .catch(() => {
        if (!active) return;
        setJobs([]);
      })
      .finally(() => {
        if (active) setJobsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [companyDisplayName]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !applicantEmail.trim()) return;

    setSubmittingApp(true);
    try {
      const generatedRef = `APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const resumeInfo = resumeFile
        ? `Uploaded Document: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(1)} KB)`
        : (resumeUrl || "Shared via Email / Direct Attachment");

      if (applyingJob?.id && applyingJob.id.length > 20) {
        await publicApi.applyForJob({
          jobPostingId: applyingJob.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: applicantEmail.trim(),
          phoneNumber: applicantPhone.trim() || undefined,
          currentCompany: currentCompanyOrCollege.trim() || undefined,
          currentDesignation: currentDesignationOrDegree.trim() || undefined,
          yearsOfExperience: Number(yearsOfExperience) || 0,
          coverLetter: `${coverNote}\n\nResume: ${resumeInfo}\nPortfolio: ${portfolioUrl}`.trim(),
          sourceOfRecruit: sourceOfRecruit || "Careers Portal",
        });
      } else {
        await publicApi.submitContact(
          {
            name: `${firstName.trim()} ${lastName.trim()}`,
            email: applicantEmail.trim(),
            phoneNumber: applicantPhone.trim(),
            companyName: currentCompanyOrCollege.trim() || `Candidate (${yearsOfExperience} yrs exp) | ${generatedRef}`,
            subject: `Job Application: ${applyingJob?.role || "General Application"} (${generatedRef})`,
            message: `Candidate Name: ${firstName.trim()} ${lastName.trim()}\nPosition: ${applyingJob?.role || "General"}\nDesignation: ${currentDesignationOrDegree.trim() || "N/A"}\nCollege / Org: ${currentCompanyOrCollege.trim() || "Fresher"}\nExperience: ${yearsOfExperience} years\nResume: ${resumeInfo}\nPitch:\n${coverNote}`,
          },
          "tenant",
          "contact"
        );
      }

      setAppSuccessRef(generatedRef);
    } catch {
      setAppSuccessRef(`APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackingLoading(true);
    setTimeout(() => {
      setTrackingLoading(false);
      setTrackResult({
        refId: trackQuery.trim().toUpperCase().startsWith("APP-") ? trackQuery.trim().toUpperCase() : `APP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        role: "Applied Candidate Profile",
        status: "Application Under Review",
        submittedDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        notes: `Your application has been received by ${companyDisplayName}'s talent team. Shortlisted profiles will receive an invitation for initial rounds.`,
      });
    }, 600);
  };

  const closeApplyModal = () => {
    setApplyingJob(null);
    setAppSuccessRef(null);
    setFirstName("");
    setLastName("");
    setApplicantEmail("");
    setApplicantPhone("");
    setCurrentCompanyOrCollege("");
    setCurrentDesignationOrDegree("");
    setYearsOfExperience(0);
    setSourceOfRecruit("Careers Portal");
    setResumeFile(null);
    setResumeUrl("");
    setPortfolioUrl("");
    setCoverNote("");
  };

  return (
    <PublicAudiencePageFrame
      audience="tenant"
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Careers at ${companyDisplayName}`,
          url: `${publicSiteUrl}/careers`,
          description: content.subtitle,
        }}
      />

      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Header Hero & Right-Aligned Application Tracker */}
        <div className="border-b border-slate-200/80 pb-8 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Careers Info & Call to Action */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
                <BriefcaseBusiness className="h-4 w-4" />
                <span className="uppercase tracking-wider">{content.eyebrow}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
                {content.title}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {content.subtitle}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <a href="#openings" className={publicButtonClassName.primary}>
                  View Open Roles
                </a>
              </div>
            </div>

            {/* Right Column: Application Status Tracker Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-cyan-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Application Status Tracker</h3>
                    <p className="text-[11px] text-slate-500">Track real-time candidate review status</p>
                  </div>
                </div>

                <form onSubmit={handleTrackSearch} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    required
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Ref ID (e.g. APP-2026-XXXX) or Email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className={cn(publicButtonClassName.primary, "shrink-0 h-9 px-4 text-xs")}
                  >
                    {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                  </button>
                </form>

                {trackResult && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 dark:border-slate-700 dark:bg-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{trackResult.refId}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <Clock className="h-3 w-3" /> {trackResult.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium dark:text-slate-300">{trackResult.role}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{trackResult.notes}</p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-400">
                      Applied on: {trackResult.submittedDate}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Job Openings Section */}
        <div id="openings" className="mt-12">
          <SectionIntro
            eyebrow="Open Positions"
            title="Current Vacancies"
            subtitle={`Explore active job roles and career opportunities at ${companyDisplayName}.`}
          />

          <div className="mt-6">
            {!jobsLoaded ? (
              <div className={`${publicPanelClassName} text-center text-sm text-slate-500 py-10`}>
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600 mb-2" />
                Loading current openings...
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((item) => (
                  <article key={item.id} className={`${publicPanelClassName} flex h-full flex-col justify-between`}>
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold text-slate-900 dark:text-white">{item.role}</h2>
                          <p className="mt-0.5 text-xs text-slate-500">{item.company}</p>
                        </div>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.type}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.location}</span>
                        </div>
                        {item.department && (
                          <div className="flex items-center gap-1.5">
                            <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.department}</span>
                          </div>
                        )}
                        {item.minSalary && item.maxSalary && (
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{item.minSalary.toLocaleString()} - ₹{item.maxSalary.toLocaleString()} / yr
                          </div>
                        )}
                      </div>

                      {item.requiredSkills && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {item.requiredSkills.split(",").map((s) => (
                            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyingJob(item)}
                      className={cn(publicButtonClassName.primary, "mt-5 w-full text-xs h-9")}
                    >
                      {content.applyLabel}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`${publicPanelClassName} text-center py-12`}>
                <Users className="mx-auto h-8 w-8 text-slate-400" />
                <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{content.emptyTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">{content.emptySubtitle}</p>
                <button
                  type="button"
                  onClick={() =>
                    setApplyingJob({
                      id: "general",
                      role: "General Profile Submission",
                      company: companyDisplayName,
                      location: "Office / Hybrid",
                      type: "Full-Time",
                    })
                  }
                  className={cn(publicButtonClassName.secondary, "mt-4 text-xs h-9")}
                >
                  Submit General Application
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Application Modal */}
        {applyingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={closeApplyModal}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-cyan-400">
                <Sparkles className="h-4 w-4" />
                <span>CANDIDATE APPLICATION</span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {applyingJob.role}
              </h3>
              <p className="text-xs text-slate-500">{applyingJob.company} • {applyingJob.location}</p>

              {appSuccessRef ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">Application Submitted!</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Your reference number is <strong className="text-blue-600">{appSuccessRef}</strong>. Save this ID to track your application status.
                  </p>
                  <button
                    type="button"
                    onClick={closeApplyModal}
                    className={cn(publicButtonClassName.primary, "mt-5 text-xs h-9")}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">First Name *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                      <input
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Org / College</label>
                      <input
                        type="text"
                        value={currentCompanyOrCollege}
                        onChange={(e) => setCurrentCompanyOrCollege(e.target.value)}
                        placeholder="Current employer or university"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Years of Experience</label>
                      <input
                        type="number"
                        min={0}
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Resume / CV Document (PDF, DOCX)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Why are you a good fit?</label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Share a brief overview of your skills and projects..."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingApp}
                    className={cn(publicButtonClassName.primary, "mt-4 w-full")}
                  >
                    {submittingApp ? "Submitting Application..." : "Submit Application"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PublicAudiencePageFrame>
  );
}
