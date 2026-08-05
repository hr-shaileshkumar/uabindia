"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, MapPin, Users } from "lucide-react";
import {
  CtaPanel,
  ProcessTimeline,
  SectionIntro,
  ValueGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionContentGapClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { clientJobs } from "@/data/clientProfile";
import { publicApi, type PublicJobPosting } from "@/services/modules";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { publicSiteUrl } from "@/lib/public-marketing";

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
  return jobType.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();
};

const cultureSignals = [
  {
    title: "Operational thinkers",
    description: "We value people who understand how software decisions affect real payroll, approvals, finance, and support workflows.",
  },
  {
    title: "Structured execution",
    description: "Teams work with clear accountability, sharper communication, and disciplined delivery standards.",
  },
  {
    title: "Enterprise ambition",
    description: "The product is being shaped to compete with serious global SaaS platforms, not local placeholder software.",
  },
  {
    title: "Practical product work",
    description: "We focus on shipping systems that help organizations work better, not on superficial feature quantity.",
  },
];

const hiringFlow = [
  { step: "01", title: "Shortlisting", description: "We evaluate business context, workflow thinking, and role fit." },
  { step: "02", title: "Functional discussion", description: "Candidates discuss realistic product, support, or delivery scenarios." },
  { step: "03", title: "Alignment", description: "We confirm role expectations, team fit, and execution ownership." },
  { step: "04", title: "Offer and onboarding", description: "Qualified candidates move into a structured onboarding path." },
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
  const [jobs, setJobs] = useState<JobCard[]>(clientJobs);

  const content = parseContent<CareersContent>({
    eyebrow: "Careers",
    title: "Build with a team shaping the next generation of enterprise operations software.",
    subtitle:
      "We work across product, implementation, support, payroll, HR, finance, and operations. The common thread is practical execution quality.",
    applyLabel: "Apply now",
    emptyTitle: "No openings published right now",
    emptySubtitle: "The hiring page is ready for new roles as soon as openings are published.",
    processTitle: "Hiring process",
    processBody:
      "We keep hiring structured, transparent, and grounded in the real operational problems the product is built to solve.",
  });

  useEffect(() => {
    let active = true;

    publicApi
      .getActiveJobPostings(1, 12, audience)
      .then((response) => {
        if (!active) return;
        const postings = response.data.jobPostings || [];
        if (!postings.length) return;

        setJobs(
          postings.map((job: PublicJobPosting) => ({
            role: job.title,
            company: profile.brandName || "UabIndia ERP",
            location: job.location || "Remote",
            type: formatJobType(job.jobType),
          }))
        );
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [audience, profile.brandName]);

  const visibleJobs = useMemo(() => jobs, [jobs]);

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
          name: "Careers at UabIndia ERP",
          url: `${publicSiteUrl}/careers`,
          description: content.subtitle,
        }}
      />

      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[1fr_1fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.primary}>
                  Talk to the team
                </Link>
                <Link href={withPublicAudience("/about", audience)} className={publicButtonClassName.secondary}>
                  About UabIndia
                </Link>
              </div>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <div className={`${publicPanelClassName} p-6`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                What we look for
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Hiring", value: "Structured" },
                  { label: "Culture", value: "Ownership" },
                  { label: "Focus", value: "Operational" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[0.95rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "People who think clearly about business workflows",
                  "Engineers and operators who care about product quality",
                  "Delivery teams comfortable with enterprise expectations",
                  "Professionals who prefer structured execution over noise",
                ].map((item) => (
                  <div key={item} className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <ValueGrid
        items={cultureSignals}
        eyebrow="Culture"
        title="A team for people who care about software with real operational consequence."
        subtitle="The strongest contributors here think beyond screen design or code style alone. They care about adoption, control, and business outcomes."
      />

      <ProcessTimeline
        items={hiringFlow}
        eyebrow={content.processTitle}
        title="The hiring process is direct, practical, and structured."
        subtitle={content.processBody}
      />

      <section className={publicSectionSpacingClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <SectionIntro
              eyebrow="Open roles"
              title="Current opportunities"
              subtitle="These roles reflect the blend of product, delivery, support, and business process depth required to build a serious ERP company."
            />
          </MotionReveal>

          <div className={publicSectionContentGapClassName}>
            {visibleJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleJobs.map((item) => (
                  <article key={`${item.role}-${item.location}`} className={`${publicPanelClassName} flex h-full flex-col p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">{item.role}</h2>
                        <p className="mt-1 text-sm text-slate-600">{item.company}</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {item.type}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                        <span>{item.type}</span>
                      </div>
                    </div>

                    <Link href={withPublicAudience("/contact", audience)} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">
                      {content.applyLabel}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`${publicPanelClassName} p-8 text-center`}>
                <Users className="mx-auto h-10 w-10 text-slate-400" />
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{content.emptyTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{content.emptySubtitle}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <CtaPanel
        eyebrow="Work with us"
        title="If you want to help build a premium enterprise product from India, start the conversation."
        description="We are interested in people who can combine execution depth, product clarity, and real operational empathy."
        primaryLabel="Contact Hiring Team"
        primaryHref={withPublicAudience("/contact", audience)}
        secondaryLabel="Book Demo"
        secondaryHref={withPublicAudience("/book-demo", audience)}
      />
    </PublicAudiencePageFrame>
  );
}
