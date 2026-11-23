"use client";

import { cn } from "@/lib/utils";

export interface DiagonalQuadLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * DiagonalQuadLoader:
 * 4 dynamic small rectangles arranged in an orbiting quadrant.
 * Each rectangle features aerodynamic diagonal rounded corners.
 * As the cluster continuously rotates around the center, each container independently cycles
 * through electric blue, vivid violet, hot pink, bright cyan, emerald green, and amber gold.
 */
export function DiagonalQuadLoader({
  size = "md",
  className,
}: DiagonalQuadLoaderProps) {
  // Container bounding box (square to ensure perfectly centered wobble-free 360° spin)
  const containerSize =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";

  // Individual rectangle proportions (width > height creates distinct rectangular tiles)
  const rectSize =
    size === "sm"
      ? "h-[8px] w-[11px]"
      : size === "lg"
      ? "h-[13px] w-[18px]"
      : "h-[10px] w-[14px]";

  // Offset placement to maintain an elegant center crosshair gap
  const offset = size === "sm" ? "1px" : size === "lg" ? "3px" : "2px";

  // Diagonal rounded corners: opposite diagonal corners rounded, adjacent corners micro
  const tlRadius =
    size === "sm"
      ? "rounded-tl-[5px] rounded-br-[5px] rounded-tr-[1px] rounded-bl-[1px]"
      : size === "lg"
      ? "rounded-tl-[8px] rounded-br-[8px] rounded-tr-[2px] rounded-bl-[2px]"
      : "rounded-tl-[6px] rounded-br-[6px] rounded-tr-[1.5px] rounded-bl-[1.5px]";

  const trRadius =
    size === "sm"
      ? "rounded-tr-[5px] rounded-bl-[5px] rounded-tl-[1px] rounded-br-[1px]"
      : size === "lg"
      ? "rounded-tr-[8px] rounded-bl-[8px] rounded-tl-[2px] rounded-br-[2px]"
      : "rounded-tr-[6px] rounded-bl-[6px] rounded-tl-[1.5px] rounded-br-[1.5px]";

  const blRadius =
    size === "sm"
      ? "rounded-bl-[5px] rounded-tr-[5px] rounded-tl-[1px] rounded-br-[1px]"
      : size === "lg"
      ? "rounded-bl-[8px] rounded-tr-[8px] rounded-tl-[2px] rounded-br-[2px]"
      : "rounded-bl-[6px] rounded-tr-[6px] rounded-tl-[1.5px] rounded-br-[1.5px]";

  const brRadius =
    size === "sm"
      ? "rounded-br-[5px] rounded-tl-[5px] rounded-tr-[1px] rounded-bl-[1px]"
      : size === "lg"
      ? "rounded-br-[8px] rounded-tl-[8px] rounded-tr-[2px] rounded-bl-[2px]"
      : "rounded-br-[6px] rounded-tl-[6px] rounded-tr-[1.5px] rounded-bl-[1.5px]";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center animate-quad-spin select-none",
        containerSize,
        className,
      )}
      aria-hidden="true"
    >
      {/* ── Top-Left Rectangle (Container 1) ── */}
      <span
        style={{ top: offset, left: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-1",
          rectSize,
          tlRadius,
        )}
      />

      {/* ── Top-Right Rectangle (Container 2) ── */}
      <span
        style={{ top: offset, right: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-2",
          rectSize,
          trRadius,
        )}
      />

      {/* ── Bottom-Left Rectangle (Container 3) ── */}
      <span
        style={{ bottom: offset, left: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-3",
          rectSize,
          blRadius,
        )}
      />

      {/* ── Bottom-Right Rectangle (Container 4) ── */}
      <span
        style={{ bottom: offset, right: offset }}
        className={cn(
          "absolute transition-colors animate-quad-rect-4",
          rectSize,
          brRadius,
        )}
      />
    </div>
  );
}
