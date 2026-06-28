import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Login",
  description:
    "Secure tenant-aware login for ERP, HRMS, payroll, finance, and operational workflows.",
  path: "/login",
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
