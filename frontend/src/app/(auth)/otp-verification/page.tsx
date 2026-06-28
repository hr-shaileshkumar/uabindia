import { redirect } from "next/navigation";
import { withPublicAudience, normalizePublicAudience } from "@/lib/public-audience";

export default async function OtpVerificationPage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const audience = normalizePublicAudience(params?.audience) ?? "tenant";
  redirect(withPublicAudience("/login", audience));
}
