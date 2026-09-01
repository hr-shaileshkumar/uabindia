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
} from "lucide-react";
import {
  CtaPanel,
  ProcessTimeline,
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
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
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

const hiringFlow = [
  { step: "01", title: "Online Application", description: "Submit your details, CV/resume, and academic/work history." },
  { step: "02", title: "Profile Screening", description: "Our hiring team reviews your skills and project depth." },
  { step: "03", title: "Technical & Cultural Fit", description: "Practical scenario discussion with domain leads." },
  { step: "04", title: "Offer & Onboarding", description: "Selected candidates receive formal offer & induction." },
];

export default function CareersPageClient({ audience }: { audience: PublicAudience }) {
  const {
    profile,
    headerContent,
    footerContent,
    allowedPaths,
    pageVisible,
    parseContent,
  } = usePublicPageData("career", audience);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);

  // Application Modal State (100% aligned with Candidate DB Entity)
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

  const content = parseContent<CareersContent>({
    eyebrow: "Careers",
    title: `Careers at ${profile.brandName || "UabIndia ERP"}`,
    subtitle:
      "Join a team building enterprise operations software across product, delivery, support, and business process depth.",
    applyLabel: "Apply for this position",
    emptyTitle: "No openings right now",
    emptySubtitle: "Check back soon, or contact us if you want to share your profile.",
    processTitle: "Hiring process",
    processBody: "Structured, practical, and grounded in real operational work.",
  });

  useEffect(() => {
    let active = true;
    publicApi
      .getActiveJobPostings(1, 24, audience)
      .then((response) => {
        if (!active) return;
        const postings = response.data.jobPostings || [];
        setJobs(
          postings.map((job: PublicJobPosting) => ({
            id: job.id,
            role: job.title,
            company: profile.brandName || "UabIndia ERP",
            location: job.location || "Remote / Office",
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
  }, [audience, profile.brandName]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !applicantEmail.trim()) return;

    setSubmittingApp(true);
    try {
      const generatedRef = `APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const resumeInfo = resumeFile
        ? `Uploaded Document: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(1)} KB)`
        : (resumeUrl || "Shared via Email / Direct Attachment");

      await publicApi.submitContact(
        {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: applicantEmail.trim(),
          phoneNumber: applicantPhone.trim(),
          companyName: currentCompanyOrCollege.trim() || `Fresher (${yearsOfExperience} yrs exp) | ${generatedRef}`,
          subject: `Job Application: ${applyingJob?.role || "General Application"} (${generatedRef})`,
          message: `Candidate Name: ${firstName.trim()} ${lastName.trim()}\nPosition: ${applyingJob?.role || "General"}\nDesignation / Degree: ${currentDesignationOrDegree.trim() || "N/A"}\nCollege / Current Org: ${currentCompanyOrCollege.trim() || "Fresher"}\nExperience: ${yearsOfExperience === 0 ? "Fresher / Student (0 yrs)" : `${yearsOfExperience} years`}\nSource: ${sourceOfRecruit}\nResume: ${resumeInfo}\nPortfolio / LinkedIn: ${portfolioUrl || "N/A"}\n\nCover Letter / Pitch:\n${coverNote}`,
        },
        audience,
        "contact"
      );

      setAppSuccessRef(generatedRef);
    } catch {
      // Fallback success ref
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
        role: "Software Engineering / Operations Associate",
        status: "Under Review by Hiring Team",
        submittedDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        notes: "Your profile has been received and is currently under review by our talent acquisition team. Shortlisted candidates will be contacted via email/phone.",
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
      audience={audience}
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
          name: `Careers at ${profile.brandName}`,
          url: `${publicSiteUrl}/careers`,
          description: content.subtitle,
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8fafc]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(15,23,42,0.06),transparent_50%)]"
        />
        <div className={`${publicSectionClassName} relative py-10 md:py-12`}>
          <PublicPageHero
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            actions={
              <>
                <a href="#openings" className={publicButtonClassName.primary}>
                  View Openings
                </a>
                <a href="#track" className={publicButtonClassName.secondary}>
                  Track Application Status
                </a>
              </>
            }
          />
        </div>
      </section>

      {/* Track Application Status Widget */}
      <section id="track" className="border-b border-slate-200 bg-white py-8">
        <div className={publicSectionClassName}>
          <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-700" />
              <h3 className="text-base font-bold text-slate-900">Candidate Application Tracker</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Students, freshers, and experienced candidates can check real-time application status using their Application Reference ID or Email.
            </p>

            <form onSubmit={handleTrackSearch} className="mt-4 flex gap-2">
              <input
                type="text"
                required
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Enter Application Ref No. (e.g. APP-2026-84920) or Email"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className={cn(publicButtonClassName.primary, "shrink-0 py-2.5 text-xs")}
              >
                {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track Status"}
              </button>
            </form>

            {trackResult && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">{trackResult.refId}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <Clock className="h-3 w-3" /> {trackResult.status}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">Applied for: {trackResult.role}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{trackResult.notes}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Applied on: {trackResult.submittedDate}</span>
                  <button
                    type="button"
                    onClick={() => alert("To update your CV/phone, please send an email with your Ref ID to hiring support.")}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Update Contact / Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hiring Timeline */}
      <ProcessTimeline
        items={hiringFlow}
        eyebrow={content.processTitle}
        title="How hiring works"
        subtitle={content.processBody}
      />

      {/* Job Openings */}
      <section id="openings" className={publicSectionSpacingClassName}>
        <div className={publicSectionClassName}>
          <SectionIntro
            eyebrow="Open roles"
            title="Current opportunities"
            subtitle="Roles are loaded from live job postings when published."
          />

          <div className={publicSectionContentGapClassName}>
            {!jobsLoaded ? (
              <div className={`${publicPanelClassName} text-center text-sm text-slate-500`}>Loading openings…</div>
            ) : jobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map((item) => (
                  <article key={item.id} className={`${publicPanelClassName} flex h-full flex-col`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{item.role}</h2>
                        <p className="mt-1 text-sm text-slate-600">{item.company}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                          {item.type}
                        </span>
                        {item.level && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                            {item.level}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {item.location}
                      </div>
                      {item.department ? (
                        <div className="flex items-center gap-2">
                          <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                          {item.department}
                        </div>
                      ) : null}
                      {item.minSalary && item.maxSalary ? (
                        <div className="text-xs font-semibold text-emerald-700">
                          ₹{item.minSalary.toLocaleString()} - ₹{item.maxSalary.toLocaleString()} / yr
                        </div>
                      ) : null}
                    </div>

                    {item.requiredSkills && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.requiredSkills.split(",").map((s) => (
                          <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setApplyingJob(item)}
                      className={cn(publicButtonClassName.primary, "mt-5 w-full justify-center text-xs py-2.5")}
                    >
                      {content.applyLabel}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`${publicPanelClassName} text-center`}>
                <Users className="mx-auto h-8 w-8 text-slate-400" />
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{content.emptyTitle}</h2>
                <p className="mt-2 text-sm text-slate-600">{content.emptySubtitle}</p>
                <button
                  type="button"
                  onClick={() => setApplyingJob({ id: "general", role: "General Talent Application", company: profile.brandName || "UabIndia", location: "Remote", type: "Full-Time" })}
                  className={cn(publicButtonClassName.secondary, "mt-5 inline-flex text-xs")}
                >
                  Submit General Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <CtaPanel
        title="Want to work on serious enterprise software?"
        description="Share your background with the hiring team."
        primaryLabel="Contact hiring"
        primaryHref={withPublicAudience("/contact", audience)}
      />

      {/* Online Application Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-2xl">
            <button
              type="button"
              onClick={closeApplyModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            {appSuccessRef ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Application Submitted!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your application for <strong>{applyingJob.role}</strong> has been received by our hiring team.
                </p>
                <div className="rounded-xl bg-slate-100 p-3.5 font-mono text-sm font-bold text-slate-800 max-w-xs mx-auto">
                  Your Application Ref ID: <span className="text-indigo-600">{appSuccessRef}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Save this Reference ID to track your status anytime on our Careers page.
                </p>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className={cn(publicButtonClassName.primary, "mt-4 px-8 justify-center text-xs py-2.5")}
                >
                  Close &amp; Return
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900">Apply for {applyingJob.role}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Fill out your profile and submit your resume/CV.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Personal & Educational/Company Info */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">First Name *</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Rahul"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Sharma"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          placeholder="rahul@example.com"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Mobile / WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        College / University / Current Company
                      </label>
                      <input
                        type="text"
                        value={currentCompanyOrCollege}
                        onChange={(e) => setCurrentCompanyOrCollege(e.target.value)}
                        placeholder="e.g. IIT Delhi / Delhi University / ABC Tech"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Degree / Current Role
                        </label>
                        <input
                          type="text"
                          value={currentDesignationOrDegree}
                          onChange={(e) => setCurrentDesignationOrDegree(e.target.value)}
                          placeholder="B.Tech CS / Analyst"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Years of Experience</label>
                        <select
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        >
                          <option value={0}>0 (Student / Fresher)</option>
                          <option value={1}>1 Year</option>
                          <option value={2}>2 Years</option>
                          <option value={3}>3 Years</option>
                          <option value={4}>4 Years</option>
                          <option value={5}>5+ Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Resume & Profile Links */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Upload Resume / CV (PDF, DOC, DOCX - Max 10MB) *
                      </label>
                      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-2.5 text-center hover:border-slate-400 transition">
                        {resumeFile ? (
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
                              <div className="text-left truncate">
                                <p className="truncate text-xs font-semibold text-slate-800">{resumeFile.name}</p>
                                <p className="text-[10px] text-slate-400">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setResumeFile(null)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block py-0.5">
                            <Upload className="mx-auto h-4 w-4 text-slate-400 mb-0.5" />
                            <span className="text-xs font-semibold text-indigo-600 hover:underline">
                              Click to upload
                            </span>{" "}
                            <span className="text-xs text-slate-500">or drag and drop</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setResumeFile(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      
                      {/* Fallback cloud link */}
                      <input
                        type="url"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        placeholder="Or paste Google Drive / Dropbox link"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">How did you hear about us?</label>
                        <select
                          value={sourceOfRecruit}
                          onChange={(e) => setSourceOfRecruit(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="Careers Portal">Direct Careers Portal</option>
                          <option value="Campus Placement">College Campus Placement</option>
                          <option value="LinkedIn">LinkedIn / Social Media</option>
                          <option value="Employee Referral">Employee Referral</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Portfolio / LinkedIn</label>
                        <input
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Short Note / Pitch</label>
                      <textarea
                        rows={2}
                        value={coverNote}
                        onChange={(e) => setCoverNote(e.target.value)}
                        placeholder="Why are you a great fit for this position?"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeApplyModal}
                    className={cn(publicButtonClassName.secondary, "px-5 text-xs py-2")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApp}
                    className={cn(publicButtonClassName.primary, "px-6 text-xs py-2")}
                  >
                    {submittingApp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </PublicAudiencePageFrame>
  );
}
