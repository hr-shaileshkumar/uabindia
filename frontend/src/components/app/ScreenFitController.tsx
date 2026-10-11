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
      const supportsZoom = "zoom" in root.style || "zoom" in body.style;

      if (isDesktop && supportsZoom) {
        // Enforce 90% zoom on desktop viewports
        (body.style as unknown as Record<string, string>).zoom = "90%";
        // In Chromium browsers with zoom: 90% on body, 100vh/100dvh is scaled down by 0.9,
        // resulting in a 10% blank void at the bottom. We set --erp-viewport-h to calc(100dvh / 0.9)
        // so the container precisely covers 100% of the browser window.
        root.style.setProperty("--erp-zoom-scale", "0.9");
        root.style.setProperty("--erp-viewport-h", "calc(100dvh / 0.9)");
        root.dataset.screenZoom = "90";
        root.dataset.screenFit = width <= 1440 ? "compact" : "wide";
      } else {
        // Natural 100% scale for touch and mobile devices
        if (supportsZoom) {
          (body.style as unknown as Record<string, string>).zoom = "100%";
        }
        root.style.setProperty("--erp-zoom-scale", "1");
        root.style.setProperty("--erp-viewport-h", "100dvh");
        root.dataset.screenZoom = "100";
        root.dataset.screenFit = isDesktop ? (width <= 1440 ? "compact" : "wide") : "mobile";
      }
    };

    applyFit();
    window.addEventListener("resize", applyFit, { passive: true });
    return () => {
      window.removeEventListener("resize", applyFit);
      if ("zoom" in body.style) {
        (body.style as unknown as Record<string, string>).zoom = "";
      }
      root.style.removeProperty("--erp-zoom-scale");
      root.style.removeProperty("--erp-viewport-h");
    };
  }, []);

  return null;
}
