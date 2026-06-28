import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Help and Support",
  description:
    "Review support coverage, escalation flow, and role-specific service guidance for UabIndia ERP.",
  path: "/help-support",
});

export default function HelpSupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
