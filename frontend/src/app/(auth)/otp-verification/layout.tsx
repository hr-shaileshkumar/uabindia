import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "OTP Verification",
  description:
    "Verify your one-time password to continue secure authentication in UabIndia ERP.",
  path: "/otp-verification",
});

export default function OtpVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
