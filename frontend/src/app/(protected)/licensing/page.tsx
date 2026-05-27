import { ROUTES } from "@/constants/routes";
import ModuleOverviewPage from "@/features/shared/components/ModuleOverviewPage";

export default function LicensingOverviewPage() {
  return (
    <ModuleOverviewPage
      title="Modules & Licensing"
      subtitle="Enterprise product control for feature enablement, commercial packaging, and integration readiness."
      eyebrow="Licensing / Control Center"
      icon="dashboard"
      actionHref={ROUTES.LICENSING_SUBSCRIPTIONS}
      actionLabel="Manage Subscriptions"
      tiles={[
        { href: ROUTES.LICENSING_CATALOG, title: "Module Catalog", description: "Review available modules, versions, and product packaging.", icon: "📚", meta: "Product catalog" },
        { href: ROUTES.LICENSING_SUBSCRIPTIONS, title: "Subscriptions", description: "Control tenant-by-tenant enablement and commercial plans.", icon: "🧾", meta: "Commercial control" },
        { href: ROUTES.LICENSING_INTEGRATIONS, title: "API Keys & Integrations", description: "Manage external connectivity, keys, and service integrations.", icon: "🔑", meta: "Ecosystem" },
      ]}
      notice="Dynamic module activation, version control, API integrations, and tenant-level subscription management are all centralized here—no redeploy required."
    />
  );
}
