"use client";

import { useEffect } from "react";

/**
 * Enterprise Screen Fit & Density Controller.
 * Ensures 100% native resolution across all browsers (Chrome, Edge, Safari, Firefox),
 * following Microsoft 365, AWS, and Stripe enterprise density standards.
 * Dynamically adjusts screen-fit density datasets without broken CSS zoom hacks.
 */
export default function ScreenFitController() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Reset any legacy zoom hacks on body
    if ("zoom" in body.style) {
      (body.style as unknown as Record<string, string>).zoom = "";
    }

    const applyFit = () => {
      const width = window.innerWidth;
      const isDesktop = width >= 1024;

      root.dataset.screenZoom = "100";
      root.dataset.screenFit = isDesktop ? (width <= 1440 ? "compact" : "wide") : "mobile";
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
