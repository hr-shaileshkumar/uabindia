"use client";

import { cn } from "@/lib/utils";

interface TenantAvatarProps {
  name: string;
  imageUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function TenantAvatar({ name, imageUrl, className, size = "md" }: TenantAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase() || "T";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-md bg-indigo-100 text-indigo-700 font-semibold items-center justify-center shadow-sm border border-indigo-200",
        sizeClasses[size],
        className
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
