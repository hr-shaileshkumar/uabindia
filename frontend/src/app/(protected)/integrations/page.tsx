import { ROUTES } from "@/constants/routes";
import ModuleOverviewPage from "@/features/shared/components/ModuleOverviewPage";

export default function IntegrationsOverviewPage() {
  return (
    <ModuleOverviewPage
      title="Integrations"
      subtitle="Connect the ERP platform to third-party services, manage API keys, webhooks, and integration logs."
      eyebrow="Integrations / Control Center"
      icon="dashboard"
      actionHref={ROUTES.INTEGRATIONS_API_KEYS}
      actionLabel="Manage API Keys"
      tiles={[
        { href: ROUTES.INTEGRATIONS_API_KEYS, title: "API Keys", description: "Create and revoke API keys for external service access.", icon: "🔑", meta: "Access control" },
        { href: ROUTES.INTEGRATIONS_WEBHOOKS, title: "Webhooks", description: "Configure webhook endpoints to push real-time events to external systems.", icon: "🔗", meta: "Event push" },
        { href: ROUTES.INTEGRATIONS_APPS, title: "Connected Apps", description: "Manage third-party app integrations and OAuth permissions.", icon: "🧩", meta: "App marketplace" },
        { href: ROUTES.INTEGRATIONS_LOGS, title: "Integration Logs", description: "Audit all inbound and outbound integration requests and responses.", icon: "📋", meta: "Audit trail" },
      ]}
      notice="Secure your integration surface by rotating API keys regularly and monitoring webhook delivery logs for failures."
    />
  );
}
