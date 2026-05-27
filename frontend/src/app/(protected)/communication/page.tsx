import { ROUTES } from "@/constants/routes";
import ModuleOverviewPage from "@/features/shared/components/ModuleOverviewPage";

export default function CommunicationOverviewPage() {
  return (
    <ModuleOverviewPage
      title="Communication"
      subtitle="Manage company-wide announcements, email templates, SMS templates, and mass notification campaigns."
      eyebrow="Communication / Control Center"
      icon="dashboard"
      actionHref={ROUTES.COMMUNICATION_ANNOUNCEMENTS}
      actionLabel="Post Announcement"
      tiles={[
        { href: ROUTES.COMMUNICATION_ANNOUNCEMENTS, title: "Announcements", description: "Broadcast company-wide or targeted announcements to employees.", icon: "📢", meta: "Company comms" },
        { href: ROUTES.COMMUNICATION_EMAIL_TEMPLATES, title: "Email Templates", description: "Design and manage reusable email templates for HR, payroll, and system notifications.", icon: "✉️", meta: "Email builder" },
        { href: ROUTES.COMMUNICATION_SMS_TEMPLATES, title: "SMS Templates", description: "Configure SMS message templates for alerts, OTPs, and employee notifications.", icon: "💬", meta: "SMS builder" },
      ]}
      notice="Consistent communication builds trust. Use templates to ensure branded, compliant messaging across all channels and employee touchpoints."
    />
  );
}
