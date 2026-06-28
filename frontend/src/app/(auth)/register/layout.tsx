import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Request Access",
  description:
    "Request workspace access for your tenant or business rollout inside UabIndia ERP.",
  path: "/register",
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
