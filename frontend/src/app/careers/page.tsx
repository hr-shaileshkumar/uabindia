"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin, Users } from "lucide-react";
import PublicButtonLink from "@/components/public/PublicButtonLink";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicMutedPanelClassName, publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { clientJobs } from "@/data/clientProfile";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getRawMarkupContent } from "@/lib/publicSiteContent";
import { publicApi, type PublicJobPosting } from "@/services/publicApi";

type JobCard = {
  role: string;
  company: string;
  location: string;
  type: string;
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

export default function CareersPage() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("career");
  const [jobs, setJobs] = useState<JobCard[]>(clientJobs);
  const content = parseContent<CareersContent>({
    eyebrow: "Careers",
    title: `Build your next chapter with ${profile.companyName}`,
    subtitle: "Open roles across ERP delivery, finance, HR operations, and platform support.",
    applyLabel: "Apply now",
    emptyTitle: "No openings published yet",
    emptySubtitle: "This page is ready as soon as the team publishes active roles.",
    processTitle: "Hiring process",
    processBody: "Screening, interviews, and onboarding are handled with clear steps and business alignment.",
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
          }))
        );
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [profile.companyName]);

  const visibleJobs = useMemo(() => jobs, [jobs]);

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="py-18 sm:py-22">
        <div className={`${publicSectionClassName} grid gap-8 lg:grid-cols-[1.05fr_0.95fr]`}>
          <div className="space-y-7">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </div>

          <div className={`${publicMutedPanelClassName} p-7`}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{content.processTitle}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{content.processBody}</p>
          </div>
        </div>
      </section>

      <section className="pb-18 sm:pb-22">
        <div className={publicSectionClassName}>
          {visibleJobs.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleJobs.map((item) => (
                <article key={`${item.role}-${item.location}`} className={`${publicPanelClassName} flex h-full flex-col p-6`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{item.role}</h2>
                      <p className="mt-1 text-sm text-slate-600">{item.company}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                      <span>{item.type}</span>
                    </div>
                  </div>

                  <PublicButtonLink href="/contact" className="mt-6 w-full justify-center">
                    {content.applyLabel}
                  </PublicButtonLink>
                </article>
              ))}
            </div>
          ) : (
            <div className={`${publicPanelClassName} p-10 text-center`}>
              <Users className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{content.emptyTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{content.emptySubtitle}</p>
            </div>
          )}
        </div>
      </section>

      {rawMarkup ? (
        <section className="py-12">
          <div className={publicSectionClassName}>
            <div className={`prose max-w-none p-8 ${publicPanelClassName}`}>
              <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
            </div>
          </div>
        </section>
      ) : null}
    </PublicSiteFrame>
  );
}
