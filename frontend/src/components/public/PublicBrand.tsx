"use client";

import { cn } from "@/lib/utils";

type PublicBrandProps = {
  logoUrl?: string;
  brandName?: string;
  className?: string;
  imageClassName?: string;
  size?: "sm" | "md" | "lg";
};

export default function PublicBrand({
  logoUrl,
  brandName = "UabIndia ERP",
  className,
  imageClassName,
  size = "md",
}: PublicBrandProps) {
  const isDefaultLogo =
    !logoUrl ||
    logoUrl === "/logo.png" ||
    logoUrl.endsWith("/logo.png") ||
    logoUrl === "logo.png";

  const normalized = brandName.trim();
  const uabMatch = normalized.match(/^uab\s*india(?:\s+(.*))?$/i);
  const isUabBrand = Boolean(uabMatch);
  let suffix = uabMatch?.[1]?.trim() || "";

  if (suffix.toLowerCase() === "enterprise platform") {
    suffix = "ERP";
  }

  const heightClass =
    size === "sm" ? "h-6" : size === "lg" ? "h-8" : "h-7";

  if (isDefaultLogo) {
    return (
      <div className={cn("flex shrink-0 items-center gap-2.5", className)}>
        {/* Wordmark logo which already contains 'uabindia' */}
        <img
          src="/logo.png"
          alt={brandName || "UabIndia"}
          className={cn(
            heightClass,
            "w-auto object-contain transition-transform group-hover:scale-105 dark:brightness-0 dark:invert",
            imageClassName,
          )}
        />

        {/* If brand has an edition suffix (like 'ERP' or 'Enterprise'), render clean badge */}
        {suffix ? (
          <span
            style={{
              backgroundColor: "var(--uab-brand-accent-soft, rgba(37,99,235,0.1))",
              color: "var(--uab-brand-primary, #1d4ed8)",
            }}
            className="hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ring-1 ring-inset ring-current/15"
          >
            {suffix}
          </span>
        ) : !isUabBrand && normalized && normalized !== "Enterprise Platform" ? (
          <div className="flex items-center gap-2 border-l border-slate-300 pl-2.5 dark:border-slate-700">
            <span
              style={{ color: "var(--uab-brand-primary, inherit)" }}
              className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100"
            >
              {normalized}
            </span>
            <span
              style={{
                backgroundColor: "var(--uab-brand-accent-soft, rgba(37,99,235,0.1))",
                color: "var(--uab-brand-primary, #1d4ed8)",
              }}
              className="hidden md:inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            >
              Workspace
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  // Tenant custom logo uploaded
  return (
    <div className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <img
        src={logoUrl}
        alt={brandName}
        className={cn(
          heightClass,
          "w-auto object-contain transition-transform group-hover:scale-105",
          imageClassName,
        )}
      />
      {brandName ? (
        <span
          style={{ color: "var(--uab-brand-primary, inherit)" }}
          className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white"
        >
          {brandName}
        </span>
      ) : null}
    </div>
  );
}
