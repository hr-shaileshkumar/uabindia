import { ROUTES } from "@/constants/routes";
import ModuleOverviewPage from "@/features/shared/components/ModuleOverviewPage";

export default function SsoPage() {
  return (
    <ModuleOverviewPage
      title="Single Sign-On (SSO)"
      subtitle="Configure SAML 2.0 and OAuth/OIDC SSO providers for enterprise identity federation."
      eyebrow="Security / Authentication"
      icon="shield"
      actionHref={ROUTES.SECURITY_HOME}
      actionLabel="Back to Security"
      tiles={[
        { href: "#", title: "SAML 2.0 Provider", description: "Configure SAML-based identity provider connection and attribute mapping.", icon: "🔐", meta: "Enterprise SSO" },
        { href: "#", title: "OAuth / OIDC", description: "Set up OAuth 2.0 and OpenID Connect provider configurations.", icon: "🔑", meta: "Modern auth" },
        { href: "#", title: "Directory Sync", description: "Sync user accounts from Azure AD, Google Workspace, or Okta.", icon: "🗂️", meta: "User provisioning" },
      ]}
      notice="SSO configuration requires super-admin privileges. Contact your identity provider for metadata and certificates before setup."
    />
  );
}
