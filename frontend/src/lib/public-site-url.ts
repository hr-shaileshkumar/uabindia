export const publicSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://www.uabindia.in";

export function getPublicBaseDomain(): string {
  if (process.env.NEXT_PUBLIC_BASE_DOMAIN) {
    return process.env.NEXT_PUBLIC_BASE_DOMAIN.replace(/^\.+/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost") {
    const parts = window.location.hostname.split(".");
    if (parts.length >= 2) {
      // e.g. "acme.uabindia.in" -> "uabindia.in", "www.uabindia.com" -> "uabindia.com"
      return parts.slice(-2).join(".");
    }
  }
  return "uabindia.in";
}

