"use client";

import { Building2, ShieldCheck, Workflow } from "lucide-react";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicMutedPanelClassName, publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getRawMarkupContent } from "@/lib/publicSiteContent";

type AboutContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  missionTitle: string;
  missionBody: string;
  governanceTitle: string;
  governanceBody: string;
};

const productPillars = [
  { title: "Tenant-ready architecture", description: "Separate client workflows clearly without creating visual clutter.", icon: ShieldCheck },
  { title: "Connected operations", description: "Keep business functions aligned inside one system.", icon: Workflow },
  { title: "Professional presentation", description: "Give clients a cleaner branded experience before and after login.", icon: Building2 },
];

export default function AboutPage() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("about");
  const content = parseContent<AboutContent>({
    eyebrow: "About",
    title: `${profile.companyName} works with ${profile.brandName}`,
    subtitle: "A unified ERP and operations experience built for teams that need clarity, governance, and dependable workflows.",
    missionTitle: "Our mission",
    missionBody: "Create a simpler operating surface that helps teams move faster while staying controlled and accountable.",
    governanceTitle: "Governance",
    governanceBody: "We align access, workflows, approvals, and support so the platform stays clean for daily users and credible for stakeholders.",
  });
  const rawMarkup = getRawMarkupContent(pageRecord?.contentJson);

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="py-18 sm:py-22">
        <div className={`${publicSectionClassName} grid gap-8 lg:grid-cols-[1.02fr_0.98fr]`}>
          <div className="space-y-7">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <div className={`${publicMutedPanelClassName} p-6`}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{content.missionTitle}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{content.missionBody}</p>
            </div>
          </div>

          <div className={`${publicPanelClassName} p-7`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Snapshot</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Industry</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{profile.industry}</p>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Headquarters</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{profile.headquarters}</p>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Support</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{profile.supportTier}</p>
              </div>
              <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Partner</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{profile.implementationPartner}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-18 sm:pb-22">
        <div className={`${publicSectionClassName} grid gap-5 md:grid-cols-3`}>
          {productPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className={`${publicPanelClassName} p-6`}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-sky-50 text-(--erp-primary)">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{pillar.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pb-18 sm:pb-22">
        <div className={`${publicSectionClassName}`}>
          <div className={`${publicMutedPanelClassName} p-7`}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-(--erp-primary)">{content.governanceTitle}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{content.governanceBody}</p>
          </div>
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
