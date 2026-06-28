import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerApiV1BaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getServerApiV1BaseUrl();

const getHostname = async () => {
  const host = (await headers()).get("host") || "";
  return host.split(":")[0].toLowerCase();
};

const isLocalhost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";
const RESERVED_HOST_LABELS = new Set(["app", "api", "www"]);

const getSubdomain = (hostname: string) => {
  if (!hostname.endsWith(".localhost")) return null;
  const parts = hostname.split(".");
  const candidate = parts.length >= 2 ? parts[0] : null;
  if (!candidate) return null;
  if (RESERVED_HOST_LABELS.has(candidate)) return null;
  return candidate;
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hostname = await getHostname();

  if (hostname.endsWith(".localhost") && !isLocalhost(hostname)) {
    const subdomain = getSubdomain(hostname);
    if (!subdomain) {
      return <>{children}</>;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/tenants/resolve?subdomain=${encodeURIComponent(subdomain)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        redirect("/tenant-not-found");
      }

      const data = await res.json();
      if (!data?.exists) {
        redirect("/tenant-not-found");
      }
    } catch {
      redirect("/tenant-not-found");
    }
  }

  return <>{children}</>;
}
