"use client";

import Link from "next/link";
import {
  AnalyticsShowcase,
  CtaPanel,
  DemoAgendaPanel,
  FaqAccordion,
  IndustryGrid,
  ModuleGrid,
  ProcessTimeline,
  ResourceGrid,
  SectionIntro,
  SupportLaneGrid,
  ValueGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import { publicButtonClassName, publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/erp/contact-demo-form";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import {
  comparisonRows,
  companyValues,
  dashboardSignals,
  demoAgenda,
  frequentlyAskedQuestions,
  getRecommendedModules,
  marketingIndustries,
  marketingModules,
  pricingPlans,
  publicSiteUrl,
  resources,
  supportLanes,
  type MarketingIndustry,
  type MarketingModule,
} from "@/lib/public-marketing";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

function buildModuleWorkflow(module: MarketingModule) {
  return [
    {
      step: "01",
      title: `Configure ${module.title}`,
      description: `Set up the policies, structures, and ownership rules required to run ${module.title.toLowerCase()} inside your business.`,
    },
    {
      step: "02",
      title: "Capture live activity",
      description: `Bring daily actions, requests, approvals, and records into one governed workflow instead of separate spreadsheets or chats.`,
    },
    {
      step: "03",
      title: "Review and approve",
      description: `Managers and admins can validate exceptions, approvals, and operational decisions before they affect reporting or downstream teams.`,
    },
    {
      step: "04",
      title: "Report with confidence",
      description: `Leadership gets a clearer view of ${module.title.toLowerCase()} outcomes through dashboards, KPIs, and audit-ready history.`,
    },
  ];
}

function getModuleFaqs(module: MarketingModule) {
  const keyword = module.title.toLowerCase();
  const highlightKeywords = module.highlights
    .flatMap((highlight) => highlight.toLowerCase().split(/\s+/))
    .filter((part) => part.length > 5);
  const related = frequentlyAskedQuestions.filter((item) => {
    const haystack = `${item.question} ${item.answer}`.toLowerCase();
    return haystack.includes(keyword) || highlightKeywords.some((part) => haystack.includes(part));
  });

  return (related.length > 0 ? related : frequentlyAskedQuestions).slice(0, 6);
}

function buildIndustryWorkflow(industry: MarketingIndustry) {
  return [
    {
      step: "01",
      title: "Map the operating model",
      description: `Review the workflows, roles, and reporting pressure points that shape ${industry.title.toLowerCase()} delivery.`,
    },
    {
      step: "02",
      title: "Deploy the core modules",
      description: `Launch the modules that remove the most friction first, then connect them to approvals, reporting, and leadership visibility.`,
    },
    {
      step: "03",
      title: "Standardize approvals",
      description: `Align department owners, escalation rules, and governance so operating decisions move faster without losing control.`,
    },
    {
      step: "04",
      title: "Scale reporting",
      description: `Expose performance, workforce, finance, and process visibility in a way that matches real sector decisions.`,
    },
  ];
}

function getIndustryFaqs(industry: MarketingIndustry) {
  const keyword = industry.title.toLowerCase();
  const related = frequentlyAskedQuestions.filter((item) =>
    `${item.question} ${item.answer}`.toLowerCase().includes(keyword)
  );

  return (related.length > 0 ? related : frequentlyAskedQuestions.slice(0, 6)).slice(0, 6);
}

export function ProductsLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("features", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Products | UabIndia ERP",
          url: `${publicSiteUrl}/products`,
          description:
            "Explore UabIndia ERP modules for HRMS, payroll, attendance, finance, inventory, procurement, CRM, projects, assets, help desk, and reporting.",
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={publicSectionClassName}>
          <MotionReveal>
            <SectionIntro
              eyebrow="Products"
              title="A connected ERP suite for every core business function."
              subtitle="Each module is valuable on its own. The biggest operational gains come when people, finance, approvals, inventory, and reporting share one data core."
            />
          </MotionReveal>
        </div>
      </section>

      <ModuleGrid
        modules={marketingModules}
        eyebrow="Module suite"
        title="Explore the full UabIndia ERP product stack."
        subtitle="From HRMS and payroll to finance, procurement, projects, help desk, and reporting, the platform is designed to grow with business complexity."
      />

      <ValueGrid
        items={[
          {
            title: "One design language",
            description: "Users do not need to relearn the product when they move from HR workflows into finance or approvals.",
          },
          {
            title: "Shared governance",
            description: "Role-based access, audit signals, and workflow patterns stay consistent across modules.",
          },
          {
            title: "Phased rollout",
            description: "Start with the modules that solve immediate pain, then expand without changing the product direction.",
          },
          {
            title: "Leadership visibility",
            description: "Cross-module reporting matters because business problems rarely stay inside a single department.",
          },
        ]}
        eyebrow="Product philosophy"
        title="The suite is designed to feel like one platform, not a bundle of disconnected tools."
        subtitle="Consistency is a competitive advantage in ERP. It reduces training time, lowers errors, and improves adoption."
      />

      <CtaPanel
        eyebrow="Product walkthrough"
        title="Need help identifying the right module sequence for your rollout?"
        description="Share your current stack and operating priorities. We will recommend where to start and what to phase next."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="View Pricing"
        secondaryHref={withPublicAudience("/pricing", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function ProductDetailPageClient({
  audience,
  module,
}: {
  audience: PublicAudience;
  module: MarketingModule;
}) {
  const shell = usePublicPageData(`product-${module.slug}`, audience);
  const analyticsMetrics =
    shell.siteData?.dashboardMetrics?.length
      ? [...module.metrics, ...shell.siteData.dashboardMetrics].slice(0, 4)
      : module.metrics.slice(0, 4);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${module.title} | UabIndia ERP`,
          url: `${publicSiteUrl}/products/${module.slug}`,
          description: module.summary,
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[1fr_1fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro
                eyebrow={`${module.category} module`}
                title={module.title}
                subtitle={module.description}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                  Book Demo
                </Link>
                <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.secondary}>
                  Talk to sales
                </Link>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06}>
            <div className={`${publicPanelClassName} p-8`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                Outcome focus
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {module.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.3rem] border border-slate-200 bg-slate-50/70 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">{metric.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{metric.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <ValueGrid
        items={module.outcomes.map((item) => ({
          title: item,
          description: `${module.title} helps teams deliver this outcome without fragmented follow-up or reporting gaps.`,
        }))}
        eyebrow="Benefits"
        title={`Why teams adopt ${module.title.toLowerCase()} first.`}
        subtitle="The strongest module rollouts create immediate operational gains while improving trust in the wider ERP program."
      />

      <section className="pb-16 sm:pb-20">
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.92fr_1.08fr]`}>
          <MotionReveal>
            <div className={`${publicPanelClassName} p-8`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                Features
              </p>
              <div className="mt-5 space-y-4">
                {module.highlights.map((highlight) => (
                  <div key={highlight} className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06}>
            <div className={`${publicPanelClassName} p-8`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                Best fit
              </p>
              <div className="mt-5 grid gap-4">
                {module.idealFor.map((item) => (
                  <div key={item} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <ProcessTimeline
        items={buildModuleWorkflow(module)}
        eyebrow="Workflow"
        title={`How ${module.title} runs from setup to reporting.`}
        subtitle="Each module follows the same product discipline: configure once, capture clean data, route approvals, and report confidently."
      />

      <AnalyticsShowcase metrics={analyticsMetrics} />

      <FaqAccordion items={getModuleFaqs(module)} />

      <ModuleGrid
        modules={marketingModules.filter((item) => item.slug !== module.slug).slice(0, 6)}
        eyebrow="Related modules"
        title={`Pair ${module.title} with the rest of the platform for stronger outcomes.`}
        subtitle="ERP value compounds when modules share workflow logic, reporting, and governance."
      />

      <CtaPanel
        eyebrow="Module walkthrough"
        title={`See how ${module.title} fits your current operating model.`}
        description="We can walk through workflows, roles, reports, and rollout dependencies based on your real process environment."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="All Products"
        secondaryHref={withPublicAudience("/products", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function IndustriesLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("industries", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Industries | UabIndia ERP",
          url: `${publicSiteUrl}/industries`,
          description:
            "Industry solutions for healthcare, manufacturing, retail, construction, education, NGOs, logistics, government projects, and services.",
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={publicSectionClassName}>
          <MotionReveal>
            <SectionIntro
              eyebrow="Industries"
              title="Different sectors. One disciplined ERP foundation."
              subtitle="Industry fit is about aligning workflows, approvals, data visibility, and implementation scope to the way each organization actually operates."
            />
          </MotionReveal>
        </div>
      </section>

      <ModuleGrid
        modules={getRecommendedModules(["hrms", "attendance", "payroll", "finance", "procurement", "inventory"])}
        eyebrow="Common module mix"
        title="These modules anchor most industry deployments."
        subtitle="The exact sequence changes by sector, but these areas solve the highest-friction operational gaps most often."
      />

      <IndustryGrid
        industries={marketingIndustries}
        eyebrow="Sector coverage"
        title="Choose the industry lens that matches your operating reality."
        subtitle="Each sector has different pressure points, but the same design principles still apply: clear workflows, stronger control, and faster reporting."
      />

      <CtaPanel
        eyebrow="Industry fit"
        title="Want to see the module mix recommended for your sector?"
        description="We can walk you through the modules, workflows, and reporting layers that usually matter most for your type of organization."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact Us"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function IndustryDetailPageClient({
  audience,
  industry,
}: {
  audience: PublicAudience;
  industry: MarketingIndustry;
}) {
  const shell = usePublicPageData(`industry-${industry.slug}`, audience);
  const recommendedModules = getRecommendedModules(industry.recommendedModules);
  const analyticsMetrics =
    shell.siteData?.dashboardMetrics?.length
      ? shell.siteData.dashboardMetrics
      : recommendedModules.flatMap((item) => item.metrics).slice(0, 4);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${industry.title} ERP Solution | UabIndia ERP`,
          url: `${publicSiteUrl}/industries/${industry.slug}`,
          description: industry.summary,
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[1fr_1fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro eyebrow={industry.eyebrow} title={industry.title} subtitle={industry.description} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                  Book Demo
                </Link>
                <Link href={withPublicAudience("/industries", audience)} className={publicButtonClassName.secondary}>
                  All Industries
                </Link>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06}>
            <div className={`${publicPanelClassName} p-8`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                Typical business pressure points
              </p>
              <div className="mt-5 space-y-4">
                {industry.challenges.map((challenge) => (
                  <div key={challenge} className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    {challenge}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <ModuleGrid
        modules={recommendedModules}
        eyebrow="Recommended modules"
        title={`A strong starting point for ${industry.title.toLowerCase()} organizations.`}
        subtitle="These modules usually create the clearest operational gain first for this sector."
      />

      <ProcessTimeline
        items={buildIndustryWorkflow(industry)}
        eyebrow="Workflow"
        title={`How ${industry.title.toLowerCase()} deployments usually move from pain points to measurable control.`}
        subtitle="Strong industry rollouts standardize the operating model first, then connect workflows, approvals, and reporting to one ERP core."
      />

      <AnalyticsShowcase metrics={analyticsMetrics.length > 0 ? analyticsMetrics : dashboardSignals} />

      <ValueGrid
        items={industry.results.map((item) => ({
          title: item,
          description: `Expected business improvement area for ${industry.title.toLowerCase()} teams after rollout.`,
        }))}
        eyebrow="Expected outcomes"
        title="The goal is better control, faster decisions, and cleaner execution."
        subtitle="Industry rollouts should lead to measurable operational improvements, not just a larger software footprint."
      />

      <FaqAccordion items={getIndustryFaqs(industry)} />

      <CtaPanel
        eyebrow="Solution consultation"
        title={`See how UabIndia ERP maps to ${industry.title.toLowerCase()} workflows.`}
        description="We can review the likely module sequence, approval model, and reporting priorities for your sector."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact Team"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function PricingLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("pricing", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Pricing | UabIndia ERP",
          url: `${publicSiteUrl}/pricing`,
          description: "Commercial planning for phased ERP rollout across growing organizations and enterprise teams.",
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={publicSectionClassName}>
          <MotionReveal>
            <SectionIntro
              eyebrow="Pricing"
              title="Commercial planning that matches rollout scope, not vague feature tiers."
              subtitle="ERP pricing works best when it reflects the real deployment journey: modules, branches, users, workflow complexity, implementation effort, and support expectations."
            />
          </MotionReveal>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className={`${publicSectionClassName} grid gap-5 xl:grid-cols-3`}>
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`${publicPanelClassName} h-full p-7 ${plan.featured ? "border-[color:var(--erp-primary)] shadow-[0_36px_80px_rgba(20,58,104,0.14)]" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">{plan.audience}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{plan.name}</h2>
                </div>
                {plan.featured ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Recommended
                  </span>
                ) : null}
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-500">{plan.implementation}</p>
              <p className="mt-5 text-sm leading-7 text-slate-600">{plan.summary}</p>
              <div className="mt-6 space-y-3">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-[1.15rem] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {point}
                  </div>
                ))}
              </div>
              <Link href={withPublicAudience("/book-demo", audience)} className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Discuss this plan
              </Link>
            </div>
          ))}
        </div>
      </section>

      <ValueGrid
        items={comparisonRows.map((row) => ({
          title: row.capability,
          description: `UabIndia ERP: ${row.uabindia}`,
        }))}
        eyebrow="Commercial logic"
        title="Pricing should follow operational value, implementation complexity, and long-term control."
        subtitle="The right conversation is not just plan comparison. It is rollout sizing, ownership clarity, and support expectations."
      />

      <FaqAccordion items={frequentlyAskedQuestions.slice(0, 8)} />

      <CtaPanel
        eyebrow="Commercial discussion"
        title="Need a pricing conversation tied to your real rollout scope?"
        description="Share company size, entities, module priorities, and approval complexity. We will align the discussion to what you actually need."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact Sales"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function ResourcesLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("resources", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Resources | UabIndia ERP",
          url: `${publicSiteUrl}/resources`,
          description: "Guides, checklists, and planning material for ERP evaluation and rollout teams.",
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={publicSectionClassName}>
          <MotionReveal>
            <SectionIntro
              eyebrow="Resources"
              title="Practical content for buyers, operators, and implementation teams."
              subtitle="Use these materials to evaluate ERP fit, prepare rollout discussions, and align internal stakeholders around expected outcomes."
            />
          </MotionReveal>
        </div>
      </section>

      <ResourceGrid items={resources} />
      <FaqAccordion items={frequentlyAskedQuestions.slice(8, 16)} />

      <CtaPanel
        eyebrow="Need a live answer?"
        title="If a guide is not enough, schedule a focused discussion."
        description="We can move from general advice into your actual organization structure, module priorities, and implementation constraints."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact Team"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function BookDemoLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("book-demo", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Book Demo | UabIndia ERP",
          url: `${publicSiteUrl}/book-demo`,
          description: "Book a tailored walkthrough for your ERP, HR, payroll, finance, and operations rollout.",
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={`${publicSectionClassName} grid gap-8 xl:grid-cols-[0.9fr_1.1fr]`}>
          <div className="space-y-6">
            <MotionReveal>
              <SectionIntro
                eyebrow="Book Demo"
                title="Schedule a walkthrough that matches your actual business priorities."
                subtitle="The best demo is not generic. We shape it around your current process stack, approval needs, reporting gaps, and rollout ambitions."
              />
            </MotionReveal>
            <MotionReveal delay={0.06}>
              <DemoAgendaPanel items={demoAgenda} />
            </MotionReveal>
            <MotionReveal delay={0.12}>
              <SupportLaneGrid items={supportLanes} />
            </MotionReveal>
          </div>
          <MotionReveal delay={0.08}>
            <ContactDemoForm audience={audience} />
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Need more detail?"
        title="Review products, pricing, or industry fit before the conversation."
        description="If you are still narrowing the rollout scope, the product, pricing, and industry pages can help frame the discussion first."
        primaryLabel="View Products"
        primaryHref={withPublicAudience("/products", audience)}
        secondaryLabel="View Pricing"
        secondaryHref={withPublicAudience("/pricing", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function HelpSupportLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("support", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Help & Support | UabIndia ERP",
          url: `${publicSiteUrl}/help-support`,
          description: "Support coverage, service paths, and guidance for UabIndia ERP customers and evaluation teams.",
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={`${publicSectionClassName} grid gap-8 xl:grid-cols-[0.9fr_1.1fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro
                eyebrow="Help & support"
                title="Support should follow the same operational clarity as the product itself."
                subtitle="Good support is role-aware, business-aware, and easy to escalate. Employee help, business admin help, and platform governance do not belong in one undefined queue."
              />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <SupportLaneGrid items={supportLanes} />
          </MotionReveal>
        </div>
      </section>

      <ValueGrid
        items={companyValues}
        eyebrow="Support principles"
        title="Service quality depends on ownership, visibility, and escalation discipline."
        subtitle="The strongest support models reduce confusion, shorten response time, and preserve trust in the platform."
      />

      <CtaPanel
        eyebrow="Need assistance"
        title="Use the contact page for product, implementation, or support conversations."
        description="The support team can route your request based on the type of business issue and the stage of your rollout."
        primaryLabel="Contact Team"
        primaryHref={withPublicAudience("/contact", audience)}
        secondaryLabel="Book Demo"
        secondaryHref={withPublicAudience("/book-demo", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export function LegalPublicPage({
  audience,
  title,
  eyebrow,
  body,
  path,
}: {
  audience: PublicAudience;
  title: string;
  eyebrow: string;
  body: Array<{ heading: string; text: string }>;
  path: string;
}) {
  const shell = usePublicPageData(path.replace("/", ""), audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${title} | UabIndia ERP`,
          url: `${publicSiteUrl}${path}`,
        }}
      />

      <section className="py-16 sm:py-20">
        <div className={`${publicSectionClassName} max-w-4xl`}>
          <MotionReveal>
            <SectionIntro
              eyebrow={eyebrow}
              title={title}
              subtitle="These summary pages communicate baseline commitments for public-site visitors and demo enquiries. Formal legal documents can be provided during commercial discussions where required."
            />
          </MotionReveal>
          <div className="mt-10 space-y-5">
            {body.map((section) => (
              <div key={section.heading} className={`${publicPanelClassName} p-6`}>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{section.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicAudiencePageFrame>
  );
}
