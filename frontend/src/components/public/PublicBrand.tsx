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
  brandName = "UabIndia",
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
  const uabMatch = normalized.match(/^uab\s*india(?:\s+.*)?$/i);
  const isUabBrand = Boolean(uabMatch);

  const heightClass =
    size === "sm" ? "h-6" : size === "lg" ? "h-8" : "h-7";

  if (isDefaultLogo) {
    return (
      <div className={cn("flex shrink-0 items-center gap-2.5", className)}>
        {/* Wordmark logo which contains 'uabindia' */}
        <img
          src="/logo.png"
          alt={brandName || "UabIndia"}
          className={cn(
            heightClass,
            "w-auto object-contain transition-transform group-hover:scale-105 dark:brightness-0 dark:invert",
            imageClassName,
          )}
        />

        {/* If custom tenant company name is present (different from UabIndia), render tenant name */}
        {!isUabBrand && normalized && normalized !== "Enterprise Platform" ? (
          <div className="flex items-center gap-2 border-l border-slate-300 pl-2.5 dark:border-slate-700">
            <span
              style={{ color: "var(--uab-brand-primary, inherit)" }}
              className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100"
            >
              {normalized}
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
      {brandName && !isUabBrand ? (
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
