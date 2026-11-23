"use client";

import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { publicSiteUrl } from "@/lib/public-marketing";
import type { PublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";

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
      <section className={publicPageSectionClassName}>
        <div className={cn(publicSectionClassName, "max-w-3xl")}>
          <MotionReveal>
            <PublicPageHero eyebrow={eyebrow} title={title} />
          </MotionReveal>
          <div className="mt-8 space-y-4">
            {body.map((section) => (
              <MotionReveal key={section.heading}>
                <article className={publicPanelClassName}>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.heading}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.text}</p>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
    </PublicAudiencePageFrame>
  );
}

export default LegalPublicPage;
