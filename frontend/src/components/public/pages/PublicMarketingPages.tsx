"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  CtaPanel,
  DemoAgendaPanel,
  PricingGrid,
  SupportLaneGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/workspace/contact-demo-form";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import {
  demoAgenda,
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

type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

function PageShell({
  audience,
  shell,
  structuredData,
  children,
}: {
  audience: PublicAudience;
  shell: ReturnType<typeof usePublicPageData>;
  structuredData: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData data={structuredData} />
      {children}
    </PublicAudiencePageFrame>
  );
}

function ModuleCard({ module }: { module: MarketingModule }) {
  return (
    <Link href={`/products/${module.slug}`} className={`${publicPanelHoverClassName} group flex h-full flex-col`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{module.category}</p>
      <h3 className="mt-2 text-base font-semibold text-slate-900">{module.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{module.summary}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
        View module
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function IndustryTile({ industry }: { industry: MarketingIndustry }) {
  return (
    <Link href={`/industries/${industry.slug}`} className={`${publicPanelHoverClassName} group flex h-full flex-col`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{industry.eyebrow}</p>
      <h3 className="mt-2 text-base font-semibold text-slate-900">{industry.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{industry.summary}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
        Explore solution
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProductsLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("features", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Products",
    title: "Modules for people, finance, and operations",
    subtitle:
      "Start with HR and payroll, then expand into finance, procurement, inventory, CRM, and reporting — one shared platform.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Products | UabIndia ERP",
        url: `${publicSiteUrl}/products`,
        description: content.subtitle,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {marketingModules.map((module, index) => (
              <MotionReveal key={module.slug} delay={index * 0.02}>
                <ModuleCard module={module} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <CtaPanel
        eyebrow="Need a starting scope?"
        title="We will recommend the right modules for your first rollout."
        description="Share team size, current tools, and process gaps — we will propose a practical module plan."
        primaryLabel="Request a Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact Sales"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PageShell>
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
  const content = shell.parseContent<HeroContent>({
    eyebrow: module.category,
    title: module.title,
    subtitle: module.summary,
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${module.title} | UabIndia ERP`,
        url: `${publicSiteUrl}/products/${module.slug}`,
        description: module.summary,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
              actions={
                <>
                  <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                    Request a Demo
                  </Link>
                  <Link href={withPublicAudience("/products", audience)} className={publicButtonClassName.secondary}>
                    Explore All Modules
                  </Link>
                </>
              }
            />
          </MotionReveal>
          <MotionReveal delay={0.04}>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{module.description}</p>
          </MotionReveal>
        </div>
      </section>

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-4 lg:grid-cols-2`}>
          <MotionReveal>
            <div className={publicPanelClassName}>
              <p className={publicEyebrowClassName}>Highlights</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">What is included</h2>
              <div className="mt-5">
                <Checklist items={module.highlights} />
              </div>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.04}>
            <div className={publicPanelClassName}>
              <p className={publicEyebrowClassName}>Outcomes</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">What teams improve</h2>
              <div className="mt-5">
                <Checklist items={module.outcomes} />
              </div>
            </div>
          </MotionReveal>
        </div>

        {module.idealFor.length > 0 ? (
          <div className={`${publicSectionClassName} mt-4`}>
            <MotionReveal>
              <div className={publicPanelClassName}>
                <p className={publicEyebrowClassName}>Best suited for</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.idealFor.map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </MotionReveal>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

export function IndustriesLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("industries", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Industries",
    title: "One ERP core, configured by sector",
    subtitle:
      "Healthcare, manufacturing, retail, logistics, education, and services — same product foundation, workflow fit for each industry.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Industries | UabIndia ERP",
        url: `${publicSiteUrl}/industries`,
        description: content.subtitle,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {marketingIndustries.map((industry, index) => (
              <MotionReveal key={industry.slug} delay={index * 0.02}>
                <IndustryTile industry={industry} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <CtaPanel
        eyebrow="Industry fit"
        title="Book a walkthrough for your operating model."
        description="We will map modules and workflows to how your sector runs people, finance, and operations."
        primaryLabel="Book Industry Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Explore All Products"
        secondaryHref={withPublicAudience("/products", audience)}
      />
    </PageShell>
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
  const content = shell.parseContent<HeroContent>({
    eyebrow: industry.eyebrow,
    title: industry.title,
    subtitle: industry.summary,
  });
  const modules = getRecommendedModules(industry.recommendedModules);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${industry.title} ERP Solution | UabIndia ERP`,
        url: `${publicSiteUrl}/industries/${industry.slug}`,
        description: industry.summary,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
              actions={
                <>
                  <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                    Book Industry Demo
                  </Link>
                  <Link href={withPublicAudience("/industries", audience)} className={publicButtonClassName.secondary}>
                    Explore All Industries
                  </Link>
                </>
              }
            />
          </MotionReveal>
          <MotionReveal delay={0.04}>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">{industry.description}</p>
          </MotionReveal>
        </div>
      </section>

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-4 lg:grid-cols-2`}>
          <MotionReveal>
            <div className={publicPanelClassName}>
              <p className={publicEyebrowClassName}>Challenges</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Problems this solution addresses</h2>
              <div className="mt-5">
                <Checklist items={industry.challenges} />
              </div>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.04}>
            <div className={publicPanelClassName}>
              <p className={publicEyebrowClassName}>Outcomes</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">What teams typically improve</h2>
              <div className="mt-5">
                <Checklist items={industry.results} />
              </div>
            </div>
          </MotionReveal>
        </div>

        {modules.length > 0 ? (
          <div className={`${publicSectionClassName} mt-8`}>
            <MotionReveal>
              <p className={publicEyebrowClassName}>Recommended modules</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">A practical stack for this sector</h2>
            </MotionReveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {modules.map((module, index) => (
                <MotionReveal key={module.slug} delay={index * 0.02}>
                  <ModuleCard module={module} />
                </MotionReveal>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

export function PricingLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("pricing", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Pricing",
    title: "Plans that follow rollout scope",
    subtitle:
      "Every tier includes the platform foundation. Commercial terms track business size, module scope, and implementation depth.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Pricing | UabIndia ERP",
        url: `${publicSiteUrl}/pricing`,
        description: content.subtitle,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <MotionReveal delay={0.04} className="mt-8">
            <PricingGrid plans={pricingPlans} />
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Commercial planning"
        title="Need help choosing the right plan?"
        description="Tell us about your branches, modules, and timeline — we will recommend a commercial model that fits."
        primaryLabel="Talk to Sales"
        primaryHref={withPublicAudience("/contact", audience)}
        secondaryLabel="Request a Demo"
        secondaryHref={withPublicAudience("/book-demo", audience)}
      />
    </PageShell>
  );
}

export function ResourcesLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("resources", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Resources",
    title: "Guides for ERP evaluation and rollout",
    subtitle: "Practical playbooks, checklists, and industry briefs for teams planning a phased ERP adoption.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Resources | UabIndia ERP",
        url: `${publicSiteUrl}/resources`,
        description: content.subtitle,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((item, index) => (
              <MotionReveal key={item.title} delay={index * 0.02}>
                <Link href={item.href} className={`${publicPanelHoverClassName} group block h-full`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.type}</p>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                    Open resource
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function BookDemoLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("book-demo", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Personalized Walkthrough",
    title: "Schedule a walkthrough for your rollout priorities",
    subtitle: "Share your scope and we will focus on modules, approvals, reporting, and adoption fit.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Request a Demo | UabIndia ERP",
        url: `${publicSiteUrl}/book-demo`,
        description: content.subtitle,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start`}>
          <div className="space-y-6">
            <MotionReveal>
              <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            </MotionReveal>
            <MotionReveal delay={0.04}>
              <DemoAgendaPanel items={[...demoAgenda]} />
            </MotionReveal>
          </div>
          <MotionReveal delay={0.06}>
            <div className={publicPanelClassName}>
              <ContactDemoForm audience={audience} variant="public" />
            </div>
          </MotionReveal>
        </div>
      </section>
    </PageShell>
  );
}

export function HelpSupportLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("support", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Help & support",
    title: "Clear support paths for every stage",
    subtitle:
      "Whether you are evaluating, rolling out, or running live operations — reach the team that owns your request.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Help & Support | UabIndia ERP",
        url: `${publicSiteUrl}/help-support`,
        description: content.subtitle,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <MotionReveal delay={0.04} className="mt-8">
            <SupportLaneGrid items={[...supportLanes]} />
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Need help now?"
        title="Contact the team for sales, rollout, or live support."
        description="Share your question and we will route it to the appropriate support lane."
        primaryLabel="Contact Support Desk"
        primaryHref={withPublicAudience("/contact", audience)}
        secondaryLabel="Request a Demo"
        secondaryHref={withPublicAudience("/book-demo", audience)}
      />
    </PageShell>
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
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${title} | UabIndia ERP`,
        url: `${publicSiteUrl}${path}`,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} max-w-3xl`}>
          <MotionReveal>
            <PublicPageHero eyebrow={eyebrow} title={title} />
          </MotionReveal>
          <div className="mt-8 space-y-4">
            {body.map((section) => (
              <MotionReveal key={section.heading}>
                <article className={publicPanelClassName}>
                  <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
