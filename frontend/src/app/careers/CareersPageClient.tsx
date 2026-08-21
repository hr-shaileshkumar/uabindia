"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, MapPin, Users } from "lucide-react";
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
  { step: "01", title: "Shortlisting", description: "We evaluate role fit and operational thinking." },
  { step: "02", title: "Discussion", description: "Practical conversation about product or delivery scenarios." },
  { step: "03", title: "Alignment", description: "Confirm expectations, ownership, and team fit." },
  { step: "04", title: "Offer", description: "Qualified candidates move into structured onboarding." },
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

  const content = parseContent<CareersContent>({
    eyebrow: "Careers",
    title: `Careers at ${profile.brandName || "UabIndia ERP"}`,
    subtitle:
      "Join a team building enterprise operations software across product, delivery, support, and business process depth.",
    applyLabel: "Apply via contact",
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
            location: job.location || "Remote",
            type: formatJobType(job.jobType),
            department: job.department,
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
                <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.primary}>
                  Contact hiring
                </Link>
                <Link href={withPublicAudience("/about", audience)} className={publicButtonClassName.secondary}>
                  About us
                </Link>
              </>
            }
          />
        </div>
      </section>

      <ProcessTimeline
        items={hiringFlow}
        eyebrow={content.processTitle}
        title="How hiring works"
        subtitle={content.processBody}
      />

      <section className={publicSectionSpacingClassName}>
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
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {item.type}
                      </span>
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
                    </div>
                    <Link
                      href={withPublicAudience(`/contact?subject=${encodeURIComponent(`Application: ${item.role}`)}`, audience)}
                      className={cn(publicButtonClassName.primary, "mt-5 w-full")}
                    >
                      {content.applyLabel}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`${publicPanelClassName} text-center`}>
                <Users className="mx-auto h-8 w-8 text-slate-400" />
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{content.emptyTitle}</h2>
                <p className="mt-2 text-sm text-slate-600">{content.emptySubtitle}</p>
                <Link href={withPublicAudience("/contact", audience)} className={cn(publicButtonClassName.secondary, "mt-5 inline-flex")}>
                  Contact us
                </Link>
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
    </PublicAudiencePageFrame>
  );
}
