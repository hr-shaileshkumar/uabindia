import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "About UabIndia ERP",
  description:
    "Learn how UabIndia ERP is designed for connected business workflows, stronger governance, and premium enterprise operations software.",
  path: "/about",
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
