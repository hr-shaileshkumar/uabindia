import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Careers",
  description:
    "Explore product, implementation, support, payroll, HR, finance, and platform roles at UabIndia ERP.",
  path: "/careers",
});

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
