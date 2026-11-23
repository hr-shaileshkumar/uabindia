"use client";

import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/auth/PublicAuthShell";
import PublicPasswordRecoveryCard from "@/components/public/auth/PublicPasswordRecoveryCard";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { withPublicAudience } from "@/lib/public-audience";

export default function ForgotPasswordPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } =
    usePublicPageData("forgot-password", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
      showHeader={false}
      showFooter={false}
    >
      <PublicAuthShell
        brandName={profile.brandName || profile.companyName || process.env.NEXT_PUBLIC_APP_NAME || "UabIndia ERP"}
        homeHref={withPublicAudience("/", audience)}
        audience={audience}
        variant="forgot-password"
        profile={profile}
        headerContent={headerContent}
        allowedPaths={allowedPaths}
      >
        <PublicPasswordRecoveryCard audience={audience} initialMode="request" />
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
