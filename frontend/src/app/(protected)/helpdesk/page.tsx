import { ROUTES } from "@/constants/routes";
import ModuleOverviewPage from "@/features/shared/components/ModuleOverviewPage";

export default function HelpdeskOverviewPage() {
  return (
    <ModuleOverviewPage
      title="Helpdesk"
      subtitle="Manage internal support tickets, escalations, SLA tracking, and self-service FAQs."
      eyebrow="Helpdesk / Control Center"
      icon="dashboard"
      actionHref={ROUTES.HELPDESK_TICKETS}
      actionLabel="View Tickets"
      tiles={[
        { href: ROUTES.HELPDESK_TICKETS, title: "Tickets", description: "Create, assign, and resolve internal support requests across all departments.", icon: "🎫", meta: "Support queue" },
        { href: ROUTES.HELPDESK_ESCALATIONS, title: "Escalations", description: "Review and manage escalated tickets that require senior attention or SLA breach action.", icon: "🚨", meta: "Priority issues" },
        { href: ROUTES.HELPDESK_FAQ, title: "FAQ", description: "Build and manage a self-service knowledge base to deflect common support requests.", icon: "❓", meta: "Knowledge base" },
      ]}
      notice="Streamline internal support by routing tickets to the right team, tracking SLA compliance, and empowering employees with self-service answers."
    />
  );
}
