import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerApiV1BaseUrl } from "@/lib/api-base-url";
import { hasTenantScopedHost, isLocalhostHostname } from "@/lib/tenant-host";

const API_BASE_URL = getServerApiV1BaseUrl();

const getHostname = async () => {
  const host = (await headers()).get("host") || "";
  return host.split(":")[0].toLowerCase();
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hostname = await getHostname();

  if (!isLocalhostHostname(hostname) && hasTenantScopedHost(hostname)) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/tenants/resolve?host=${encodeURIComponent(hostname)}`,
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
