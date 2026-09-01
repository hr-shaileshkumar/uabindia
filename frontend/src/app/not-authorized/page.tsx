"use client";

import { useSearchParams } from "next/navigation";
import PublicStatusPage from "@/components/public/PublicStatusPage";

const messages: Record<string, { title: string; body: string; note: string }> = {
  "access-not-configured": {
    title: "Access is not configured",
    body: "Your account is authenticated, but the backend has not published module navigation or route access for this workspace yet.",
    note: "An administrator needs to verify tenant modules, role mapping, menu configuration, and route rules.",
  },
  "permissions-unavailable": {
    title: "Permissions could not be loaded",
    body: "The frontend could not retrieve your backend permission grants for this session.",
    note: "Retry the session or contact support if the permissions API remains unavailable.",
  },
  "navigation-unavailable": {
    title: "Workspace navigation is unavailable",
    body: "The backend navigation contract could not be loaded, so the protected shell cannot render a safe workspace.",
    note: "This is usually caused by a backend API failure or incomplete tenant UI schema setup.",
  },
  "access-denied": {
    title: "Access blocked",
    body: "This page is not available for your current backend permissions, enabled modules, or feature configuration.",
    note: "If you believe this is incorrect, contact your administrator.",
  },
};

export default function NotAuthorizedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get("reason") || "access-denied";
  const message = messages[reason] || messages["access-denied"];

  return (
    <PublicStatusPage
      eyebrow="Access control"
      title={message.title}
      description={message.body}
      note={message.note}
      actions={[
        { href: "/context", label: "Re-check workspace" },
        { href: "/login", label: "Re-authenticate", variant: "secondary" },
      ]}
    />
  );
}
