"use client";

import { useEffect } from "react";

/**
 * Enterprise Screen Fit & 90% Viewport Zoom Controller.
 * Ensures that when viewed under standard 100% browser zoom in Chrome,
 * Microsoft Edge, Safari, Opera, and other modern browsers, the entire UABIndia
 * platform renders at an optimized 90% zoom on desktop viewports (>=1024px).
 * On mobile/tablet screens (<1024px), it preserves natural 100% touch scale.
 */
export default function ScreenFitController() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyFit = () => {
      const width = window.innerWidth;
      const isDesktop = width >= 1024;

      if (isDesktop) {
        // Enforce 90% zoom on desktop viewports
        if ("zoom" in root.style || "zoom" in body.style) {
          (body.style as unknown as Record<string, string>).zoom = "90%";
        }
        root.dataset.screenZoom = "90";
        root.dataset.screenFit = width <= 1440 ? "compact" : "wide";
      } else {
        // Natural 100% scale for touch and mobile devices
        if ("zoom" in root.style || "zoom" in body.style) {
          (body.style as unknown as Record<string, string>).zoom = "100%";
        }
        root.dataset.screenZoom = "100";
        root.dataset.screenFit = "mobile";
      }
    };

    applyFit();
    window.addEventListener("resize", applyFit, { passive: true });
    return () => {
      window.removeEventListener("resize", applyFit);
      if ("zoom" in body.style) {
        (body.style as unknown as Record<string, string>).zoom = "";
      }
    };
  }, []);

  return null;
}
