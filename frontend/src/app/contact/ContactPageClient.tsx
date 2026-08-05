"use client";

import { Clock3, Mail, MapPinned, PhoneCall } from "lucide-react";
import {
  CtaPanel,
  DemoAgendaPanel,
  SectionIntro,
  SupportLaneGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";

import { supportLanes, publicSiteUrl } from "@/lib/public-marketing";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export default function ContactPageClient({ audience }: { audience: PublicAudience }) {
  const {
    profile,
    headerContent,
    footerContent,
    allowedPaths,
    pageVisible,
    parseContent,
  } = usePublicPageData("contact", audience);

  const content = parseContent<ContactContent>({
    eyebrow: audience === "platform" ? "Contact and demo requests" : "Support and contact",
    title:
      audience === "platform"
        ? "Talk to the UabIndia ERP team about your rollout."
        : `Contact ${profile.brandName} support and service teams.`,
    subtitle:
      audience === "platform"
        ? "Share your business size, current system stack, and module priorities. We will shape the walkthrough around your real operating context."
        : "Use this page for access support, workflow help, product questions, and company-level assistance.",
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact UabIndia ERP",
    url: `${publicSiteUrl}/contact`,
    description: content.subtitle,
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
      <PublicStructuredData data={structuredData} />

      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.88fr_1.12fr]`}>
          <div className="space-y-5">
            <MotionReveal>
              <SectionIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            </MotionReveal>
            <MotionReveal delay={0.06}>
              <DemoAgendaPanel
                items={[
                  "Map the modules that matter first for your business",
                  "Review approval, reporting, attendance, and payroll friction points",
                  "Discuss implementation sequencing, entities, and branch complexity",
                  "Plan a realistic path from demo to deployment",
                ]}
              />
            </MotionReveal>
            <MotionReveal delay={0.12}>
              <div className={`${publicPanelClassName} p-5`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">Direct contact</p>
                <div className="mt-4 grid gap-2.5">
                  {[
                    { icon: Mail, label: "Email", value: profile.supportEmail },
                    { icon: PhoneCall, label: "Phone", value: profile.supportPhone },
                    { icon: MapPinned, label: "Address", value: profile.headquarters },
                    { icon: Clock3, label: "Hours", value: profile.supportHours },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="flex items-start gap-4 rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] border border-slate-200 bg-white text-[color:var(--erp-primary)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                          <p className="mt-1 text-sm leading-7 text-slate-700">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </MotionReveal>
          </div>

          <MotionReveal delay={0.08}>
            <div className={`${publicPanelClassName} h-full p-5 sm:p-6`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">Contact view</p>
              <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-slate-950">A clear route into the right team.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This page should help the visitor identify the right conversation quickly instead of forcing every request through the same channel.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Sales", value: "Demo-led" },
                  { label: "Support", value: "Tenant-ready" },
                  { label: "Routing", value: "Clear" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[0.95rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  "Sales and rollout enquiries should be separated from live tenant issue handling.",
                  "Regional presence and working hours should be visible without hunting through the footer.",
                  "The next action should be obvious whether the user wants a demo or operational support.",
                ].map((item) => (
                  <div key={item} className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.86fr_1.14fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro
                eyebrow="Support coverage"
                title="The right conversation depends on where the business issue sits."
                subtitle="Sales, implementation, support, and post-go-live optimization are related, but they should still follow clear ownership paths."
              />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <SupportLaneGrid items={supportLanes} />
          </MotionReveal>
        </div>
      </section>

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.9fr_1.1fr]`}>
          <MotionReveal>
              <div className={`${publicPanelClassName} p-5 sm:p-6`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">Visit or verify</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">Clean contact data, clear location context.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Public contact pages should make the next step obvious: who to contact, where the team sits, and how enquiries are routed.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sales desk</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">Response-led routing</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Demo, pricing, and rollout queries are separated from tenant support requests.</p>
                </div>
                <div className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace support</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">Operational escalation</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Access, workflow, payroll, and employee issues can be triaged to the correct team quickly.</p>
                </div>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06}>
            <div className={`${publicPanelClassName} overflow-hidden p-3 sm:p-4`}>
              <div className="rounded-[1.35rem] border border-[#dbe7ff] bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">Regional presence</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Business-ready contact map</h3>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Verified
                  </div>
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-white/80 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
                  <div className="relative h-[16rem] overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,#eaf3ff,#dfeeff)] sm:h-[18rem]">
                    <div className="absolute inset-x-0 top-10 h-px bg-[linear-gradient(90deg,transparent,rgba(15,94,255,0.18),transparent)]" />
                    <div className="absolute left-10 top-16 h-24 w-24 rounded-full bg-[#0f5eff]/10 blur-2xl" />
                    <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="absolute inset-x-8 bottom-6 top-12 rounded-[1.1rem] border border-[#d4e3ff] bg-[repeating-linear-gradient(90deg,rgba(15,94,255,0.04)_0,rgba(15,94,255,0.04)_1px,transparent_1px,transparent_64px),repeating-linear-gradient(0deg,rgba(15,94,255,0.035)_0,rgba(15,94,255,0.035)_1px,transparent_1px,transparent_54px)]" />
                    <div className="absolute left-[18%] top-[35%] rounded-full bg-white px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.1)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">HQ</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">Noida</p>
                    </div>
                    <div className="absolute left-[52%] top-[22%] rounded-full bg-white px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.1)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Support</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">Remote desk</p>
                    </div>
                    <div className="absolute left-[62%] top-[58%] rounded-full bg-white px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.1)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rollout</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">Multi-site ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Planning call"
        title="If you already know the pain points, the fastest next step is a focused walkthrough."
        description="Share your employee count, locations, and target modules. We will shape the discussion around rollout fit rather than generic product presentation."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="View Pricing"
        secondaryHref={withPublicAudience("/pricing", audience)}
      />
    </PublicAudiencePageFrame>
  );
}
