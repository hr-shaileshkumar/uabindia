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

  // Check if brandName starts with "uabindia" or "uab india"
  // e.g. "UabIndia ERP" -> suffix: "ERP"
  // e.g. "UabIndia Enterprise Platform" -> suffix: "Enterprise"
  // e.g. "UabIndia" -> suffix: ""
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
      <div className={cn("flex shrink-0 items-center gap-2", className)}>
        {/* Wordmark logo which already contains 'uabindia' */}
        <img
          src="/logo.png"
          alt={brandName || "UabIndia"}
          className={cn(
            heightClass,
            "w-auto object-contain transition-transform group-hover:scale-105",
            imageClassName,
          )}
        />

        {/* If brand has an edition suffix (like 'ERP' or 'Enterprise'), render clean badge */}
        {suffix ? (
          <span className="hidden sm:inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-700/15 dark:bg-blue-950/70 dark:text-cyan-300 dark:ring-blue-400/20">
            {suffix}
          </span>
        ) : !isUabBrand && normalized && normalized !== "Enterprise Platform" ? (
          <span className="hidden sm:inline-flex items-center border-l border-slate-300 pl-2.5 text-sm font-bold tracking-tight text-slate-800 dark:border-slate-700 dark:text-slate-200">
            {normalized}
          </span>
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
        <span className="hidden sm:inline-block font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
          {brandName}
        </span>
      ) : null}
    </div>
  );
}
