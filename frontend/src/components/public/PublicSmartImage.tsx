"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type PublicSmartImageProps = {
  pageKey: "home" | "about" | "contact" | "pricing" | "help-support" | string;
  preferredSrc?: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "square" | "auto" | "wide";
  children?: React.ReactNode;
};

/**
 * Production-grade smart image loader for UabIndia public pages.
 * Pre-validates image in background memory before mounting to DOM.
 * NEVER renders a broken image box if file is missing.
 */
export default function PublicSmartImage({
  pageKey,
  preferredSrc,
  alt,
  className,
  aspectRatio = "auto",
  children,
}: PublicSmartImageProps) {
  const candidates: string[] = [
    ...(preferredSrc ? [preferredSrc] : []),
    `/assets/pages/${pageKey}/banner.png`,
    `/assets/pages/${pageKey}/banner.webp`,
    `/assets/pages/${pageKey}/banner.jpg`,
    `/assets/pages/${pageKey}/hero.png`,
    `/assets/pages/${pageKey}/hero.webp`,
    `/assets/pages/${pageKey}/hero.jpg`,
    `/assets/pages/${pageKey}/feature.png`,
    `/assets/pages/${pageKey}/feature.jpg`,
  ];

  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkImages() {
      for (const src of candidates) {
        const isValid = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = src;
        });

        if (isValid && isMounted) {
          setLoadedSrc(src);
          return;
        }
      }
      if (isMounted) {
        setLoadedSrc(null);
      }
    }

    checkImages();

    return () => {
      isMounted = false;
    };
  }, [candidates.join(",")]);

  if (!loadedSrc) {
    return children ? <>{children}</> : null;
  }

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-300 animate-in fade-in w-full",
        aspectClass,
        className
      )}
    >
      <img
        src={loadedSrc}
        alt={alt}
        className="w-full h-auto max-h-[680px] object-contain transition-transform duration-500 hover:scale-[1.015] drop-shadow-xl mx-auto"
        loading="lazy"
      />
    </div>
  );
}
