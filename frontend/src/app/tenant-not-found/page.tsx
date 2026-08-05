import PublicStatusPage from "@/components/public/PublicStatusPage";

export default function TenantNotFoundPage() {
  return (
    <PublicStatusPage
      eyebrow="Tenant error"
      title="This workspace could not be matched to a configured tenant."
      description="The subdomain or tenant path you used does not map to an active company workspace in the current environment."
      note="Check the URL, switch back to the public site, or contact the platform administrator for the correct tenant address."
      actions={[
        { href: "/", label: "Open public site" },
        { href: "/login", label: "Try login again", variant: "secondary" },
      ]}
    />
  );
}
