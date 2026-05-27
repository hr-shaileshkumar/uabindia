"use client";

import { useEffect, useMemo, useState } from "react";
import PublicButtonLink from "@/components/public/PublicButtonLink";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicPanelClassName } from "@/components/public/publicStyles";
import { clientJobs } from "@/data/clientProfile";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getRawMarkupContent } from "@/lib/publicSiteContent";
import { publicApi, type PublicJobPosting } from "@/services/publicApi";

type JobCard = {
  role: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
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
  const spaced = jobType.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.replace(/\s+/g, " ").trim();
};

const formatSalaryRange = (job: PublicJobPosting) => {
  if (typeof job.minSalary === "number" && typeof job.maxSalary === "number") {
    return `INR ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}`;
  }

  if (typeof job.minSalary === "number") {
    return `INR ${job.minSalary.toLocaleString()}+`;
  }

  return undefined;
};

const hiringFilters = ["All", "Finance", "HR", "Operations", "Compliance"];

const joinBenefits = [
  { title: "Career growth", description: "Structured learning pathways for enterprise professionals." },
  { title: "Modern ERP", description: "Work on a secure, live tenant-based ERP platform." },
  { title: "Collaborative culture", description: "Cross-functional teams aligned to business outcomes." },
];

export default function CareersPage() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("career");
  const [jobs, setJobs] = useState<JobCard[]>(clientJobs);
  const [activeFilter, setActiveFilter] = useState("All");
  const content = parseContent<CareersContent>({
    eyebrow: "Careers",
    title: `Build your career with ${profile.companyName}`,
    subtitle:
      "Open roles for ERP, finance, HR, operations, and compliance teams working across modern enterprise workflows.",
    applyLabel: "Apply now",
    emptyTitle: "No openings published yet",
    emptySubtitle: "We will publish recruitment opportunities here once the team publishes openings.",
    processTitle: "Recruitment process",
    processBody:
      "Our application process includes screening, live interviews, role approvals, and onboarding readiness—all aligned with enterprise standards.",
  });
  const rawMarkup = getRawMarkupContent(pageRecord?.contentJson);

  useEffect(() => {
    let isActive = true;

    publicApi
      .getActiveJobPostings()
      .then((response) => {
        if (!isActive) return;
        const postings = response.data.jobPostings || [];
        if (!postings.length) return;
        setJobs(
          postings.map((job: PublicJobPosting) => ({
            role: job.title,
            company: profile.companyName,
            location: job.location || "Remote",
            type: formatJobType(job.jobType),
            salary: formatSalaryRange(job),
          }))
        );
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [profile.companyName]);

  const visibleJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (activeFilter === "All") return true;
        return (
          job.type.toLowerCase().includes(activeFilter.toLowerCase()) ||
          job.location.toLowerCase().includes(activeFilter.toLowerCase())
        );
      }),
    [activeFilter, jobs]
  );

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Immediate roles</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{visibleJobs.length}</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Teams hiring</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">ERP</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Work style</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">Hybrid</p>
              </div>
            </div>
          </div>

          <div className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">Why join us</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Join a platform-focused team delivering ERP value across finance, HR, and operations.
            </p>
            <div className="mt-8 grid gap-4">
              {joinBenefits.map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-900">Filter by</span>
            {hiringFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "bg-(--erp-primary) text-white"
                    : "bg-white text-slate-700 shadow-sm"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {visibleJobs.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {visibleJobs.map((item) => (
              <div key={`${item.role}-${item.location}`} className={`${publicPanelClassName} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{item.role}</h2>
                    <p className="mt-1 text-sm text-slate-600">{item.company}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {item.type}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Deliver ERP impact across workflows and support teams with a blend of process and product experience.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{item.location}</span>
                  {item.salary ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.salary}</span> : null}
                </div>
                <PublicButtonLink href="/contact" variant="primary" className="mt-4 w-full text-center">
                  {content.applyLabel}
                </PublicButtonLink>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{content.emptyTitle}</h2>
            <p className="mt-3 text-sm text-slate-600">{content.emptySubtitle}</p>
          </div>
        )}

        <div className={`${publicPanelClassName} mt-10 p-6`}>
          <h2 className="text-lg font-semibold text-slate-900">{content.processTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{content.processBody}</p>
        </div>

        {rawMarkup && (
          <div className={`prose mt-10 max-w-none p-8 ${publicPanelClassName}`}>
            <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          </div>
        )}
      </section>
    </PublicSiteFrame>
  );
}
