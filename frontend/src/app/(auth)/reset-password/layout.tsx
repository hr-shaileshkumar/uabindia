import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Reset Password",
  description:
    "Set a new password for your UabIndia ERP tenant workspace and continue sign-in securely.",
  path: "/reset-password",
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
