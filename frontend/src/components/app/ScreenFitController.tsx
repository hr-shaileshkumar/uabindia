"use client";

import { useEffect } from "react";

const resolveScreenFit = (width: number): "compact" | "cozy" | "wide" => {
  if (width <= 1366) return "compact";
  if (width <= 1680) return "cozy";
  return "wide";
};

export default function ScreenFitController() {
  useEffect(() => {
    const root = document.documentElement;

    const applyFit = () => {
      root.dataset.screenFit = resolveScreenFit(window.innerWidth);
    };

    applyFit();
    window.addEventListener("resize", applyFit, { passive: true });
    return () => window.removeEventListener("resize", applyFit);
  }, []);

  return null;
}
