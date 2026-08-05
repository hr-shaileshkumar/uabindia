import PublicStatusPage from "@/components/public/PublicStatusPage";

export default function NotFoundPage() {
  return (
    <PublicStatusPage
      eyebrow="404 page"
      title="The page you were looking for does not exist."
      description="That route may have moved, the link may be outdated, or the page may not be published for the current public audience."
      note="Use the main public navigation or jump back into the product overview to continue."
      actions={[
        { href: "/", label: "Go to home" },
        { href: "/products", label: "Browse products", variant: "secondary" },
      ]}
    />
  );
}
