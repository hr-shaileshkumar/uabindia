import { ROUTES } from "@/constants/routes";
import ModuleOverviewPage from "@/features/shared/components/ModuleOverviewPage";

export default function SecurityOverviewPage() {
  return (
    <ModuleOverviewPage
      title="Authentication & Security"
      subtitle="Enterprise identity, session governance, and policy control for secure ERP access."
      eyebrow="Security / Control Center"
      icon="shield"
      actionHref={ROUTES.SECURITY_MFA}
      actionLabel="Review MFA"
      tiles={[
        { href: ROUTES.SECURITY_SESSIONS, title: "Sessions", description: "Review active refresh tokens and session controls.", icon: "♻️", meta: "Identity runtime" },
        { href: ROUTES.SECURITY_DEVICES, title: "Device Sessions", description: "Track trusted devices and enrolled endpoints.", icon: "📱", meta: "Endpoint trust" },
        { href: ROUTES.SECURITY_PASSWORD_POLICIES, title: "Password Policies", description: "Enforce enterprise-grade credential standards.", icon: "🔏", meta: "Access policy" },
        { href: ROUTES.SECURITY_MFA, title: "MFA", description: "Strengthen authentication with multi-factor controls.", icon: "🛂", meta: "Verification" },
      ]}
      notice="Roadmap-ready capabilities include SSO/OAuth, SAML 2.0, deeper audit evidence, and compliance-grade identity reporting."
    />
  );
}
