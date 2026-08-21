import type { PublicAudience } from "@/lib/public-audience";

type PublicRoutePlacement = "primary" | "footer";

export type ManifestPublicPageLike = {
  label: string;
  path: string;
  isEnabled: boolean;
  placements: string[];
};

type PublicRouteDefinition = {
  key: string;
  label: string;
  href: string;
  audiences: PublicAudience[];
  placements: PublicRoutePlacement[];
};

export type PublicLinkLike = {
  label: string;
  href: string;
};

const PUBLIC_ROUTE_DEFINITIONS: PublicRouteDefinition[] = [
  {
    key: "home",
    label: "Home",
    href: "/",
    audiences: ["platform", "tenant"],
    placements: ["primary", "footer"],
  },
  {
    key: "products",
    label: "Products",
    href: "/products",
    audiences: ["platform"],
    placements: ["primary", "footer"],
  },
  {
    key: "industries",
    label: "Industries",
    href: "/industries",
    audiences: ["platform"],
    placements: ["primary", "footer"],
  },
  {
    key: "pricing",
    label: "Pricing",
    href: "/pricing",
    audiences: ["platform"],
    placements: ["primary", "footer"],
  },
  {
    key: "resources",
    label: "Resources",
    href: "/resources",
    audiences: ["platform"],
    placements: ["primary", "footer"],
  },
  {
    key: "tenant-about",
    label: "About",
    href: "/about",
    audiences: ["tenant"],
    placements: ["primary", "footer"],
  },
  {
    key: "platform-about",
    label: "About",
    href: "/about",
    audiences: ["platform"],
    placements: ["primary", "footer"],
  },
  {
    key: "book-demo",
    label: "Book Demo",
    href: "/book-demo",
    audiences: ["platform"],
    placements: ["primary", "footer"],
  },
  {
    key: "careers",
    label: "Careers",
    href: "/careers",
    audiences: ["platform", "tenant"],
    placements: ["primary", "footer"],
  },
  {
    key: "contact",
    label: "Contact",
    href: "/contact",
    audiences: ["platform", "tenant"],
    placements: ["primary", "footer"],
  },
  {
    key: "help-support",
    label: "Help & Support",
    href: "/help-support",
    audiences: ["platform", "tenant"],
    placements: ["footer"],
  },
  {
    key: "privacy",
    label: "Privacy",
    href: "/privacy",
    audiences: ["platform", "tenant"],
    placements: ["footer"],
  },
  {
    key: "terms",
    label: "Terms",
    href: "/terms",
    audiences: ["platform", "tenant"],
    placements: ["footer"],
  },
  {
    key: "platform-login",
    label: "Login",
    href: "/login",
    audiences: ["platform"],
    placements: ["footer"],
  },
  {
    key: "tenant-login",
    label: "Login",
    href: "/login",
    audiences: ["tenant"],
    placements: ["footer"],
  },
  {
    key: "forgot-password",
    label: "Forgot Password",
    href: "/forgot-password",
    audiences: ["platform", "tenant"],
    placements: ["footer"],
  },
  {
    key: "reset-password",
    label: "Reset Password",
    href: "/reset-password",
    audiences: ["platform", "tenant"],
    placements: ["footer"],
  },
  {
    key: "register",
    label: "Request Access",
    href: "/register",
    audiences: ["platform", "tenant"],
    placements: ["footer"],
  },
];

const normalizeInternalHref = (href: string) => {
  const [pathAndQuery] = href.split("#");
  const [pathname] = pathAndQuery.split("?");
  return pathname || "/";
};

const SUPPORTED_PUBLIC_PATH_PREFIXES = ["/products/", "/industries/"];

const isBuiltInPublicHref = (href: string, audience: PublicAudience) => {
  if (
    PUBLIC_ROUTE_DEFINITIONS.some(
      (route) => route.audiences.includes(audience) && route.href === href
    )
  ) {
    return true;
  }

  return SUPPORTED_PUBLIC_PATH_PREFIXES.some((prefix) => href.startsWith(prefix));
};

export function getDefaultPublicHomeHref(_audience: PublicAudience) {
  return "/";
}

export function getPublicNavLinks(
  audience: PublicAudience,
  placement: PublicRoutePlacement
): PublicLinkLike[] {
  return PUBLIC_ROUTE_DEFINITIONS
    .filter(
      (route) =>
        route.audiences.includes(audience) && route.placements.includes(placement)
    )
    .map(({ label, href }) => ({ label, href }));
}

export function getManifestPublicNavLinks(
  pages: readonly ManifestPublicPageLike[] | undefined,
  placement: PublicRoutePlacement
): PublicLinkLike[] {
  if (!pages || pages.length === 0) {
    return [];
  }

  return pages
    .filter(
      (page) =>
        page.isEnabled &&
        page.path &&
        Array.isArray(page.placements) &&
        page.placements.includes(placement)
    )
    .map((page) => ({
      label: page.label,
      href: page.path,
    }));
}

const isAllowedByManifest = (
  normalizedHref: string,
  allowedPaths?: readonly string[]
) => {
  if (!allowedPaths || allowedPaths.length === 0) {
    return null;
  }

  return allowedPaths.includes(normalizedHref);
};

export function isSupportedPublicHref(
  href: string,
  audience: PublicAudience,
  allowedPaths?: readonly string[]
) {
  if (!href.startsWith("/")) {
    return true;
  }

  const normalizedHref = normalizeInternalHref(href);
  const manifestDecision = isAllowedByManifest(normalizedHref, allowedPaths);
  if (manifestDecision === true) {
    return true;
  }

  if (manifestDecision === false && isBuiltInPublicHref(normalizedHref, audience)) {
    return true;
  }

  return isBuiltInPublicHref(normalizedHref, audience);
}

export function filterPublicLinks<T extends PublicLinkLike>(
  links: T[],
  audience: PublicAudience,
  allowedPaths?: readonly string[]
) {
  const seen = new Set<string>();

  return links.filter((link) => {
    const href = link.href?.trim();
    if (!href) {
      return false;
    }

    const key = href.startsWith("/") ? normalizeInternalHref(href) : href;
    if (seen.has(key)) {
      return false;
    }

    if (href.startsWith("/") && !isSupportedPublicHref(href, audience, allowedPaths)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
