import { headers } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getHostname = async () => {
  const host = (await headers()).get("host") || "";
  return host.split(":")[0].toLowerCase();
};

const isLocalhost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";

const getSubdomain = (hostname: string) => {
  if (!hostname.endsWith(".localhost")) return null;
  const parts = hostname.split(".");
  return parts.length >= 2 ? parts[0] : null;
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
      redirect("/tenant-not-found");
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/tenants/resolve?subdomain=${encodeURIComponent(subdomain)}`,
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
