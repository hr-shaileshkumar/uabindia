import PublicStatusPage from "@/components/public/PublicStatusPage";

export default function TenantNotFoundPage() {
  return (
    <PublicStatusPage
      eyebrow="Tenant error"
      title="This workspace could not be matched to a configured tenant."
      description="The subdomain or tenant path you used does not map to an active company workspace in the current environment."
      note="Check the URL, switch back to the public site, or contact the platform administrator for the correct tenant address."
      actions={[
        { href: "/", label: "Return to Main Website" },
        { href: "/login", label: "Sign In to Workspace", variant: "secondary" },
      ]}
    />
  );
}
