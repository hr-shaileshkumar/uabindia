"use client";

import type { ReactNode } from "react";
import { publicEyebrowClassName, publicSubtitleClassName, publicTitleClassName } from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  centered?: boolean;
  className?: string;
};

export default function PublicPageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  centered = false,
  className,
}: PublicPageHeroProps) {
  return (
    <div className={cn(centered && "mx-auto max-w-3xl text-center", className)}>
      <p className={cn(publicEyebrowClassName, centered && "justify-center")}>{eyebrow}</p>
      <h1 className={cn(publicTitleClassName, "mt-3")}>{title}</h1>
      {subtitle ? <p className={cn(publicSubtitleClassName, "mt-3", centered && "mx-auto")}>{subtitle}</p> : null}
      {actions ? (
        <div className={cn("mt-6 flex flex-wrap gap-3", centered && "justify-center")}>{actions}</div>
      ) : null}
    </div>
  );
}
